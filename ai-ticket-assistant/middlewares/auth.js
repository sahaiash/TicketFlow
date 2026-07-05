import jwt from "jsonwebtoken";
import { userRepository } from "../repositories/user.repository.js";

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access Denied. No token found." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Resolve the CURRENT role from the database rather than trusting the role
    // baked into the (up to 24h old) token. This makes role promotions and
    // demotions take effect immediately and rejects tokens for deleted users.
    const user = await userRepository.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    req.user = { _id: user._id, role: user.role, email: user.email };
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
