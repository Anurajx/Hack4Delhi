const Block = require("./block");
const SHA256 = require("crypto-js/sha256");

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.latestUserState = {}; // cache latest user values
    this.latestOffchainHash = {};
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), { system: "genesis" }, "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Accepts raw DB documents
   * [
   *   { ID:"KZR6688359", State:"UttarPradesh", Phone:"9898..." }
   * ]
   */
  addUserUpdate(records) {
    for (const record of records) {
      const userId = record.ID;
      if (!userId) continue;
      const changedFields = [];

      // First time user appears
      if (!this.latestUserState[userId]) {
        this.latestUserState[userId] = {};
      }

      for (const key in record) {
        if (this.isTrackableField(key)) {
          const oldValue = this.latestUserState[userId][key];
          const newValue = record[key];

          // Only write if value changed
          if (oldValue !== newValue) {
            const blockData = {
              ID: userId,
              field: key,
              oldValue,
              newValue,
              timestamp: new Date().toISOString(),
            };

            const newBlock = new Block(
              this.chain.length,
              Date.now(),
              blockData,
              this.getLatestBlock().hash
            );

            this.chain.push(newBlock);

            // Update cache
            this.latestUserState[userId][key] = newValue;
            changedFields.push(key);
          }
        }
      }

      this.logImmutableEvent({
        ID: userId,
        TYPE: "UPDATION",
        CREDENTIAL_TYPE: "PROFILE",
        DETAILS: changedFields.length
          ? `Updated fields: ${changedFields.join(", ")}`
          : "Profile fields updated",
        actor: "OFFICER",
        offchainHash: this.buildStateHash(this.latestUserState[userId]),
      });
    }
  }

  isTrackableField(key) {
    const allowed = [
      "IDType",
      "Aadhaar",
      "FirstName",
      "LastName",
      "MotherName",
      "FatherName",
      "Sex",
      "Birthday",
      "Age",
      "DistrictId",
      "District ID",
      "State",
      "Phone",
      "VoterId",
      "Voter ID",
      "DefPassword",
    ];
    return allowed.includes(key);
  }

  getUserHistory(ID) {
    return this.chain
      .filter((b) => b.data?.ID === ID)
      .map((b) => ({
        index: b.index,
        blockTimestamp: b.timestamp,
        ID: b.data.ID,
        field: b.data.field,
        newValue: b.data.newValue,
        eventTimestamp: b.data.timestamp,
        hash: b.hash,
        previousHash: b.previousHash,
        TYPE: b.data.TYPE,
        CREDENTIAL_TYPE: b.data.CREDENTIAL_TYPE,
        DETAILS: b.data.DETAILS,
        actor: b.data.actor,
        offchainHash: b.data.offchainHash,
      }));
  }

  logImmutableEvent({
    ID,
    TYPE,
    CREDENTIAL_TYPE,
    DETAILS,
    actor = "SYSTEM",
    offchainHash = "",
  }) {
    const event = {
      ID,
      TYPE,
      CREDENTIAL_TYPE,
      DETAILS,
      timestamp: new Date().toISOString(),
      actor,
      offchainHash,
      field: `${TYPE}::${CREDENTIAL_TYPE}`,
      oldValue: null,
      newValue: DETAILS,
    };
    const prev = this.getLatestBlock();
    const block = new Block(this.chain.length, Date.now(), event, prev.hash);
    this.chain.push(block);
    if (ID && offchainHash) {
      this.latestOffchainHash[ID] = offchainHash;
    }
    return block;
  }

  getAuditTrail(ID) {
    return this.chain
      .filter((b) => b.data?.ID === ID && b.data?.TYPE)
      .map((b) => ({
        index: b.index,
        hash: b.hash,
        previousHash: b.previousHash,
        ...b.data,
      }));
  }

  getOnChainHash(ID) {
    return this.latestOffchainHash[ID] || null;
  }

  buildStateHash(payload) {
    return SHA256(JSON.stringify(payload || {})).toString();
  }

  addCitizenCreated(record) {
    const payload = {
      IDType: record.IDType,
      Aadhaar: record.Aadhaar,
      FirstName: record.FirstName,
      LastName: record.LastName,
      MotherName: record.MotherName,
      FatherName: record.FatherName,
      Sex: record.Sex,
      Birthday: record.Birthday,
      Age: record.Age,
      DistrictId: record.DistrictId,
      State: record.State,
      Phone: record.Phone,
      VoterId: record.VoterId,
      LinkedCredentials: record.LinkedCredentials || [],
    };
    this.latestUserState[record.ID] = { ...payload };
    this.logImmutableEvent({
      ID: record.ID,
      TYPE: "CREATION",
      CREDENTIAL_TYPE: "PROFILE",
      DETAILS: "Citizen profile created",
      actor: "OFFICER",
      offchainHash: this.buildStateHash(payload),
    });
  }

  addCitizenDeleted(ID) {
    this.logImmutableEvent({
      ID,
      TYPE: "DELETION",
      CREDENTIAL_TYPE: "PROFILE",
      DETAILS: "Citizen record deleted",
      actor: "OFFICER",
      offchainHash: "",
    });

    delete this.latestUserState[ID];
    delete this.latestOffchainHash[ID];
  }

  addCredentialLinked({ ID, credentialType, details, actor = "CITIZEN", offchainHash }) {
    return this.logImmutableEvent({
      ID,
      TYPE: "ADD_CREDENTIAL",
      CREDENTIAL_TYPE: credentialType,
      DETAILS: details,
      actor,
      offchainHash,
    });
  }

  renderUserChainASCII(ID) {
    const blocks = this.chain.filter((b) => b.data?.ID === ID);

    if (blocks.length === 0) return "No blockchain records found.";

    let output = "";

    blocks.forEach((b, i) => {
      output += `
+-------------------------------+
|  BLOCK ${b.index}
|-------------------------------
| User ID : ${b.data.ID}
| Field   : ${b.data.field}
| New     : ${b.data.newValue}
| Time    : ${b.data.timestamp}
| Hash    : ${b.hash.slice(0, 20)}...
| Prev    : ${b.previousHash.slice(0, 20)}...
+-------------------------------+
`;

      if (i < blocks.length - 1) {
        output += "            |\n            v\n";
      }
    });

    return output;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const curr = this.chain[i];
      const prev = this.chain[i - 1];

      if (curr.hash !== curr.calculateHash()) return false;
      if (curr.previousHash !== prev.hash) return false;
    }
    return true;
  }
}

module.exports = Blockchain;
