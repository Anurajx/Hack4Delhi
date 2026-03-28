require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const SHA256 = require("crypto-js/sha256");
const fuzz = require("fuzzball");
const { v4: uuidv4 } = require("uuid");
const { generateUniqueCode, IDType } = require("./UVID/generator");
const { EPICgenerator, generateDistrictID } = require("./EPIC/generator");
const Blockchain = require("./Blockchain/Blockchain"); // or correct path
const blockchain = new Blockchain();
const { computeConfidenceScore } = require("./models/confidence");
const { sendSMSToAllContacts, sendSMS } = require("./services/smsService");


const app = express();
app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.1", timestamp: new Date() });
});

app.get("/", (req, res) => {
  res.json({ status: "active", version: "emergency-v2" });
});

const buildOffchainHash = (record) => SHA256(JSON.stringify(record || {})).toString();

//adhaar is actually government ID number, did't refactor to avoid confusion

/* -----------------------------------
   DATABASE CONNECTIONS
------------------------------------ */

const DB = mongoose.createConnection(process.env.MONGO_URI, {
  dbName: "StateVoter",
});

DB.once("open", () => console.log("Connected to StateVoter"));

/* -----------------------------------
   SCHEMA 
----------------------------------- */

const voterSchema = new mongoose.Schema({}, { strict: false });

const StateVoter = DB.model("Voter", voterSchema, "voters");
const TempVoter = DB.model("Voter", voterSchema, "tempVotersBLO");
const UpdateVoter = DB.model("Voter", voterSchema, "toUpdate");

// Emergency Access Models
const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    relationship: { type: String, default: "" },
    phone1: { type: String, default: "" },
    phone2: { type: String, default: "" },
  },
  { _id: false }
);

const emergencyTokenSchema = new mongoose.Schema(
  {
    uvid: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    createdAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    emergencyContacts: {
      type: [emergencyContactSchema],
      default: () => [{}, {}],
    },
    accessLog: { type: Array, default: [] }, // [{accessedAt, accessorNote, event, smsSent, smsRecipients, ...}]
  },
  { strict: true }
);

const EmergencyToken = DB.model(
  "EmergencyToken",
  emergencyTokenSchema,
  "emergencyTokens"
);

const notificationSchema = new mongoose.Schema(
  {
    uvid: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    message: { type: String, required: true },
    seenByUser: { type: Boolean, default: false },
    createdAt: { type: Date, default: () => new Date() },

    // SMS audit fields (optional; included when sendSMS is requested)
    smsSent: { type: Boolean, default: false },
    smsRecipients: { type: [String], default: [] },
    timestamp: { type: Date },
  },
  { strict: true }
);

const Notification = DB.model(
  "EmergencyNotification",
  notificationSchema,
  "notifications"
);

/* -----------------------------------
   ROUTES
----------------------------------- */

app.get("/api/state-stats", async (req, res) => {
  try {
    // Additions: count approved voters per state
    const additionsData = await StateVoter.aggregate([
      { $group: { _id: "$State", count: { $sum: 1 } } }
    ]);

    // Updations: count pending update requests per state
    const updationsData = await UpdateVoter.aggregate([
      { $group: { _id: "$State", count: { $sum: 1 } } }
    ]);

    // Duplications: find IDs that exist in BOTH TempVoter and StateVoter (same UVID = duplicate attempt)
    const tempVoters = await TempVoter.find({}, { ID: 1, State: 1, _id: 0 }).lean();
    const stateVoterIds = new Set(
      (await StateVoter.find({}, { ID: 1, _id: 0 }).lean()).map((v) => v.ID)
    );

    // Count duplicates grouped by state
    const dupsByState = {};
    for (const tv of tempVoters) {
      if (tv.ID && stateVoterIds.has(tv.ID)) {
        const state = tv.State || "Unknown";
        dupsByState[state] = (dupsByState[state] || 0) + 1;
      }
    }
    const duplicationsData = Object.entries(dupsByState).map(([state, count]) => ({
      _id: state,
      count,
    }));

    // Fraud Detection: Aggregate markers from StateVoter
    const fraudMarkersData = await StateVoter.aggregate([
      {
        $group: {
          _id: "$State",
          tamperCount: { $sum: { $cond: ["$TamperCheckFailed", 1, 0] } },
          fuzzyHighCount: { $sum: { $cond: [{ $gt: ["$FuzzyMatchRatio", 0.8] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);

    // Linked Credentials: count total linked credentials per state
    const linkedCredsData = await StateVoter.aggregate([
      { $unwind: { path: "$LinkedCredentials", preserveNullAndEmptyArrays: false } },
      { $group: { _id: "$State", count: { $sum: 1 } } }
    ]);

    const statsByState = {};
    const mergeStats = (data, key) => {
      data.forEach((item) => {
        const stateName = item._id || "Unknown";
        if (!statsByState[stateName]) {
          statsByState[stateName] = {
            State: stateName,
            additions: 0,
            updations: 0,
            duplications: 0,
            linkedCredentials: 0,
            tamperCount: 0,
            fraudScore: 0
          };
        }
        if (key === "fraudMarkers") {
          statsByState[stateName].tamperCount = item.tamperCount || 0;
          // Calculate a rudimentary fraud score 0-10
          const baseScore = ((item.tamperCount * 2) + (item.fuzzyHighCount * 1.5)) / (item.total || 1);
          statsByState[stateName].fraudScore = Math.min(10, Math.max(0.5, baseScore * 5));
        } else {
          statsByState[stateName][key] = item.count;
        }
      });
    };

    mergeStats(additionsData, "additions");
    mergeStats(updationsData, "updations");
    mergeStats(duplicationsData, "duplications");
    mergeStats(linkedCredsData, "linkedCredentials");
    mergeStats(fraudMarkersData, "fraudMarkers");

    res.json(Object.values(statsByState));
  } catch (error) {
    console.error("State stats error:", error);
    res.status(500).json({ message: "Failed to fetch state statistics" });
  }
});

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
    DefPassword: req.params.password, //Def_Password
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

  console.log(data);

  await StateVoter.create(data);

  blockchain.addCitizenCreated(data); //send to blockchain

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

// ===========================
// Emergency Access Mode APIs
// ===========================

const formatTimestampIST = (date = new Date()) => {
  try {
    return new Date(date).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return new Date(date).toISOString();
  }
};

const normalizeEmergencyContacts = (voter) => {
  const toStr = (v) => (v == null ? "" : String(v));

  const raw = voter?.emergencyContacts;
  if (Array.isArray(raw) && raw.length > 0) {
    const c0 = raw[0] || {};
    const c1 = raw[1] || {};
    return [
      {
        name: toStr(c0.name),
        relationship: toStr(c0.relationship),
        phone1: toStr(c0.phone1),
        phone2: toStr(c0.phone2),
      },
      {
        name: toStr(c1.name),
        relationship: toStr(c1.relationship),
        phone1: toStr(c1.phone1),
        phone2: toStr(c1.phone2),
      },
    ];
  }

  // Backward compatibility: older single emergencyContact shape
  const legacy = voter?.emergencyContact || {};
  return [
    {
      name: toStr(legacy.name),
      relationship: toStr(legacy.relationship),
      phone1: toStr(legacy.phone || legacy.phone1),
      phone2: toStr(legacy.phone2),
    },
    {
      name: "",
      relationship: "",
      phone1: "",
      phone2: "",
    },
  ];
};

// 1) Generate a signed emergency access token (stored in Mongo)
app.post("/emergency/generate/:uvid", async (req, res) => {
  try {
    const uvid = req.params.uvid;
    if (!uvid) return res.status(400).json({ message: "uvid is required" });

    const token = uuidv4();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 72 * 60 * 60 * 1000); // 72 hours

    const voter = await StateVoter.findOne({ ID: uvid }).lean();
    if (!voter) return res.status(404).json({ message: "Citizen not found" });

    // Extract normalized emergency contacts from the voter record.
    const emergencyContacts = normalizeEmergencyContacts(voter);

    const emergencyToken = await EmergencyToken.create({
      uvid,
      token,
      createdAt,
      expiresAt,
      isActive: true,
      emergencyContacts,
      accessLog: [],
    });

    res.json({
      token: emergencyToken.token,
      emergencyUrl: `/emergency/${emergencyToken.token}`,
    });
  } catch (error) {
    console.error("Emergency token generation error:", error);
    res.status(500).json({ message: "Failed to generate emergency token" });
  }
});

// 2) Public emergency endpoint (no auth)
app.get("/emergency/:token", async (req, res, next) => {
  try {
    const token = req.params.token;
    // Avoid route shadowing: /emergency/notifications/:uvid is also a GET route.
    if (token === "notifications") return next();
    const emergencyToken = await EmergencyToken.findOne({ token }).lean();

    if (
      !emergencyToken ||
      emergencyToken.isActive !== true ||
      !emergencyToken.expiresAt ||
      new Date(emergencyToken.expiresAt).getTime() <= Date.now()
    ) {
      return res.status(403).json({ message: "Emergency token expired or revoked" });
    }

    const voter = await StateVoter.findOne({ ID: emergencyToken.uvid }).lean();
    if (!voter) return res.status(404).json({ message: "Citizen/UVID not found" });

    const scanAccessedAt = Date.now();

    // Append access log entry (placeholder for accessor audit)
    await EmergencyToken.updateOne(
      { token },
      {
        $push: {
          accessLog: { accessedAt: scanAccessedAt, accessorNote: "" },
        },
      }
    );

    // ALWAYS fetch latest emergency contacts from the verified voter record, 
    // rather than using the static snapshot in the token.
    const emergencyContacts = normalizeEmergencyContacts(voter);
    const scanIstTimestamp = formatTimestampIST(new Date(scanAccessedAt));
    const fullName = `${(voter.FirstName || "").trim()} ${(voter.LastName || "").trim()}`.trim();
    const scanSmsMessage = `[CredChain Emergency Alert]
Your emergency identity QR was just scanned.

Identity: ${fullName}
Time: ${scanIstTimestamp}
Location data: Not available

If this was not an emergency, revoke access immediately at:
credchain.in/user-profile

This is an automated alert from CredChain India.
`;

    // Non-blocking: do not await SMS before responding.
    void sendSMSToAllContacts(emergencyContacts, scanSmsMessage)
      .then((results) => {
        const smsSent = Array.isArray(results)
          ? results.some((r) => r?.sent === true)
          : false;
        const smsRecipients = Array.isArray(results)
          ? results
            .map((r) => r?.to)
            .filter((t) => typeof t === "string" && t.trim())
          : [];

        return EmergencyToken.updateOne(
          { token },
          {
            $push: {
              accessLog: {
                event: "TOKEN_SCANNED",
                smsSent,
                smsRecipients,
                accessedAt: scanAccessedAt,
              },
            },
          }
        );
      })
      .catch(() => {
        // sendSMSToAllContacts should never throw; keep as defensive.
        return EmergencyToken.updateOne(
          { token },
          {
            $push: {
              accessLog: {
                event: "TOKEN_SCANNED",
                smsSent: false,
                smsRecipients: [],
                accessedAt: scanAccessedAt,
              },
            },
          }
        );
      });

    // Immutable blockchain log
    blockchain.logImmutableEvent({
      ID: emergencyToken.uvid,
      TYPE: "EMERGENCY_ACCESS",
      CREDENTIAL_TYPE: "PROFILE",
      DETAILS: "Public emergency token accessed",
      actor: "ANONYMOUS_EMERGENCY",
    });

    // Return ONLY allowed fields
    res.json({
      FirstName: voter.FirstName,
      LastName: voter.LastName,
      Phone: voter.Phone,
      State: voter.State,
      Birthday: voter.Birthday,
      Sex: voter.Sex,

      bloodGroup: voter.bloodGroup,
      allergies: voter.allergies,
      emergencyContacts,
      organDonor: voter.organDonor,
      medicalConditions: voter.medicalConditions,
      insuranceId: voter.insuranceId,
    });
  } catch (error) {
    console.error("Emergency token access error:", error);
    res.status(500).json({ message: "Failed to access emergency token" });
  }
});

// 3) Notify identity holder after accessor identifies themselves
app.post("/emergency/notify/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const {
      reason,
      accessorName,
      accessorRole,
      accessorPhone,
      organizationName,
    } = req.body || {};

    if (!reason || !accessorName || !accessorRole) {
      return res.status(400).json({
        message: "reason, accessorName, and accessorRole are required",
      });
    }

    const emergencyToken = await EmergencyToken.findOne({ token });
    if (
      !emergencyToken ||
      emergencyToken.isActive !== true ||
      !emergencyToken.expiresAt ||
      new Date(emergencyToken.expiresAt).getTime() <= Date.now()
    ) {
      return res.status(403).json({ message: "Emergency token expired or revoked" });
    }

    const voter = await StateVoter.findOne({ ID: emergencyToken.uvid }).lean();
    if (!voter) return res.status(404).json({ message: "Citizen/UVID not found" });

    const emergencyContacts = normalizeEmergencyContacts(voter);

    const accessorIstTimestamp = formatTimestampIST(new Date());
    const citizenFullName = `${(voter.FirstName || "").trim()} ${(voter.LastName || "").trim()}`.trim();

    const smsMessage = `[CredChain Emergency Alert]
Someone has accessed the emergency identity of ${citizenFullName}.

Accessor Details:
Name: ${accessorName}
Role: ${accessorRole}
Organization: ${organizationName || ""}
Phone: ${accessorPhone || ""}
Reason: ${reason}
Time: ${accessorIstTimestamp}

This is an automated alert from CredChain India Identity System.
`;

    // SMS to emergency contacts (up to 4 numbers)
    const emergencyResults = await sendSMSToAllContacts(
      emergencyContacts,
      smsMessage
    );

    // Also notify the citizen (user profile) via their registered phone(s)
    const citizenPhoneRaw = String(voter?.Phone || "");
    const citizenPhones = citizenPhoneRaw
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const citizenResults = [];
    for (const phone of citizenPhones) {
      // sendSMS never throws.
      // eslint-disable-next-line no-await-in-loop
      citizenResults.push(await sendSMS(phone, smsMessage));
    }

    const allResults = [...(Array.isArray(emergencyResults) ? emergencyResults : []), ...citizenResults];

    const smsRecipients = allResults
      .map((r) => r?.to)
      .filter((t) => typeof t === "string" && t.trim());
    const smsSent = allResults.some((r) => r?.sent === true);

    const newAccessLogEntry = {
      accessedAt: Date.now(),
      accessorNote: reason,
      reason,
      accessorName,
      accessorRole,
      accessorPhone,
      smsSent,
      smsRecipients,
    };

    // Save into the token's accessLog last accessor-related entry.
    if (
      Array.isArray(emergencyToken.accessLog) &&
      emergencyToken.accessLog.length > 0
    ) {
      const accessorPlaceholderIdx = [...emergencyToken.accessLog]
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => (e?.accessorNote ?? "") === "" && e?.event !== "TOKEN_SCANNED")
        .map(({ i }) => i)
        .pop();

      const idxToUpdate =
        typeof accessorPlaceholderIdx === "number"
          ? accessorPlaceholderIdx
          : emergencyToken.accessLog.length - 1;

      emergencyToken.accessLog[idxToUpdate] = {
        ...(emergencyToken.accessLog[idxToUpdate] || {}),
        ...newAccessLogEntry,
      };
    } else {
      emergencyToken.accessLog = [newAccessLogEntry];
    }

    await emergencyToken.save();

    const message = `${accessorName} (${accessorRole}) requested emergency access: ${reason}`;
    await Notification.create({
      uvid: emergencyToken.uvid,
      type: "EMERGENCY_ACCESS_ALERT",
      message,
      seenByUser: false,
      createdAt: new Date(),
      smsSent,
      smsRecipients,
    });

    res.json({ success: true, smsSent, smsRecipients });
  } catch (error) {
    console.error("Emergency notify error:", error);
    res.status(500).json({ message: "Failed to notify identity holder" });
  }
});

// 4) Ping notifications (ongoing assistance)
app.post("/emergency/ping/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const { message, sendSMS } = req.body || {};

    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }

    const emergencyToken = await EmergencyToken.findOne({ token }).lean();
    if (
      !emergencyToken ||
      emergencyToken.isActive !== true ||
      !emergencyToken.expiresAt ||
      new Date(emergencyToken.expiresAt).getTime() <= Date.now()
    ) {
      return res.status(403).json({ message: "Emergency token expired or revoked" });
    }

    const voter = await StateVoter.findOne({ ID: emergencyToken.uvid }).lean();
    const timestamp = new Date();

    let smsSent = false;
    let smsRecipients = [];

    if (sendSMS === true && voter) {
      const ongoingIstTimestamp = formatTimestampIST(new Date(timestamp));
      const emergencyContacts = normalizeEmergencyContacts(voter);
      const accessorFullName = `${(voter.FirstName || "").trim()} ${(voter.LastName || "").trim()}`.trim();

      const smsMessage = `[CredChain Ongoing Alert]
Emergency accessor is still present with ${accessorFullName}.

Message: ${message}
Time: ${ongoingIstTimestamp}

This is an automated update from CredChain India.
`;

      const results = await sendSMSToAllContacts(emergencyContacts, smsMessage);
      smsRecipients = Array.isArray(results)
        ? results.map((r) => r?.to).filter((t) => typeof t === "string" && t.trim())
        : [];
      smsSent = Array.isArray(results) ? results.some((r) => r?.sent === true) : false;
    }

    await Notification.create({
      uvid: emergencyToken.uvid,
      type: "EMERGENCY_PING",
      message,
      seenByUser: false,
      createdAt: timestamp,
      timestamp,
      smsSent,
      smsRecipients,
    });

    res.json({
      success: true,
      smsSent,
      smsRecipients,
      timestamp: timestamp.toISOString(),
    });
  } catch (error) {
    console.error("Emergency ping error:", error);
    res.status(500).json({ message: "Failed to send ping" });
  }
});

// 5) Fetch notifications for a citizen
app.get("/emergency/notifications/:uvid", async (req, res) => {
  try {
    const uvid = req.params.uvid;
    if (!uvid) return res.status(400).json({ message: "uvid is required" });

    const notifications = await Notification.find({ uvid })
      .sort({ createdAt: -1 })
      .lean();

    res.json(notifications);
  } catch (error) {
    console.error("Emergency notifications fetch error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// 6) Revoke emergency access for a citizen
app.delete("/emergency/token/:uvid", async (req, res) => {
  try {
    const uvid = req.params.uvid;
    if (!uvid) return res.status(400).json({ message: "uvid is required" });

    const result = await EmergencyToken.updateMany(
      { uvid, isActive: true },
      { $set: { isActive: false } }
    );

    res.json({ success: true, revokedCount: result.modifiedCount || 0 });
  } catch (error) {
    console.error("Emergency token revoke error:", error);
    res.status(500).json({ message: "Failed to revoke emergency access" });
  }
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
    { new: true },
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

// Direct update of citizen record (specifically for emergency/medical info)
app.put("/update-citizen/:id", async (req, res) => {
  try {
    console.log(`Direct update requested for ${req.params.id}:`, req.body);
    const voter = await StateVoter.findOneAndUpdate(
      { ID: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!voter) return res.status(404).json({ message: "Citizen not found" });

    // Log change to blockchain
    blockchain.logImmutableEvent({
      ID: req.params.id,
      TYPE: "PROFILE_UPDATE",
      DETAILS: "Medical/Emergency profile updated by citizen",
      actor: "CITIZEN",
    });

    res.json(voter);
  } catch (error) {
    console.error("Direct update error:", error);
    res.status(500).json({ message: "Failed to update profile directly" });
  }
});

// Link additional credentials to existing UVID
app.post("/add-credential", async (req, res) => {
  try {
    const { ID, credentialType, credentialValue, details, actor } = req.body;
    if (!ID || !credentialType || !credentialValue) {
      return res.status(400).json({
        message: "ID, credentialType and credentialValue are required",
      });
    }

    const voter = await StateVoter.findOne({ ID });
    if (!voter) {
      return res.status(404).json({ message: "Citizen/UVID not found" });
    }

    const linkedCredentials = Array.isArray(voter.LinkedCredentials)
      ? voter.LinkedCredentials
      : [];

    const alreadyLinked = linkedCredentials.some(
      (c) =>
        c?.credentialType === credentialType &&
        c?.credentialValue === credentialValue
    );
    if (alreadyLinked) {
      return res.status(409).json({ message: "Credential already linked" });
    }

    const credentialEntry = {
      credentialType,
      credentialValue,
      details: details || `${credentialType} linked`,
      linkedAt: new Date().toISOString(),
      actor: actor || "CITIZEN",
    };

    const updatedVoter = await StateVoter.findOneAndUpdate(
      { ID },
      { $push: { LinkedCredentials: credentialEntry } },
      { new: true }
    );

    const offchainHash = buildOffchainHash(updatedVoter);
    blockchain.addCredentialLinked({
      ID,
      credentialType,
      details: details || `${credentialType} credential linked`,
      actor: actor || "CITIZEN",
      offchainHash,
    });

    res.json({
      message: "Credential linked successfully",
      LinkedCredentials: updatedVoter.LinkedCredentials || [],
    });
  } catch (error) {
    console.error("Add credential error:", error);
    res.status(500).json({ message: "Failed to link credential" });
  }
});

// Update an already linked credential for existing UVID
app.put("/update-credential", async (req, res) => {
  try {
    const { ID, credentialType, oldCredentialValue, newCredentialValue, details, actor } =
      req.body;
    if (!ID || !credentialType || !oldCredentialValue || !newCredentialValue) {
      return res.status(400).json({
        message:
          "ID, credentialType, oldCredentialValue and newCredentialValue are required",
      });
    }

    const voter = await StateVoter.findOne({ ID });
    if (!voter) return res.status(404).json({ message: "Citizen/UVID not found" });

    const linkedCredentials = Array.isArray(voter.LinkedCredentials)
      ? voter.LinkedCredentials
      : [];
    const credentialIndex = linkedCredentials.findIndex(
      (c) =>
        c?.credentialType === credentialType &&
        c?.credentialValue === oldCredentialValue
    );
    if (credentialIndex === -1) {
      return res.status(404).json({ message: "Linked credential not found" });
    }

    linkedCredentials[credentialIndex] = {
      ...linkedCredentials[credentialIndex],
      credentialValue: newCredentialValue,
      details: details || `${credentialType} credential updated`,
      linkedAt: new Date().toISOString(),
      actor: actor || "CITIZEN",
    };

    const updatedVoter = await StateVoter.findOneAndUpdate(
      { ID },
      { LinkedCredentials: linkedCredentials },
      { new: true }
    );

    const offchainHash = buildOffchainHash(updatedVoter);
    blockchain.logImmutableEvent({
      ID,
      TYPE: "UPDATION",
      CREDENTIAL_TYPE: credentialType,
      DETAILS: details || `${credentialType} credential updated`,
      actor: actor || "CITIZEN",
      offchainHash,
    });

    res.json({
      message: "Credential updated successfully",
      LinkedCredentials: updatedVoter.LinkedCredentials || [],
    });
  } catch (error) {
    console.error("Update credential error:", error);
    res.status(500).json({ message: "Failed to update credential" });
  }
});

// Read immutable audit trail for a UVID
app.get("/get-audit-trail/:id", (req, res) => {
  const history = blockchain.getAuditTrail(req.params.id);
  res.json(history);
});

// Backward compatible query style endpoint
app.get("/get-audit-trail", (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ message: "id query param required" });
  const history = blockchain.getAuditTrail(id);
  res.json(history);
});

// Confidence score for a UVID
app.get("/confidence/:id", async (req, res) => {
  try {
    const requestedId = (req.params.id || "").trim();
    const voter = await StateVoter.findOne({
      ID: { $regex: `^${requestedId}$`, $options: "i" },
    }).lean();
    if (!voter) return res.status(404).json({ message: "Citizen/UVID not found" });
    const auditTrail = blockchain.getAuditTrail(voter.ID);
    const result = computeConfidenceScore({ voter, auditTrail });
    res.json({
      ID: voter.ID,
      ...result,
    });
  } catch (error) {
    console.error("Confidence score error:", error);
    res.status(500).json({ message: "Failed to compute confidence score" });
  }
});
// Tamper check: compare DB snapshot hash with latest on-chain hash
app.get("/tamper-check/:id", async (req, res) => {
  try {
    const voter = await StateVoter.findOne({ ID: req.params.id }).lean();
    if (!voter) return res.status(404).json({ message: "Citizen/UVID not found" });

    const offchainHash = buildOffchainHash(voter);
    const onchainHash = blockchain.getOnChainHash(req.params.id);
    const isTampered = !!onchainHash && offchainHash !== onchainHash;

    res.json({
      ID: req.params.id,
      offchainHash,
      onchainHash,
      integrity: isTampered ? "FAILED" : "PASS",
      tampered: isTampered,
    });
  } catch (error) {
    console.error("Tamper check error:", error);
    res.status(500).json({ message: "Tamper check failed" });
  }
});

// Tamper simulation: mutate DB without updating blockchain to test integrity detection
app.post("/tamper-simulate/:id", async (req, res) => {
  try {
    const requestedId = (req.params.id || "").trim();
    const voter = await StateVoter.findOne({
      ID: { $regex: `^${requestedId}$`, $options: "i" },
    });
    if (!voter) return res.status(404).json({ message: "Citizen/UVID not found" });

    // Minimal, visible mutation: toggle a suffix on Phone field or touch a misc field
    const currentPhone = voter.Phone || "";
    const mutatedPhone = currentPhone.endsWith("-tampered")
      ? currentPhone.replace(/-tampered$/, "")
      : `${currentPhone}-tampered`;

    voter.Phone = mutatedPhone;
    await voter.save();

    // IMPORTANT: Do not log to blockchain here (simulates out-of-band modification)
    res.json({ message: "Record tampered for testing", ID: req.params.id, Phone: voter.Phone });
  } catch (error) {
    console.error("Tamper simulate error:", error);
    res.status(500).json({ message: "Failed to tamper record" });
  }
});
// Fuzzy duplicate detection page support
app.get("/fuzzy-detection", async (req, res) => {
  try {
    const query = (req.query.query || "").toString().trim().toLowerCase();
    const threshold = Number(req.query.threshold || 80);
    if (!query) {
      return res.status(400).json({ message: "query is required" });
    }

    const voters = await StateVoter.find().lean();
    const tempVoters = await TempVoter.find().lean();
    const updates = await UpdateVoter.find().lean();
    const auditLogs = blockchain.chain.map((b) => b.data || {});

    const candidates = [
      ...voters.map((v) => ({
        source: "StateVoter",
        ID: v.ID,
        text: `${v.FirstName || ""} ${v.LastName || ""} ${v.Aadhaar || ""} ${v.Phone || ""} ${v.Birthday || ""}`,
        payload: v,
      })),
      ...tempVoters.map((v) => ({
        source: "TempVoter",
        ID: v.ID,
        text: `${v.FirstName || ""} ${v.LastName || ""} ${v.Aadhaar || ""} ${v.Phone || ""} ${v.Birthday || ""}`,
        payload: v,
      })),
      ...updates.map((v) => ({
        source: "UpdateVoter",
        ID: v.ID,
        text: `${v.FirstName || ""} ${v.LastName || ""} ${v.Aadhaar || ""} ${v.Phone || ""} ${v.Birthday || ""}`,
        payload: v,
      })),
      ...auditLogs.map((log) => ({
        source: "BlockchainLog",
        ID: log.ID || "N/A",
        text: `${log.TYPE || ""} ${log.CREDENTIAL_TYPE || ""} ${log.DETAILS || ""} ${log.actor || ""}`,
        payload: log,
      })),
    ];

    const suspicious = candidates
      .map((row) => ({
        ...row,
        score: fuzz.token_set_ratio(query, row.text.toLowerCase()),
      }))
      .filter((row) => row.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);

    res.json({
      query,
      threshold,
      totalChecked: candidates.length,
      suspiciousCount: suspicious.length,
      suspicious,
    });
  } catch (error) {
    console.error("Fuzzy detection error:", error);
    res.status(500).json({ message: "Fuzzy detection failed" });
  }
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

  blockchain.addCitizenDeleted(req.params.id); //send to blockchain

  res.json({ message: "Voter deleted" });
});

/* -----------------------------------
   START SERVER
----------------------------------- */

app.listen(process.env.PORT, () =>
  console.log("Server running on port " + process.env.PORT),
);
