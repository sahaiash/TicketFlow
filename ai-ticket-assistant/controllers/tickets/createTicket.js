import { ticketService } from "../../services/ticket.service.js";
import { handleError } from "../../utils/appError.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    const ticket = await ticketService.createTicket({
      title,
      description,
      category,
      priority,
      userId: req.user._id,
    });
    return res.status(201).json({
      message: "Ticket created successfully",
      ticket,
    });
  } catch (error) {
    return handleError(res, error, "Error creating ticket");
  }
};
