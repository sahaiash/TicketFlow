import Ticket from "../../models/ticket.js";

export const getTickets = async (req, res) => {
    try {
      console.log("Fetching tickets for user:", req.user);
      const user = req.user;
      let tickets = [];
      if (user.role !== "user") {
        tickets = await Ticket.find({})
          .populate("assignedTo", ["email", "_id"])
          .sort({ createdAt: -1 });
      } else {
        tickets = await Ticket.find({ createdBy: user._id })
          .populate("assignedTo", "email")
          .sort({ createdAt: -1 });
        }
      console.log("Found tickets:", tickets.length);
      console.log("Sample ticket data:", tickets[0] ? {
        id: tickets[0]._id,
        title: tickets[0].title,
        status: tickets[0].status,
        priority: tickets[0].priority,
        helpfulNotes: tickets[0].helpfulNotes ? "Present" : "Missing",
        relatedSkills: tickets[0].relatedSkills
      } : "No tickets");
      return res.status(200).json({ tickets });
    } catch (error) {
      console.error("Error fetching tickets", error.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
};