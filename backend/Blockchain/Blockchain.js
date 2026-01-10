const Block = require("./block");

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.latestUserState = {}; // cache latest user values
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
          }
        }
      }
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
      "State",
      "Phone",
      "VoterId",
      "DefPassword",
    ];
    return allowed.includes(key);
  }

  getUserHistory(ID) {
    return this.chain.filter((b) => b.data.ID === ID).map((b) => b.data);
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
