const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
};

// Specific token for team member invitations
exports.generateInvitationToken = (email, recruiterId, teamMemberId) => {
  return jwt.sign({ email, recruiterId, teamMemberId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // 7 days for invitation
  });
};

// Generate email verification token
exports.generateEmailToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "10m" });
};
