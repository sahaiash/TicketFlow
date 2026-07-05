
import { createAgent, gemini } from "@inngest/agent-kit";

const analyzeTicket = async (ticket) => {
  try {
    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.log(" No Gemini API key found");
      return null;
    }

    console.log(" Starting AI analysis for ticket:", ticket.title);
    console.log(" Using API key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
    
    const supportAgent = createAgent({
      model: gemini({
        model: "gemini-1.5-flash",
        apiKey: process.env.GEMINI_API_KEY,
      }),
      name: "AI Ticket Triage Assistant",
      system: `You are an expert AI assistant that processes technical support tickets. 

Your job is to:
1. Summarize the issue.
2. Estimate its priority.
3. Provide helpful notes and resource links for human moderators.
4. List relevant technical skills required.

IMPORTANT:
- Respond with *only* valid raw JSON.
- Do NOT include markdown, code fences, comments, or any extra formatting.
- The format must be a raw JSON object.`,
    });

    console.log(" Running AI agent...");
    const response = await supportAgent.run(`Analyze this support ticket and return only a JSON object:

Title: ${ticket.title}
Description: ${ticket.description}

Return JSON in this exact format:
{
  "summary": "Brief summary of the issue",
  "priority": "low",
  "helpfulNotes": "Technical guidance for resolution",
  "relatedSkills": ["skill1", "skill2"]
}`);

    const raw = response.output[0].context;
    console.log("🔍Raw AI response:", raw.substring(0, 300) + "...");

    try {
      // Try multiple parsing approaches
      let jsonString = raw.trim();
      
      // Remove any markdown formatting
      const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1];
      }
      
      // Find JSON object
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      const result = JSON.parse(jsonString);
      console.log(" AI analysis successful:", result);
      return result;
    } catch (parseError) {
      console.log(" Failed to parse JSON from AI response:", parseError.message);
      console.log("Raw response:", raw);
      throw parseError;
    }
  } catch (error) {
    console.error(" AI Analysis Error:", error.message);
    
    // Return a fallback analysis
    console.log(" Using fallback analysis");
    return {
      summary: `User reported: ${ticket.title}`,
      priority: "medium",
      helpfulNotes: `Issue: ${ticket.description}. Please investigate and provide assistance to the user.`,
      relatedSkills: ["Technical Support", "Troubleshooting"]
    };
  }
};

export default analyzeTicket;
