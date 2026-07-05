import { ticketRepository } from "../repositories/ticket.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { inngest } from "../inngest/client.js";
import { sendMail } from "../utils/mailer.js";
import { AppError } from "../utils/appError.js";

// Business-logic / orchestration layer for tickets.
// No req/res here — methods throw AppError to signal HTTP status; the thin
// controllers translate that. Logic relocated verbatim from the old
// controllers (Phase A refactor) so behaviour is identical.
export const ticketService = {
  // from getTicket.js — scoping (user vs moderator/admin) lives in the repo.
  listTickets({ role, userId }) {
    return ticketRepository.findForList({ role, userId });
  },

  // from createTicket.js
  async createTicket({ title, description, category, priority, userId }) {
    if (!title || !description) {
      throw new AppError("Title and description are required", 400);
    }

    const newTicket = await ticketRepository.create({
      title,
      description,
      category,
      priority,
      createdBy: userId.toString(),
    });
    console.log("Ticket created successfully:", newTicket._id);

    // Queue AI processing via Inngest (best-effort — ticket already created).
    try {
      await inngest.send({
        name: "ticket/created",
        data: { ticketId: newTicket._id.toString() },
      });
      console.log("Inngest event sent successfully");
    } catch (inngestError) {
      console.error(
        "Inngest event failed (but ticket still created):",
        inngestError.message
      );
    }

    // PHASE B: remove — this duplicates the Inngest job and races with it.
    // Preserved as-is for the behaviour-preserving Phase A refactor.
    try {
      const { default: analyzeTicket } = await import("../utils/ai.js");
      setTimeout(async () => {
        try {
          const aiResponse = await analyzeTicket(newTicket);
          if (aiResponse) {
            await ticketRepository.update(newTicket._id, {
              priority: !["low", "medium", "high"].includes(aiResponse.priority)
                ? newTicket.priority || "medium"
                : aiResponse.priority,
              helpfulNotes: aiResponse.helpfulNotes,
              status: "IN_PROGRESS",
              relatedSkills: aiResponse.relatedSkills,
            });
          } else {
            await ticketRepository.update(newTicket._id, {
              helpfulNotes: `Issue: ${newTicket.description}. Category: ${newTicket.category}. Please review and assist the user.`,
              status: "IN_PROGRESS",
              relatedSkills: ["Technical Support"],
            });
          }
        } catch (aiError) {
          console.error("Direct AI processing error:", aiError.message);
        }
      }, 2000);
    } catch (directAIError) {
      console.error("Failed to start direct AI processing:", directAIError.message);
    }

    return newTicket;
  },

  // from updateTicket.js
  async updateTicket({ ticketId, userId, role, body }) {
    const { status, assignedTo, priority } = body;

    // Only moderators and admins can update tickets.
    if (role === "user") {
      throw new AppError("Only moderators and admins can update tickets", 403);
    }

    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    // Assignment handling + notification decision.
    let willNotifyAssignee = false;
    let newAssigneeUser = null;
    if (assignedTo !== undefined) {
      const assignedUser = await userRepository.findById(assignedTo);
      if (!assignedUser) {
        throw new AppError("Assigned user not found", 404);
      }
      if (!["moderator", "admin"].includes(assignedUser.role)) {
        throw new AppError(
          "Tickets can only be assigned to moderators or admins",
          400
        );
      }
      // A moderator (not admin) can only reassign tickets currently theirs.
      if (role === "moderator") {
        if (
          !ticket.assignedTo ||
          ticket.assignedTo.toString() !== userId.toString()
        ) {
          throw new AppError(
            "Moderators can only reassign tickets that are currently assigned to them",
            403
          );
        }
      }
      // Notify only when the assignee actually changes.
      if (!ticket.assignedTo || ticket.assignedTo.toString() !== assignedTo) {
        willNotifyAssignee = true;
        newAssigneeUser = assignedUser;
      }
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (priority !== undefined) updateData.priority = priority;

    const updatedTicket = await ticketRepository.updateById(ticketId, updateData);
    console.log("Ticket updated successfully:", ticketId);

    // Best-effort assignment email — never fails the request.
    try {
      if (willNotifyAssignee && newAssigneeUser?.email) {
        const adminUser = await userRepository.findFirstAdmin();
        const adminEmail = adminUser ? adminUser.email : undefined;
        await sendMail(
          newAssigneeUser.email,
          "New Ticket Assigned - TicketFlow",
          `Hello ${newAssigneeUser.email.split("@")[0]},\n\nA ticket has been assigned to you.\n\nTitle: ${updatedTicket.title}\nPriority: ${updatedTicket.priority || "Medium"}\nStatus: ${updatedTicket.status}\n\nDescription:\n${updatedTicket.description}\n\nPlease log into TicketFlow to review and take action.\n`,
          adminEmail
        );
        console.log("Manual assignment email sent to:", newAssigneeUser.email);
      }
    } catch (notifyErr) {
      console.error("Failed to send manual assignment email:", notifyErr.message);
    }

    return updatedTicket;
  },

  // from deleteTicket.js
  async deleteTicket({ ticketId, userId, role }) {
    // Admin can delete any ticket; others only their own.
    const ticket =
      role === "admin"
        ? await ticketRepository.findById(ticketId)
        : await ticketRepository.findOwnedById(ticketId, userId);

    if (!ticket) {
      throw new AppError(
        role === "admin"
          ? "Ticket not found"
          : "Ticket not found or you don't have permission to delete it",
        404
      );
    }

    await ticketRepository.deleteById(ticketId);
    console.log("Ticket deleted successfully:", ticketId);
    return ticketId;
  },

  // from getModerators.js
  listModerators({ role }) {
    if (role === "user") {
      throw new AppError(
        "Only moderators and admins can view the list of moderators",
        403
      );
    }
    return userRepository.findModerators();
  },
};
