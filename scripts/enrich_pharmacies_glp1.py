#!/usr/bin/env python3
"""
Enrich 41,775 independent pharmacies with GLP-1 opportunity scoring
using publicly verifiable federal data sources.

Data sources:
  1. CDC PLACES 2025 -- ZCTA-level diabetes & obesity prevalence
     https://data.cdc.gov/500-Cities-Places/PLACES-ZCTA-Data-GIS-Friendly-Format-2025-release/kee5-23sr
  2. Census ACS 5-Year 2023 -- ZCTA-level % 65+, median income
     https://api.census.gov/data/2023/acs/acs5
  3. HRSA HPSA -- Primary care shortage area designations
     https://data.hrsa.gov/data/download
  4. State GLP-1 data -- from our build_glp1_state_data.py output

Input:  ~/Desktop/RetailMyMeds/Pharmacy_Database/qualified_independent_pharmacies_feb2026.csv
Output: ~/Desktop/RetailMyMeds/Pharmacy_Database/pharmacies_glp1_qualified.csv
"""

import csv
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
GLP1_STATE_CSV = (
    Path.home()
    / "Desktop/RetailMyMeds/Pharmacy_Database/state_glp1_loss_data_2024.csv"
)
OUTPUT_CSV = (
    Path.home()
    / "Desktop/RetailMyMeds/Pharmacy_Database/pharmacies_glp1_qualified.csv"
)

# CDC PLACES GIS-friendly (one row per ZCTA, measures as columns)
CDC_PLACES_URL = "https://data.cdc.gov/api/views/kee5-23sr/rows.csv?accessType=DOWNLOAD"

# HRSA Primary Care HPSAs
HRSA_HPSA_URL = "https://data.hrsa.gov/DataDownload/DD_Files/BCD_HPSA_FCT_DET_PC.csv"

# Census ACS -- we'll use the API for specific variables
CENSUS_API_BASE = "https://api.census.gov/data/2023/acs/acs5"

# ZIP to county FIPS crosswalk from HUD
HUD_ZIP_COUNTY_URL = "https://www.huduser.gov/hudapi/public/usps?type=2&query=All"

# ── Helpers ─────────────────────────────────────────────────────────────

def safe_float(val: str) -> float:
    try:
        return float(str(val).strip().replace(",", "").replace("$", "").replace("%", ""))
    except (ValueError, AttributeError, TypeError):
        return 0.0

def safe_int(val: str) -> int:
    try:
        return int(str(val).strip().replace(",", ""))
    except (ValueError, AttributeError, TypeError):
        return 0

def download_file(url: str, filename: str, headers: dict = None) -> Path:
    """Download a file to cache dir, skip if already exists."""
    path = CACHE_DIR / filename
    if path.exists():
        size_mb = path.stat().st_size / 1_000_000
        print(f"  [cached] {filename} ({size_mb:.1f} MB)")
        return path

    print(f"  Downloading {filename}...")
    resp = requests.get(url, stream=True, timeout=600, headers=headers or {})
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
            else:
                print(f"\r  {filename}: {downloaded / 1_000_000:.0f} MB...", end="", flush=True)
    print()
    return path


# ── Step 1: Load state-level GLP-1 data ────────────────────────────────

def load_state_glp1() -> dict[str, dict]:
    """Load state GLP-1 metrics from our previously generated CSV."""
    print("\n[1/6] Loading state-level GLP-1 data...")
    data = {}
    with open(GLP1_STATE_CSV, newline="", encoding="utf-8") as f:
        for line in f:
            if line.startswith("#"):
                continue
            break
        # Re-read from start, skipping comment lines
        f.seek(0)
        lines = [l for l in f if not l.startswith("#")]

    reader = csv.DictReader(lines)
    for row in reader:
        state = row["state"].strip()
        data[state] = {
            "total_govt_glp1_claims": safe_int(row["total_govt_glp1_claims"]),
            "total_glp1_drug_cost": safe_float(row["total_glp1_drug_cost"]),
            "govt_glp1_claims_per_pharmacy": safe_float(row["govt_glp1_claims_per_pharmacy"]),
            "govt_glp1_cost_per_pharmacy": safe_float(row["govt_glp1_cost_per_pharmacy"]),
        }
    print(f"  Loaded {len(data)} states")
    return data


# ── Step 2: Load CDC PLACES data ───────────────────────────────────────

def load_cdc_places(path: Path) -> dict[str, dict]:
    """
    Parse CDC PLACES GIS-friendly ZCTA data.
    Returns {zcta: {diabetes_pct, obesity_pct, no_insurance_pct, ...}}.
    """
    print("\n[2/6] Parsing CDC PLACES ZCTA health data...")
    data = {}
    row_count = 0

    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        fields = reader.fieldnames or []
        print(f"  Columns ({len(fields)}): {fields[:10]}...")

        # Find the right column names -- CDC PLACES uses varying naming conventions
        # Look for diabetes, obesity, and insurance columns
        diabetes_col = None
        obesity_col = None
        noinsurance_col = None
        depression_col = None
        noexercise_col = None

        for col in fields:
            col_lower = col.lower()
            if "diabetes" in col_lower and "crude" in col_lower and "prev" in col_lower:
                diabetes_col = col
            elif "obesity" in col_lower and "crude" in col_lower and "prev" in col_lower:
                obesity_col = col
            elif "access2" in col_lower and "crude" in col_lower and "prev" in col_lower:
                noinsurance_col = col
            elif "depression" in col_lower and "crude" in col_lower and "prev" in col_lower:
                depression_col = col
            elif ("lpa" in col_lower or "no_exercise" in col_lower or "physical" in col_lower) and "crude" in col_lower and "prev" in col_lower:
                noexercise_col = col

        # Fallback: try simpler matching
        if not diabetes_col:
            for col in fields:
                if "DIABETES" in col.upper() and "CrudePrev" in col:
                    diabetes_col = col
                    break
        if not obesity_col:
            for col in fields:
                if "OBESITY" in col.upper() and "CrudePrev" in col:
                    obesity_col = col
                    break
        if not noinsurance_col:
            for col in fields:
                if "ACCESS2" in col.upper() and "CrudePrev" in col:
                    noinsurance_col = col
                    break

        print(f"  Diabetes column: {diabetes_col}")
        print(f"  Obesity column: {obesity_col}")
        print(f"  No-insurance column: {noinsurance_col}")

        for row in reader:
            row_count += 1
            zcta = row.get("ZCTA5", row.get("GEOID", row.get("LocationID", ""))).strip()
            if not zcta:
                continue
            # Normalize to 5-digit
            zcta = zcta.zfill(5)[-5:]

            entry = {}
            if diabetes_col:
                entry["diabetes_pct"] = safe_float(row.get(diabetes_col, "0"))
            if obesity_col:
                entry["obesity_pct"] = safe_float(row.get(obesity_col, "0"))
            if noinsurance_col:
                entry["no_insurance_pct"] = safe_float(row.get(noinsurance_col, "0"))
            if depression_col:
                entry["depression_pct"] = safe_float(row.get(depression_col, "0"))

            if entry:
                data[zcta] = entry

    print(f"  Parsed {row_count:,} rows, {len(data):,} ZCTAs with data")
    return data


# ── Step 3: Load Census ACS data ───────────────────────────────────────

def load_census_acs() -> dict[str, dict]:
    """
    Fetch ZCTA-level demographics from Census ACS API.
    Returns {zcta: {median_age, pct_65plus, median_income, pct_insured}}.
    """
    print("\n[3/6] Fetching Census ACS ZCTA demographics...")

    cache_path = CACHE_DIR / "census_acs_zcta.json"
    if cache_path.exists():
        print("  [cached] census_acs_zcta.json")
        with open(cache_path) as f:
            return json.load(f)

    # Variables:
    # B01002_001E = median age
    # B01001_001E = total population
    # B01001_020E-025E = male 65-69, 70-74, 75-79, 80-84, 85+
    # B01001_044E-049E = female 65-69, 70-74, 75-79, 80-84, 85+
    # B19013_001E = median household income
    # B27001_001E = total for insurance, B27001_005E = male 19-25 with ins, etc.
    # Simpler: use B27010_001E (total) and build from there
    # Actually simplest: just get total pop, 65+ pop, median income

    # Male 65+ bins: B01001_020E through B01001_025E (6 bins)
    # Female 65+ bins: B01001_044E through B01001_049E (6 bins)
    male_65_vars = ",".join([f"B01001_{i:03d}E" for i in range(20, 26)])
    female_65_vars = ",".join([f"B01001_{i:03d}E" for i in range(44, 50)])

    variables = f"B01002_001E,B01001_001E,{male_65_vars},{female_65_vars},B19013_001E"

    url = f"{CENSUS_API_BASE}?get=NAME,{variables}&for=zip%20code%20tabulation%20area:*"
    print(f"  Fetching from Census API...")

    resp = requests.get(url, timeout=120)
    if resp.status_code != 200:
        print(f"  WARNING: Census API returned {resp.status_code}")
        print(f"  Response: {resp.text[:500]}")
        return {}

    rows = resp.json()
    headers = rows[0]
    print(f"  Got {len(rows) - 1:,} ZCTAs")

    data = {}
    for row in rows[1:]:
        zcta = row[-1].strip().zfill(5)
        vals = dict(zip(headers, row))

        total_pop = safe_int(vals.get("B01001_001E", "0"))
        median_age = safe_float(vals.get("B01002_001E", "0"))
        median_income = safe_int(vals.get("B19013_001E", "0"))

        # Sum 65+ population
        pop_65_plus = 0
        for i in range(20, 26):
            pop_65_plus += safe_int(vals.get(f"B01001_{i:03d}E", "0"))
        for i in range(44, 50):
            pop_65_plus += safe_int(vals.get(f"B01001_{i:03d}E", "0"))

        pct_65_plus = (pop_65_plus / total_pop * 100) if total_pop > 0 else 0

        data[zcta] = {
            "total_pop": total_pop,
            "median_age": round(median_age, 1),
            "pct_65_plus": round(pct_65_plus, 1),
            "median_income": median_income,
        }

    # Cache
    with open(cache_path, "w") as f:
        json.dump(data, f)
    print(f"  Cached {len(data):,} ZCTAs")
    return data


# ── Step 4: Load HRSA HPSA data ────────────────────────────────────────

def load_hrsa_hpsa(path: Path) -> dict[str, dict]:
    """
    Parse HRSA HPSA data to find underserved counties.
    Returns {county_fips: {hpsa_score, hpsa_name, designation_type}}.
    """
    print("\n[4/6] Parsing HRSA HPSA shortage area data...")
    county_hpsa: dict[str, dict] = {}
    row_count = 0
    match_count = 0

    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        fields = reader.fieldnames or []
        print(f"  Columns ({len(fields)}): {[c for c in fields[:8]]}...")

        for row in reader:
            row_count += 1
            status = row.get("HPSA Status", "").strip()
            if status != "Designated":
                continue

            match_count += 1
            # Get county FIPS -- use the combined 5-digit code
            fips = row.get("Common State County FIPS Code", "").strip()
            if not fips or len(fips) < 4:
                # Fallback: try State and County FIPS
                fips = row.get("State and County Federal Information Processing Standard Code", "").strip()
            if not fips or len(fips) < 4:
                continue
            fips = fips.zfill(5)

            score = safe_int(row.get("HPSA Score", "0"))

            # Keep highest score per county
            if fips not in county_hpsa or score > county_hpsa[fips]["hpsa_score"]:
                county_hpsa[fips] = {
                    "hpsa_score": score,
                    "hpsa_name": row.get("HPSA Name", "").strip(),
                    "designation_type": row.get("HPSA Designation Type", "").strip(),
                }

    print(f"  Scanned {row_count:,} rows, {match_count:,} designated HPSAs")
    print(f"  {len(county_hpsa):,} counties with HPSA designations")
    return county_hpsa


# ── Step 5: ZIP to County FIPS mapping ──────────────────────────────────

def build_zip_to_county() -> dict[str, str]:
    """
    Build ZIP -> county FIPS mapping from Census ZCTA-to-county relationship file.
    """
    print("\n[5/6] Building ZIP to county FIPS mapping...")

    cache_path = CACHE_DIR / "zip_county_map.json"
    if cache_path.exists():
        print("  [cached] zip_county_map.json")
        with open(cache_path) as f:
            return json.load(f)

    # Use Census ZCTA-County Relationship File
    url = "https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt"
    print(f"  Downloading Census ZCTA-County relationship file...")
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()

    mapping: dict[str, str] = {}
    # Track the primary county for each ZCTA (highest population overlap)
    zcta_county_pop: dict[str, list] = defaultdict(list)

    lines = resp.text.strip().split("\n")
    reader = csv.DictReader(lines, delimiter="|")
    for row in reader:
        zcta = row.get("GEOID_ZCTA5_20", "").strip().zfill(5)
        county_fips = row.get("GEOID_COUNTY_20", "").strip().zfill(5)
        pop = safe_int(row.get("AREALAND_PART", "0"))  # Use land area as proxy
        if zcta and county_fips:
            zcta_county_pop[zcta].append((county_fips, pop))

    # For each ZCTA, pick the county with the largest overlap
    for zcta, counties in zcta_county_pop.items():
        best = max(counties, key=lambda x: x[1])
        mapping[zcta] = best[0]

    with open(cache_path, "w") as f:
        json.dump(mapping, f)
    print(f"  Mapped {len(mapping):,} ZCTAs to counties")
    return mapping


# ── Step 6: Score and enrich pharmacies ─────────────────────────────────

def score_pharmacies(
    state_glp1: dict,
    cdc_places: dict,
    census_acs: dict,
    hrsa_hpsa: dict,
    zip_to_county: dict,
) -> list[dict]:
    """
    Read each pharmacy, enrich with area-level data, compute GLP-1 opportunity score.
    """
    print("\n[6/6] Scoring pharmacies...")

    # Collect all diabetes and obesity values for percentile calculation
    all_diabetes = [v["diabetes_pct"] for v in cdc_places.values() if v.get("diabetes_pct", 0) > 0]
    all_obesity = [v["obesity_pct"] for v in cdc_places.values() if v.get("obesity_pct", 0) > 0]
    all_65plus = [v["pct_65_plus"] for v in census_acs.values() if v.get("pct_65_plus", 0) > 0]

    # Compute percentile thresholds
    all_diabetes.sort()
    all_obesity.sort()
    all_65plus.sort()

    def percentile(sorted_list, value):
        if not sorted_list or value <= 0:
            return 0
        count_below = sum(1 for x in sorted_list if x <= value)
        return round(count_below / len(sorted_list) * 100, 1)

    rows = []
    matched_cdc = 0
    matched_acs = 0
    matched_hpsa = 0
    total = 0

    with open(PHARMACY_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total += 1
            if total % 10000 == 0:
                print(f"  Processing pharmacy {total:,}...", flush=True)

            npi = row["npi"].strip()
            state = row["state"].strip().upper()
            zip5 = row["zip"].strip()[:5].zfill(5)
            status = row["estimated_status"].strip()

            # State GLP-1 data
            sg = state_glp1.get(state, {})

            # CDC PLACES (ZIP level)
            cdc = cdc_places.get(zip5, {})
            diabetes_pct = cdc.get("diabetes_pct", 0)
            obesity_pct = cdc.get("obesity_pct", 0)
            no_insurance_pct = cdc.get("no_insurance_pct", 0)
            if diabetes_pct > 0:
                matched_cdc += 1

            # Census ACS (ZIP level)
            acs = census_acs.get(zip5, {})
            median_age = acs.get("median_age", 0)
            pct_65_plus = acs.get("pct_65_plus", 0)
            median_income = acs.get("median_income", 0)
            zip_population = acs.get("total_pop", 0)
            if pct_65_plus > 0:
                matched_acs += 1

            # HRSA HPSA (county level via ZIP->county mapping)
            county_fips = zip_to_county.get(zip5, "")
            hpsa = hrsa_hpsa.get(county_fips, {})
            hpsa_score = hpsa.get("hpsa_score", 0)
            hpsa_designated = 1 if hpsa_score > 0 else 0
            if hpsa_score > 0:
                matched_hpsa += 1

            # ── Composite GLP-1 Opportunity Score ──
            # Each dimension normalized 0-100, then weighted
            #
            # Dimensions:
            #   1. Disease Burden (40%) -- diabetes + obesity prevalence in ZIP
            #   2. Medicare Density (25%) -- % 65+ in ZIP (proxy for Part D eligibility)
            #   3. Market Access (20%) -- state GLP-1 claims per pharmacy + insurance rate
            #   4. Underserved Bonus (15%) -- HPSA score (less competition)

            # 1. Disease burden (0-100)
            diabetes_score = min(100, diabetes_pct * 5) if diabetes_pct > 0 else 0  # 20% diabetes = 100
            obesity_score = min(100, obesity_pct * 2.5) if obesity_pct > 0 else 0  # 40% obesity = 100
            disease_burden = (diabetes_score * 0.6 + obesity_score * 0.4)

            # 2. Medicare density (0-100)
            medicare_density = min(100, pct_65_plus * 4) if pct_65_plus > 0 else 0  # 25% senior = 100

            # 3. Market access (0-100)
            claims_per_pharm = sg.get("govt_glp1_claims_per_pharmacy", 0)
            # Normalize: 1500 claims/pharmacy = 100 (top states like IN, NH)
            market_access = min(100, claims_per_pharm / 15) if claims_per_pharm > 0 else 0
            # Penalize low insurance areas
            if no_insurance_pct > 20:
                market_access *= 0.7

            # 4. Underserved bonus (0-100)
            underserved = min(100, hpsa_score * 4) if hpsa_score > 0 else 0  # Score 25 = 100

            # Weighted composite
            composite = (
                disease_burden * 0.40 +
                medicare_density * 0.25 +
                market_access * 0.20 +
                underserved * 0.15
            )

            # Grade: A (75+), B (55-74), C (35-54), D (<35)
            if composite >= 75:
                grade = "A"
            elif composite >= 55:
                grade = "B"
            elif composite >= 35:
                grade = "C"
            else:
                grade = "D"

            rows.append({
                # Original pharmacy fields
                "npi": npi,
                "display_name": row["display_name"].strip(),
                "city": row["city"].strip(),
                "state": state,
                "zip": zip5,
                "phone": row["phone"].strip(),
                "estimated_status": status,
                "owner_name": row["owner_name"].strip(),
                "owner_title": row["owner_title"].strip(),
                # Area health data (CDC PLACES)
                "zip_diabetes_pct": round(diabetes_pct, 1),
                "zip_obesity_pct": round(obesity_pct, 1),
                "zip_no_insurance_pct": round(no_insurance_pct, 1),
                # Area demographics (Census ACS)
                "zip_median_age": median_age,
                "zip_pct_65_plus": pct_65_plus,
                "zip_median_income": median_income,
                "zip_population": zip_population,
                # Underserved area (HRSA)
                "county_fips": county_fips,
                "hpsa_designated": hpsa_designated,
                "hpsa_score": hpsa_score,
                # State GLP-1 context
                "state_glp1_claims_per_pharmacy": round(claims_per_pharm, 1),
                "state_glp1_cost_per_pharmacy": round(sg.get("govt_glp1_cost_per_pharmacy", 0), 0),
                # Scoring
                "disease_burden_score": round(disease_burden, 1),
                "medicare_density_score": round(medicare_density, 1),
                "market_access_score": round(market_access, 1),
                "underserved_score": round(underserved, 1),
                "glp1_opportunity_score": round(composite, 1),
                "glp1_opportunity_grade": grade,
            })

    print(f"\n  Enrichment coverage:")
    print(f"    CDC PLACES (diabetes/obesity): {matched_cdc:,}/{total:,} ({matched_cdc/total*100:.1f}%)")
    print(f"    Census ACS (demographics):     {matched_acs:,}/{total:,} ({matched_acs/total*100:.1f}%)")
    print(f"    HRSA HPSA (underserved):        {matched_hpsa:,}/{total:,} ({matched_hpsa/total*100:.1f}%)")

    # Grade distribution
    grades = defaultdict(int)
    for r in rows:
        grades[r["glp1_opportunity_grade"]] += 1
    print(f"\n  Grade distribution:")
    for g in ["A", "B", "C", "D"]:
        print(f"    {g}: {grades[g]:,} pharmacies ({grades[g]/total*100:.1f}%)")

    return rows


# ── Output ──────────────────────────────────────────────────────────────

def write_output(rows: list[dict]):
    """Write enriched pharmacy CSV."""
    print(f"\nWriting enriched CSV to {OUTPUT_CSV}...")

    fieldnames = [
        "npi", "display_name", "city", "state", "zip", "phone",
        "estimated_status", "owner_name", "owner_title",
        "zip_diabetes_pct", "zip_obesity_pct", "zip_no_insurance_pct",
        "zip_median_age", "zip_pct_65_plus", "zip_median_income", "zip_population",
        "county_fips", "hpsa_designated", "hpsa_score",
        "state_glp1_claims_per_pharmacy", "state_glp1_cost_per_pharmacy",
        "disease_burden_score", "medicare_density_score",
        "market_access_score", "underserved_score",
        "glp1_opportunity_score", "glp1_opportunity_grade",
    ]

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        f.write("# Independent Pharmacy GLP-1 Opportunity Qualification\n")
        f.write("# Health data: CDC PLACES 2025 (data.cdc.gov)\n")
        f.write("# Demographics: Census ACS 5-Year 2023 (api.census.gov)\n")
        f.write("# Shortage areas: HRSA HPSA 2026 (data.hrsa.gov)\n")
        f.write("# GLP-1 claims: CMS Medicare Part D 2023 + Medicaid SDUD 2024\n")
        f.write(f"# Generated: {time.strftime('%Y-%m-%d')}\n")
        f.write("# Scoring: Disease Burden 40%, Medicare Density 25%, Market Access 20%, Underserved 15%\n")
        f.write("# Grades: A (75+), B (55-74), C (35-54), D (<35)\n")
        f.write("#\n")

        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        # Sort by score descending
        rows.sort(key=lambda r: r["glp1_opportunity_score"], reverse=True)
        writer.writerows(rows)

    print(f"  Wrote {len(rows):,} pharmacies")

    # Top 20 preview
    print("\n  Top 20 pharmacies by GLP-1 opportunity score:")
    print(f"  {'Rank':>4} {'NPI':>10} {'Name':<35} {'City':<20} {'ST':>2} {'Score':>5} {'Grade':>5}")
    print(f"  {'-'*4} {'-'*10} {'-'*35} {'-'*20} {'-'*2} {'-'*5} {'-'*5}")
    for i, r in enumerate(rows[:20]):
        name = r["display_name"][:35]
        city = r["city"][:20]
        print(f"  {i+1:>4} {r['npi']:>10} {name:<35} {city:<20} {r['state']:>2} {r['glp1_opportunity_score']:>5.1f} {r['glp1_opportunity_grade']:>5}")


# ── Main ────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print("Pharmacy GLP-1 Opportunity Enrichment & Scoring")
    print("=" * 70)

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    if not PHARMACY_CSV.exists():
        print(f"ERROR: Pharmacy CSV not found at {PHARMACY_CSV}")
        sys.exit(1)
    if not GLP1_STATE_CSV.exists():
        print(f"ERROR: State GLP-1 CSV not found at {GLP1_STATE_CSV}")
        print("Run build_glp1_state_data.py first.")
        sys.exit(1)

    # Load state GLP-1 data
    state_glp1 = load_state_glp1()

    # Download external datasets
    print("\nDownloading external datasets...")
    cdc_path = download_file(CDC_PLACES_URL, "cdc_places_zcta_2025.csv")
    hrsa_path = download_file(HRSA_HPSA_URL, "hrsa_hpsa_pc.csv")

    # Parse each source
    cdc_places = load_cdc_places(cdc_path)
    census_acs = load_census_acs()
    hrsa_hpsa = load_hrsa_hpsa(hrsa_path)
    zip_to_county = build_zip_to_county()

    # Score and enrich
    rows = score_pharmacies(state_glp1, cdc_places, census_acs, hrsa_hpsa, zip_to_county)

    # Write output
    write_output(rows)

    print("\n" + "=" * 70)
    print("DONE")
    print(f"  Output: {OUTPUT_CSV}")
    print("=" * 70)


if __name__ == "__main__":
    main()
