import User from "../../models/user.js"

export const getModerators = async (req, res) => {
    try {
      const user = req.user;
      
      // Check permissions - only moderators and admins can see the list of moderators
      if (user.role === "user") {
        return res.status(403).json({ 
          message: "Only moderators and admins can view the list of moderators" 
        });
      }
      
 
      // Get all moderators and admins
      const moderators = await User.find(
        { role: { $in: ["moderator", "admin"] } },
        { email: 1, _id: 1, role: 1 }
      ).sort({ email: 1 });
      
      console.log("Found moderators:", moderators.length);
      
      return res.status(200).json({ 
        moderators 
      });
      
    } catch (error) {
      console.error("Error fetching moderators:", error.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };