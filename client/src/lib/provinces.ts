// Philippine locations: provinces, major cities, and key municipalities
// for search/zoom functionality
// Source: PSA (Philippine Statistics Authority)

export interface Province {
  name: string;
  lat: number;
  lon: number;
  region: string;
  zoom: number;
  type?: "province" | "city" | "municipality";
}

export const PROVINCES: Province[] = [
  // === PROVINCES ===
  // NCR
  { name: "Metro Manila", lat: 14.5995, lon: 120.9842, region: "NCR", zoom: 11, type: "province" },
  // CAR
  { name: "Abra", lat: 17.5951, lon: 120.7983, region: "CAR", zoom: 10, type: "province" },
  { name: "Apayao", lat: 18.0120, lon: 121.1710, region: "CAR", zoom: 10, type: "province" },
  { name: "Benguet", lat: 16.4023, lon: 120.5960, region: "CAR", zoom: 10, type: "province" },
  { name: "Ifugao", lat: 16.8301, lon: 121.1710, region: "CAR", zoom: 10, type: "province" },
  { name: "Kalinga", lat: 17.4741, lon: 121.3685, region: "CAR", zoom: 10, type: "province" },
  { name: "Mountain Province", lat: 17.0442, lon: 121.1100, region: "CAR", zoom: 10, type: "province" },
  // Region I
  { name: "Ilocos Norte", lat: 18.1647, lon: 120.7116, region: "Region I", zoom: 10, type: "province" },
  { name: "Ilocos Sur", lat: 17.2209, lon: 120.5740, region: "Region I", zoom: 10, type: "province" },
  { name: "La Union", lat: 16.6159, lon: 120.3209, region: "Region I", zoom: 10, type: "province" },
  { name: "Pangasinan", lat: 15.8949, lon: 120.2863, region: "Region I", zoom: 10, type: "province" },
  // Region II
  { name: "Batanes", lat: 20.4487, lon: 121.9702, region: "Region II", zoom: 10, type: "province" },
  { name: "Cagayan", lat: 18.2489, lon: 121.8787, region: "Region II", zoom: 9, type: "province" },
  { name: "Isabela", lat: 16.9754, lon: 121.8107, region: "Region II", zoom: 9, type: "province" },
  { name: "Nueva Vizcaya", lat: 16.3301, lon: 121.1710, region: "Region II", zoom: 10, type: "province" },
  { name: "Quirino", lat: 16.4900, lon: 121.5320, region: "Region II", zoom: 10, type: "province" },
  // Region III
  { name: "Aurora", lat: 15.9784, lon: 121.6323, region: "Region III", zoom: 10, type: "province" },
  { name: "Bataan", lat: 14.6417, lon: 120.4818, region: "Region III", zoom: 10, type: "province" },
  { name: "Bulacan", lat: 14.7942, lon: 120.8800, region: "Region III", zoom: 10, type: "province" },
  { name: "Nueva Ecija", lat: 15.5784, lon: 121.0613, region: "Region III", zoom: 10, type: "province" },
  { name: "Pampanga", lat: 15.0794, lon: 120.7120, region: "Region III", zoom: 10, type: "province" },
  { name: "Tarlac", lat: 15.4755, lon: 120.5963, region: "Region III", zoom: 10, type: "province" },
  { name: "Zambales", lat: 15.5082, lon: 120.0690, region: "Region III", zoom: 10, type: "province" },
  // Region IV-A
  { name: "Batangas", lat: 13.7565, lon: 121.0583, region: "Region IV-A", zoom: 10, type: "province" },
  { name: "Cavite", lat: 14.2456, lon: 120.8785, region: "Region IV-A", zoom: 10, type: "province" },
  { name: "Laguna", lat: 14.2691, lon: 121.4113, region: "Region IV-A", zoom: 10, type: "province" },
  { name: "Quezon", lat: 14.0313, lon: 122.1108, region: "Region IV-A", zoom: 9, type: "province" },
  { name: "Rizal", lat: 14.6042, lon: 121.3084, region: "Region IV-A", zoom: 11, type: "province" },
  // MIMAROPA
  { name: "Marinduque", lat: 13.4017, lon: 121.9694, region: "MIMAROPA", zoom: 11, type: "province" },
  { name: "Occidental Mindoro", lat: 12.7506, lon: 120.9478, region: "MIMAROPA", zoom: 10, type: "province" },
  { name: "Oriental Mindoro", lat: 12.9867, lon: 121.4064, region: "MIMAROPA", zoom: 10, type: "province" },
  { name: "Palawan", lat: 9.8349, lon: 118.7384, region: "MIMAROPA", zoom: 8, type: "province" },
  { name: "Romblon", lat: 12.5778, lon: 122.2711, region: "MIMAROPA", zoom: 10, type: "province" },
  // Region V
  { name: "Albay", lat: 13.1775, lon: 123.7280, region: "Region V", zoom: 10, type: "province" },
  { name: "Camarines Norte", lat: 14.1389, lon: 122.7632, region: "Region V", zoom: 10, type: "province" },
  { name: "Camarines Sur", lat: 13.5250, lon: 123.3486, region: "Region V", zoom: 10, type: "province" },
  { name: "Catanduanes", lat: 13.7089, lon: 124.2422, region: "Region V", zoom: 10, type: "province" },
  { name: "Masbate", lat: 12.3574, lon: 123.5504, region: "Region V", zoom: 10, type: "province" },
  { name: "Sorsogon", lat: 12.9970, lon: 124.0145, region: "Region V", zoom: 10, type: "province" },
  // Region VI
  { name: "Aklan", lat: 11.8166, lon: 122.0942, region: "Region VI", zoom: 10, type: "province" },
  { name: "Antique", lat: 11.3688, lon: 122.0373, region: "Region VI", zoom: 10, type: "province" },
  { name: "Capiz", lat: 11.5528, lon: 122.6308, region: "Region VI", zoom: 10, type: "province" },
  { name: "Guimaras", lat: 10.5928, lon: 122.6325, region: "Region VI", zoom: 11, type: "province" },
  { name: "Iloilo", lat: 11.0049, lon: 122.5372, region: "Region VI", zoom: 10, type: "province" },
  { name: "Negros Occidental", lat: 10.0000, lon: 122.5500, region: "Region VI", zoom: 9, type: "province" },
  // Region VII
  { name: "Bohol", lat: 9.8500, lon: 124.0150, region: "Region VII", zoom: 10, type: "province" },
  { name: "Cebu", lat: 10.3157, lon: 123.8854, region: "Region VII", zoom: 9, type: "province" },
  { name: "Negros Oriental", lat: 9.6168, lon: 123.0107, region: "Region VII", zoom: 10, type: "province" },
  { name: "Siquijor", lat: 9.1985, lon: 123.5950, region: "Region VII", zoom: 12, type: "province" },
  // Region VIII
  { name: "Biliran", lat: 11.5833, lon: 124.4667, region: "Region VIII", zoom: 11, type: "province" },
  { name: "Eastern Samar", lat: 11.5000, lon: 125.5000, region: "Region VIII", zoom: 10, type: "province" },
  { name: "Leyte", lat: 10.4167, lon: 124.9500, region: "Region VIII", zoom: 10, type: "province" },
  { name: "Northern Samar", lat: 12.3600, lon: 124.7700, region: "Region VIII", zoom: 10, type: "province" },
  { name: "Samar (Western Samar)", lat: 11.7500, lon: 124.9600, region: "Region VIII", zoom: 10, type: "province" },
  { name: "Southern Leyte", lat: 10.1347, lon: 125.1717, region: "Region VIII", zoom: 10, type: "province" },
  // Region IX
  { name: "Zamboanga del Norte", lat: 8.1527, lon: 123.2588, region: "Region IX", zoom: 10, type: "province" },
  { name: "Zamboanga del Sur", lat: 7.8383, lon: 123.2968, region: "Region IX", zoom: 10, type: "province" },
  { name: "Zamboanga Sibugay", lat: 7.5222, lon: 122.8198, region: "Region IX", zoom: 10, type: "province" },
  // Region X
  { name: "Bukidnon", lat: 8.0515, lon: 125.0985, region: "Region X", zoom: 10, type: "province" },
  { name: "Camiguin", lat: 9.1732, lon: 124.7291, region: "Region X", zoom: 12, type: "province" },
  { name: "Lanao del Norte", lat: 8.0726, lon: 124.0198, region: "Region X", zoom: 10, type: "province" },
  { name: "Misamis Occidental", lat: 8.3375, lon: 123.7071, region: "Region X", zoom: 10, type: "province" },
  { name: "Misamis Oriental", lat: 8.5046, lon: 124.6220, region: "Region X", zoom: 10, type: "province" },
  // Region XI
  { name: "Davao de Oro", lat: 7.8174, lon: 126.1549, region: "Region XI", zoom: 10, type: "province" },
  { name: "Davao del Norte", lat: 7.5622, lon: 125.8044, region: "Region XI", zoom: 10, type: "province" },
  { name: "Davao del Sur", lat: 6.7656, lon: 125.3284, region: "Region XI", zoom: 10, type: "province" },
  { name: "Davao Occidental", lat: 6.1055, lon: 125.6145, region: "Region XI", zoom: 10, type: "province" },
  { name: "Davao Oriental", lat: 7.3172, lon: 126.5420, region: "Region XI", zoom: 10, type: "province" },
  // Region XII
  { name: "Cotabato (North Cotabato)", lat: 7.1436, lon: 124.8510, region: "Region XII", zoom: 10, type: "province" },
  { name: "Sarangani", lat: 5.9260, lon: 125.4630, region: "Region XII", zoom: 10, type: "province" },
  { name: "South Cotabato", lat: 6.2969, lon: 124.8533, region: "Region XII", zoom: 10, type: "province" },
  { name: "Sultan Kudarat", lat: 6.5069, lon: 124.4198, region: "Region XII", zoom: 10, type: "province" },
  // Region XIII (Caraga)
  { name: "Agusan del Norte", lat: 8.9456, lon: 125.5319, region: "Caraga", zoom: 10, type: "province" },
  { name: "Agusan del Sur", lat: 8.1534, lon: 125.8953, region: "Caraga", zoom: 10, type: "province" },
  { name: "Dinagat Islands", lat: 10.1280, lon: 125.6083, region: "Caraga", zoom: 11, type: "province" },
  { name: "Surigao del Norte", lat: 9.7177, lon: 125.5950, region: "Caraga", zoom: 10, type: "province" },
  { name: "Surigao del Sur", lat: 8.5405, lon: 126.1145, region: "Caraga", zoom: 10, type: "province" },
  // BARMM
  { name: "Basilan", lat: 6.4221, lon: 121.9690, region: "BARMM", zoom: 10, type: "province" },
  { name: "Lanao del Sur", lat: 7.8232, lon: 124.4198, region: "BARMM", zoom: 10, type: "province" },
  { name: "Maguindanao del Norte", lat: 7.2047, lon: 124.4198, region: "BARMM", zoom: 10, type: "province" },
  { name: "Maguindanao del Sur", lat: 6.9421, lon: 124.4198, region: "BARMM", zoom: 10, type: "province" },
  { name: "Sulu", lat: 6.0474, lon: 121.0028, region: "BARMM", zoom: 10, type: "province" },
  { name: "Tawi-Tawi", lat: 5.1339, lon: 119.9510, region: "BARMM", zoom: 10, type: "province" },

  // === MAJOR CITIES (HUCs, ICCs, Component Cities) ===
  // NCR Cities
  { name: "Quezon City", lat: 14.6760, lon: 121.0437, region: "NCR", zoom: 13, type: "city" },
  { name: "Manila", lat: 14.5995, lon: 120.9842, region: "NCR", zoom: 13, type: "city" },
  { name: "Makati", lat: 14.5547, lon: 121.0244, region: "NCR", zoom: 14, type: "city" },
  { name: "Taguig", lat: 14.5176, lon: 121.0509, region: "NCR", zoom: 13, type: "city" },
  { name: "Pasig", lat: 14.5764, lon: 121.0851, region: "NCR", zoom: 14, type: "city" },
  { name: "Mandaluyong", lat: 14.5794, lon: 121.0359, region: "NCR", zoom: 14, type: "city" },
  { name: "Marikina", lat: 14.6507, lon: 121.1029, region: "NCR", zoom: 13, type: "city" },
  { name: "Parañaque", lat: 14.4793, lon: 121.0198, region: "NCR", zoom: 13, type: "city" },
  { name: "Las Piñas", lat: 14.4445, lon: 120.9939, region: "NCR", zoom: 14, type: "city" },
  { name: "Muntinlupa", lat: 14.4081, lon: 121.0415, region: "NCR", zoom: 13, type: "city" },
  { name: "Caloocan", lat: 14.6488, lon: 120.9672, region: "NCR", zoom: 13, type: "city" },
  { name: "Valenzuela", lat: 14.6942, lon: 120.9639, region: "NCR", zoom: 13, type: "city" },
  { name: "Malabon", lat: 14.6625, lon: 120.9567, region: "NCR", zoom: 14, type: "city" },
  { name: "Navotas", lat: 14.6667, lon: 120.9417, region: "NCR", zoom: 14, type: "city" },
  { name: "San Juan", lat: 14.6019, lon: 121.0355, region: "NCR", zoom: 15, type: "city" },
  { name: "Pasay", lat: 14.5378, lon: 121.0014, region: "NCR", zoom: 14, type: "city" },
  { name: "Pateros", lat: 14.5446, lon: 121.0684, region: "NCR", zoom: 15, type: "city" },
  // Major cities outside NCR
  { name: "Cebu City", lat: 10.3157, lon: 123.8854, region: "Region VII", zoom: 13, type: "city" },
  { name: "Davao City", lat: 7.1907, lon: 125.4553, region: "Region XI", zoom: 11, type: "city" },
  { name: "Zamboanga City", lat: 6.9214, lon: 122.0790, region: "Region IX", zoom: 11, type: "city" },
  { name: "Cagayan de Oro", lat: 8.4542, lon: 124.6319, region: "Region X", zoom: 12, type: "city" },
  { name: "General Santos", lat: 6.1164, lon: 125.1716, region: "Region XII", zoom: 12, type: "city" },
  { name: "Iloilo City", lat: 10.6920, lon: 122.5737, region: "Region VI", zoom: 13, type: "city" },
  { name: "Bacolod", lat: 10.6840, lon: 122.9563, region: "Region VI", zoom: 12, type: "city" },
  { name: "Baguio", lat: 16.4023, lon: 120.5960, region: "CAR", zoom: 13, type: "city" },
  { name: "Angeles City", lat: 15.1450, lon: 120.5887, region: "Region III", zoom: 13, type: "city" },
  { name: "Olongapo", lat: 14.8292, lon: 120.2824, region: "Region III", zoom: 13, type: "city" },
  { name: "San Fernando (Pampanga)", lat: 15.0286, lon: 120.6840, region: "Region III", zoom: 13, type: "city" },
  { name: "San Fernando (La Union)", lat: 16.6159, lon: 120.3209, region: "Region I", zoom: 13, type: "city" },
  { name: "Laoag", lat: 18.1978, lon: 120.5934, region: "Region I", zoom: 13, type: "city" },
  { name: "Vigan", lat: 17.5747, lon: 120.3869, region: "Region I", zoom: 14, type: "city" },
  { name: "Dagupan", lat: 16.0433, lon: 120.3373, region: "Region I", zoom: 13, type: "city" },
  { name: "Tuguegarao", lat: 17.6132, lon: 121.7270, region: "Region II", zoom: 13, type: "city" },
  { name: "Santiago (Isabela)", lat: 16.6893, lon: 121.5487, region: "Region II", zoom: 13, type: "city" },
  { name: "Cabanatuan", lat: 15.4869, lon: 120.9664, region: "Region III", zoom: 13, type: "city" },
  { name: "Malolos", lat: 14.8433, lon: 120.8114, region: "Region III", zoom: 13, type: "city" },
  { name: "Meycauayan", lat: 14.7369, lon: 120.9609, region: "Region III", zoom: 14, type: "city" },
  { name: "Tarlac City", lat: 15.4362, lon: 120.5963, region: "Region III", zoom: 13, type: "city" },
  { name: "Antipolo", lat: 14.5860, lon: 121.1761, region: "Region IV-A", zoom: 12, type: "city" },
  { name: "Bacoor", lat: 14.4624, lon: 120.9645, region: "Region IV-A", zoom: 13, type: "city" },
  { name: "Imus", lat: 14.4297, lon: 120.9367, region: "Region IV-A", zoom: 13, type: "city" },
  { name: "Dasmariñas", lat: 14.3294, lon: 120.9367, region: "Region IV-A", zoom: 13, type: "city" },
  { name: "General Trias", lat: 14.3866, lon: 120.8821, region: "Region IV-A", zoom: 13, type: "city" },
  { name: "Calamba", lat: 14.2117, lon: 121.1653, region: "Region IV-A", zoom: 13, type: "city" },
  { name: "San Pablo", lat: 14.0686, lon: 121.3254, region: "Region IV-A", zoom: 13, type: "city" },
  { name: "Biñan", lat: 14.3346, lon: 121.0809, region: "Region IV-A", zoom: 14, type: "city" },
  { name: "Santa Rosa (Laguna)", lat: 14.3122, lon: 121.1115, region: "Region IV-A", zoom: 13, type: "city" },
  { name: "Batangas City", lat: 13.7565, lon: 121.0583, region: "Region IV-A", zoom: 13, type: "city" },
  { name: "Lipa", lat: 13.9411, lon: 121.1631, region: "Region IV-A", zoom: 13, type: "city" },
  { name: "Lucena", lat: 13.9373, lon: 121.6170, region: "Region IV-A", zoom: 13, type: "city" },
  { name: "Puerto Princesa", lat: 9.7392, lon: 118.7353, region: "MIMAROPA", zoom: 11, type: "city" },
  { name: "Naga (Camarines Sur)", lat: 13.6218, lon: 123.1948, region: "Region V", zoom: 13, type: "city" },
  { name: "Legazpi", lat: 13.1391, lon: 123.7438, region: "Region V", zoom: 13, type: "city" },
  { name: "Tacloban", lat: 11.2543, lon: 124.9600, region: "Region VIII", zoom: 13, type: "city" },
  { name: "Ormoc", lat: 11.0044, lon: 124.6075, region: "Region VIII", zoom: 12, type: "city" },
  { name: "Mandaue", lat: 10.3236, lon: 123.9223, region: "Region VII", zoom: 14, type: "city" },
  { name: "Lapu-Lapu", lat: 10.3103, lon: 123.9494, region: "Region VII", zoom: 13, type: "city" },
  { name: "Tagbilaran", lat: 9.6500, lon: 123.8500, region: "Region VII", zoom: 14, type: "city" },
  { name: "Dumaguete", lat: 9.3068, lon: 123.3054, region: "Region VII", zoom: 13, type: "city" },
  { name: "Butuan", lat: 8.9475, lon: 125.5406, region: "Caraga", zoom: 12, type: "city" },
  { name: "Surigao City", lat: 9.7844, lon: 125.4888, region: "Caraga", zoom: 13, type: "city" },
  { name: "Cotabato City", lat: 7.2047, lon: 124.2310, region: "BARMM", zoom: 13, type: "city" },
  { name: "Marawi", lat: 8.0016, lon: 124.2928, region: "BARMM", zoom: 13, type: "city" },
  { name: "Iligan", lat: 8.2280, lon: 124.2452, region: "Region X", zoom: 12, type: "city" },
  { name: "Malaybalay", lat: 8.1575, lon: 125.1275, region: "Region X", zoom: 12, type: "city" },
  { name: "Koronadal", lat: 6.5022, lon: 124.8469, region: "Region XII", zoom: 13, type: "city" },
  { name: "Kidapawan", lat: 7.0084, lon: 125.0894, region: "Region XII", zoom: 13, type: "city" },
  { name: "Pagadian", lat: 7.8262, lon: 123.4367, region: "Region IX", zoom: 12, type: "city" },
  { name: "Dipolog", lat: 8.5872, lon: 123.3408, region: "Region IX", zoom: 13, type: "city" },
  { name: "Dapitan", lat: 8.6555, lon: 123.4246, region: "Region IX", zoom: 13, type: "city" },
  { name: "Tagum", lat: 7.4478, lon: 125.8078, region: "Region XI", zoom: 12, type: "city" },
  { name: "Panabo", lat: 7.3080, lon: 125.6844, region: "Region XI", zoom: 12, type: "city" },
  { name: "Digos", lat: 6.7497, lon: 125.3572, region: "Region XI", zoom: 12, type: "city" },
  { name: "Mati", lat: 6.9553, lon: 126.2167, region: "Region XI", zoom: 12, type: "city" },
  { name: "Roxas City", lat: 11.5853, lon: 122.7511, region: "Region VI", zoom: 13, type: "city" },
  { name: "Kabankalan", lat: 9.5847, lon: 122.8167, region: "Region VI", zoom: 12, type: "city" },
  { name: "Silay", lat: 10.8117, lon: 122.9697, region: "Region VI", zoom: 13, type: "city" },
  { name: "Talisay (Negros Occidental)", lat: 10.7381, lon: 122.9681, region: "Region VI", zoom: 13, type: "city" },
  { name: "Calapan", lat: 13.4115, lon: 121.1803, region: "MIMAROPA", zoom: 12, type: "city" },

  // === KEY MUNICIPALITIES / AREAS ===
  { name: "Subic", lat: 14.8770, lon: 120.2340, region: "Region III", zoom: 13, type: "municipality" },
  { name: "Clark (Mabalacat)", lat: 15.1860, lon: 120.5600, region: "Region III", zoom: 13, type: "municipality" },
  { name: "Tagaytay", lat: 14.1153, lon: 120.9621, region: "Region IV-A", zoom: 13, type: "municipality" },
  { name: "Taal", lat: 13.8800, lon: 120.9220, region: "Region IV-A", zoom: 13, type: "municipality" },
  { name: "Boracay (Malay)", lat: 11.9674, lon: 121.9248, region: "Region VI", zoom: 14, type: "municipality" },
  { name: "El Nido", lat: 11.1784, lon: 119.3926, region: "MIMAROPA", zoom: 12, type: "municipality" },
  { name: "Coron", lat: 11.9986, lon: 120.2043, region: "MIMAROPA", zoom: 12, type: "municipality" },
  { name: "Siargao (Del Carmen)", lat: 9.8544, lon: 126.0458, region: "Caraga", zoom: 11, type: "municipality" },
  { name: "Baler", lat: 15.7594, lon: 121.5603, region: "Region III", zoom: 13, type: "municipality" },
  { name: "Sagada", lat: 17.0833, lon: 121.0167, region: "CAR", zoom: 14, type: "municipality" },
  { name: "Banaue", lat: 16.9140, lon: 121.0570, region: "CAR", zoom: 13, type: "municipality" },
  { name: "Moalboal", lat: 9.9500, lon: 123.3950, region: "Region VII", zoom: 14, type: "municipality" },
  { name: "Oslob", lat: 9.4667, lon: 123.4333, region: "Region VII", zoom: 13, type: "municipality" },
  { name: "Donsol", lat: 12.9083, lon: 123.5917, region: "Region V", zoom: 13, type: "municipality" },
  { name: "Infanta", lat: 14.7467, lon: 121.6517, region: "Region IV-A", zoom: 12, type: "municipality" },
  { name: "Real", lat: 14.6633, lon: 121.6067, region: "Region IV-A", zoom: 13, type: "municipality" },
  { name: "San Mateo", lat: 14.6983, lon: 121.1175, region: "Region IV-A", zoom: 14, type: "municipality" },
  { name: "Rodriguez (Montalban)", lat: 14.7367, lon: 121.1467, region: "Region IV-A", zoom: 13, type: "municipality" },
  { name: "Taytay (Rizal)", lat: 14.5567, lon: 121.1342, region: "Region IV-A", zoom: 14, type: "municipality" },
  { name: "Cainta", lat: 14.5733, lon: 121.1192, region: "Region IV-A", zoom: 14, type: "municipality" },
];

// Search locations by name (case-insensitive, partial match)
// Searches across provinces, cities, and municipalities
export function searchProvinces(query: string): Province[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results = PROVINCES.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.region.toLowerCase().includes(q)
  );
  // Sort: exact start matches first, then cities before municipalities
  results.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;
    // provinces first, then cities, then municipalities
    const typeOrder = { province: 0, city: 1, municipality: 2 };
    return (typeOrder[a.type || "province"] || 0) - (typeOrder[b.type || "province"] || 0);
  });
  return results.slice(0, 10); // max 10 results
}
