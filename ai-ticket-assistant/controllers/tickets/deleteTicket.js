import Ticket from "../../models/ticket.js";

export const deleteTicket = async (req, res) => {
    try {
      const user = req.user;
      const ticketId = req.params.id;
      
      console.log("Delete request from user:", user._id, "for ticket:", ticketId);
      
      let ticket;
      
      // Check permissions - admin can delete any ticket, users can only delete their own
      if (user.role === "admin") {
        ticket = await Ticket.findById(ticketId);
      } else {
        // Regular users can only delete tickets they created
        ticket = await Ticket.findOne({
          _id: ticketId,
          createdBy: user._id
        });
      }
  
      if (!ticket) {
        return res.status(404).json({ 
          message: user.role === "admin" 
            ? "Ticket not found" 
            : "Ticket not found or you don't have permission to delete it" 
        });
      }
  
      // Delete the ticket
      await Ticket.findByIdAndDelete(ticketId);
      
      console.log("Ticket deleted successfully:", ticketId);
      
      return res.status(200).json({ 
        message: "Ticket deleted successfully",
        deletedTicketId: ticketId
      });
      
    } catch (error) {
      console.error("Error deleting ticket:", error.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };