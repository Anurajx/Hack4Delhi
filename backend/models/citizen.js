const mongoose = require("mongoose");

const credentialSchema = new mongoose.Schema(
  {
    credentialType: { type: String, required: true },
    encryptedValue: { type: String, required: true },
    hash: { type: String, required: true },
    linkedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const citizenSchema = new mongoose.Schema(
  {
    bid: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    dob: { type: String, required: true },
    phone: { type: String, required: true },
    encryptedProfile: { type: String, required: true },
    credentials: { type: [credentialSchema], default: [] },
    auditHashes: { type: [String], default: [] },
  },
  {
    collection: "users",
    timestamps: true,
  },
);

module.exports = mongoose.model("Citizen", citizenSchema);
