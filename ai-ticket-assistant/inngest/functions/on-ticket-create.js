import { inngest } from "../client.js";
import { NonRetriableError } from "inngest";
import { ticketRepository } from "../../repositories/ticket.repository.js";
import { userRepository } from "../../repositories/user.repository.js";
import { sendMail } from "../../utils/mailer.js";
import analyzeTicket from "../../utils/ai.js";

const VALID_PRIORITIES = ["low", "medium", "high"];

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      // fetch ticket from DB
      const ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await ticketRepository.findById(ticketId);
        if (!ticketObject) {
          throw new NonRetriableError("Ticket not found");
        }
        return ticketObject;
      });

      await step.run("update-ticket-status", async () => {
        await ticketRepository.updateFields(ticket._id, { status: "TODO" });
      });

      const aiResponse = await step.run("ai-analysis", async () => {
        console.log("Running AI analysis for ticket:", ticket.title);
        return await analyzeTicket(ticket);
      });

      const relatedSkills = await step.run("ai-processing", async () => {
        let skills = [];
        if (aiResponse) {
          console.log("AI analysis successful, updating ticket with:", aiResponse);
          // Normalise priority case ("High" -> "high") before the enum check.
          const p = aiResponse.priority?.toLowerCase();
          await ticketRepository.updateFields(ticket._id, {
            priority: VALID_PRIORITIES.includes(p) ? p : "medium",
            helpfulNotes: aiResponse.helpfulNotes,
            status: "IN_PROGRESS",
            relatedSkills: aiResponse.relatedSkills || [],
          });
          skills = aiResponse.relatedSkills || [];
        } else {
          console.log("AI analysis failed, using basic processing");
          await ticketRepository.updateFields(ticket._id, {
            priority: "medium",
            helpfulNotes: `Issue reported: ${ticket.description}. Please review and assist the user.`,
            status: "IN_PROGRESS",
            relatedSkills: ["Technical Support"],
          });
          skills = ["Technical Support"];
        }
        return skills;
      });

      const moderator = await step.run("assign-moderator", async () => {
        let user = await userRepository.findModeratorBySkills(relatedSkills);
        if (!user) {
          user = await userRepository.findFirstAdmin();
        }
        await ticketRepository.updateFields(ticket._id, {
          assignedTo: user?._id || null,
        });
        return user;
      });

      await step.run("send-email-notification", async () => {
        if (moderator) {
          const finalTicket = await ticketRepository.findById(ticket._id);

          // Admin email is used as the reply-to address on the notification.
          const adminUser = await userRepository.findFirstAdmin();
          const adminEmail = adminUser ? adminUser.email : null;

          // Business rule (moved out of the mailer): don't notify an admin
          // about a ticket the system just assigned to them.
          if (adminEmail && adminEmail === moderator.email) {
            console.log("Skipping email - ticket auto-assigned to the admin:", adminEmail);
            return;
          }

          await sendMail(
            moderator.email,
            "New Ticket Assigned - TicketFlow",
            `Hello ${moderator.email.split("@")[0]},

A new support ticket has been assigned to you:

Title: ${finalTicket.title}
Priority: ${finalTicket.priority || "Medium"}
Category: ${finalTicket.category || "General"}
Status: ${finalTicket.status}

Description:
${finalTicket.description}

${finalTicket.helpfulNotes ? `AI Analysis Notes:
${finalTicket.helpfulNotes}` : ""}

Please log into TicketFlow to review and resolve this ticket.

Best regards,
TicketFlow Admin Team`,
            adminEmail
          );
          console.log("Assignment email sent to:", moderator.email);
        }
      });

      return { success: true };
    } catch (err) {
      console.error("Error running the step", err.message);
      return { success: false };
    }
  }
);
