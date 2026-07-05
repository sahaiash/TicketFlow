import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  status: { type: String, default: "TODO" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  priority: String,
  deadline: Date,
  helpfulNotes: String,
  relatedSkills: [String],
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for frequently queried fields to improve query performance
ticketSchema.index({ createdBy: 1, createdAt: -1 }); // For user's ticket queries
ticketSchema.index({ status: 1, createdAt: -1 }); // For status-based filtering
ticketSchema.index({ assignedTo: 1 }); // For assignment queries
ticketSchema.index({ createdAt: -1 }); // For sorting by creation date

export default mongoose.model("Ticket", ticketSchema);
