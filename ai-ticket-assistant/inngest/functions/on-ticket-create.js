import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import analyzeTicket from "../../utils/ai.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      //fetch ticket from DB
      const ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await Ticket.findById(ticketId);
        if (!ticketObject) {
          throw new NonRetriableError("Ticket not found");
        }
        return ticketObject;
      });

      await step.run("update-ticket-status", async () => {
        await Ticket.findByIdAndUpdate(ticket._id, { status: "TODO" });
      });

      const aiResponse = await step.run("ai-analysis", async () => {
        console.log("🤖 Running AI analysis for ticket:", ticket.title);
        return await analyzeTicket(ticket);
      });

      const relatedSkills = await step.run("ai-processing", async () => {
        let skills = [];
        if (aiResponse) {
          console.log(" AI analysis successful, updating ticket with:", aiResponse);
          await Ticket.findByIdAndUpdate(ticket._id, {
            priority: !["low", "medium", "high"].includes(aiResponse.priority)
              ? "medium"
              : aiResponse.priority,
            helpfulNotes: aiResponse.helpfulNotes,
            status: "IN_PROGRESS",
            relatedSkills: aiResponse.relatedSkills,
          });
          skills = aiResponse.relatedSkills || [];
        } else {
          console.log("⚠️ AI analysis failed, using basic processing");
          // Basic fallback processing
          await Ticket.findByIdAndUpdate(ticket._id, {
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
        let user = await User.findOne({
          role: "moderator",
          skills: {
            $elemMatch: {
              $regex: relatedSkills.join("|"),
              $options: "i",
            },
          },
        });
        if (!user) {
          user = await User.findOne({
            role: "admin",
          });
        }
        await Ticket.findByIdAndUpdate(ticket._id, {
          assignedTo: user?._id || null,
        });
        return user;
      });

      await step.run("send-email-notification", async () => {
        if (moderator) {
          const finalTicket = await Ticket.findById(ticket._id);
          
          // Get admin email to use as sender
          const adminUser = await User.findOne({ role: "admin" });
          const adminEmail = adminUser ? adminUser.email : null;
          
          await sendMail(
            moderator.email,
            "New Ticket Assigned - TicketFlow",
            `Hello ${moderator.email.split('@')[0]},

A new support ticket has been assigned to you:

Title: ${finalTicket.title}
Priority: ${finalTicket.priority || 'Medium'}
Category: ${finalTicket.category || 'General'}
Status: ${finalTicket.status}

Description:
${finalTicket.description}

${finalTicket.helpfulNotes ? `AI Analysis Notes:
${finalTicket.helpfulNotes}` : ''}

Please log into TicketFlow to review and resolve this ticket.

Best regards,
TicketFlow Admin Team`,
            adminEmail
          );
          console.log(" Assignment email sent to:", moderator.email);
        }
      });

      return { success: true };
    } catch (err) {
      console.error(" Error running the step", err.message);
      return { success: false };
    }
  }
);