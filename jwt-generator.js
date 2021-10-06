const fs = require("fs");
const jwt = require("jsonwebtoken");

// read .env
require("dotenv").config();
const { JWT_ISSUER, JWT_SUBJECT, JWT_AUDIENCE } = process.env;

// must expire within 5 minutes for Salesforce
const expiresIn = 5*60;
// Salesforce only supports RS256
const algorithm = "RS256";
// issuer = client_id / consumer key of Connected App
const issuer = JWT_ISSUER;
// subject = the username of the user in Salesforce we're requesting an access token for
const subject = JWT_SUBJECT;
// audience = where is this JWT any good (https://login.salesforce.com, https://test.salesforce.com or commmunity url
const audience = JWT_AUDIENCE;
// read keys
const privateKEY = fs.readFileSync("./private_key.pem", "utf8");

/**
 * jwt-generator is initialized with the private key and can be used to generate JWT tokens for communication
 * with Salesforce's token API
 *
 * @class JwtGenerator
 */
class JwtGenerator {
  /**
   * Converts a json object to a string that represents a csv
   * @param {string} userName
   * @returns {Object} jwt for further use
   */
  generateToken(userName) {
    try {
      const additionalPayload = {};
      //Set general headers and standard payload
      const signOptions = {
        issuer,
        subject,
        audience,
        expiresIn,
        algorithm,
      };

      // add thumbprint of certificate if using with azure
      if (process.env.CERTIFICATE_THUMBPRINT) {
        signOptions.header = {
          x5t: process.env.CERTIFICATE_THUMBPRINT,
        };
      }

      return jwt.sign(additionalPayload, privateKEY, signOptions);
    } catch (e) {
      console.error("jwt generation failed: " + e.message);
    }
  }
}

module.exports = JwtGenerator;