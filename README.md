# CredChain India

<img width="1830" height="1011"  alt="image" src="https://github.com/user-attachments/assets/259940d8-9239-468a-a88b-f146d8bdc2e1" />
<img width="1830" height="1011" alt="Screenshot 2026-01-05 174436" src="https://github.com/user-attachments/assets/198e724f-0646-4830-8987-0f560069dceb" />









## Overview

CredChain India is a zero-trust digital identity lifecycle platform designed citizens of India. It leverages blockchain for immutable audit trails, cryptographic identifiers, and officer-verified workflows to prevent identity fraud, ensure data integrity, and enable unified management of multiple credentials (e.g., Aadhaar, PAN, Passport). this MVP demonstrates secure registration without prior government IDs, event logging for creations/updates/deletions, and tamper detection—all while maintaining privacy with off-chain encrypted storage.

This project addresses real-world challenges like fragmented IDs, insider tampering, and bootstrapping for underserved users (e.g., newborns or immigrants). It's scalable for national-level systems, emphasizing cyber-resilient features like fuzzy duplicate checks and UVID-anchored identity records.

# What it Does

The system provides a complete end-to-end flow for managing digital identities securely:

- **User Registration and Bootstrapping:** Citizens register via a portal with basic details (name, DOB, phone, parents' names, optional existing ID, and mock document uploads). No prior government ID is required - the backend generates a unique UVID after verification.
  
- **Officer Verification:** Requests are routed to an admin dashboard where officers review documents and perform fuzzy duplicate checks (using name/DOB similarity). Approved requests activate the citizen UVID in the verified registry.

- **UVID as Identity Anchor:** The existing backend-generated UVID is the lifelong identity anchor. The mock blockchain logs immutable events against this UVID without generating any new blockchain ID.

- **Multi-Credential Linking:** Users/officers can add credentials (e.g., Aadhaar, PAN, Passport, Driving License, Voter ID) linked to the same UVID. Each action is logged immutably on the mock blockchain.

- **Immutable Event Logging:** Blockchain records events in a structured format:
  - **TYPE:** CREATION, UPDATION, DELETION (or ADD for new credentials).
  - **CREDENTIAL_TYPE:** AADHAAR, PAN, PASSPORT, VOTER_ID, etc.
  - **DETAILS:** Short description or hash of changes (e.g., "Updated PAN with new hash: 0xdef...").
  - Additional: Timestamp, actor (officer wallet), and data hash for integrity.

- **Audit and Tamper Detection:** Query UVID to view full event history from blockchain. Compare off-chain data hashes to on-chain for real-time tamper alerts (e.g., "Integrity violation detected!").

- **Threat Monitoring:** Basic anomaly detection (e.g., excessive updates flagged as suspicious).

- **Privacy and Security:** Sensitive data (PII) is encrypted off-chain in a database; blockchain only stores hashes and metadata to minimize costs and risks.

This setup prevents duplicates across credentials, ensures no secret modifications, and supports synchronization across distributed systems.

# Components

The architecture is layered for modularity, following zero-trust principles:

- **User Interaction Layer:**
  - Citizen Portal: React frontend for registration, credential requests, and UVID-linked profile access.
  - Officer Dashboard: Admin interface for approvals, reviews, and fuzzy checks.

- **Verification Layer:**
  - Fuzzy duplicate detection: Basic ML/string similarity (e.g., Levenshtein distance via libraries like fuzzywuzzy).
  - Document validation: Mocked uploads (images/PDFs) for officer review.

- **National Identity & Synchronization Server:**
  - Backend: Node.js/Express API handling logic, duplicate checks, and contract calls.
  - UVID Generation: Triggered in backend registration flow (existing logic retained).

- **Secure Operational Databases:**
  - Off-chain storage: MongoDB collections for user records and linked credentials, keyed by UVID.

- **Blockchain Integrity Layer:**
  - Smart Contract: Solidity on Polygon Mumbai testnet.
  - Events: Logged for all lifecycle actions (IdentityEvent with UVID, TYPE, CREDENTIAL_TYPE, DETAILS, timestamp, actor).
  - Libraries: ethers.js for interactions.

- **Threat Detection & Monitoring Engine:**
  - Basic rules: Flag anomalies (e.g., >3 updates/hour).
  - Tamper checks: Hash comparisons between off-chain and on-chain.

- **Independent Audit Nodes:**
  - Simulated via blockchain explorer links for viewing distributed ledger copies.

**Tech Stack Summary:**
- Frontend: React, Tailwind CSS.
- Backend: Node.js, Express.
- Blockchain: Solidity, Polygon Mumbai, ethers.js.
- Database: Firebase/Supabase.
- ML: Basic libraries for fuzzy matching.
- Other: MetaMask for wallet signatures (optional).

# Installation

1. Clone the repo: `git clone https://github.com/Anurajx/CredChain`
2. Install dependencies: `npm install` (for both frontend and backend).
3. Set up environment: Add `.env` with Polygon API keys and DB credentials.
4. Deploy contract: Use Remix IDE to deploy Solidity contract to Mumbai testnet.
5. Run: `npm run dev` for local development.

# Usage

- Citizen: Access portal, register, get UVID, add credentials, and view audit trail.
- Officer: Login to dashboard, approve requests.
- Demo: Run tamper simulation in monitoring console.

# Contributing

- Fork and PR! Focus on adding real biometrics or multi-region sync.
- For questions, contact us at [anurajupadhyay6@gmail.com].
