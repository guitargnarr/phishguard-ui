#!/usr/bin/env python3
"""
Sync Pipeline: Cross-reference state-level GLP-1 economics with pharmacy-level
opportunity scoring to produce a single actionable targeting CSV for Arica.

Inputs:
  1. state_glp1_loss_data_2024.csv   -- state GLP-1 claims + costs (CMS data)
  2. pharmacies_glp1_qualified.csv    -- 41,775 pharmacies with area health scores

Outputs:
  pharmacies_glp1_targeting.csv       -- final targeting list with financial model

Key additions over the enrichment CSV:
  - Estimated monthly GLP-1 fills per pharmacy (from state claims / pharmacy count,
    adjusted by local disease burden percentile)
  - Estimated monthly loss (fills * NCPA-reported $37-$42/fill loss)
  - Estimated annual loss
  - Net monthly savings at $275/month subscription
  - ROI multiple (annual savings / annual subscription cost)
  - Breakeven fills needed (from GLP-1 Value Proposition)
  - Outreach priority tier (matching Portfolio Analysis framework)
  - Outreach segment (GLP-1 Loss / MFP Cash Flow / DIR Fee Squeeze)

Data sources for loss economics:
  - NCPA 2024 survey: 95% of pharmacies lose avg $42/fill on GLP-1s
  - NCPA 2023 survey: avg loss exceeds $37/fill
  - RetailMyMeds GLP-1 Value Proposition (Feb 2026): $37-$42 range confirmed
  - GLP-1 penetration: 7% of total Rx volume (6.5% Sept 2025, trending up)
  - Avg independent pharmacy: 67,601 Rx/year = 5,633/month
  - At 7% GLP-1 penetration: ~394 GLP-1 fills/month (national average)
"""

import csv
import json
import math
import os
import sys
import time
from collections import defaultdict
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────────────

DB_DIR = Path.home() / "Desktop/RetailMyMeds/Pharmacy_Database"

STATE_GLP1_CSV = DB_DIR / "state_glp1_loss_data_2024.csv"
ENRICHED_CSV = DB_DIR / "pharmacies_glp1_qualified.csv"
OUTPUT_CSV = DB_DIR / "pharmacies_glp1_targeting.csv"

# ── Economics constants (from NCPA surveys + RetailMyMeds value prop) ──

# NCPA-reported loss per GLP-1 fill
LOSS_PER_FILL_LOW = 37.0    # NCPA 2023 survey (conservative)
LOSS_PER_FILL_HIGH = 42.0   # NCPA 2024 survey
LOSS_PER_FILL_MID = 39.50   # Midpoint for estimates

# RetailMyMeds subscription
SUBSCRIPTION_MONTHLY = 275.0
SUBSCRIPTION_ANNUAL = SUBSCRIPTION_MONTHLY * 12  # $3,300

# Breakeven: fills routed per month to cover subscription
BREAKEVEN_FILLS = math.ceil(SUBSCRIPTION_MONTHLY / LOSS_PER_FILL_LOW)  # 8 fills

# Routing rate assumptions (from GLP-1 Value Proposition)
ROUTING_RATE_CONSERVATIVE = 0.02  # 2% of GLP-1 volume
ROUTING_RATE_MODERATE = 0.05      # 5% -- the "defensible pitch"
ROUTING_RATE_AGGRESSIVE = 0.10    # 10%

# GLP-1 penetration of total Rx volume
GLP1_PENETRATION = 0.07  # 7% (up from 6.5% Sept 2025)

# National average monthly Rx volume for independent pharmacies
# Source: NCPA 2024 Digest, 67,601 annual / 12 = 5,633/month
NATIONAL_AVG_MONTHLY_RX = 5633

# MFP economics (from MFP Crisis Response Brief)
MFP_WEEKLY_SHORTFALL = 10838.0  # per pharmacy
MFP_ANNUAL_MARGIN_LOSS_LOW = 40000.0
MFP_ANNUAL_MARGIN_LOSS_HIGH = 46000.0


def safe_float(val):
    try:
        return float(str(val).strip().replace(",", "").replace("$", "").replace("%", ""))
    except (ValueError, AttributeError, TypeError):
        return 0.0


def safe_int(val):
    try:
        return int(float(str(val).strip().replace(",", "")))
    except (ValueError, AttributeError, TypeError):
        return 0


# ── Step 1: Load state-level GLP-1 data ────────────────────────────────

def load_state_data():
    """Load state GLP-1 metrics and compute per-pharmacy fill estimates."""
    print("\n[1/4] Loading state-level GLP-1 data...")
    states = {}
    with open(STATE_GLP1_CSV, newline="", encoding="utf-8") as f:
        lines = [l for l in f if not l.startswith("#")]
    reader = csv.DictReader(lines)
    for row in reader:
        st = row["state"].strip()
        total_claims = safe_int(row["total_govt_glp1_claims"])
        pharmacy_count = safe_int(row["independent_pharmacy_count"])
        total_cost = safe_float(row["total_glp1_drug_cost"])
        avg_cost = safe_float(row["avg_cost_per_claim"])

        # Monthly GLP-1 fills per pharmacy estimate
        #
        # APPROACH: Use NCPA national average (394 fills/month) as baseline,
        # then use CMS data to compute each state's RELATIVE GLP-1 intensity.
        #
        # CMS gives us govt_glp1_claims_per_pharmacy for each state.
        # We compute a state index: state_claims_per_pharmacy / national_avg_claims_per_pharmacy.
        # Then: estimated fills = 394 * state_index.
        #
        # This preserves the CMS-measured relative differences between states
        # while anchoring to the NCPA-reported absolute number.
        claims_per_pharmacy = total_claims / pharmacy_count / 12 if pharmacy_count > 0 else 0
        monthly_fills_per_pharmacy = claims_per_pharmacy  # will be indexed later

        states[st] = {
            "total_govt_claims": total_claims,
            "pharmacy_count": pharmacy_count,
            "total_cost": total_cost,
            "avg_cost_per_claim": avg_cost,
            "monthly_fills_per_pharmacy": round(monthly_fills_per_pharmacy, 0),
        }

    print(f"  Loaded {len(states)} states")

    # Compute national average claims/pharmacy/month from CMS data
    raw_monthly = [s["monthly_fills_per_pharmacy"] for s in states.values() if s["monthly_fills_per_pharmacy"] > 0]
    national_avg_raw = sum(raw_monthly) / len(raw_monthly) if raw_monthly else 1
    NCPA_NATIONAL_AVG = 394  # NCPA 2024 Digest: 67,601 Rx/yr * 7% GLP-1 / 12 months

    # Index each state: state_raw / national_avg_raw * NCPA_NATIONAL_AVG
    # This preserves CMS-measured relative differences while anchoring to NCPA absolute.
    # Cap the index at 1.5x to prevent outlier states (e.g., IN with few independent
    # pharmacies relative to claims) from producing unrealistic fill estimates.
    for st, data in states.items():
        raw = data["monthly_fills_per_pharmacy"]
        if raw > 0 and national_avg_raw > 0:
            state_index = raw / national_avg_raw
            # Dampen extremes: cap at 0.5x - 1.5x to keep estimates in NCPA-plausible range
            state_index = max(0.5, min(1.5, state_index))
            data["monthly_fills_per_pharmacy"] = round(NCPA_NATIONAL_AVG * state_index)
            data["state_index"] = round(state_index, 2)
        else:
            data["monthly_fills_per_pharmacy"] = round(NCPA_NATIONAL_AVG * 0.5)  # low estimate
            data["state_index"] = 0.5

    fills = [s["monthly_fills_per_pharmacy"] for s in states.values()]
    fills.sort()
    print(f"  Indexed monthly GLP-1 fills/pharmacy range: {fills[0]} - {fills[-1]}")
    print(f"  Median: {fills[len(fills)//2]}, Mean: {round(sum(fills)/len(fills))}")
    print(f"  National avg anchor (NCPA): {NCPA_NATIONAL_AVG} fills/month")

    # Show top/bottom states
    ranked = sorted(states.items(), key=lambda x: x[1]["monthly_fills_per_pharmacy"], reverse=True)
    print(f"  Top 5: {', '.join(f'{st}={d['monthly_fills_per_pharmacy']}' for st, d in ranked[:5])}")
    print(f"  Bottom 5: {', '.join(f'{st}={d['monthly_fills_per_pharmacy']}' for st, d in ranked[-5:])}")

    return states


# ── Step 2: Load enriched pharmacy data ────────────────────────────────

def load_enriched_pharmacies():
    """Load the pharmacy enrichment CSV with area-level scoring."""
    print("\n[2/4] Loading enriched pharmacy data...")
    pharmacies = []
    with open(ENRICHED_CSV, newline="", encoding="utf-8") as f:
        lines = [l for l in f if not l.startswith("#")]
    reader = csv.DictReader(lines)
    for row in reader:
        pharmacies.append(row)
    print(f"  Loaded {len(pharmacies):,} pharmacies")
    return pharmacies


# ── Step 3: Cross-reference and compute financial model ────────────────

def compute_targeting(pharmacies, states):
    """
    For each pharmacy, combine state GLP-1 economics with area-level
    health data to estimate financial impact and assign outreach priority.
    """
    print("\n[3/4] Computing targeting model...")

    # Collect all disease burden scores for percentile adjustment
    all_disease = [safe_float(p["disease_burden_score"]) for p in pharmacies]
    all_disease.sort()
    median_disease = all_disease[len(all_disease) // 2] if all_disease else 50.0
    # Percentile rank function
    def disease_percentile(score):
        if not all_disease or score <= 0:
            return 50.0  # assume average if no data
        count = sum(1 for x in all_disease if x <= score)
        return round(count / len(all_disease) * 100, 1)

    results = []
    for p in pharmacies:
        st = p["state"].strip().upper()
        state_data = states.get(st, {})

        # Base monthly GLP-1 fills from state average (NCPA-indexed)
        base_fills = state_data.get("monthly_fills_per_pharmacy", 394)

        # Adjust by local disease burden -- pharmacies in high-diabetes ZIPs
        # fill more GLP-1s than the state average, but the effect is moderate
        disease_score = safe_float(p.get("disease_burden_score", "0"))
        pctile = disease_percentile(disease_score)
        # Damped adjustment: 50th pctile = 1.0x, 90th = 1.15x, 10th = 0.85x
        disease_multiplier = max(0.85, min(1.15, 0.85 + (pctile / 100 * 0.30)))

        # Medicare density -- areas with more 65+ fill more Part D GLP-1s
        pct_65 = safe_float(p.get("zip_pct_65_plus", "0"))
        # National avg ~17%. Mild boost for senior-heavy areas.
        medicare_multiplier = max(0.90, min(1.10, 0.90 + (pct_65 / 100)))

        # Estimated monthly GLP-1 fills for this specific pharmacy
        est_monthly_fills = round(base_fills * disease_multiplier * medicare_multiplier)

        # Cap to realistic range based on portfolio analysis data (80-600 fills/month)
        # NCPA avg = 394. Low-volume pharmacies ~80, high-volume ~600.
        est_monthly_fills = max(80, min(650, est_monthly_fills))

        # Financial model
        est_monthly_loss_low = round(est_monthly_fills * LOSS_PER_FILL_LOW, 0)
        est_monthly_loss_high = round(est_monthly_fills * LOSS_PER_FILL_HIGH, 0)
        est_monthly_loss_mid = round(est_monthly_fills * LOSS_PER_FILL_MID, 0)

        est_annual_loss_mid = round(est_monthly_loss_mid * 12, 0)

        # ROI at moderate routing rate (5% of fills routed)
        fills_routed = round(est_monthly_fills * ROUTING_RATE_MODERATE)
        monthly_savings = round(fills_routed * LOSS_PER_FILL_MID, 0)
        net_monthly = monthly_savings - SUBSCRIPTION_MONTHLY
        annual_net = round(net_monthly * 12, 0)
        roi_multiple = round(monthly_savings * 12 / SUBSCRIPTION_ANNUAL, 1) if SUBSCRIPTION_ANNUAL > 0 else 0

        # Breakeven: how many fills to route to cover $275/month
        # At $37/fill: 8 fills. At $42/fill: 7 fills
        fills_to_breakeven = BREAKEVEN_FILLS  # 8
        pct_volume_for_breakeven = round(fills_to_breakeven / est_monthly_fills * 100, 1) if est_monthly_fills > 0 else 99.9

        # ── Outreach segmentation ──
        # Primary pain point determines messaging angle
        # GLP-1 Loss is the universal pain -- every pharmacy filling GLP-1s loses money
        # MFP Cash Flow is the acute crisis -- pharmacies with high Medicare Part D exposure
        # DIR Fee Squeeze targets underserved areas where margins are thinnest
        opportunity_score = safe_float(p.get("glp1_opportunity_score", "0"))
        hpsa = safe_int(p.get("hpsa_designated", "0"))

        if pct_65 >= 22 and est_monthly_fills >= 350:
            segment = "MFP Cash Flow"
        elif hpsa == 1 and safe_float(p.get("hpsa_score", "0")) >= 18 and safe_float(p.get("zip_no_insurance_pct", "0")) >= 15:
            segment = "DIR Fee Squeeze"
        else:
            segment = "GLP-1 Loss"  # Default -- universal pain point, every pharmacy

        # Urgency score (0-100) -- how urgent is the financial pressure
        # Every independent pharmacy filling GLP-1s is losing money.
        # Urgency reflects how MUCH and how ACUTELY.
        vol_urgency = min(100, est_monthly_fills / 4)  # 400 fills = 100
        disease_urgency = min(100, disease_score * 1.5)  # High disease = high urgency
        mfp_urgency = min(100, pct_65 * 5) if pct_65 >= 15 else pct_65 * 3
        hpsa_urgency = min(100, safe_int(p.get("hpsa_score", "0")) * 5)
        urgency = round(
            vol_urgency * 0.35 +
            disease_urgency * 0.25 +
            mfp_urgency * 0.20 +
            hpsa_urgency * 0.20,
            0
        )

        # Combined score for final ranking
        # Opportunity score captures area-level fit (is this pharmacy in a
        # high-need area?). Financial impact captures magnitude of loss.
        # Urgency captures how acute the pain is right now.
        financial_impact_score = min(100, est_monthly_loss_mid / 150)  # $15K/mo = 100
        final_score = round(
            opportunity_score * 0.45 +
            financial_impact_score * 0.30 +
            urgency * 0.25,
            1
        )

        # Outreach priority (matching Portfolio Analysis framework)
        # Thresholds set so ~10% Immediate, ~25% Nurture, ~35% Conditional, ~30% Deprioritize
        # This gives Arica a focused top tier without drowning her in "call everyone"
        if final_score >= 80 and urgency >= 70:
            priority = "Immediate Outreach"
        elif final_score >= 70:
            priority = "Nurture"
        elif final_score >= 55 and urgency >= 50:
            priority = "Conditional"
        else:
            priority = "Deprioritize"

        # Grade boundaries -- aim for ~15% A, ~30% B, ~35% C, ~20% D
        if final_score >= 85:
            grade = "A"
        elif final_score >= 72:
            grade = "B"
        elif final_score >= 55:
            grade = "C"
        else:
            grade = "D"

        results.append({
            # Identity
            "npi": p["npi"],
            "display_name": p["display_name"],
            "city": p["city"],
            "state": p["state"],
            "zip": p["zip"],
            "phone": p["phone"],
            "estimated_status": p["estimated_status"],
            "owner_name": p["owner_name"],
            "owner_title": p["owner_title"],
            # Area health context
            "zip_diabetes_pct": p.get("zip_diabetes_pct", ""),
            "zip_obesity_pct": p.get("zip_obesity_pct", ""),
            "zip_pct_65_plus": p.get("zip_pct_65_plus", ""),
            "zip_median_income": p.get("zip_median_income", ""),
            "zip_population": p.get("zip_population", ""),
            "hpsa_designated": p.get("hpsa_designated", ""),
            "hpsa_score": p.get("hpsa_score", ""),
            # State GLP-1 economics (from CMS)
            "state_glp1_claims_per_pharmacy": p.get("state_glp1_claims_per_pharmacy", ""),
            "state_glp1_cost_per_pharmacy": p.get("state_glp1_cost_per_pharmacy", ""),
            # Estimated pharmacy-level GLP-1 economics
            "est_monthly_glp1_fills": est_monthly_fills,
            "est_monthly_loss_low": est_monthly_loss_low,
            "est_monthly_loss_mid": est_monthly_loss_mid,
            "est_monthly_loss_high": est_monthly_loss_high,
            "est_annual_loss": est_annual_loss_mid,
            # ROI at 5% routing rate
            "fills_routed_at_5pct": fills_routed,
            "monthly_savings_at_5pct": monthly_savings,
            "net_monthly_after_subscription": net_monthly,
            "annual_net_savings": annual_net,
            "roi_multiple": roi_multiple,
            "breakeven_fills_per_month": fills_to_breakeven,
            "pct_volume_for_breakeven": pct_volume_for_breakeven,
            # Targeting
            "segment": segment,
            "urgency_score": urgency,
            "opportunity_score": round(opportunity_score, 1),
            "final_score": final_score,
            "grade": grade,
            "outreach_priority": priority,
        })

    # Sort by final score descending
    results.sort(key=lambda r: r["final_score"], reverse=True)

    # Stats
    priorities = defaultdict(int)
    grades = defaultdict(int)
    segments = defaultdict(int)
    for r in results:
        priorities[r["outreach_priority"]] += 1
        grades[r["grade"]] += 1
        segments[r["segment"]] += 1

    print(f"\n  Grade distribution:")
    for g in ["A", "B", "C", "D"]:
        ct = grades[g]
        print(f"    {g}: {ct:,} ({ct/len(results)*100:.1f}%)")

    print(f"\n  Outreach priority:")
    for p in ["Immediate Outreach", "Nurture", "Conditional", "Deprioritize"]:
        ct = priorities[p]
        print(f"    {p}: {ct:,} ({ct/len(results)*100:.1f}%)")

    print(f"\n  Segment breakdown:")
    for s in sorted(segments.keys()):
        ct = segments[s]
        print(f"    {s}: {ct:,} ({ct/len(results)*100:.1f}%)")

    # Financial summary
    total_monthly_loss = sum(r["est_monthly_loss_mid"] for r in results)
    total_annual_loss = sum(r["est_annual_loss"] for r in results)
    imm_outreach = [r for r in results if r["outreach_priority"] == "Immediate Outreach"]
    imm_monthly = sum(r["est_monthly_loss_mid"] for r in imm_outreach)

    print(f"\n  Financial summary:")
    print(f"    Total estimated GLP-1 loss (all pharmacies): ${total_monthly_loss:,.0f}/month (${total_annual_loss:,.0f}/year)")
    print(f"    Immediate Outreach pharmacies: {len(imm_outreach):,}")
    print(f"    Their combined monthly GLP-1 loss: ${imm_monthly:,.0f}/month")
    if imm_outreach:
        avg_loss = imm_monthly / len(imm_outreach)
        print(f"    Avg loss per Immediate Outreach pharmacy: ${avg_loss:,.0f}/month (${avg_loss*12:,.0f}/year)")

    return results


# ── Step 4: Write output ───────────────────────────────────────────────

def write_output(results):
    """Write the synced targeting CSV."""
    print(f"\n[4/4] Writing targeting CSV to {OUTPUT_CSV}...")

    fieldnames = [
        # Identity
        "npi", "display_name", "city", "state", "zip", "phone",
        "estimated_status", "owner_name", "owner_title",
        # Area context
        "zip_diabetes_pct", "zip_obesity_pct", "zip_pct_65_plus",
        "zip_median_income", "zip_population",
        "hpsa_designated", "hpsa_score",
        # State GLP-1 (CMS measured)
        "state_glp1_claims_per_pharmacy", "state_glp1_cost_per_pharmacy",
        # Pharmacy GLP-1 estimates
        "est_monthly_glp1_fills",
        "est_monthly_loss_low", "est_monthly_loss_mid", "est_monthly_loss_high",
        "est_annual_loss",
        # ROI model
        "fills_routed_at_5pct", "monthly_savings_at_5pct",
        "net_monthly_after_subscription", "annual_net_savings",
        "roi_multiple", "breakeven_fills_per_month", "pct_volume_for_breakeven",
        # Targeting
        "segment", "urgency_score", "opportunity_score", "final_score",
        "grade", "outreach_priority",
    ]

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        f.write("# RetailMyMeds GLP-1 Pharmacy Targeting List\n")
        f.write("# Synced from: state_glp1_loss_data_2024.csv + pharmacies_glp1_qualified.csv\n")
        f.write("#\n")
        f.write("# State GLP-1 data: CMS Medicare Part D 2023 + Medicaid SDUD 2024\n")
        f.write("# Area health data: CDC PLACES 2025, Census ACS 2023, HRSA HPSA 2026\n")
        f.write("# Loss economics: NCPA surveys 2023-2024 ($37-$42/fill)\n")
        f.write("# ROI model: RetailMyMeds $275/month, 5% routing rate (moderate scenario)\n")
        f.write(f"# Generated: {time.strftime('%Y-%m-%d')}\n")
        f.write("#\n")
        f.write("# Scoring model:\n")
        f.write("#   Opportunity Score (50%): Disease Burden 40% + Medicare Density 25% + Market Access 20% + Underserved 15%\n")
        f.write("#   Financial Impact (30%): Estimated monthly GLP-1 loss magnitude\n")
        f.write("#   Urgency (20%): GLP-1 volume 40% + disease trend 20% + MFP exposure 20% + HPSA 20%\n")
        f.write("#\n")
        f.write("# Outreach Priority:\n")
        f.write("#   Immediate Outreach: final_score >= 65 AND urgency >= 60\n")
        f.write("#   Nurture: final_score >= 65 AND urgency < 60\n")
        f.write("#   Conditional: final_score < 65 AND urgency >= 60\n")
        f.write("#   Deprioritize: final_score < 65 AND urgency < 60\n")
        f.write("#\n")
        f.write("# Segments (conversation lead):\n")
        f.write("#   GLP-1 Loss: primary pain = losing money on every GLP-1 fill\n")
        f.write("#   MFP Cash Flow: primary pain = MFP timing gap ($10,838/week shortfall)\n")
        f.write("#   DIR Fee Squeeze: primary pain = below-cost reimbursement in underserved area\n")
        f.write("#\n")

        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)

    print(f"  Wrote {len(results):,} pharmacies")

    # Top 25 preview
    print("\n  Top 25 pharmacies by final targeting score:")
    print(f"  {'#':>3} {'Name':<30} {'City':<18} {'ST':>2} {'Score':>5} {'Grd':>3} {'Mo.Fills':>8} {'Mo.Loss':>9} {'Net/Mo':>8} {'ROI':>4}x {'Priority':<20} {'Segment':<16}")
    print(f"  {'─'*3} {'─'*30} {'─'*18} {'─'*2} {'─'*5} {'─'*3} {'─'*8} {'─'*9} {'─'*8} {'─'*5} {'─'*20} {'─'*16}")
    for i, r in enumerate(results[:25]):
        name = r["display_name"][:30]
        city = r["city"][:18]
        print(
            f"  {i+1:>3} {name:<30} {city:<18} {r['state']:>2} "
            f"{r['final_score']:>5.1f} {r['grade']:>3} "
            f"{r['est_monthly_glp1_fills']:>8,} ${r['est_monthly_loss_mid']:>8,} "
            f"${r['net_monthly_after_subscription']:>7,} {r['roi_multiple']:>4.1f}x "
            f"{r['outreach_priority']:<20} {r['segment']:<16}"
        )

    return results


# ── Main ────────────────────────────────────────────────────────────────

def main():
    print("=" * 78)
    print("RetailMyMeds GLP-1 Pharmacy Targeting -- Synced Pipeline")
    print("=" * 78)

    # Verify inputs exist
    for path, label in [(STATE_GLP1_CSV, "State GLP-1 data"), (ENRICHED_CSV, "Enriched pharmacies")]:
        if not path.exists():
            print(f"ERROR: {label} not found at {path}")
            sys.exit(1)

    states = load_state_data()
    pharmacies = load_enriched_pharmacies()
    results = compute_targeting(pharmacies, states)
    write_output(results)

    print("\n" + "=" * 78)
    print("DONE")
    print(f"  Output: {OUTPUT_CSV}")
    print(f"  {len(results):,} pharmacies with targeting data")
    print("=" * 78)


if __name__ == "__main__":
    main()
