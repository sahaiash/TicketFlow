import Ticket from "../models/ticket.js";

// Data-access layer for the Ticket model.
// The ONLY place that runs Mongoose queries for tickets. No business rules,
// no req/res. Methods below are relocated verbatim from the old controllers
// so behaviour stays identical (Phase A refactor).
export const ticketRepository = {
  // from createTicket.js
  create(data) {
    return Ticket.create(data);
  },

  // from getTicket.js - preserves the moderator/admin vs user branch AND the
  // different populate shapes each branch used.
  findForList({ role, userId }) {
    if (role !== "user") {
      return Ticket.find({})
        .populate("assignedTo", ["email", "_id"])
        .sort({ createdAt: -1 });
    }
    return Ticket.find({ createdBy: userId })
      .populate("assignedTo", "email")
      .sort({ createdAt: -1 });
  },

  // from updateTicket.js
  findById(id) {
    return Ticket.findById(id);
  },

  // from deleteTicket.js - a user may only find a ticket they created.
  findOwnedById(id, userId) {
    return Ticket.findOne({ _id: id, createdBy: userId });
  },

  // from updateTicket.js - returns the updated doc, populated as before.
  updateById(id, patch) {
    return Ticket.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    })
      .populate("assignedTo", ["email", "_id"])
      .populate("createdBy", ["email", "_id"]);
  },

  // from deleteTicket.js
  deleteById(id) {
    return Ticket.findByIdAndDelete(id);
  },
};
