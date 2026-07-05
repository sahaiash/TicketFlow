import { inngest } from "../../inngest/client.js";
import Ticket from "../../models/ticket.js";

export const createTicket = async (req, res) => {
  try {
    console.log("Creating ticket for user:", req.user._id);
    console.log("Request body:", req.body);
    const { title, description, category, priority } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }
    const newTicket = await Ticket.create({
      title,
      description,
      category,
      priority,
      createdBy: req.user._id.toString(),
    });
    console.log("Ticket created successfully:", newTicket._id);

    // Send Inngest event for AI processing
    try {
      console.log("Sending Inngest event for ticket:", newTicket._id);
      await inngest.send({
        name: "ticket/created",
        data: {
          ticketId: newTicket._id.toString(),
        },
      });
      console.log("Inngest event sent successfully");
    } catch (inngestError) {
      console.error("Inngest event failed (but ticket still created):", inngestError.message);
      // Don't fail the ticket creation if Inngest fails
    }

    // Direct AI processing as fallback
    try {
      console.log("🤖 Starting direct AI processing for ticket:", newTicket._id);
      const { default: analyzeTicket } = await import("../../utils/ai.js");
      
      // Run AI analysis directly
      setTimeout(async () => {
        try {
          const aiResponse = await analyzeTicket(newTicket);
          
          if (aiResponse) {
            console.log(" Direct AI analysis successful:", aiResponse);
            await Ticket.findByIdAndUpdate(newTicket._id, {
              priority: !["low", "medium", "high"].includes(aiResponse.priority)
                ? newTicket.priority || "medium"
                : aiResponse.priority,
              helpfulNotes: aiResponse.helpfulNotes,
              status: "IN_PROGRESS",
              relatedSkills: aiResponse.relatedSkills,
            });
            console.log(" Ticket updated with AI analysis");
          } else {
            console.log("⚠️ AI analysis failed, using basic processing");
            await Ticket.findByIdAndUpdate(newTicket._id, {
              helpfulNotes: `Issue: ${newTicket.description}. Category: ${newTicket.category}. Please review and assist the user.`,
              status: "IN_PROGRESS",
              relatedSkills: ["Technical Support"],
            });
          }
        } catch (aiError) {
          console.error(" Direct AI processing error:", aiError.message);
        }
      }, 2000); // Process after 2 seconds
      
    } catch (directAIError) {
      console.error(" Failed to start direct AI processing:", directAIError.message);
    }

    return res.status(201).json({
      message: "Ticket created successfully",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// export const getTickets = async (req, res) => {
//   try {
//     console.log("Fetching tickets for user:", req.user);
//     const user = req.user;
//     let tickets = [];
//     if (user.role !== "user") {
//       tickets = await Ticket.find({})
//         .populate("assignedTo", ["email", "_id"])
//         .sort({ createdAt: -1 });
//     } else {
//       tickets = await Ticket.find({ createdBy: user._id })
//         .populate("assignedTo", "email")
//         .sort({ createdAt: -1 });
//     }
//     console.log("Found tickets:", tickets.length);
//     console.log("Sample ticket data:", tickets[0] ? {
//       id: tickets[0]._id,
//       title: tickets[0].title,
//       status: tickets[0].status,
//       priority: tickets[0].priority,
//       helpfulNotes: tickets[0].helpfulNotes ? "Present" : "Missing",
//       relatedSkills: tickets[0].relatedSkills
//     } : "No tickets");
//     return res.status(200).json({ tickets });
//   } catch (error) {
//     console.error("Error fetching tickets", error.message);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// export const getTicket = async (req, res) => {
//   try {
//     const user = req.user;
//     let ticket;

//     if (user.role !== "user") {
//       ticket = await Ticket.findById(req.params.id).populate("assignedTo", [
//         "email",
//         "_id",
//       ]);
//     } else {
//       ticket = await Ticket.findOne({
//         createdBy: user._id,
//         _id: req.params.id,
//       }).populate('assignedTo', 'email').populate('createdBy', 'email');
//     }

//     if (!ticket) {
//       return res.status(404).json({ message: "Ticket not found" });
//     }
//     return res.status(200).json({ ticket });
//   } catch (error) {
//     console.error("Error fetching ticket", error.message);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// export const updateTicket = async (req, res) => {
//   try {
//     const user = req.user;
//     const ticketId = req.params.id;
//     const { status, assignedTo, priority } = req.body;
    
//     console.log("Update request from user:", user._id, "for ticket:", ticketId);
//     console.log("Update data:", { status, assignedTo, priority });
    
//     // Check permissions - only moderators and admins can update tickets
//     if (user.role === "user") {
//       return res.status(403).json({ 
//         message: "Only moderators and admins can update tickets" 
//       });
//     }
    
//     // Find the ticket
//     const ticket = await Ticket.findById(ticketId);
//     if (!ticket) {
//       return res.status(404).json({ message: "Ticket not found" });
//     }
    
//     // If trying to assign ticket to someone
//     let willNotifyAssignee = false;
//     let newAssigneeUser = null;
//     if (assignedTo !== undefined) {
//       // Import User model to validate assignment
//       const { default: User } = await import("../../models/user.js");
      
//       // Check if the assigned user exists and is a moderator or admin
//       const assignedUser = await User.findById(assignedTo);
//       if (!assignedUser) {
//         return res.status(404).json({ 
//           message: "Assigned user not found" 
//         });
//       }
      
//       if (!["moderator", "admin"].includes(assignedUser.role)) {
//         return res.status(400).json({ 
//           message: "Tickets can only be assigned to moderators or admins" 
//         });
//       }
      
//       // If current user is a moderator (not admin), check if they can assign this ticket
//       if (user.role === "moderator") {
//         // Moderator can only assign tickets that are currently assigned to them
//         if (!ticket.assignedTo || ticket.assignedTo.toString() !== user._id.toString()) {
//           return res.status(403).json({ 
//             message: "Moderators can only reassign tickets that are currently assigned to them" 
//           });
//         }
//       }

//       // Decide if we should notify (only when the assignee actually changes)
//       if (!ticket.assignedTo || ticket.assignedTo.toString() !== assignedTo) {
//         willNotifyAssignee = true;
//         newAssigneeUser = assignedUser;
//       }
//     }
    
//     // Build update object
//     const updateData = {};
//     if (status !== undefined) updateData.status = status;
//     if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
//     if (priority !== undefined) updateData.priority = priority;
    
//     // Update the ticket
//     const updatedTicket = await Ticket.findByIdAndUpdate(
//       ticketId,
//       updateData,
//       { new: true, runValidators: true }
//     ).populate("assignedTo", ["email", "_id"]).populate("createdBy", ["email", "_id"]);
    
//     console.log("Ticket updated successfully:", ticketId);

//     // If reassigned, send an email notification to the new assignee
//     try {
//       if (willNotifyAssignee && newAssigneeUser?.email) {
//         const { default: User } = await import("../../models/user.js");
//         const { sendMail } = await import("../../utils/mailer.js");
//         const adminUser = await User.findOne({ role: "admin" });
//         const adminEmail = adminUser ? adminUser.email : undefined;

//         await sendMail(
//           newAssigneeUser.email,
//           "New Ticket Assigned - TicketFlow",
//           `Hello ${newAssigneeUser.email.split('@')[0]},\n\nA ticket has been assigned to you.\n\nTitle: ${updatedTicket.title}\nPriority: ${updatedTicket.priority || 'Medium'}\nStatus: ${updatedTicket.status}\n\nDescription:\n${updatedTicket.description}\n\nPlease log into TicketFlow to review and take action.\n`,
//           adminEmail
//         );
//         console.log(" Manual assignment email sent to:", newAssigneeUser.email);
//       }
//     } catch (notifyErr) {
//       console.error("⚠️ Failed to send manual assignment email:", notifyErr.message);
//       // Do not fail the API response due to email issues
//     }
    
//     return res.status(200).json({ 
//       message: "Ticket updated successfully",
//       ticket: updatedTicket
//     });
    
//   } catch (error) {
//     console.error("Error updating ticket:", error.message);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// export const deleteTicket = async (req, res) => {
//   try {
//     const user = req.user;
//     const ticketId = req.params.id;
    
//     console.log("Delete request from user:", user._id, "for ticket:", ticketId);
    
//     let ticket;
    
//     // Check permissions - admin can delete any ticket, users can only delete their own
//     if (user.role === "admin") {
//       ticket = await Ticket.findById(ticketId);
//     } else {
//       // Regular users can only delete tickets they created
//       ticket = await Ticket.findOne({
//         _id: ticketId,
//         createdBy: user._id
//       });
//     }

//     if (!ticket) {
//       return res.status(404).json({ 
//         message: user.role === "admin" 
//           ? "Ticket not found" 
//           : "Ticket not found or you don't have permission to delete it" 
//       });
//     }

//     // Delete the ticket
//     await Ticket.findByIdAndDelete(ticketId);
    
//     console.log("Ticket deleted successfully:", ticketId);
    
//     return res.status(200).json({ 
//       message: "Ticket deleted successfully",
//       deletedTicketId: ticketId
//     });
    
//   } catch (error) {
//     console.error("Error deleting ticket:", error.message);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// export const getModerators = async (req, res) => {
//   try {
//     const user = req.user;
    
//     // Check permissions - only moderators and admins can see the list of moderators
//     if (user.role === "user") {
//       return res.status(403).json({ 
//         message: "Only moderators and admins can view the list of moderators" 
//       });
//     }
    
//     // Import User model
//     const { default: User } = await import("../../models/user.js");
    
//     // Get all moderators and admins
//     const moderators = await User.find(
//       { role: { $in: ["moderator", "admin"] } },
//       { email: 1, _id: 1, role: 1 }
//     ).sort({ email: 1 });
    
//     console.log("Found moderators:", moderators.length);
    
//     return res.status(200).json({ 
//       moderators 
//     });
    
//   } catch (error) {
//     console.error("Error fetching moderators:", error.message);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };