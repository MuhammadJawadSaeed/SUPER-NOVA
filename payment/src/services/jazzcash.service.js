const crypto = require("crypto-js");

class JazzCashService {
  constructor() {
    this.merchantId = process.env.JAZZCASH_MERCHANT_ID;
    this.password = process.env.JAZZCASH_PASSWORD;
    this.integritysalt = process.env.JAZZCASH_INTEGRITY_SALT;
    this.returnUrl =
      process.env.JAZZCASH_RETURN_URL ||
      "http://localhost:3004/api/payments/jazzcash/callback";
    this.transactionUrl =
      process.env.JAZZCASH_TRANSACTION_URL ||
      "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";
  }

  /**
   * Generate sorted string for hash calculation
   */
  sortAndJoinParams(params) {
    const sortedKeys = Object.keys(params).sort();
    let sortedString = "";
    sortedKeys.forEach((key) => {
      if (params[key]) {
        sortedString += "&" + params[key];
      }
    });
    return sortedString.substring(1);
  }

  /**
   * Generate secure hash for JazzCash transaction
   */
  generateHash(params) {
    const sortedString = this.sortAndJoinParams(params);
    const hashString = this.integritySort + "&" + sortedString;
    const hash = crypto.HmacSHA256(hashString, this.integritySalt);
    return hash.toString(crypto.enc.Hex);
  }

  /**
   * Create payment request parameters
   */
  createPaymentRequest(orderId, amount, customerEmail, customerMobile) {
    const timestamp = new Date().getTime().toString().substring(0, 10);
    const transactionId = `T${timestamp}${orderId}`;
    const expiryDateTime = this.getExpiryDateTime();

    const params = {
      pp_Version: "1.1",
      pp_TxnType: "MWALLET",
      pp_Language: "EN",
      pp_MerchantID: this.merchantId,
      pp_SubMerchantID: "",
      pp_Password: this.password,
      pp_BankID: "",
      pp_ProductID: "",
      pp_TxnRefNo: transactionId,
      pp_Amount: (amount * 100).toString(), // Amount in paisa (1 PKR = 100 paisa)
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: this.getCurrentDateTime(),
      pp_BillReference: orderId,
      pp_Description: `Payment for Order ${orderId}`,
      pp_TxnExpiryDateTime: expiryDateTime,
      pp_ReturnURL: this.returnUrl,
      pp_SecureHash: "",
      ppmpf_1: customerEmail || "",
      ppmpf_2: customerMobile || "",
      ppmpf_3: "",
      ppmpf_4: "",
      ppmpf_5: "",
    };

    // Generate secure hash
    params.pp_SecureHash = this.generateHash(params);

    return {
      params,
      transactionId,
      transactionUrl: this.transactionUrl,
    };
  }

  /**
   * Verify callback hash
   */
  verifyCallback(callbackParams) {
    const receivedHash = callbackParams.pp_SecureHash;
    delete callbackParams.pp_SecureHash;

    const calculatedHash = this.generateHash(callbackParams);

    return receivedHash === calculatedHash;
  }

  /**
   * Get current date time in JazzCash format (YYYYMMDDHHmmss)
   */
  getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Get expiry date time (1 hour from now)
   */
  getExpiryDateTime() {
    const expiryTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const year = expiryTime.getFullYear();
    const month = String(expiryTime.getMonth() + 1).padStart(2, "0");
    const day = String(expiryTime.getDate()).padStart(2, "0");
    const hours = String(expiryTime.getHours()).padStart(2, "0");
    const minutes = String(expiryTime.getMinutes()).padStart(2, "0");
    const seconds = String(expiryTime.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Parse payment status from response code
   */
  parsePaymentStatus(responseCode) {
    if (responseCode === "000") {
      return "COMPLETE";
    } else if (responseCode === "124") {
      return "PENDING";
    } else {
      return "FAILED";
    }
  }
}

module.exports = new JazzCashService();
