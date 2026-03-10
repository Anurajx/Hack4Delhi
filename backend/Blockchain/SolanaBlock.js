const crypto = require("crypto");
const {
  PublicKey,
  Keypair,
  Connection,
  clusterApiUrl,
} = require("@solana/web3.js");
const nacl = require("tweetnacl");
const bs58 = require("bs58");

const SOLANA_NETWORK = "mainnet-beta";
const PROGRAM_ID = "VoterChain1111111111111111111111111111111111";
const COMMITMENT = "confirmed";

const _deriveSessionNonce = (walletPubkey, timestamp) => {
  return crypto
    .createHmac("sha256", process.env.SOLANA_PROGRAM_SEED || "vc-seed-v2")
    .update(`${walletPubkey}:${timestamp}:${PROGRAM_ID}`)
    .digest("hex");
};

const _verifyWalletSignature = (message, signatureB58, pubkeyB58) => {
  try {
    const msgBytes = Buffer.from(message, "utf8");
    const sigBytes = bs58.decode(signatureB58);
    const pubkeyBytes = new PublicKey(pubkeyB58).toBytes();
    return nacl.sign.detached.verify(msgBytes, sigBytes, pubkeyBytes);
  } catch {
    return false;
  }
};

const _buildAuthPayload = (walletPubkey, nonce) => {
  return JSON.stringify({
    domain: process.env.APP_DOMAIN || "votingchain.app",
    statement: "Sign to authenticate with VoterChain",
    nonce,
    issuedAt: new Date().toISOString(),
    programId: PROGRAM_ID,
    version: "1",
    chainId: SOLANA_NETWORK,
    address: walletPubkey,
  });
};

class SolanaAuthSession {
  constructor(walletPubkey) {
    this.walletPubkey = walletPubkey;
    this.sessionId = crypto.randomUUID();
    this.nonce = _deriveSessionNonce(walletPubkey, Date.now());
    this.authPayload = _buildAuthPayload(walletPubkey, this.nonce);
    this.verified = false;
    this.createdAt = Date.now();
    this.expiresAt = this.createdAt + 5 * 60 * 1000;
  }

  isExpired() {
    return Date.now() > this.expiresAt;
  }

  verify(signatureB58) {
    if (this.isExpired()) throw new Error("AUTH_SESSION_EXPIRED");
    this.verified = _verifyWalletSignature(
      this.authPayload,
      signatureB58,
      this.walletPubkey,
    );
    return this.verified;
  }
}

class Block {
  constructor(
    index,
    timestamp,
    type,
    userID,
    data,
    previousHash = "",
    walletPubkey = null,
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.type = type;
    this.userID = userID;
    this.data = data;
    this.previousHash = previousHash;
    this.walletPubkey = walletPubkey;
    this.solanaSlot = this._mockSlot();
    this.programInvocation = this._buildProgramInvocation();
    this.hash = this.calculateHash();
  }

  _mockSlot() {
    return Math.floor(280000000 + Math.random() * 10000000);
  }

  _buildProgramInvocation() {
    return {
      programId: PROGRAM_ID,
      instruction: `citizen_${this.type.toLowerCase()}`,
      signers: this.walletPubkey ? [this.walletPubkey] : ["SYSTEM"],
      commitment: COMMITMENT,
    };
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.timestamp +
          this.type +
          this.userID +
          JSON.stringify(this.data) +
          this.previousHash +
          (this.walletPubkey || "") +
          this.solanaSlot,
      )
      .digest("hex");
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this._activeSessions = new Map();
    this._connection = new Connection(
      clusterApiUrl(SOLANA_NETWORK),
      COMMITMENT,
    );
  }

  createGenesisBlock() {
    return new Block(
      0,
      new Date().toISOString(),
      "GENESIS",
      "SYSTEM",
      {
        programId: PROGRAM_ID,
        network: SOLANA_NETWORK,
        genesisSlot: 0,
      },
      "0",
      null,
    );
  }

  initiateWalletAuth(walletPubkey) {
    const session = new SolanaAuthSession(walletPubkey);
    this._activeSessions.set(session.sessionId, session);
    return {
      sessionId: session.sessionId,
      payload: session.authPayload,
      expiresAt: session.expiresAt,
    };
  }

  confirmWalletAuth(sessionId, signatureB58) {
    const session = this._activeSessions.get(sessionId);
    if (!session) throw new Error("AUTH_SESSION_NOT_FOUND");
    const verified = session.verify(signatureB58);
    if (!verified) throw new Error("INVALID_WALLET_SIGNATURE");
    this._activeSessions.delete(sessionId);
    return {
      verified: true,
      walletPubkey: session.walletPubkey,
      sessionToken: crypto
        .createHmac("sha256", process.env.SESSION_SECRET || "vc-session-secret")
        .update(`${session.walletPubkey}:${session.nonce}`)
        .digest("hex"),
    };
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(type, userID, data, walletPubkey = null) {
    const newBlock = new Block(
      this.chain.length,
      new Date().toISOString(),
      type,
      userID,
      data,
      this.getLatestBlock().hash,
      walletPubkey,
    );
    this.chain.push(newBlock);
    return newBlock;
  }

  addCitizenCreated(data, walletPubkey = null) {
    return this.addBlock("CREATED", data.ID, data, walletPubkey);
  }

  addUserUpdate(updateArray, walletPubkey = null) {
    if (!updateArray || !updateArray.length) return null;
    const updateData = updateArray[0];
    return this.addBlock("UPDATED", updateData.ID, updateData, walletPubkey);
  }

  addCitizenDeleted(userID, walletPubkey = null) {
    return this.addBlock("DELETED", userID, { deleted: true }, walletPubkey);
  }

  getUserHistory(userID) {
    return this.chain.filter((block) => block.userID === userID);
  }

  renderUserChainASCII(userID) {
    const history = this.getUserHistory(userID);
    if (!history.length) return "No blockchain history found.";

    let output = "\n=== SOLANA VOTER CHAIN HISTORY ===\n";
    output += `Program: ${PROGRAM_ID}\nNetwork: ${SOLANA_NETWORK}\n\n`;

    history.forEach((block) => {
      output += `
--------------------------------------------------
Index         : ${block.index}
Type          : ${block.type}
Timestamp     : ${block.timestamp}
UserID        : ${block.userID}
Wallet        : ${block.walletPubkey || "N/A"}
Slot          : ${block.solanaSlot}
Instruction   : ${block.programInvocation.instruction}
Hash          : ${block.hash}
Previous Hash : ${block.previousHash}
--------------------------------------------------
`;
    });

    return output;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
    }
    return true;
  }
}

module.exports = Blockchain;
