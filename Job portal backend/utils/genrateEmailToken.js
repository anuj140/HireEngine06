const jwt = require("jsonwebtoken");
require('dotenv').config()

function generateEmailToken(requestId) {
  return jwt.sign({ requestId }, process.env.JWT_SECRET, { expiresIn: "10m" });
}

module.exports = generateEmailToken;
