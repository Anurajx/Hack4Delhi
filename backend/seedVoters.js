const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// Connect to StateVoter database
mongoose.connect(process.env.MONGO_URI, {
  dbName: "StateVoter",
});

const voterSchema = new mongoose.Schema({}, { strict: false });
const StateVoter = mongoose.model("Voter", voterSchema, "voters");

const firstNames = ["Arjun", "Deepika", "Ravi", "Sita", "Vikram", "Anjali", "Karan", "Priya", "Rahul", "Neha", "Sanjay", "Meera", "Aditya", "Ishani", "Rohit", "Sneha", "Amit", "Kavya", "Manish", "Rani"];
const lastNames = ["Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Patel", "Reddy", "Iyer", "Nair", "Das", "Chatterjee", "Deshmukh", "Chauhan", "Yadav", "Kapoor", "Joshi", "Aggarwal", "Pandey", "Mistra", "Bhasin"];
const states = ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "West Bengal", "Gujarat", "Rajasthan", "Punjab", "Kerala", "Sikkim", "Goa"];
const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const relationships = ["Father", "Mother", "Spouse", "Brother", "Friend"];

const seedData = async () => {
  try {
    console.log("Seeding started...");
    const sharedPhone = "7428662179";

    const users = [];

    for (let i = 0; i < 30; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const state = states[Math.floor(Math.random() * states.length)];
        
        // Generate a pseudo-UVID
        const uvid = "ID" + Math.floor(100000000000000 + Math.random() * 900000000000000);
        
        const user = {
            ID: uvid,
            Aadhaar: `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
            FirstName: firstName,
            LastName: lastName,
            MotherName: lastNames[Math.floor(Math.random() * lastNames.length)],
            FatherName: lastNames[Math.floor(Math.random() * lastNames.length)],
            Sex: Math.random() > 0.5 ? "M" : "F",
            Birthday: `${Math.floor(10, 28) + 1}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(1970 + Math.random() * 35)}`,
            Age: Math.floor(18 + Math.random() * 60),
            DistrictId: Math.floor(1000 + Math.random() * 5000),
            Phone: sharedPhone,
            VoterId: "EPIC" + Math.floor(1000000 + Math.random() * 9000000),
            DefPassword: "Init@" + Math.floor(1000 + Math.random() * 9000),
            State: state,
            
            // Medical / Emergency Access Details
            bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
            allergies: Math.random() > 0.7 ? "Penicillin, Dust" : "None",
            organDonor: Math.random() > 0.5 ? "Yes" : "No",
            medicalConditions: Math.random() > 0.8 ? "Type 2 Diabetes" : "No pre-existing conditions",
            insuranceId: "INS-" + Math.floor(1000000 + Math.random() * 8999999),
            
            emergencyContacts: [
                {
                    name: firstNames[Math.floor(Math.random() * firstNames.length)] + " " + lastName,
                    relationship: relationships[Math.floor(Math.random() * relationships.length)],
                    phone1: sharedPhone,
                    phone2: ""
                },
                {
                    name: firstNames[Math.floor(Math.random() * firstNames.length)] + " " + lastNames[Math.floor(Math.random() * lastNames.length)],
                    relationship: relationships[Math.floor(Math.random() * relationships.length)],
                    phone1: sharedPhone,
                    phone2: ""
                }
            ],
            
            LinkedCredentials: [
                {
                    credentialType: "AADHAAR",
                    credentialValue: "LINKED_ADHER_01",
                    details: "Verified via UIDAI API",
                    linkedAt: new Date().toISOString(),
                    actor: "SYSTEM"
                },
                {
                    credentialType: "DRIVING_LICENSE",
                    credentialValue: "DL-" + Math.floor(10000000),
                    details: "RTO Verified",
                    linkedAt: new Date().toISOString(),
                    actor: "SYSTEM"
                }
            ],
            
            createdAt: new Date(),
            updatedAt: new Date()
        };

        users.push(user);
    }

    await StateVoter.insertMany(users);
    console.log(`Successfully seeded ${users.length} users into the StateVoter collection.`);
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedData();
