import { ticketService } from "../../services/ticket.service.js";
import { handleError } from "../../utils/appError.js";

export const updateTicket = async (req, res) => {
  try {
    const ticket = await ticketService.updateTicket({
      ticketId: req.params.id,
      userId: req.user._id,
      role: req.user.role,
      body: req.body,
    });
    return res.status(200).json({
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    return handleError(res, error, "Error updating ticket");
  }
};
