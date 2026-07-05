import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { deleteTicket } from "../controllers/tickets/deleteTicket.js";
import { getModerators } from "../controllers/tickets/getModerators.js";
import { createTicket } from "../controllers/tickets/createTicket.js";
import { updateTicket } from "../controllers/tickets/updateTicket.js";
import { getTickets } from "../controllers/tickets/getTicket.js";

const router = express.Router();

router.get("/", authenticate, getTickets);
router.get("/moderators", authenticate, getModerators);
router.get("/:id", authenticate, getTickets);
router.post("/", authenticate, createTicket);
router.put("/:id", authenticate, updateTicket);
router.delete("/:id", authenticate, deleteTicket);

export default router;