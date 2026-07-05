import { ticketService } from "../../services/ticket.service.js";
import { handleError } from "../../utils/appError.js";

export const getTickets = async (req, res) => {
  try {
    const tickets = await ticketService.listTickets({
      role: req.user.role,
      userId: req.user._id,
    });
    return res.status(200).json({ tickets });
  } catch (error) {
    return handleError(res, error, "Error fetching tickets");
  }
};
