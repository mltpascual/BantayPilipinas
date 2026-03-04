// Philippine provinces with center coordinates for search/zoom functionality
// Source: PSA (Philippine Statistics Authority) province boundaries

export interface Province {
  name: string;
  lat: number;
  lon: number;
  region: string;
  zoom: number; // suggested zoom level
}

export const PROVINCES: Province[] = [
  // NCR
  { name: "Metro Manila", lat: 14.5995, lon: 120.9842, region: "NCR", zoom: 11 },
  // CAR
  { name: "Abra", lat: 17.5951, lon: 120.7983, region: "CAR", zoom: 10 },
  { name: "Apayao", lat: 18.0120, lon: 121.1710, region: "CAR", zoom: 10 },
  { name: "Benguet", lat: 16.4023, lon: 120.5960, region: "CAR", zoom: 10 },
  { name: "Ifugao", lat: 16.8301, lon: 121.1710, region: "CAR", zoom: 10 },
  { name: "Kalinga", lat: 17.4741, lon: 121.3685, region: "CAR", zoom: 10 },
  { name: "Mountain Province", lat: 17.0442, lon: 121.1100, region: "CAR", zoom: 10 },
  // Region I
  { name: "Ilocos Norte", lat: 18.1647, lon: 120.7116, region: "Region I", zoom: 10 },
  { name: "Ilocos Sur", lat: 17.2209, lon: 120.5740, region: "Region I", zoom: 10 },
  { name: "La Union", lat: 16.6159, lon: 120.3209, region: "Region I", zoom: 10 },
  { name: "Pangasinan", lat: 15.8949, lon: 120.2863, region: "Region I", zoom: 10 },
  // Region II
  { name: "Batanes", lat: 20.4487, lon: 121.9702, region: "Region II", zoom: 10 },
  { name: "Cagayan", lat: 18.2489, lon: 121.8787, region: "Region II", zoom: 9 },
  { name: "Isabela", lat: 16.9754, lon: 121.8107, region: "Region II", zoom: 9 },
  { name: "Nueva Vizcaya", lat: 16.3301, lon: 121.1710, region: "Region II", zoom: 10 },
  { name: "Quirino", lat: 16.4900, lon: 121.5320, region: "Region II", zoom: 10 },
  // Region III
  { name: "Aurora", lat: 15.9784, lon: 121.6323, region: "Region III", zoom: 10 },
  { name: "Bataan", lat: 14.6417, lon: 120.4818, region: "Region III", zoom: 10 },
  { name: "Bulacan", lat: 14.7942, lon: 120.8800, region: "Region III", zoom: 10 },
  { name: "Nueva Ecija", lat: 15.5784, lon: 121.0613, region: "Region III", zoom: 10 },
  { name: "Pampanga", lat: 15.0794, lon: 120.7120, region: "Region III", zoom: 10 },
  { name: "Tarlac", lat: 15.4755, lon: 120.5963, region: "Region III", zoom: 10 },
  { name: "Zambales", lat: 15.5082, lon: 120.0690, region: "Region III", zoom: 10 },
  // Region IV-A
  { name: "Batangas", lat: 13.7565, lon: 121.0583, region: "Region IV-A", zoom: 10 },
  { name: "Cavite", lat: 14.2456, lon: 120.8785, region: "Region IV-A", zoom: 10 },
  { name: "Laguna", lat: 14.2691, lon: 121.4113, region: "Region IV-A", zoom: 10 },
  { name: "Quezon", lat: 14.0313, lon: 122.1108, region: "Region IV-A", zoom: 9 },
  { name: "Rizal", lat: 14.6042, lon: 121.3084, region: "Region IV-A", zoom: 11 },
  // MIMAROPA
  { name: "Marinduque", lat: 13.4017, lon: 121.9694, region: "MIMAROPA", zoom: 11 },
  { name: "Occidental Mindoro", lat: 12.7506, lon: 120.9478, region: "MIMAROPA", zoom: 10 },
  { name: "Oriental Mindoro", lat: 12.9867, lon: 121.4064, region: "MIMAROPA", zoom: 10 },
  { name: "Palawan", lat: 9.8349, lon: 118.7384, region: "MIMAROPA", zoom: 8 },
  { name: "Romblon", lat: 12.5778, lon: 122.2711, region: "MIMAROPA", zoom: 10 },
  // Region V
  { name: "Albay", lat: 13.1775, lon: 123.7280, region: "Region V", zoom: 10 },
  { name: "Camarines Norte", lat: 14.1389, lon: 122.7632, region: "Region V", zoom: 10 },
  { name: "Camarines Sur", lat: 13.5250, lon: 123.3486, region: "Region V", zoom: 10 },
  { name: "Catanduanes", lat: 13.7089, lon: 124.2422, region: "Region V", zoom: 10 },
  { name: "Masbate", lat: 12.3574, lon: 123.5504, region: "Region V", zoom: 10 },
  { name: "Sorsogon", lat: 12.9970, lon: 124.0145, region: "Region V", zoom: 10 },
  // Region VI
  { name: "Aklan", lat: 11.8166, lon: 122.0942, region: "Region VI", zoom: 10 },
  { name: "Antique", lat: 11.3688, lon: 122.0373, region: "Region VI", zoom: 10 },
  { name: "Capiz", lat: 11.5528, lon: 122.6308, region: "Region VI", zoom: 10 },
  { name: "Guimaras", lat: 10.5928, lon: 122.6325, region: "Region VI", zoom: 11 },
  { name: "Iloilo", lat: 11.0049, lon: 122.5372, region: "Region VI", zoom: 10 },
  { name: "Negros Occidental", lat: 10.0000, lon: 122.5500, region: "Region VI", zoom: 9 },
  // Region VII
  { name: "Bohol", lat: 9.8500, lon: 124.0150, region: "Region VII", zoom: 10 },
  { name: "Cebu", lat: 10.3157, lon: 123.8854, region: "Region VII", zoom: 9 },
  { name: "Negros Oriental", lat: 9.6168, lon: 123.0107, region: "Region VII", zoom: 10 },
  { name: "Siquijor", lat: 9.1985, lon: 123.5950, region: "Region VII", zoom: 12 },
  // Region VIII
  { name: "Biliran", lat: 11.5833, lon: 124.4667, region: "Region VIII", zoom: 11 },
  { name: "Eastern Samar", lat: 11.5000, lon: 125.5000, region: "Region VIII", zoom: 10 },
  { name: "Leyte", lat: 10.4167, lon: 124.9500, region: "Region VIII", zoom: 10 },
  { name: "Northern Samar", lat: 12.3600, lon: 124.7700, region: "Region VIII", zoom: 10 },
  { name: "Samar (Western Samar)", lat: 11.7500, lon: 124.9600, region: "Region VIII", zoom: 10 },
  { name: "Southern Leyte", lat: 10.1347, lon: 125.1717, region: "Region VIII", zoom: 10 },
  // Region IX
  { name: "Zamboanga del Norte", lat: 8.1527, lon: 123.2588, region: "Region IX", zoom: 10 },
  { name: "Zamboanga del Sur", lat: 7.8383, lon: 123.2968, region: "Region IX", zoom: 10 },
  { name: "Zamboanga Sibugay", lat: 7.5222, lon: 122.8198, region: "Region IX", zoom: 10 },
  // Region X
  { name: "Bukidnon", lat: 8.0515, lon: 125.0985, region: "Region X", zoom: 10 },
  { name: "Camiguin", lat: 9.1732, lon: 124.7291, region: "Region X", zoom: 12 },
  { name: "Lanao del Norte", lat: 8.0726, lon: 124.0198, region: "Region X", zoom: 10 },
  { name: "Misamis Occidental", lat: 8.3375, lon: 123.7071, region: "Region X", zoom: 10 },
  { name: "Misamis Oriental", lat: 8.5046, lon: 124.6220, region: "Region X", zoom: 10 },
  // Region XI
  { name: "Davao de Oro", lat: 7.8174, lon: 126.1549, region: "Region XI", zoom: 10 },
  { name: "Davao del Norte", lat: 7.5622, lon: 125.8044, region: "Region XI", zoom: 10 },
  { name: "Davao del Sur", lat: 6.7656, lon: 125.3284, region: "Region XI", zoom: 10 },
  { name: "Davao Occidental", lat: 6.1055, lon: 125.6145, region: "Region XI", zoom: 10 },
  { name: "Davao Oriental", lat: 7.3172, lon: 126.5420, region: "Region XI", zoom: 10 },
  // Region XII
  { name: "Cotabato (North Cotabato)", lat: 7.1436, lon: 124.8510, region: "Region XII", zoom: 10 },
  { name: "Sarangani", lat: 5.9260, lon: 125.4630, region: "Region XII", zoom: 10 },
  { name: "South Cotabato", lat: 6.2969, lon: 124.8533, region: "Region XII", zoom: 10 },
  { name: "Sultan Kudarat", lat: 6.5069, lon: 124.4198, region: "Region XII", zoom: 10 },
  // Region XIII (Caraga)
  { name: "Agusan del Norte", lat: 8.9456, lon: 125.5319, region: "Caraga", zoom: 10 },
  { name: "Agusan del Sur", lat: 8.1534, lon: 125.8953, region: "Caraga", zoom: 10 },
  { name: "Dinagat Islands", lat: 10.1280, lon: 125.6083, region: "Caraga", zoom: 11 },
  { name: "Surigao del Norte", lat: 9.7177, lon: 125.5950, region: "Caraga", zoom: 10 },
  { name: "Surigao del Sur", lat: 8.5405, lon: 126.1145, region: "Caraga", zoom: 10 },
  // BARMM
  { name: "Basilan", lat: 6.4221, lon: 121.9690, region: "BARMM", zoom: 10 },
  { name: "Lanao del Sur", lat: 7.8232, lon: 124.4198, region: "BARMM", zoom: 10 },
  { name: "Maguindanao del Norte", lat: 7.2047, lon: 124.4198, region: "BARMM", zoom: 10 },
  { name: "Maguindanao del Sur", lat: 6.9421, lon: 124.4198, region: "BARMM", zoom: 10 },
  { name: "Sulu", lat: 6.0474, lon: 121.0028, region: "BARMM", zoom: 10 },
  { name: "Tawi-Tawi", lat: 5.1339, lon: 119.9510, region: "BARMM", zoom: 10 },
];

// Search provinces by name (case-insensitive, partial match)
export function searchProvinces(query: string): Province[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return PROVINCES.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.region.toLowerCase().includes(q)
  ).slice(0, 8); // max 8 results
}
