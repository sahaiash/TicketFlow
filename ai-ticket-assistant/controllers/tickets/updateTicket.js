import Ticket from "../../models/ticket.js";

export const updateTicket = async (req, res) => {
    try {
      const user = req.user;
      const ticketId = req.params.id;
      const { status, assignedTo, priority } = req.body;
      
      console.log("Update request from user:", user._id, "for ticket:", ticketId);
      console.log("Update data:", { status, assignedTo, priority });
      
      // Check permissions - only moderators and admins can update tickets
      if (user.role === "user") {
        return res.status(403).json({ 
          message: "Only moderators and admins can update tickets" 
        });
      }
      
      // Find the ticket
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // If trying to assign ticket to someone
      let willNotifyAssignee = false;
      let newAssigneeUser = null;
      if (assignedTo !== undefined) {
        // Import User model to validate assignment
        const { default: User } = await import("../../models/user.js");
        
        // Check if the assigned user exists and is a moderator or admin
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser) {
          return res.status(404).json({ 
            message: "Assigned user not found" 
          });
        }
        
        if (!["moderator", "admin"].includes(assignedUser.role)) {
          return res.status(400).json({ 
            message: "Tickets can only be assigned to moderators or admins" 
          });
        }
        
        // If current user is a moderator (not admin), check if they can assign this ticket
        if (user.role === "moderator") {
          // Moderator can only assign tickets that are currently assigned to them
          if (!ticket.assignedTo || ticket.assignedTo.toString() !== user._id.toString()) {
            return res.status(403).json({ 
              message: "Moderators can only reassign tickets that are currently assigned to them" 
            });
          }
        }
  
        // Decide if we should notify (only when the assignee actually changes)
        if (!ticket.assignedTo || ticket.assignedTo.toString() !== assignedTo) {
          willNotifyAssignee = true;
          newAssigneeUser = assignedUser;
        }
      }
      
      // Build update object
      const updateData = {};
      if (status !== undefined) updateData.status = status;
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
      if (priority !== undefined) updateData.priority = priority;
      
      // Update the ticket
      const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId,
        updateData,
        { new: true, runValidators: true }
      ).populate("assignedTo", ["email", "_id"]).populate("createdBy", ["email", "_id"]);
      
      console.log("Ticket updated successfully:", ticketId);
  
      // If reassigned, send an email notification to the new assignee
      try {
        if (willNotifyAssignee && newAssigneeUser?.email) {
          const { default: User } = await import("../../models/user.js");
          const { sendMail } = await import("../../utils/mailer.js");
          const adminUser = await User.findOne({ role: "admin" });
          const adminEmail = adminUser ? adminUser.email : undefined;
  
          await sendMail(
            newAssigneeUser.email,
            "New Ticket Assigned - TicketFlow",
            `Hello ${newAssigneeUser.email.split('@')[0]},\n\nA ticket has been assigned to you.\n\nTitle: ${updatedTicket.title}\nPriority: ${updatedTicket.priority || 'Medium'}\nStatus: ${updatedTicket.status}\n\nDescription:\n${updatedTicket.description}\n\nPlease log into TicketFlow to review and take action.\n`,
            adminEmail
          );
          console.log(" Manual assignment email sent to:", newAssigneeUser.email);
        }
      } catch (notifyErr) {
        console.error("⚠️ Failed to send manual assignment email:", notifyErr.message);
        // Do not fail the API response due to email issues
      }
      
      return res.status(200).json({ 
        message: "Ticket updated successfully",
        ticket: updatedTicket
      });
      
    } catch (error) {
      console.error("Error updating ticket:", error.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };