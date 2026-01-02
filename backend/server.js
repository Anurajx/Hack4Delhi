const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Voter = require("./models/voter");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "StateVoter",
  })
  .then(() => console.log("MongoDB connected to StateVoter"))
  .catch((err) => console.log(err));

/* -----------------------------------
   ROUTES
----------------------------------- */

// Get all voters (with pagination)
app.get("/voters", async (req, res) => {
  //console.log("Fetching voters, page:", req);
  const page = parseInt(req.query.page) || 1;
  const limit = 50;

  const voters = await Voter.find()
    .skip((page - 1) * limit)
    .limit(limit);

  res.json(voters);
});

// Get one voter by ID
app.get("/voters/:id", async (req, res) => {
  const voter = await Voter.findOne({ ID: req.params.id });
  if (!voter) return res.status(404).json({ message: "Not found" });
  res.json(voter);
});

// Search by state
app.get("/state/:state", async (req, res) => {
  const voters = await Voter.find({ State: req.params.state });
  res.json(voters);
});

// Search by district
app.get("/district/:district", async (req, res) => {
  const voters = await Voter.find({ "District ID": req.params.district });
  res.json(voters);
});

// Search by authentication
app.get("/auth/:ID/:password", async (req, res) => {
  const voters = await Voter.find({
    ID: req.params.ID,
    Def_Password: req.params.password,
  });
  if (!voters || voters.length === 0) {
    return res.json({ success: false });
  }

  res.json({ success: true, voters });
});

app.listen(process.env.PORT, () =>
  console.log("Server running on port " + process.env.PORT)
);
