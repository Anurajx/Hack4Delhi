require("dotenv").config();
const mongoose = require("mongoose");
const { generateUniqueCode, IDType } = require("./UVID/generator");

const DB = mongoose.createConnection(process.env.MONGO_URI, {
  dbName: "StateVoter",
});

const voterSchema = new mongoose.Schema({}, { strict: false });
const StateVoter = DB.model("Voter", voterSchema, "voters"); 1234
const TempVoter = DB.model("Voter", voterSchema, "tempVotersBLO");
const UpdateVoter = DB.model("Voter", voterSchema, "toUpdate");

const STATES = [
  "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Uttar Pradesh", "Telangana"
];

const firstNames = ["Amit", "Rahul", "Priya", "Sneha", "Vikram", "Neha", "Rohan", "Anjali", "Karan", "Pooja"];
const lastNames = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy", "Mehta", "Das", "Jain"];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomUser(isFraud = false, index = 0) {
  const fName = getRandomItem(firstNames);
  const lName = getRandomItem(lastNames);
  const phone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const aadhaar = `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    ID: `ID${Date.now()}${index}`,
    Aadhaar: aadhaar,
    FirstName: fName,
    LastName: lName,
    MotherName: "Mother " + fName,
    FatherName: "Father " + fName,
    Sex: Math.random() > 0.5 ? "Male" : "Female",
    Birthday: `19${Math.floor(60 + Math.random() * 40)}-0${Math.floor(1 + Math.random() * 9)}-1${Math.floor(0 + Math.random() * 9)}`,
    Age: Math.floor(20 + Math.random() * 50),
    DistrictId: Math.floor(100 + Math.random() * 900),
    State: getRandomItem(STATES),
    Phone: phone,
    VoterId: `VOT${Math.floor(100000 + Math.random() * 900000)}`,
    DefPassword: "password123",
    TamperCheckFailed: isFraud && Math.random() > 0.5, // Explicit fraud flags
    FuzzyMatchRatio: isFraud ? 0.95 : 0.1,
  };
}

async function seed() {
  console.log("Starting DB seed process...");

  try {
    // Optional: Clear existing collections to have exactly 30 users.
    // await StateVoter.deleteMany({});
    // await TempVoter.deleteMany({});
    // await UpdateVoter.deleteMany({});
    // console.log("Cleared existing collections.");

    const normalUsers = [];
    for (let i = 0; i < 20; i++) {
      normalUsers.push(generateRandomUser(false, i));
    }

    await StateVoter.insertMany(normalUsers);
    console.log(`Inserted 20 normal voters into StateVoter collection.`);

    const fraudUsers = [];
    for (let i = 20; i < 30; i++) {
      fraudUsers.push(generateRandomUser(true, i));
    }

    await StateVoter.insertMany(fraudUsers);

    const suspiciousUpdates = [];
    fraudUsers.forEach((f, idx) => {
      // Create 4 rapid updates for each fraud user to simulate >3 updates/hour
      for (let j = 0; j < 4; j++) {
        suspiciousUpdates.push({
          ...f,
          UpdateReason: "Address Change Simulation",
          Timestamp: Date.now() - (j * 1000 * 60), // minutes apart
          _id: new mongoose.Types.ObjectId() // Generate fresh _id to avoid dup key error
        });
      }
    });

    await UpdateVoter.insertMany(suspiciousUpdates);

    const duplicateApplications = [];
    fraudUsers.forEach((f, idx) => {
      if (idx % 2 === 0) {
        // Submit identical Aadhaar applications to tempVotersBLO with slightly changed name (fuzzy duplicates)
        duplicateApplications.push({
          ...f,
          FirstName: f.FirstName + "x",
          _id: new mongoose.Types.ObjectId(),
          ID: `ID${Date.now()}DUP1`
        });
        duplicateApplications.push({
          ...f,
          FirstName: f.FirstName + "y",
          _id: new mongoose.Types.ObjectId(),
          ID: `ID${Date.now()}DUP2`
        });
      }
    });

    await TempVoter.insertMany(duplicateApplications);

    console.log(`Inserted 10 fraud voters.`);
    console.log(`Simulated ${suspiciousUpdates.length} suspicious update requests.`);
    console.log(`Simulated ${duplicateApplications.length} fuzzy duplicate registrations.`);

    console.log("Seeding complete. Exiting...");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    process.exit(0);
  }
}

DB.once("open", () => seed());
