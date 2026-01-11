const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { generateUniqueCode, IDType } = require("./UVID/generator");
const { EPICgenerator, generateDistrictID } = require("./EPIC/generator");
const Blockchain = require("./Blockchain/Blockchain"); // or correct path
const blockchain = new Blockchain();

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

//adhaar is actually government ID number, did't refactor to avoid confusion

/* -----------------------------------
   DATABASE CONNECTIONS
------------------------------------ */

const DB = mongoose.createConnection(process.env.MONGO_URI, {
  dbName: "StateVoter",
});

DB.once("open", () => console.log("Connected to StateVoter"));

/* -----------------------------------
   SCHEMA (Flexible)
----------------------------------- */

const voterSchema = new mongoose.Schema({}, { strict: false });

const StateVoter = DB.model("Voter", voterSchema, "voters");
const TempVoter = DB.model("Voter", voterSchema, "tempVotersBLO");
const UpdateVoter = DB.model("Voter", voterSchema, "toUpdate");

/* -----------------------------------
   ROUTES
----------------------------------- */

// Get all verified voters
app.get("/voters", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 50;

  const voters = await StateVoter.find()
    .skip((page - 1) * limit)
    .limit(limit);

  res.json(voters);
});

// Get all temp voters (applications)
app.get("/tempVoters", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 50;

  const voters = await TempVoter.find()
    .skip((page - 1) * limit)
    .limit(limit);

  res.json(voters);
});

// Get voter by ID (verified only)
app.get("/voters/:id", async (req, res) => {
  const voter = await StateVoter.findOne({ ID: req.params.id });
  if (!voter) return res.status(404).json({ message: "Not found" });
  res.json(voter);
});

// Login (verified voters only)
app.get("/auth/:ID/:password", async (req, res) => {
  const voters = await StateVoter.find({
    ID: req.params.ID,
    Def_Password: req.params.password,
  });

  if (!voters.length) return res.json({ success: false });

  res.json({ success: true, voters });
});

// Apply for new voter (goes to TEMP DB)
app.post("/register", async (req, res) => {
  try {
    // Generate ID if not provided or empty
    let generatedID = req.body.ID;

    if (!generatedID || generatedID.trim() === "") {
      // Map IDType from request to generator IDType constants
      const idTypeMap = {
        AADHAAR: IDType.AADHAAR,
        PAN: IDType.PAN,
        PASSPORT: IDType.PASSPORT,
        DRIVING_LICENSE: IDType.DRIVING_LICENSE,
        VOTER_ID: IDType.VOTER_ID,
      };

      // Determine ID type - default to AADHAAR if not specified
      const requestIDType = req.body.IDType?.toUpperCase() || "AADHAAR";
      const idType = idTypeMap[requestIDType] || IDType.AADHAAR;

      // Get ID number - prefer Aadhaar, fallback to VoterId
      const idNumber = req.body.Aadhaar || req.body.VoterId || "";
      if (!idNumber) {
        return res.status(400).json({
          message: "Aadhaar or VoterId is required for ID generation",
        });
      }

      // Get and convert Birthday format to YYYY-MM-DD
      let dateOfBirth = req.body.Birthday || "";
      if (!dateOfBirth) {
        return res.status(400).json({
          message: "Birthday is required for ID generation",
        });
      }

      // Convert DD-MM-YYYY to YYYY-MM-DD if needed
      if (dateOfBirth.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = dateOfBirth.split("-");
        dateOfBirth = `${year}-${month}-${day}`;
      } else if (dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already in YYYY-MM-DD format, use as is
        dateOfBirth = dateOfBirth;
      } else {
        // Try to handle other formats - if invalid, generator will throw error
        // For now, assume it's already in the correct format or needs manual fixing
      }

      // Generate secret code - use a combination of user data for uniqueness
      // If you want to use a system-wide secret, use: process.env.UVID_SECRET || "defaultSecret"
      const secretCode = idNumber + 292;
      console.log("Using secret code for ID generation.", { secretCode });

      // Generate unique ID
      console.log("Params:", { idType, idNumber, dateOfBirth, secretCode });
      generatedID = generateUniqueCode({
        idType,
        idNumber,
        dateOfBirth,
        secretCode,
      });
    }

    // Create new voter with generated ID
    const newVoter = new TempVoter({
      ...req.body,
      ID: generatedID,
      // "District ID": req.body.DistrictId,
      // "Voter ID": req.body.VoterId,
      // Def_Password: req.body.DefPassword,
    });

    await newVoter.save();
    res.json({
      message: "Application submitted for verification",
      generatedID: generatedID,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      message: "Failed to process registration",
      error: error.message,
    });
  }
});

// Approve voter (TEMP → STATE)
app.post("/approve/:id", async (req, res) => {
  const voter = await TempVoter.findOne({ ID: req.params.id });
  if (!voter) return res.status(404).json({ message: "Not found" });

  const data = voter.toObject(); //creating a new object to make modifications
  delete data._id; // delete old mongo _id to avoid conflicts

  data["VoterId"] = generateDistrictID({
    districtId: data["DistrictId"],
    state: data["State"],
    randomNumber: Math.floor(1000000 + Math.random() * 9000000),
  }); //generate new EPIC ID

  await StateVoter.create(data);
  await TempVoter.deleteOne({ _id: voter._id });

  res.json({ message: "Voter approved and moved to StateVoter" });
});

// Reject voter
app.delete("/reject/:id", async (req, res) => {
  await TempVoter.deleteOne({ ID: req.params.id });
  res.json({ message: "Application rejected" });
});

//Psuedo Update request** //check normal update with this and test we will need to change card structure in frontend but thats easier
app.put("/updateRequest/:id", async (req, res) => {
  const newVoter = new UpdateVoter({
    //"Voter ID": req.body.VoterId,
    ...req.body,
    ID: req.params.id,
  });

  await newVoter.save();
  res.json({ message: "Application submitted for updation" });
});

//read psuedo update db
app.get("/updateFetch", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 50;

  const voters = await UpdateVoter.find()
    .skip((page - 1) * limit)
    .limit(limit);

  res.json(voters);
});

// Reject update request
app.delete("/rejectUpdate/:id", async (req, res) => {
  const result = await UpdateVoter.deleteOne({ ID: req.params.id });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "Update request not found" });
  }
  res.json({ message: "Update request rejected" });
});

// Update verified voter to final stateDB
app.put("/update/:id", async (req, res) => {
  const voter = await StateVoter.findOneAndUpdate(
    //find the field and update it in stateDB
    { ID: req.params.id },
    req.body,
    { new: true }
  );

  //BLOCKCHAIN UPDATE LOGIC HERE
  // Fetch clean update record for blockchain
  const eventData = await UpdateVoter.findOne({ ID: req.params.id }).lean();
  // Send to blockchain (as array)
  console.log("Sending update to blockchain:", eventData);
  await blockchain.addUserUpdate([eventData]);

  await UpdateVoter.deleteOne({ ID: req.params.id }); //delete the update request from updateDB
  res.json(voter);
});

//get blockchain data for a user
app.get("/blockchain/:id", (req, res) => {
  const history = blockchain.getUserHistory(req.params.id);
  res.json(history);
});

//ASCII Blockchain data dump
app.get("/blockchainRender/:id", (req, res) => {
  const ascii = blockchain.renderUserChainASCII(req.params.id);
  res.type("text/plain").send(ascii);
});

// Delete verified voter
app.delete("/delete/:id", async (req, res) => {
  await StateVoter.deleteOne({ ID: req.params.id });
  res.json({ message: "Voter deleted" });
});

/* -----------------------------------
   START SERVER
----------------------------------- */

app.listen(process.env.PORT, () =>
  console.log("Server running on port " + process.env.PORT)
);
