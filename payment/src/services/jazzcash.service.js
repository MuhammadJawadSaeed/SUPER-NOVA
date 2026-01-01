const crypto = require("crypto");

const MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID;
const PASSWORD = process.env.JAZZCASH_PASSWORD;
const INTEGRITY_SALT = process.env.JAZZCASH_INTEGRITY_SALT;
const RETURN_URL = process.env.JAZZCASH_RETURN_URL;
const API_URL = process.env.JAZZCASH_API_URL;

function generateTransactionId() {
  return "T" + Date.now();
}

function generateHash(data) {
  const sortedKeys = Object.keys(data).sort();
  let hashString = INTEGRITY_SALT + "&";

  sortedKeys.forEach((key) => {
    if (data[key] !== "" && data[key] !== undefined) {
      hashString += data[key] + "&";
    }
  });

  hashString = hashString.slice(0, -1);
  return crypto
    .createHmac("sha256", INTEGRITY_SALT)
    .update(hashString)
    .digest("hex");
}

function createPaymentRequest(orderId, amount, email, phone) {
  const transactionId = generateTransactionId();
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 1);

  const formattedDate = expiryDate
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z/, "");

  const params = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: MERCHANT_ID,
    pp_SubMerchantID: "",
    pp_Password: PASSWORD,
    pp_TxnRefNo: transactionId,
    pp_Amount: Math.round(amount * 100).toString(), // Convert to paisa
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: formattedDate,
    pp_BillReference: orderId,
    pp_Description: `Payment for order ${orderId}`,
    pp_TxnExpiryDateTime: formattedDate,
    pp_ReturnURL: RETURN_URL,
    pp_SecureHash: "",
    ppmpf_1: email || "",
    ppmpf_2: phone || "",
    ppmpf_3: "",
    ppmpf_4: "",
    ppmpf_5: "",
  };

  params.pp_SecureHash = generateHash(params);

  return {
    params,
    transactionId,
    transactionUrl: API_URL,
  };
}

function verifyCallback(callbackData) {
  const receivedHash = callbackData.pp_SecureHash;
  const dataToHash = { ...callbackData };
  delete dataToHash.pp_SecureHash;

  const calculatedHash = generateHash(dataToHash);
  return receivedHash === calculatedHash;
}

function parsePaymentStatus(responseCode) {
  const successCodes = ["000", "121", "200"];
  const pendingCodes = ["124", "125"];

  if (successCodes.includes(responseCode)) {
    return "COMPLETE";
  } else if (pendingCodes.includes(responseCode)) {
    return "PENDING";
  } else {
    return "FAILED";
  }
}

module.exports = {
  createPaymentRequest,
  verifyCallback,
  parsePaymentStatus,
  generateTransactionId,
};
