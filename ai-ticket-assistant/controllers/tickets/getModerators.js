import { ticketService } from "../../services/ticket.service.js";
import { handleError } from "../../utils/appError.js";

export const getModerators = async (req, res) => {
  try {
    const moderators = await ticketService.listModerators({
      role: req.user.role,
    });
    return res.status(200).json({ moderators });
  } catch (error) {
    return handleError(res, error, "Error fetching moderators");
  }
};
