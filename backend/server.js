const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

/* -----------------------------------
   DATABASE CONNECTIONS
----------------------------------- */

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
  const newVoter = new TempVoter({
    ...req.body,
    "District ID": req.body.DistrictId,
    "Voter ID": req.body.VoterId,
    Def_Password: req.body.DefPassword,
  });

  await newVoter.save();
  res.json({ message: "Application submitted for verification" });
});

// Approve voter (TEMP → STATE)
app.post("/approve/:id", async (req, res) => {
  const voter = await TempVoter.findOne({ ID: req.params.id });
  if (!voter) return res.status(404).json({ message: "Not found" });

  await StateVoter.create(voter.toObject());
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

  await UpdateVoter.deleteOne({ ID: req.params.id }); //delete the update request from updateDB
  res.json(voter);
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
