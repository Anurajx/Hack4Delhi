let twilioClient = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;

  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    const Twilio = require("twilio");
    twilioClient = Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log("Twilio client initialized");
  } else {
    // console.warn("Twilio missing env vars");
  }
  return twilioClient;

  // 042a19983fc638b5bcacd56f12f38bfdc14915e2
}

/**
 * Send a single SMS.
 * - Never throws; always resolves with a result object.
 * - If Twilio isn't configured, logs a warning and resolves silently.
 */
async function sendSMS(to, message) {
  const phone = String(to || "").trim();
  if (!phone) {
    return { to: phone, sent: false, reason: "Empty recipient" };
  }

  const client = getTwilioClient();
  if (!client) {
    console.warn(
      "Twilio credentials missing. Skipping SMS send.",
      `to=${phone}`
    );
    return { to: phone, sent: false, reason: "Twilio not configured" };
  }

  try {
    const from = process.env.TWILIO_PHONE_NUMBER;
    // Twilio restriction: Can't send to self
    if (phone === String(from || "").trim()) {
      console.warn("Skipping SMS send: Recipient (To) is identical to Twilio sender (From). Use a different test number.");
      return { to: phone, sent: false, reason: "Same sender/receiver" };
    }

    const sms = await client.messages.create({
      from,
      to: phone,
      body: message,
    });

    console.log("SMS sent successfully", { to: phone, sid: sms.sid });
    return { to: phone, sent: true, sid: sms.sid };
  } catch (err) {
    console.error("SMS send failed", { to: phone, error: err?.message || err });
    return {
      to: phone,
      sent: false,
      reason: err?.message || "SMS send failed",
    };
  }
}

/**
 * Sends SMS to all non-empty contact numbers.
 * emergencyContacts is expected to be an array of 2 objects:
 * [{ name, relationship, phone1, phone2 }, { ... }]
 *
 * Returns an array of results (one per attempted number).
 */
async function sendSMSToAllContacts(emergencyContacts, message) {
  const contacts = Array.isArray(emergencyContacts)
    ? emergencyContacts
    : [{}, {}];

  const c1 = contacts[0] || {};
  const c2 = contacts[1] || {};

  const phones = [c1.phone1, c1.phone2, c2.phone1, c2.phone2]
    .map((p) => (p == null ? "" : String(p).trim()))
    .filter(Boolean);

  // Fire sends sequentially (safe + easier logging).
  const results = [];
  for (const to of phones) {
    // sendSMS never throws.
    // eslint-disable-next-line no-await-in-loop
    const result = await sendSMS(to, message);
    results.push(result);
  }

  return results;
}

module.exports = { sendSMS, sendSMSToAllContacts };

