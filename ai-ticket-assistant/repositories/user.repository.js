import User from "../models/user.js";

// Data-access layer for the User model — only the queries the ticket flow needs.
// Relocated verbatim from the old ticket controllers (Phase A refactor).
export const userRepository = {
  // from getModerators.js — moderators + admins, minimal projection, sorted.
  findModerators() {
    return User.find(
      { role: { $in: ["moderator", "admin"] } },
      { email: 1, _id: 1, role: 1 }
    ).sort({ email: 1 });
  },

  // from updateTicket.js — used to validate an assignee exists / check role.
  findById(id) {
    return User.findById(id);
  },

  // from updateTicket.js — the admin used as the email "from" address.
  findFirstAdmin() {
    return User.findOne({ role: "admin" });
  },
};
