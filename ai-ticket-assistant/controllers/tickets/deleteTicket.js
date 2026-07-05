import { ticketService } from "../../services/ticket.service.js";
import { handleError } from "../../utils/appError.js";

export const deleteTicket = async (req, res) => {
  try {
    const deletedTicketId = await ticketService.deleteTicket({
      ticketId: req.params.id,
      userId: req.user._id,
      role: req.user.role,
    });
    return res.status(200).json({
      message: "Ticket deleted successfully",
      deletedTicketId,
    });
  } catch (error) {
    return handleError(res, error, "Error deleting ticket");
  }
};
