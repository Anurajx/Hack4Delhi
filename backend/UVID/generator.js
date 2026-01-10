const crypto = require("crypto");

/**
 * ID Type prefix mapping
 */
const IDType = {
  AADHAAR: "A",
  PAN: "P",
  PASSPORT: "S",
  VOTER_ID: "V",
  DRIVING_LICENSE: "D",
};

/**
 * Generates a deterministic unique 10-digit code
 * Format: [ID_TYPE][9_DIGITS]
 *
 * @param {Object} input - Object containing ID type, ID number, DOB, and secret code
 * @param {string} input.idType - Type of ID (use IDType constants)
 * @param {string} input.idNumber - ID number (Aadhaar/PAN/Passport etc.)
 * @param {string} input.dateOfBirth - Date of birth in YYYY-MM-DD format
 * @param {string} input.secretCode - Secret code for additional security
 * @returns {string} A unique 10-character code (1 letter + 9 digits)
 */
function generateUniqueCode(input) {
  const { idType, idNumber, dateOfBirth, secretCode } = input;

  // Validate inputs
  if (!idNumber || !dateOfBirth || !secretCode) {
    throw new Error(
      "All fields are required: idNumber, dateOfBirth, and secretCode"
    );
  }

  if (!idType || !Object.values(IDType).includes(idType)) {
    throw new Error("Invalid ID type. Use IDType constants.");
  }

  // Normalize inputs (remove spaces, convert to uppercase)
  const normalizedIdNumber = idNumber.replace(/\s+/g, "").toUpperCase();
  const normalizedDOB = dateOfBirth.replace(/\s+/g, "");
  const normalizedSecret = secretCode.trim();

  // Create a deterministic string by combining all inputs
  const combinedString = `${normalizedIdNumber}|${normalizedDOB}|${normalizedSecret}`;

  // Generate SHA-256 hash (deterministic)
  const hash = crypto.createHash("sha256").update(combinedString).digest("hex");

  // Convert hash to a numeric string
  // Take portions of the hex hash and convert to decimal
  let numericString = "";

  for (let i = 0; i < hash.length && numericString.length < 9; i += 2) {
    const hexPair = hash.substr(i, 2);
    const decimalValue = parseInt(hexPair, 16);
    numericString += decimalValue.toString();
  }

  // Take exactly 9 digits
  const nineDigits = numericString.substr(0, 9);

  // Combine ID type prefix with 9 digits
  return `${idType}${nineDigits}`;
}

/**
 * Validates if the generated code format is correct
 * @param {string} code - The code to validate
 * @returns {boolean} True if valid format
 */
function validateCodeFormat(code) {
  const pattern = /^[A-Z]\d{9}$/;
  return pattern.test(code);
}

/**
 * Extracts ID type from a generated code
 * @param {string} code - The generated code
 * @returns {string} The ID type character
 */
function getIDTypeFromCode(code) {
  if (!validateCodeFormat(code)) {
    throw new Error("Invalid code format");
  }
  return code.charAt(0);
}

/**
 * Batch generate codes for multiple users
 * @param {Array} users - Array of user objects with idType, idNumber, dateOfBirth, secretCode
 * @returns {Array} Array of generated codes
 */
function batchGenerateCodes(users) {
  return users.map((user) => {
    try {
      return {
        input: user,
        code: generateUniqueCode(user),
        success: true,
      };
    } catch (error) {
      return {
        input: user,
        error: error.message,
        success: false,
      };
    }
  });
}

// Export functions for use in other modules
module.exports = {
  generateUniqueCode,
  validateCodeFormat,
  getIDTypeFromCode,
  batchGenerateCodes,
  IDType,
};

// Example usage (only runs if file is executed directly)
if (require.main === module) {
  console.log("=== Unique Code Generator ===\n");

  // Example 1: Aadhaar Card
  const aadhaarInput = {
    idType: IDType.AADHAAR,
    idNumber: "1234 5678 9012",
    dateOfBirth: "1990-05-15",
    secretCode: "mySecret123",
  };

  const aadhaarCode = generateUniqueCode(aadhaarInput);
  console.log("Aadhaar Code:", aadhaarCode);
  console.log("Valid Format:", validateCodeFormat(aadhaarCode));
  console.log("ID Type:", getIDTypeFromCode(aadhaarCode));
  console.log("");

  // Example 2: PAN Card
  const panInput = {
    idType: IDType.PAN,
    idNumber: "ABCDE1234F",
    dateOfBirth: "1985-12-20",
    secretCode: "panSecret456",
  };

  const panCode = generateUniqueCode(panInput);
  console.log("PAN Code:", panCode);
  console.log("Valid Format:", validateCodeFormat(panCode));
  console.log("");

  // Example 3: Passport
  const passportInput = {
    idType: IDType.PASSPORT,
    idNumber: "Z1234567",
    dateOfBirth: "1992-03-10",
    secretCode: "passport789",
  };

  const passportCode = generateUniqueCode(passportInput);
  console.log("Passport Code:", passportCode);
  console.log("Valid Format:", validateCodeFormat(passportCode));
  console.log("");

  // Demonstration: Same inputs always generate same code
  console.log("=== Consistency Test ===");
  const code1 = generateUniqueCode(aadhaarInput);
  const code2 = generateUniqueCode(aadhaarInput);
  const code3 = generateUniqueCode(aadhaarInput);
  console.log("Attempt 1:", code1);
  console.log("Attempt 2:", code2);
  console.log("Attempt 3:", code3);
  console.log("All codes identical:", code1 === code2 && code2 === code3);
  console.log("");

  // Demonstration: Different inputs generate different codes
  console.log("=== Uniqueness Test ===");
  const slightlyDifferentInput = {
    idType: IDType.AADHAAR,
    idNumber: "1234 5678 9012",
    dateOfBirth: "1990-05-15",
    secretCode: "mySecret124", // Changed last digit
  };

  const differentCode = generateUniqueCode(slightlyDifferentInput);
  console.log("Original Code:", aadhaarCode);
  console.log("Different Code:", differentCode);
  console.log("Codes are different:", aadhaarCode !== differentCode);
  console.log("");

  // Batch processing example
  console.log("=== Batch Processing ===");
  const batchUsers = [
    {
      idType: IDType.AADHAAR,
      idNumber: "1111 2222 3333",
      dateOfBirth: "1988-01-01",
      secretCode: "secret1",
    },
    {
      idType: IDType.PAN,
      idNumber: "AAAAA1111A",
      dateOfBirth: "1990-06-15",
      secretCode: "secret2",
    },
    {
      idType: IDType.PASSPORT,
      idNumber: "P9876543",
      dateOfBirth: "1995-12-25",
      secretCode: "secret3",
    },
  ];

  const batchResults = batchGenerateCodes(batchUsers);
  batchResults.forEach((result, index) => {
    console.log(
      `User ${index + 1}:`,
      result.success ? result.code : result.error
    );
  });
}
