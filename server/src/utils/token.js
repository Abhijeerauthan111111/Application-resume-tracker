const crypto = require("crypto");

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function hashShareToken(token, pepper) {
  if (!pepper) throw new Error("Missing SHARE_TOKEN_PEPPER");
  return sha256Hex(`${token}.${pepper}`);
}

module.exports = { generateToken, hashShareToken };

