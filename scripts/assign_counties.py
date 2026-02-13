#!/usr/bin/env python3
"""
Assign 41,752 pharmacies to counties via point-in-polygon.
Uses Shapely STRtree spatial index against counties-10m.json TopoJSON.
Outputs county-density.json to ../public/data/
"""

import json
from pathlib import Path

import requests
from shapely.geometry import shape, Point
from shapely import STRtree

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "data"
POINTS_PATH = OUTPUT_DIR / "pharmacy-points.json"
COUNTIES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"
COUNTIES_CACHE = Path(__file__).parent / "counties-10m.json"


def load_county_topojson():
    """Download and cache the county TopoJSON."""
    if COUNTIES_CACHE.exists():
        print("Loading cached counties TopoJSON...")
        with open(COUNTIES_CACHE) as f:
            return json.load(f)

    print("Downloading counties-10m.json from CDN...")
    resp = requests.get(COUNTIES_URL, timeout=60)
    resp.raise_for_status()
    data = resp.json()

    with open(COUNTIES_CACHE, "w") as f:
        json.dump(data, f)
    print(f"  Cached to {COUNTIES_CACHE}")
    return data


def topojson_to_geojson_features(topo, object_name):
    """Convert TopoJSON object to list of GeoJSON features with properties."""
    obj = topo["objects"][object_name]
    arcs = topo["arcs"]
    transform = topo.get("transform")

    def decode_arc(arc_index):
        """Decode a single arc from the TopoJSON arcs array."""
        reverse = arc_index < 0
        idx = ~arc_index if reverse else arc_index
        coords = arcs[idx]

        # Apply delta decoding if transform exists
        if transform:
            scale = transform["scale"]
            translate = transform["translate"]
            decoded = []
            x, y = 0, 0
            for dx, dy in coords:
                x += dx
                y += dy
                decoded.append([x * scale[0] + translate[0], y * scale[1] + translate[1]])
        else:
            decoded = list(coords)

        if reverse:
            decoded.reverse()
        return decoded

    def decode_ring(arc_indices):
        """Decode a ring (list of arc indices) into coordinates."""
        coords = []
        for arc_idx in arc_indices:
            arc_coords = decode_arc(arc_idx)
            # Skip first point of subsequent arcs (it's the same as last point of previous)
            if coords:
                arc_coords = arc_coords[1:]
            coords.extend(arc_coords)
        return coords

    features = []
    for geom in obj["geometries"]:
        geom_type = geom["type"]
        arcs_data = geom.get("arcs", [])

        if geom_type == "Polygon":
            rings = [decode_ring(ring) for ring in arcs_data]
            geojson_geom = {"type": "Polygon", "coordinates": rings}
        elif geom_type == "MultiPolygon":
            polygons = []
            for polygon_arcs in arcs_data:
                rings = [decode_ring(ring) for ring in polygon_arcs]
                polygons.append(rings)
            geojson_geom = {"type": "MultiPolygon", "coordinates": polygons}
        else:
            continue

        features.append({
            "type": "Feature",
            "id": geom.get("id"),
            "properties": geom.get("properties", {}),
            "geometry": geojson_geom,
        })

    return features


def main():
    # Load pharmacy points
    print(f"Loading pharmacy points from {POINTS_PATH}...")
    with open(POINTS_PATH) as f:
        points = json.load(f)
    print(f"  {len(points)} pharmacies loaded")

    # Load county TopoJSON and convert to GeoJSON
    topo = load_county_topojson()
    print("Converting TopoJSON to GeoJSON features...")
    county_features = topojson_to_geojson_features(topo, "counties")
    print(f"  {len(county_features)} county polygons")

    # Build Shapely geometries
    print("Building Shapely geometries...")
    county_shapes = []
    county_fips_list = []
    for feat in county_features:
        try:
            geom = shape(feat["geometry"])
            if geom.is_valid:
                county_shapes.append(geom)
                county_fips_list.append(str(feat["id"]).zfill(5))
        except Exception:
            continue
    print(f"  {len(county_shapes)} valid county geometries")

    # Build spatial index
    print("Building STRtree spatial index...")
    tree = STRtree(county_shapes)

    # Assign each pharmacy to a county
    print("Assigning pharmacies to counties...")
    # density[fips] = [total, active, likelyActive, uncertain, likelyClosed]
    density = {}
    assigned = 0
    unassigned = 0

    for i, (lon, lat, status) in enumerate(points):
        if i % 5000 == 0 and i > 0:
            print(f"  {i}/{len(points)} processed...")

        pt = Point(lon, lat)
        # Query nearest geometry -- STRtree.query_nearest returns indices
        idx = tree.query_nearest(pt)
        if hasattr(idx, '__len__'):
            idx = idx[0]

        county_geom = county_shapes[idx]
        # Verify the point is actually inside (query_nearest finds closest, not necessarily containing)
        if county_geom.contains(pt) or county_geom.distance(pt) < 0.01:
            fips = county_fips_list[idx]
            if fips not in density:
                density[fips] = [0, 0, 0, 0, 0]
            density[fips][0] += 1  # total
            if 0 <= status <= 3:
                density[fips][status + 1] += 1
            assigned += 1
        else:
            unassigned += 1

    print("\nAssignment complete:")
    print(f"  Assigned: {assigned}")
    print(f"  Unassigned: {unassigned}")
    print(f"  Counties with pharmacies: {len(density)}")

    # Stats
    totals = [v[0] for v in density.values()]
    print(f"  Max per county: {max(totals)}")
    print(f"  Median per county: {sorted(totals)[len(totals) // 2]}")

    # Write output
    output_path = OUTPUT_DIR / "county-density.json"
    with open(output_path, "w") as f:
        json.dump(density, f, separators=(",", ":"))
    print(f"\nWrote {output_path} ({output_path.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
