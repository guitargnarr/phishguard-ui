#!/usr/bin/env python3
"""
Geocode 41,774 independent pharmacies via Census Bureau batch API.
Falls back to ZIP centroid for non-matches.
Outputs pharmacy-points.json and pharmacy-details.json to ../public/data/
"""

import csv
import io
import json
import time
import zipfile
from pathlib import Path

import requests


# ── Config ──────────────────────────────────────────────────────────────

CSV_PATH = Path.home() / "Desktop/RetailMyMeds/Pharmacy_Database/qualified_independent_pharmacies_feb2026.csv"
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "data"
CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/locations/addressbatch"
BATCH_SIZE = 8000  # Under 10K limit with margin
DELAY_BETWEEN_BATCHES = 5  # seconds

STATUS_MAP = {
    "Active": 0,
    "Likely Active": 1,
    "Uncertain": 2,
    "Likely Closed": 3,
}


# ── Load ZIP centroids ──────────────────────────────────────────────────

def load_zip_centroids():
    """Download and parse Census ZCTA centroid data for fallback geocoding."""
    cache_path = Path(__file__).parent / "zcta_centroids.json"

    if cache_path.exists():
        print("Loading cached ZIP centroids...")
        with open(cache_path) as f:
            return json.load(f)

    print("Downloading ZCTA centroid data from Census Bureau...")
    # Census gazetteer files have centroid lat/lon for each ZCTA
    url = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_zcta_national.zip"
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()

    centroids = {}
    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        for name in zf.namelist():
            if name.endswith(".txt"):
                with zf.open(name) as f:
                    reader = csv.reader(io.TextIOWrapper(f, encoding="utf-8"), delimiter="\t")
                    header = next(reader)
                    # Find column indices
                    geoid_idx = next(i for i, h in enumerate(header) if "GEOID" in h)
                    lat_idx = next(i for i, h in enumerate(header) if "INTPTLAT" in h)
                    lon_idx = next(i for i, h in enumerate(header) if "INTPTLONG" in h)
                    for row in reader:
                        if len(row) > max(geoid_idx, lat_idx, lon_idx):
                            zip5 = row[geoid_idx].strip()
                            try:
                                lat = float(row[lat_idx].strip())
                                lon = float(row[lon_idx].strip())
                                centroids[zip5] = [lon, lat]
                            except (ValueError, IndexError):
                                continue

    print(f"  Loaded {len(centroids)} ZIP centroids")

    # Cache for next run
    with open(cache_path, "w") as f:
        json.dump(centroids, f)

    return centroids


# ── Read pharmacy CSV ───────────────────────────────────────────────────

def read_pharmacies():
    """Read the qualified pharmacy CSV and return list of dicts."""
    pharmacies = []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pharmacies.append(row)
    print(f"Read {len(pharmacies)} pharmacies from CSV")
    return pharmacies


# ── Census batch geocoding ──────────────────────────────────────────────

def geocode_batch(batch, batch_num, total_batches):
    """Send a batch to Census geocoder and return {npi: (lon, lat)} for matches."""
    print(f"\nBatch {batch_num}/{total_batches}: {len(batch)} addresses")

    # Build CSV content: ID, street, city, state, zip (no header)
    lines = []
    for pharm in batch:
        npi = pharm["npi"]
        addr = pharm["address_1"].replace(",", " ")  # commas break Census parser
        city = pharm["city"]
        state = pharm["state"]
        zipcode = pharm["zip"][:5]  # Ensure 5-digit
        lines.append(f"{npi},{addr},{city},{state},{zipcode}")

    csv_content = "\n".join(lines)

    # POST to Census API
    files = {
        "addressFile": ("batch.csv", csv_content, "text/csv"),
    }
    data = {
        "benchmark": "Public_AR_Current",
    }

    for attempt in range(3):
        try:
            resp = requests.post(CENSUS_URL, files=files, data=data, timeout=600)
            resp.raise_for_status()
            break
        except (requests.RequestException, requests.Timeout) as e:
            print(f"  Attempt {attempt + 1} failed: {e}")
            if attempt < 2:
                time.sleep(30)
            else:
                print("  FAILED after 3 attempts, skipping batch")
                return {}

    # Parse response
    results = {}
    match_count = 0
    for line in resp.text.strip().split("\n"):
        if not line.strip():
            continue
        # Response format: "ID","Input Address","Match/No Match","Match Type","Output Address","Lon,Lat","TIGER ID","Side"
        # The CSV can have quoted fields with commas inside
        try:
            parts = list(csv.reader([line]))[0]
            npi = parts[0].strip('" ')
            match_status = parts[2].strip('" ')
            if match_status == "Match" and len(parts) >= 6:
                coords_str = parts[5].strip('" ')
                if "," in coords_str:
                    lon_str, lat_str = coords_str.split(",")
                    lon = float(lon_str.strip())
                    lat = float(lat_str.strip())
                    results[npi] = (lon, lat)
                    match_count += 1
        except (IndexError, ValueError):
            continue

    print(f"  Matched: {match_count}/{len(batch)} ({100 * match_count / len(batch):.1f}%)")
    return results


# ── Main ────────────────────────────────────────────────────────────────

def main():
    pharmacies = read_pharmacies()
    zip_centroids = load_zip_centroids()

    # Check for cached geocode results (resume support)
    cache_path = Path(__file__).parent / "geocode_cache.json"
    if cache_path.exists():
        print("Loading cached geocode results...")
        with open(cache_path) as f:
            all_results = json.load(f)
        print(f"  {len(all_results)} cached results loaded")
    else:
        all_results = {}

    # Find pharmacies still needing geocoding
    remaining = [p for p in pharmacies if p["npi"] not in all_results]
    print(f"{len(remaining)} pharmacies need geocoding ({len(all_results)} already cached)")

    if remaining:
        # Split into batches
        batches = [remaining[i:i + BATCH_SIZE] for i in range(0, len(remaining), BATCH_SIZE)]
        total = len(batches)

        for i, batch in enumerate(batches, 1):
            results = geocode_batch(batch, i, total)

            # Store as {"npi": [lon, lat]} for JSON serialization
            for npi, (lon, lat) in results.items():
                all_results[npi] = [lon, lat]

            # Save cache after each batch
            with open(cache_path, "w") as f:
                json.dump(all_results, f)
            print(f"  Cache updated: {len(all_results)} total results")

            if i < total:
                print(f"  Waiting {DELAY_BETWEEN_BATCHES}s before next batch...")
                time.sleep(DELAY_BETWEEN_BATCHES)

    # ── Build output files ──────────────────────────────────────────────

    print("\n--- Building output files ---")
    census_matches = sum(1 for npi in all_results if all_results[npi] is not None)
    print(f"Census matches: {census_matches}")

    points = []  # [[lon, lat, statusCode], ...]
    details = []  # [{"n": name, "c": city, "s": state, "z": zip, "p": phone}, ...]
    fallback_count = 0
    skip_count = 0

    for pharm in pharmacies:
        npi = pharm["npi"]
        status_code = STATUS_MAP.get(pharm.get("estimated_status", ""), 2)

        if npi in all_results and all_results[npi] is not None:
            lon, lat = all_results[npi]
        else:
            # ZIP centroid fallback
            zip5 = pharm["zip"][:5]
            if zip5 in zip_centroids:
                lon, lat = zip_centroids[zip5]
                fallback_count += 1
            else:
                skip_count += 1
                continue

        points.append([round(lon, 5), round(lat, 5), status_code])
        details.append({
            "n": pharm.get("display_name", ""),
            "c": pharm.get("city", ""),
            "s": pharm.get("state", ""),
            "z": pharm.get("zip", "")[:5],
            "p": pharm.get("phone", ""),
            "a1": pharm.get("address_1", ""),
            "a2": pharm.get("address_2", ""),
            "ln": pharm.get("legal_name", ""),
            "dn": pharm.get("dba_name", ""),
            "on": pharm.get("owner_name", ""),
            "ot": pharm.get("owner_title", ""),
            "op": pharm.get("owner_phone", ""),
            "ed": pharm.get("enumeration_date", ""),
            "lu": pharm.get("last_updated", ""),
        })

    print(f"Total points: {len(points)}")
    print(f"  Census geocoded: {census_matches}")
    print(f"  ZIP centroid fallback: {fallback_count}")
    print(f"  Skipped (no coords): {skip_count}")

    # Write output
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    points_path = OUTPUT_DIR / "pharmacy-points.json"
    with open(points_path, "w") as f:
        json.dump(points, f, separators=(",", ":"))
    print(f"\nWrote {points_path} ({points_path.stat().st_size / 1024:.0f} KB)")

    details_path = OUTPUT_DIR / "pharmacy-details.json"
    with open(details_path, "w") as f:
        json.dump(details, f, separators=(",", ":"))
    print(f"Wrote {details_path} ({details_path.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
