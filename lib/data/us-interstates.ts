// Simplified US Interstate Highway GeoJSON
// ~30 major interstates with key waypoint coordinates [lon, lat]

export interface InterstateFeature {
  type: "Feature";
  properties: { id: string; name: string };
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

export interface InterstateCollection {
  type: "FeatureCollection";
  features: InterstateFeature[];
}

export const US_INTERSTATES: InterstateCollection = {
  type: "FeatureCollection",
  features: [
    // ── East-West Corridors ──────────────────────────────────────────
    {
      type: "Feature",
      properties: { id: "I-10", name: "Interstate 10" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-118.25, 34.05], // Los Angeles
          [-115.17, 32.72], // near El Centro
          [-112.07, 33.45], // Phoenix
          [-109.95, 32.22], // Tucson area
          [-106.65, 31.80], // Las Cruces/El Paso
          [-103.35, 31.00], // near Pecos
          [-100.44, 30.45], // near Ozona
          [-97.74, 30.27],  // Austin area
          [-96.80, 29.76],  // Houston
          [-93.22, 30.22],  // Lake Charles
          [-91.15, 30.45],  // Baton Rouge
          [-90.07, 29.95],  // New Orleans
          [-88.10, 30.40],  // Mobile
          [-87.22, 30.47],  // Pensacola
          [-85.66, 30.16],  // Panama City
          [-84.28, 30.44],  // Tallahassee
          [-82.46, 30.33],  // near Lake City
          [-81.66, 30.33],  // Jacksonville
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-20", name: "Interstate 20" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-99.73, 32.45],  // Abilene
          [-97.33, 32.75],  // Fort Worth
          [-96.80, 32.78],  // Dallas
          [-94.80, 32.50],  // near Marshall
          [-93.75, 32.52],  // Shreveport
          [-92.45, 32.51],  // Monroe
          [-91.15, 32.30],  // Vicksburg
          [-90.18, 32.30],  // Jackson MS
          [-89.29, 32.35],  // Meridian
          [-87.57, 33.21],  // Tuscaloosa
          [-86.80, 33.52],  // Birmingham
          [-85.33, 33.44],  // Anniston
          [-84.39, 33.75],  // Atlanta
          [-83.37, 33.47],  // Madison GA
          [-82.00, 33.47],  // Augusta
          [-80.84, 34.00],  // Columbia SC
          [-79.93, 34.05],  // Florence SC
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-30", name: "Interstate 30" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-96.80, 32.78],  // Dallas
          [-95.99, 33.13],  // Sulphur Springs
          [-94.04, 33.44],  // Texarkana
          [-93.23, 33.68],  // Hope AR
          [-92.44, 34.25],  // Benton
          [-92.29, 34.75],  // Little Rock
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-40", name: "Interstate 40" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-122.42, 37.65], // Barstow area (west)
          [-117.92, 34.06], // near Barstow
          [-116.54, 34.95], // Barstow
          [-114.59, 35.19], // Needles
          [-112.07, 35.20], // Flagstaff
          [-109.50, 35.52], // Gallup
          [-106.65, 35.08], // Albuquerque
          [-104.60, 35.00], // Santa Rosa
          [-103.20, 35.18], // Tucumcari
          [-101.84, 35.22], // Amarillo
          [-99.75, 35.40],  // Elk City
          [-97.52, 35.47],  // Oklahoma City
          [-95.99, 35.46],  // Henryetta
          [-94.80, 35.39],  // Ft Smith area
          [-93.09, 35.28],  // Russellville
          [-92.29, 34.75],  // Little Rock area
          [-90.05, 35.15],  // Memphis
          [-88.82, 35.61],  // Jackson TN
          [-86.78, 36.17],  // Nashville
          [-85.31, 36.00],  // Cookeville
          [-84.26, 35.96],  // Knoxville
          [-82.55, 35.60],  // Asheville
          [-80.48, 36.10],  // Winston-Salem
          [-79.44, 36.07],  // Greensboro
          [-78.64, 35.78],  // Raleigh
          [-77.38, 35.60],  // Wilson NC
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-44", name: "Interstate 44" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-98.48, 33.91],  // Wichita Falls
          [-97.52, 35.47],  // Oklahoma City
          [-96.97, 36.15],  // Tulsa
          [-94.83, 36.92],  // Joplin
          [-93.29, 37.21],  // Springfield MO
          [-92.20, 37.82],  // Rolla
          [-90.20, 38.63],  // St. Louis
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-64", name: "Interstate 64" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-90.20, 38.63],  // St. Louis
          [-89.02, 38.52],  // Mt. Vernon IL
          [-87.88, 38.04],  // Evansville area
          [-86.15, 38.25],  // near Louisville
          [-85.76, 38.25],  // Louisville
          [-84.50, 38.05],  // Frankfort
          [-83.43, 38.04],  // Lexington
          [-82.44, 38.41],  // Huntington WV
          [-81.63, 38.35],  // Charleston WV
          [-80.43, 37.78],  // White Sulphur Springs
          [-79.94, 38.06],  // Staunton VA
          [-78.49, 38.03],  // Charlottesville
          [-77.46, 37.54],  // Richmond
          [-76.30, 37.08],  // Hampton Roads
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-70", name: "Interstate 70" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-111.84, 38.93], // near Green River UT
          [-109.55, 39.06], // Grand Junction
          [-108.55, 39.07], // Glenwood Springs
          [-106.82, 39.55], // Vail
          [-105.78, 39.55], // Georgetown
          [-104.99, 39.74], // Denver
          [-102.05, 39.32], // Burlington CO
          [-100.52, 39.01], // Colby KS
          [-99.31, 38.87],  // Hays
          [-97.33, 38.95],  // Salina
          [-96.59, 39.04],  // Topeka area
          [-94.63, 39.10],  // Kansas City
          [-92.33, 38.95],  // Columbia MO
          [-90.20, 38.63],  // St. Louis
          [-89.66, 38.66],  // near Effingham
          [-88.95, 39.17],  // Effingham
          [-87.53, 39.47],  // Terre Haute
          [-86.16, 39.77],  // Indianapolis
          [-85.19, 39.82],  // Richmond IN
          [-84.52, 39.76],  // Dayton
          [-83.80, 39.93],  // Springfield OH
          [-82.98, 40.00],  // Columbus
          [-81.52, 40.06],  // Zanesville
          [-80.72, 40.06],  // Wheeling WV
          [-79.95, 40.00],  // Washington PA
          [-79.00, 40.05],  // near Somerset
          [-78.40, 40.02],  // Bedford PA
          [-77.61, 40.27],  // Breezewood
          [-76.88, 40.27],  // Harrisburg
          [-75.93, 40.10],  // near Lancaster
          [-75.56, 39.91],  // near Wilmington
          [-76.61, 39.29],  // Baltimore
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-80", name: "Interstate 80" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-122.42, 37.77], // San Francisco
          [-121.89, 37.68], // Oakland
          [-121.29, 37.95], // near Fairfield
          [-120.99, 38.58], // Sacramento area
          [-120.23, 39.33], // near Donner Pass
          [-119.82, 39.53], // Reno
          [-117.74, 40.84], // Winnemucca
          [-115.76, 40.83], // Elko
          [-112.58, 40.82], // near Wendover
          [-111.89, 40.76], // Salt Lake City
          [-111.04, 40.75], // near Evanston WY
          [-109.20, 41.13], // Rock Springs
          [-107.23, 41.14], // Rawlins
          [-105.59, 41.14], // Laramie
          [-104.82, 41.14], // Cheyenne
          [-102.99, 41.02], // Sidney NE
          [-101.70, 41.13], // North Platte
          [-100.77, 40.87], // Kearney
          [-99.37, 40.79],  // near Lexington
          [-96.68, 41.26],  // Omaha
          [-95.86, 41.26],  // Council Bluffs
          [-93.62, 41.60],  // Des Moines
          [-92.43, 41.66],  // Grinnell
          [-91.53, 41.66],  // Iowa City
          [-90.58, 41.52],  // Davenport
          [-89.65, 41.51],  // near Moline
          [-88.84, 41.52],  // La Salle
          [-88.08, 41.54],  // near Joliet
          [-87.63, 41.67],  // Chicago (south)
          [-86.80, 41.60],  // Gary
          [-85.13, 41.08],  // Fort Wayne area
          [-84.21, 41.07],  // near Van Wert
          [-83.55, 41.16],  // near Findlay
          [-82.52, 41.24],  // near Mansfield
          [-81.52, 41.09],  // near Akron
          [-80.65, 41.10],  // Youngstown
          [-80.09, 41.10],  // Sharon PA
          [-79.00, 41.08],  // Clarion
          [-77.85, 41.00],  // Lock Haven
          [-76.82, 41.24],  // Bloomsburg
          [-75.85, 41.25],  // near Scranton
          [-75.21, 40.93],  // Stroudsburg
          [-74.68, 40.84],  // near Dover NJ
          [-74.17, 40.80],  // near NYC (GWB)
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-90", name: "Interstate 90" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-122.33, 47.61], // Seattle
          [-120.51, 47.42], // Ellensburg
          [-117.43, 47.66], // Spokane
          [-116.78, 47.70], // Coeur d'Alene
          [-114.09, 46.87], // Missoula
          [-112.03, 45.78], // Butte
          [-111.04, 45.68], // Bozeman
          [-108.50, 45.78], // Billings
          [-106.65, 45.80], // near Hardin
          [-105.51, 44.80], // Sheridan WY
          [-104.71, 44.37], // Gillette
          [-103.77, 44.08], // Rapid City
          [-102.01, 43.73], // near Pierre SD
          [-100.35, 43.78], // near Chamberlain
          [-98.35, 43.73],  // Mitchell
          [-96.73, 43.55],  // Sioux Falls
          [-96.17, 43.73],  // near Worthington MN
          [-94.88, 43.65],  // near Fairmont
          [-93.27, 44.00],  // Albert Lea
          [-91.50, 43.80],  // La Crosse
          [-90.50, 43.44],  // near Tomah
          [-89.78, 43.39],  // Wisconsin Dells
          [-89.40, 43.07],  // Madison
          [-88.01, 42.71],  // Beloit
          [-87.63, 41.88],  // Chicago
          [-87.33, 41.65],  // Gary area
          [-86.25, 41.68],  // South Bend area
          [-85.00, 42.30],  // Kalamazoo
          [-83.75, 42.33],  // near Ann Arbor
          [-83.05, 42.33],  // Detroit area
          [-82.43, 42.98],  // Port Huron/Sarnia
          [-81.68, 41.50],  // Cleveland
          [-80.65, 42.10],  // Erie PA
          [-79.95, 42.13],  // near Jamestown NY
          [-78.88, 42.88],  // Buffalo
          [-77.61, 43.16],  // Rochester
          [-76.15, 43.05],  // Syracuse
          [-75.46, 43.10],  // Utica
          [-73.76, 42.66],  // Albany
          [-73.21, 42.45],  // near Pittsfield MA
          [-72.59, 42.10],  // Springfield MA
          [-72.02, 42.06],  // near Hartford
          [-71.06, 42.36],  // Boston
        ],
      },
    },
    // ── North-South Corridors ────────────────────────────────────────
    {
      type: "Feature",
      properties: { id: "I-5", name: "Interstate 5" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-117.12, 32.54], // San Diego (border)
          [-117.16, 32.72], // San Diego
          [-117.94, 33.77], // near Camp Pendleton
          [-118.25, 34.05], // Los Angeles
          [-118.54, 34.45], // near Santa Clarita
          [-119.02, 35.37], // Bakersfield (via Tejon)
          [-120.43, 36.78], // near Fresno
          [-121.50, 37.33], // near San Jose
          [-121.95, 37.67], // near Oakland
          [-122.42, 37.77], // San Francisco area
          [-122.42, 38.58], // Sacramento
          [-122.32, 40.58], // Redding
          [-122.57, 42.33], // near Medford OR
          [-122.87, 42.33], // Ashland
          [-123.02, 43.22], // Roseburg
          [-123.09, 44.05], // Eugene
          [-123.04, 44.94], // Salem
          [-122.68, 45.52], // Portland
          [-122.65, 46.28], // near Longview
          [-122.90, 46.97], // Olympia
          [-122.33, 47.24], // Tacoma
          [-122.33, 47.61], // Seattle
          [-122.20, 48.20], // near Mt Vernon
          [-122.47, 48.77], // Bellingham
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-15", name: "Interstate 15" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-117.16, 32.72], // San Diego
          [-117.17, 33.13], // Escondido/Temecula
          [-117.37, 33.95], // Riverside
          [-117.30, 34.49], // Victorville
          [-115.95, 35.60], // Baker
          [-115.14, 36.17], // Las Vegas
          [-114.78, 36.93], // near Mesquite
          [-113.58, 37.10], // St George UT
          [-113.51, 37.67], // Cedar City
          [-112.83, 38.57], // Beaver
          [-112.08, 39.36], // Nephi
          [-111.89, 40.23], // Provo
          [-111.89, 40.76], // Salt Lake City
          [-112.02, 41.22], // Ogden
          [-112.44, 42.33], // near Pocatello
          [-112.46, 43.49], // Idaho Falls
          [-112.53, 44.25], // near Dubois
          [-112.69, 45.28], // near Dillon MT
          [-112.03, 45.78], // Butte
          [-112.03, 46.60], // Helena
          [-111.46, 47.51], // Great Falls
          [-110.68, 48.55], // near Shelby
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-25", name: "Interstate 25" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-106.65, 31.80], // Las Cruces/El Paso area
          [-106.65, 32.35], // near T or C
          [-106.65, 34.07], // near Socorro
          [-106.65, 35.08], // Albuquerque
          [-106.61, 35.69], // Santa Fe
          [-105.22, 36.41], // near Raton Pass
          [-104.61, 37.17], // Trinidad CO
          [-104.82, 37.95], // Pueblo
          [-104.82, 38.83], // Colorado Springs
          [-104.99, 39.74], // Denver
          [-105.08, 40.59], // Fort Collins
          [-104.82, 41.14], // Cheyenne
          [-105.59, 42.87], // Casper WY
          [-106.33, 43.03], // near Thermopolis
          [-106.65, 44.80], // near Sheridan
          [-108.50, 45.78], // Billings MT
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-35", name: "Interstate 35" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-98.49, 29.42],  // San Antonio
          [-97.74, 30.27],  // Austin
          [-97.14, 31.55],  // Waco
          [-96.80, 32.78],  // Dallas/Fort Worth
          [-97.33, 33.96],  // Denton/Gainesville
          [-97.40, 34.60],  // Ardmore OK
          [-97.52, 35.47],  // Oklahoma City
          [-97.33, 36.73],  // near Ponca City
          [-97.33, 37.69],  // Wichita
          [-95.69, 38.97],  // Topeka area
          [-94.63, 39.10],  // Kansas City
          [-94.42, 39.77],  // near St Joseph
          [-93.62, 41.60],  // Des Moines
          [-93.30, 42.50],  // Ames
          [-93.37, 43.66],  // near Albert Lea
          [-93.27, 44.00],  // near Owatonna
          [-93.27, 44.98],  // Minneapolis/St Paul
          [-93.10, 46.78],  // Duluth
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-45", name: "Interstate 45" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-94.79, 29.30],  // Galveston
          [-95.36, 29.76],  // Houston
          [-95.80, 30.72],  // Huntsville
          [-96.30, 31.46],  // near Corsicana
          [-96.80, 32.78],  // Dallas
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-55", name: "Interstate 55" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-90.07, 29.95],  // New Orleans area
          [-90.17, 30.55],  // Hammond
          [-90.39, 31.33],  // near McComb MS
          [-90.18, 32.30],  // Jackson MS
          [-89.97, 33.49],  // Grenada
          [-90.05, 34.26],  // Batesville
          [-90.05, 35.15],  // Memphis
          [-89.59, 36.37],  // near Dyersburg
          [-89.18, 37.00],  // near Cairo IL
          [-89.38, 37.73],  // near Marion
          [-89.64, 38.52],  // Mt. Vernon
          [-89.66, 39.80],  // Springfield IL
          [-89.50, 40.47],  // Bloomington-Normal
          [-88.99, 41.05],  // Pontiac
          [-87.63, 41.88],  // Chicago
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-57", name: "Interstate 57" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-89.18, 37.00],  // near Cairo/Sikeston
          [-88.92, 37.75],  // Mt Vernon area
          [-88.95, 38.52],  // near Effingham
          [-88.37, 39.48],  // Champaign
          [-87.86, 40.48],  // near Kankakee
          [-87.63, 41.75],  // Chicago south
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-65", name: "Interstate 65" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-88.10, 30.69],  // Mobile
          [-86.90, 31.22],  // near Greenville AL
          [-86.30, 32.38],  // Montgomery
          [-86.80, 33.52],  // Birmingham
          [-86.93, 34.73],  // Decatur/Huntsville area
          [-87.07, 35.02],  // near Pulaski TN
          [-86.78, 36.17],  // Nashville
          [-86.28, 36.97],  // Bowling Green KY
          [-85.97, 37.71],  // Elizabethtown
          [-85.76, 38.25],  // Louisville
          [-86.16, 39.77],  // Indianapolis
          [-86.41, 40.42],  // Lafayette
          [-87.17, 41.07],  // near Rensselaer
          [-87.33, 41.48],  // Gary area
          [-87.63, 41.88],  // Chicago
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-75", name: "Interstate 75" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-80.19, 25.77],  // Miami
          [-80.45, 26.12],  // Fort Lauderdale
          [-80.07, 26.72],  // West Palm Beach area
          [-80.90, 27.64],  // near Okeechobee
          [-81.69, 28.29],  // near Lakeland
          [-82.46, 28.96],  // near Ocala
          [-82.32, 29.65],  // Gainesville
          [-82.33, 30.84],  // Valdosta GA
          [-83.65, 31.58],  // Tifton
          [-83.63, 32.84],  // Macon
          [-84.39, 33.75],  // Atlanta
          [-84.97, 34.77],  // Dalton
          [-85.27, 35.05],  // Chattanooga
          [-84.26, 35.96],  // Knoxville area
          [-84.29, 36.99],  // Corbin KY
          [-84.50, 37.98],  // Lexington
          [-84.47, 38.63],  // Covington/Cincinnati
          [-84.21, 39.76],  // Dayton
          [-83.80, 40.35],  // Sidney
          [-83.77, 40.76],  // Lima
          [-83.55, 41.16],  // Findlay
          [-83.37, 41.65],  // Toledo
          [-83.40, 42.33],  // Monroe MI
          [-83.05, 42.33],  // Detroit
          [-83.55, 42.97],  // Flint
          [-84.25, 43.42],  // Saginaw
          [-83.98, 44.32],  // Bay City/Grayling
          [-84.72, 44.74],  // Grayling
          [-84.73, 45.78],  // Mackinaw City
          [-85.00, 46.00],  // St. Ignace
          [-87.38, 46.55],  // near Marquette
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-77", name: "Interstate 77" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-80.84, 34.00],  // Columbia SC
          [-80.85, 35.22],  // Charlotte NC
          [-80.47, 36.10],  // near Winston-Salem
          [-80.58, 36.65],  // near Mt Airy
          [-81.03, 37.27],  // Wytheville VA
          [-80.43, 37.78],  // near Beckley WV
          [-81.63, 38.35],  // Charleston WV
          [-81.17, 39.27],  // Parkersburg
          [-81.38, 40.34],  // near New Philadelphia OH
          [-81.37, 40.80],  // Canton
          [-81.52, 41.09],  // Akron
          [-81.68, 41.50],  // Cleveland
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-81", name: "Interstate 81" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-81.97, 36.60],  // Bristol VA/TN
          [-82.19, 36.85],  // near Abingdon
          [-80.41, 37.25],  // Roanoke area
          [-79.44, 37.94],  // Lexington VA
          [-79.07, 38.45],  // Staunton
          [-78.87, 38.88],  // Harrisonburg
          [-78.17, 39.18],  // Winchester
          [-77.82, 39.46],  // Martinsburg WV
          [-77.72, 39.64],  // Hagerstown MD
          [-77.26, 39.98],  // Chambersburg PA
          [-77.00, 40.27],  // Carlisle
          [-76.88, 40.27],  // Harrisburg
          [-76.42, 40.80],  // near Hazleton
          [-75.85, 41.25],  // Scranton
          [-75.88, 41.68],  // near Binghamton
          [-76.15, 43.05],  // Syracuse
          [-75.95, 43.97],  // Watertown
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-85", name: "Interstate 85" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-86.30, 32.38],  // Montgomery AL
          [-85.38, 32.47],  // near Auburn
          [-85.18, 33.00],  // near West Point GA
          [-84.39, 33.75],  // Atlanta
          [-83.37, 34.25],  // near Commerce GA
          [-82.40, 34.85],  // near Greenville SC
          [-81.97, 34.95],  // Spartanburg
          [-80.85, 35.22],  // Charlotte
          [-80.09, 35.58],  // near Salisbury
          [-79.79, 36.07],  // Greensboro
          [-78.90, 36.00],  // Durham
          [-78.64, 35.78],  // Raleigh area
          [-78.35, 36.57],  // Henderson/VA border
          [-77.43, 36.86],  // Petersburg VA
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-94", name: "Interstate 94" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-104.07, 46.81], // Billings MT area
          [-103.23, 46.88], // near Glendive
          [-101.30, 46.88], // Dickinson ND
          [-100.78, 46.81], // Bismarck
          [-99.32, 46.88],  // Jamestown
          [-97.03, 46.88],  // Fargo
          [-96.74, 46.88],  // Moorhead MN
          [-95.85, 46.35],  // near Fergus Falls
          [-94.17, 45.55],  // St Cloud
          [-93.27, 44.98],  // Minneapolis
          [-92.10, 44.94],  // near Hudson WI
          [-91.23, 44.81],  // Eau Claire
          [-90.50, 43.85],  // Tomah
          [-89.40, 43.07],  // Madison
          [-88.46, 42.72],  // near Racine
          [-87.90, 42.59],  // Milwaukee
          [-87.63, 41.88],  // Chicago
          [-87.33, 41.65],  // Gary
          [-86.25, 41.68],  // near Michigan City
          [-86.25, 42.27],  // Benton Harbor
          [-85.64, 42.29],  // Kalamazoo
          [-84.55, 42.73],  // Lansing/Battle Creek
          [-83.75, 42.33],  // Ann Arbor
          [-83.05, 42.33],  // Detroit
          [-82.92, 42.98],  // Port Huron
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: "I-95", name: "Interstate 95" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-80.19, 25.77],  // Miami
          [-80.10, 26.72],  // West Palm Beach
          [-80.63, 28.06],  // Melbourne
          [-81.06, 29.21],  // Daytona Beach
          [-81.66, 30.33],  // Jacksonville
          [-80.93, 32.08],  // Savannah
          [-79.93, 34.05],  // Florence SC
          [-79.05, 34.24],  // near Lumberton NC
          [-78.64, 35.78],  // Fayetteville/Raleigh area
          [-77.94, 36.33],  // Rocky Mount
          [-77.43, 36.86],  // Petersburg VA
          [-77.46, 37.54],  // Richmond
          [-77.47, 38.30],  // Fredericksburg
          [-77.04, 38.90],  // Washington DC
          [-76.61, 39.29],  // Baltimore
          [-75.56, 39.74],  // Wilmington DE
          [-75.15, 39.95],  // Philadelphia
          [-74.67, 40.22],  // Trenton
          [-74.17, 40.72],  // Newark/NYC
          [-73.77, 40.80],  // New Rochelle
          [-73.20, 41.18],  // Bridgeport CT
          [-72.92, 41.31],  // New Haven
          [-72.10, 41.37],  // New London
          [-71.42, 41.82],  // Providence
          [-71.06, 42.36],  // Boston area
          [-70.87, 42.80],  // near Newburyport
          [-70.76, 43.08],  // Portsmouth NH
          [-70.32, 43.66],  // Portland ME
          [-69.78, 44.31],  // Augusta ME
          [-68.77, 44.80],  // Bangor ME
          [-67.84, 45.26],  // Houlton ME
        ],
      },
    },
  ],
};
