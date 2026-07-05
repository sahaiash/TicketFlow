import User from "../models/user.js";

// Data-access layer for the User model - only the queries the ticket flow needs.
// Relocated verbatim from the old ticket controllers (Phase A refactor).
export const userRepository = {
  // from getModerators.js - moderators + admins, minimal projection, sorted.
  findModerators() {
    return User.find(
      { role: { $in: ["moderator", "admin"] } },
      { email: 1, _id: 1, role: 1 }
    ).sort({ email: 1 });
  },

  // from updateTicket.js - used to validate an assignee exists / check role.
  findById(id) {
    return User.findById(id);
  },

  // from updateTicket.js - the admin used as the email "from" address.
  findFirstAdmin() {
    return User.findOne({ role: "admin" });
  },

  // --- user/auth feature (from controllers/user.js) ---

  // from signup - create a user (password already hashed by the service).
  create(data) {
    return User.create(data);
  },

  // from login / updateUser - full doc (includes password) for auth checks.
  findByEmail(email) {
    return User.findOne({ email });
  },

  // from updateUser - partial update by email.
  updateByEmail(email, patch) {
    return User.updateOne({ email }, patch);
  },

  // from getUsers - everyone, password stripped.
  findAllPublic() {
    return User.find().select("-password");
  },

  // from getAssignableUsers - moderators + admins with a few public fields.
  findAssignable() {
    return User.find({ role: { $in: ["moderator", "admin"] } }).select(
      "_id email role skills"
    );
  },

  // from getCurrentUser - one user by id, password stripped.
  findByIdPublic(id) {
    return User.findById(id).select("-password");
  },
};
