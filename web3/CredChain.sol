// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CredChainIdentity {

    // ========== ROLES ==========
    address public admin;
    mapping(address => bool) public officers;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyOfficer() {
        require(officers[msg.sender] == true, "Not authorized officer");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addOfficer(address _officer) external onlyAdmin {
        officers[_officer] = true;
    }

    function removeOfficer(address _officer) external onlyAdmin {
        officers[_officer] = false;
    }

    // ========== STRUCT ==========
    struct Identity {
        uint256 bid;
        bytes32 dataHash;     // hash of user data
        bool exists;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // user wallet => identity
    mapping(address => Identity) public identities;

    // bid counter
    uint256 private bidCounter = 1;

    // ========== EVENTS ==========
    event IdentityCreated(address indexed user, uint256 bid, bytes32 dataHash);
    event IdentityUpdated(address indexed user, uint256 bid, bytes32 newHash);
    event AccessLogged(address indexed user, address indexed accessor, string purpose, uint256 timestamp);

    // ========== CORE FUNCTIONS ==========

    // Create BID (only officer after verification)
    function createIdentity(address _user, bytes32 _dataHash) external onlyOfficer {
        require(!identities[_user].exists, "Identity already exists");

        identities[_user] = Identity({
            bid: bidCounter,
            dataHash: _dataHash,
            exists: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit IdentityCreated(_user, bidCounter, _dataHash);

        bidCounter++;
    }

    // Update hash (e.g., document update)
    function updateIdentity(address _user, bytes32 _newHash) external onlyOfficer {
        require(identities[_user].exists, "Identity not found");

        identities[_user].dataHash = _newHash;
        identities[_user].updatedAt = block.timestamp;

        emit IdentityUpdated(_user, identities[_user].bid, _newHash);
    }

    // Log access (audit trail)
    function logAccess(address _user, string calldata _purpose) external {
        require(identities[_user].exists, "Identity not found");

        emit AccessLogged(_user, msg.sender, _purpose, block.timestamp);
    }

    // Verify integrity (compare hash)
    function verifyIdentity(address _user, bytes32 _hash) external view returns (bool) {
        require(identities[_user].exists, "Identity not found");

        return identities[_user].dataHash == _hash;
    }

    // Get BID
    function getBID(address _user) external view returns (uint256) {
        require(identities[_user].exists, "Identity not found");

        return identities[_user].bid;
    }
}