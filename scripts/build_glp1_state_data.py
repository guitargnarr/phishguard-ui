#!/usr/bin/env python3
"""
Build state-level GLP-1 pharmacy loss data from public CMS sources.

Data sources (all free, no auth):
  1. CMS Medicare Part D Prescribers by Geography & Drug (2023)
     https://data.cms.gov/provider-summary-by-type-of-service/medicare-part-d-prescribers
  2. Medicaid State Drug Utilization Data (2024)
     https://www.medicaid.gov/medicaid/prescription-drugs/state-drug-utilization-data
  3. NADAC - National Average Drug Acquisition Cost (2024)
     https://www.medicaid.gov/medicaid/prescription-drugs/pharmacy-pricing/index.html

Output: ~/Desktop/RetailMyMeds/Pharmacy_Database/state_glp1_loss_data_2024.csv
"""

import csv
import io
import json
import os
import sys
import time
from collections import defaultdict
from pathlib import Path

import requests

# ── Config ──────────────────────────────────────────────────────────────

CACHE_DIR = Path(__file__).parent / "cache"
PHARMACY_CSV = (
    Path.home()
    / "Desktop/RetailMyMeds/Pharmacy_Database/qualified_independent_pharmacies_feb2026.csv"
)
OUTPUT_CSV = (
    Path.home()
    / "Desktop/RetailMyMeds/Pharmacy_Database/state_glp1_loss_data_2024.csv"
)
OUTPUT_JSON = Path(__file__).parent.parent / "public" / "data" / "state-glp1-losses.json"

PART_D_URL = "https://data.cms.gov/sites/default/files/2025-04/9fe6b8a6-0cb9-4b7c-9760-87800da010a8/MUP_DPR_RY25_P04_V10_DY23_Geo.csv"
SDUD_URL = "https://download.medicaid.gov/data/sdud-2024-updated-dec2025.csv"
NADAC_URL = "https://download.medicaid.gov/data/nadac-national-average-drug-acquisition-cost-12-25-2024.csv"

# GLP-1 brand names as they appear in CMS data (uppercase)
GLP1_BRANDS_PARTD = {
    "OZEMPIC", "WEGOVY", "MOUNJARO", "ZEPBOUND",
    "TRULICITY", "VICTOZA", "SAXENDA",
}

# For SDUD Product Name matching (case-insensitive substring)
GLP1_BRANDS_SDUD = [
    "ozempic", "wegovy", "mounjaro", "zepbound",
    "trulicity", "victoza", "saxenda",
    "semaglutide", "tirzepatide", "dulaglutide", "liraglutide",
]

# For NADAC NDC Description matching
GLP1_BRANDS_NADAC = [
    "ozempic", "wegovy", "mounjaro", "zepbound",
    "trulicity", "victoza", "saxenda",
    "semaglutide", "tirzepatide", "dulaglutide", "liraglutide",
]

STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "DC": "District of Columbia", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii",
    "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine",
    "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
    "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska",
    "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico",
    "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
    "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island",
    "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas",
    "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
    "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
}

# Reverse lookup: full state name -> abbreviation
NAME_TO_ABBR = {v: k for k, v in STATE_NAMES.items()}


# ── Download Helper ─────────────────────────────────────────────────────

def download_file(url: str, filename: str) -> Path:
    """Download a file to cache dir, skip if already exists."""
    path = CACHE_DIR / filename
    if path.exists():
        size_mb = path.stat().st_size / 1_000_000
        print(f"  [cached] {filename} ({size_mb:.1f} MB)")
        return path

    print(f"  Downloading {filename}...")
    resp = requests.get(url, stream=True, timeout=600)
    resp.raise_for_status()

    total = int(resp.headers.get("content-length", 0))
    downloaded = 0
    with open(path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=1_000_000):
            f.write(chunk)
            downloaded += len(chunk)
            if total > 0:
                pct = downloaded / total * 100
                print(f"\r  {filename}: {downloaded / 1_000_000:.0f}/{total / 1_000_000:.0f} MB ({pct:.0f}%)", end="", flush=True)
    print()
    return path


# ── Step 1: Count independent pharmacies per state from existing CSV ────

def count_pharmacies_by_state() -> dict[str, int]:
    """Count independent pharmacies per state from the master pharmacy CSV."""
    print("\n[1/5] Counting independent pharmacies per state...")
    counts: dict[str, int] = defaultdict(int)

    with open(PHARMACY_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            state = row["state"].strip().upper()
            if state in STATE_NAMES:
                counts[state] += 1

    print(f"  {sum(counts.values()):,} pharmacies across {len(counts)} states")
    return dict(counts)


# ── Step 2: Parse Medicare Part D data ──────────────────────────────────

def parse_part_d(path: Path) -> dict[str, dict]:
    """
    Parse CMS Part D Geography & Drug file for GLP-1 state-level claims.
    Returns {state_abbr: {claims, cost, fills}} summed across all GLP-1 brands.
    """
    print("\n[2/5] Parsing Medicare Part D GLP-1 claims by state...")
    state_data: dict[str, dict] = defaultdict(lambda: {"claims": 0, "cost": 0.0, "fills": 0.0})
    matched_brands = set()
    row_count = 0

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_count += 1
            if row.get("Prscrbr_Geo_Lvl", "").strip() != "State":
                continue
            brand = row.get("Brnd_Name", "").strip().upper()
            if brand not in GLP1_BRANDS_PARTD:
                continue

            matched_brands.add(brand)
            # Map state name to abbreviation
            state_desc = row.get("Prscrbr_Geo_Desc", "").strip()
            abbr = NAME_TO_ABBR.get(state_desc)
            if not abbr:
                continue

            claims = safe_int(row.get("Tot_Clms", "0"))
            cost = safe_float(row.get("Tot_Drug_Cst", "0"))
            fills = safe_float(row.get("Tot_30day_Fills", "0"))

            state_data[abbr]["claims"] += claims
            state_data[abbr]["cost"] += cost
            state_data[abbr]["fills"] += fills

    total_claims = sum(d["claims"] for d in state_data.values())
    total_cost = sum(d["cost"] for d in state_data.values())
    print(f"  Scanned {row_count:,} rows")
    print(f"  Matched brands: {sorted(matched_brands)}")
    print(f"  {len(state_data)} states, {total_claims:,} total claims, ${total_cost:,.0f} total cost")
    return dict(state_data)


# ── Step 3: Parse Medicaid SDUD data ────────────────────────────────────

def parse_sdud(path: Path) -> dict[str, dict]:
    """
    Stream-parse the 478 MB SDUD file for GLP-1 prescriptions by state.
    Returns {state_abbr: {prescriptions, amount_reimbursed}}.
    """
    print("\n[3/5] Parsing Medicaid SDUD GLP-1 prescriptions by state (streaming)...")
    state_data: dict[str, dict] = defaultdict(lambda: {"prescriptions": 0, "reimbursed": 0.0})
    matched_products = set()
    row_count = 0
    match_count = 0

    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_count += 1
            if row_count % 1_000_000 == 0:
                print(f"\r  Processed {row_count / 1_000_000:.0f}M rows, {match_count:,} GLP-1 matches...", end="", flush=True)

            product = row.get("Product Name", "").strip().lower()
            if not product:
                continue

            is_glp1 = any(brand in product for brand in GLP1_BRANDS_SDUD)
            if not is_glp1:
                continue

            match_count += 1
            matched_products.add(row.get("Product Name", "").strip())

            state = row.get("State", "").strip().upper()
            if state not in STATE_NAMES:
                # SDUD uses full state names sometimes, abbreviations other times
                state = NAME_TO_ABBR.get(row.get("State", "").strip(), state)
            if state not in STATE_NAMES:
                continue

            prescriptions = safe_int(row.get("Number of Prescriptions", "0"))
            reimbursed = safe_float(row.get("Total Amount Reimbursed", "0"))

            state_data[state]["prescriptions"] += prescriptions
            state_data[state]["reimbursed"] += reimbursed

    print(f"\r  Scanned {row_count:,} rows, {match_count:,} GLP-1 matches")
    print(f"  Matched products (sample): {sorted(list(matched_products))[:10]}")
    total_rx = sum(d["prescriptions"] for d in state_data.values())
    total_reimb = sum(d["reimbursed"] for d in state_data.values())
    print(f"  {len(state_data)} states, {total_rx:,} prescriptions, ${total_reimb:,.0f} reimbursed")
    return dict(state_data)


# ── Step 4: Parse NADAC for acquisition costs ──────────────────────────

def parse_nadac(path: Path) -> dict[str, dict]:
    """
    Parse NADAC data to find pharmacy acquisition costs for GLP-1 drugs.
    Returns {brand_key: {nadac_per_unit, effective_date, description}} for most recent entry.
    """
    print("\n[4/5] Parsing NADAC acquisition costs for GLP-1 drugs...")
    # Collect all GLP-1 entries, keeping only the most recent per NDC
    glp1_entries: dict[str, dict] = {}
    row_count = 0
    match_count = 0

    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_count += 1
            if row_count % 500_000 == 0:
                print(f"\r  Processed {row_count / 1_000_000:.1f}M rows...", end="", flush=True)

            desc = row.get("NDC Description", "").strip().lower()
            if not desc:
                continue

            is_glp1 = any(brand in desc for brand in GLP1_BRANDS_NADAC)
            if not is_glp1:
                continue

            match_count += 1
            ndc = row.get("NDC", "").strip()
            nadac = safe_float(row.get("NADAC Per Unit", "0"))
            eff_date = row.get("Effective Date", "")
            pharmacy_type = row.get("Pharmacy Type Indicator", "").strip()

            # Only retail pharmacy pricing
            if pharmacy_type and pharmacy_type.upper() not in ("", "C/I"):
                continue

            # Keep most recent entry per NDC
            if ndc not in glp1_entries or eff_date > glp1_entries[ndc]["date"]:
                glp1_entries[ndc] = {
                    "nadac_per_unit": nadac,
                    "date": eff_date,
                    "description": row.get("NDC Description", "").strip(),
                    "pricing_unit": row.get("Pricing Unit", "").strip(),
                }

    print(f"\r  Scanned {row_count:,} rows, {match_count:,} GLP-1 matches")
    print(f"  Found {len(glp1_entries)} unique GLP-1 NDCs with NADAC pricing")

    # Calculate weighted average acquisition cost per fill
    # GLP-1 injectables are typically dispensed as pens with specific unit counts
    # Group by brand and compute average NADAC per unit
    brand_costs: dict[str, list[float]] = defaultdict(list)
    for ndc, info in glp1_entries.items():
        desc_lower = info["description"].lower()
        for brand in ["ozempic", "wegovy", "mounjaro", "zepbound", "trulicity", "victoza", "saxenda"]:
            if brand in desc_lower:
                if info["nadac_per_unit"] > 0:
                    brand_costs[brand].append(info["nadac_per_unit"])
                break

    print("\n  Average NADAC per unit by brand:")
    for brand, costs in sorted(brand_costs.items()):
        avg = sum(costs) / len(costs) if costs else 0
        print(f"    {brand}: ${avg:.2f}/unit ({len(costs)} NDCs)")

    # Estimate acquisition cost per 30-day fill
    # Injectable GLP-1s: typically 1 pen/month, ~1.5-3 mL per pen
    # NADAC is per ML for injectables
    # Average across all brands for a blended rate
    all_costs = []
    for costs in brand_costs.values():
        all_costs.extend(costs)

    avg_nadac_per_unit = sum(all_costs) / len(all_costs) if all_costs else 0

    # Typical GLP-1 injectable fill: ~1.5 mL (varies by dose)
    # But NADAC per unit already reflects the pricing unit
    # For a more accurate calc, use total cost / total claims from Part D
    print(f"\n  Overall avg NADAC per unit: ${avg_nadac_per_unit:.2f}")

    return {
        "brand_costs": {k: sum(v) / len(v) for k, v in brand_costs.items()},
        "avg_nadac_per_unit": avg_nadac_per_unit,
        "entries": glp1_entries,
    }


# ── Step 5: Combine and calculate ──────────────────────────────────────

def build_state_data(
    pharmacy_counts: dict[str, int],
    part_d: dict[str, dict],
    sdud: dict[str, dict],
    nadac: dict,
) -> list[dict]:
    """Combine all sources into per-state GLP-1 loss metrics."""
    print("\n[5/5] Calculating per-state GLP-1 loss metrics...")

    # National average reimbursement per claim from Part D
    # (More reliable than SDUD because SDUD reimbursement is pre-rebate)
    total_partd_cost = sum(d["cost"] for d in part_d.values())
    total_partd_claims = sum(d["claims"] for d in part_d.values())
    national_avg_reimb = total_partd_cost / total_partd_claims if total_partd_claims > 0 else 0
    print(f"  National avg reimbursement per Part D claim: ${national_avg_reimb:,.2f}")

    # For acquisition cost, use Part D total cost as a proxy for what's reimbursed
    # The NADAC per-unit needs to be converted to per-fill, which varies by drug/dose
    # Instead, use published data: average GLP-1 WAC is ~$900-1100/month
    # NADAC is typically 1-5% below WAC
    # The pharmacy LOSS comes from: acquisition cost > reimbursement
    # Part D Tot_Drug_Cst includes: ingredient cost + dispensing fee + sales tax
    # This IS approximately what the pharmacy receives
    # NADAC represents what the pharmacy PAYS
    # So: loss = NADAC cost - reimbursement received

    # Calculate per-fill acquisition cost from NADAC
    # Use brand-level costs with typical fill sizes
    # Semaglutide (Ozempic/Wegovy): ~1.5-3 mL per month
    # Tirzepatide (Mounjaro/Zepbound): ~0.5-1 mL per month
    # We'll use the Part D avg cost per claim as the reimbursement benchmark
    # and compare against NADAC-derived acquisition cost

    rows = []
    all_states = sorted(set(list(STATE_NAMES.keys())))

    for state in all_states:
        name = STATE_NAMES[state]
        pharm_count = pharmacy_counts.get(state, 0)

        # Medicare Part D
        pd = part_d.get(state, {"claims": 0, "cost": 0.0, "fills": 0.0})
        medicare_claims = pd["claims"]
        medicare_cost = pd["cost"]
        medicare_fills = pd["fills"]

        # Medicaid SDUD
        sd = sdud.get(state, {"prescriptions": 0, "reimbursed": 0.0})
        medicaid_claims = sd["prescriptions"]
        medicaid_reimbursed = sd["reimbursed"]

        total_govt_claims = medicare_claims + medicaid_claims

        # Average reimbursement per claim (state-specific from Part D if available)
        if medicare_claims > 0:
            state_avg_reimb = medicare_cost / medicare_claims
        else:
            state_avg_reimb = national_avg_reimb

        # Total drug cost across both programs
        total_drug_cost = medicare_cost + medicaid_reimbursed

        # Average reimbursement across both programs
        avg_reimb_combined = total_drug_cost / total_govt_claims if total_govt_claims > 0 else 0

        # Per-pharmacy metrics
        claims_per_pharmacy = total_govt_claims / pharm_count if pharm_count > 0 else 0
        cost_per_pharmacy = total_drug_cost / pharm_count if pharm_count > 0 else 0

        rows.append({
            "state": state,
            "state_name": name,
            "medicare_glp1_claims": medicare_claims,
            "medicare_glp1_cost": round(medicare_cost, 2),
            "medicaid_glp1_claims": medicaid_claims,
            "medicaid_glp1_reimbursed": round(medicaid_reimbursed, 2),
            "total_govt_glp1_claims": total_govt_claims,
            "total_glp1_drug_cost": round(total_drug_cost, 2),
            "avg_cost_per_claim": round(avg_reimb_combined, 2),
            "independent_pharmacy_count": pharm_count,
            "govt_glp1_claims_per_pharmacy": round(claims_per_pharmacy, 1),
            "govt_glp1_cost_per_pharmacy": round(cost_per_pharmacy, 2),
        })

    # Sort by total claims descending
    rows.sort(key=lambda r: r["total_govt_glp1_claims"], reverse=True)

    # Print top 10
    print("\n  Top 10 states by total GLP-1 claims (Medicare + Medicaid):")
    for r in rows[:10]:
        print(
            f"    {r['state']}: {r['total_govt_glp1_claims']:>8,} claims, "
            f"${r['total_glp1_drug_cost']:>14,.0f} cost, "
            f"{r['govt_glp1_claims_per_pharmacy']:>6.0f} claims/pharmacy"
        )

    return rows


# ── Output ──────────────────────────────────────────────────────────────

def write_csv(rows: list[dict]):
    """Write the output CSV."""
    print(f"\nWriting CSV to {OUTPUT_CSV}...")

    fieldnames = [
        "state", "state_name",
        "medicare_glp1_claims", "medicare_glp1_cost",
        "medicaid_glp1_claims", "medicaid_glp1_reimbursed",
        "total_govt_glp1_claims", "total_glp1_drug_cost", "avg_cost_per_claim",
        "independent_pharmacy_count",
        "govt_glp1_claims_per_pharmacy", "govt_glp1_cost_per_pharmacy",
    ]

    # Re-sort alphabetically by state for the CSV
    rows_sorted = sorted(rows, key=lambda r: r["state"])

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        # Write metadata comment
        f.write("# State-Level GLP-1 Prescription Data from Public CMS Sources\n")
        f.write("# Medicare Part D data: 2023 (data.cms.gov)\n")
        f.write("# Medicaid SDUD data: 2024 (data.medicaid.gov)\n")
        f.write("# NADAC acquisition cost: 2024 (data.medicaid.gov)\n")
        f.write(f"# Generated: {time.strftime('%Y-%m-%d')}\n")
        f.write(f"# Independent pharmacy counts from: qualified_independent_pharmacies_feb2026.csv\n")
        f.write("#\n")

        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows_sorted)

    print(f"  Wrote {len(rows_sorted)} state rows")


def write_json(rows: list[dict]):
    """Write JSON for dashboard consumption."""
    print(f"Writing JSON to {OUTPUT_JSON}...")

    # Key by state abbreviation
    data = {}
    for r in rows:
        data[r["state"]] = {
            "medicareClaims": r["medicare_glp1_claims"],
            "medicareCost": r["medicare_glp1_cost"],
            "medicaidClaims": r["medicaid_glp1_claims"],
            "medicaidReimbursed": r["medicaid_glp1_reimbursed"],
            "totalGovtClaims": r["total_govt_glp1_claims"],
            "totalDrugCost": r["total_glp1_drug_cost"],
            "avgCostPerClaim": r["avg_cost_per_claim"],
            "govtClaimsPerPharmacy": r["govt_glp1_claims_per_pharmacy"],
            "govtCostPerPharmacy": r["govt_glp1_cost_per_pharmacy"],
        }

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"  Wrote {len(data)} states")


# ── Helpers ─────────────────────────────────────────────────────────────

def safe_int(val: str) -> int:
    try:
        return int(val.strip().replace(",", ""))
    except (ValueError, AttributeError):
        return 0

def safe_float(val: str) -> float:
    try:
        return float(val.strip().replace(",", "").replace("$", ""))
    except (ValueError, AttributeError):
        return 0.0


# ── Main ────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("State-Level GLP-1 Loss Data Builder")
    print("=" * 60)

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    # Step 0: Verify pharmacy CSV exists
    if not PHARMACY_CSV.exists():
        print(f"ERROR: Pharmacy CSV not found at {PHARMACY_CSV}")
        sys.exit(1)

    # Step 1: Count pharmacies
    pharmacy_counts = count_pharmacies_by_state()

    # Step 2: Download data files
    print("\nDownloading CMS data files...")
    part_d_path = download_file(PART_D_URL, "partd_geo_drug_2023.csv")
    sdud_path = download_file(SDUD_URL, "sdud_2024.csv")
    nadac_path = download_file(NADAC_URL, "nadac_2024.csv")

    # Step 3: Parse each source
    part_d_data = parse_part_d(part_d_path)
    sdud_data = parse_sdud(sdud_path)
    nadac_data = parse_nadac(nadac_path)

    # Step 4: Combine
    rows = build_state_data(pharmacy_counts, part_d_data, sdud_data, nadac_data)

    # Step 5: Output
    write_csv(rows)
    write_json(rows)

    print("\n" + "=" * 60)
    print("DONE")
    print(f"  CSV: {OUTPUT_CSV}")
    print(f"  JSON: {OUTPUT_JSON}")
    print("=" * 60)


if __name__ == "__main__":
    main()
