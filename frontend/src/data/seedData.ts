export interface RegionalSeedData {
  state: string;
  districtId: number;
  registeredCitizens: number;
  pendingApplications: number;
  pendingUpdates: number;
  fraudScore: number;
  flaggedRecords: number;
  avgConfidenceScore: number;
  linkedCredentials: number;
}

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const SEED_REGIONAL_DATA: RegionalSeedData[] = STATES.map((state, i) => {
  const isHighRisk = Math.random() > 0.8;
  const isMediumRisk = !isHighRisk && Math.random() > 0.5;
  let fraudScore = isHighRisk ? (7 + Math.random() * 3) : isMediumRisk ? (4 + Math.random() * 3) : (Math.random() * 4);
  
  return {
    state,
    districtId: i + 1,
    registeredCitizens: randomInt(500, 50000),
    pendingApplications: randomInt(10, 500),
    pendingUpdates: randomInt(0, 100),
    fraudScore: Number(fraudScore.toFixed(2)),
    flaggedRecords: isHighRisk ? randomInt(50, 200) : randomInt(0, 50),
    avgConfidenceScore: Number((5 + Math.random() * 4.5).toFixed(1)),
    linkedCredentials: randomInt(100, 5000),
  };
});
