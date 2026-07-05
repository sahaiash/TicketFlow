import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { sendMail } from "../utils/mailer.js";

export const signup = async (req, res) => {
  const { email, password, skills = [] } = req.body;
  try {
    console.log("Signup attempt:", { email, password: "***", skills });
    
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, skills });
    console.log("User created:", user.email);

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } // Token expires in 24 hours
    );
    console.log("Token created successfully");

    // Send welcome email directly from controller (no Inngest)
    try {
      const adminUser = await User.findOne({ role: "admin" });
      const adminEmail = adminUser ? adminUser.email : null;
      const subject = `Welcome to TicketFlow - Your Account is Ready!`;
      const message = `Hello ${email.split('@')[0]},\n\nWelcome to TicketFlow! Your account has been successfully created.\n\nYou can now:\n• Create support tickets for IT issues\n• Track the status of your requests\n• Receive updates on ticket progress\n• Access our AI-powered support system\n\nGetting Started:\n1. Log into TicketFlow\n2. Create your first support ticket\n3. Track your ticket progress in the dashboard\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nTicketFlow Admin Team`;
      await sendMail(email, subject, message, adminEmail);
      console.log(" Welcome email sent from admin:", adminEmail);
    } catch (emailError) {
      console.error(" Direct welcome email failed:", emailError.message);
    }

    res.json({ user, token });
  } catch (error) {
    console.error("Signup error:", error);
    
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(400).json({ 
        error: "Email already exists", 
        message: "An account with this email already exists. Please use a different email or try logging in." 
      });
    }
    
    res.status(500).json({ error: "Signup failed", details: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } // Token expires in 24 hours
    );

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: "Login failed", details: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ error: "Unauthorized" });
    });
    res.json({ message: "Logout successfully" });
  } catch (error) {
    res.status(500).json({ error: "Logout failed", details: error.message });
  }
};

export const updateUser = async (req, res) => {
  const { skills = [], role, email } = req.body;
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User not found" });

    await User.updateOne(
      { email },
      { skills: skills.length ? skills : user.skills, role }
    );
    return res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Update failed", details: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const users = await User.find().select("-password");
    return res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Update failed", details: error.message });
  }
};

export const getAssignableUsers = async (req, res) => {
  try {
    // Only moderators and admins can assign tickets
    if (req.user.role === "user") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get users who can be assigned tickets (moderators and admins)
    const users = await User.find({ 
      role: { $in: ["moderator", "admin"] } 
    }).select("_id email role skills");
    
    return res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignable users", details: error.message });
  }
};

// Get current authenticated user info (with fresh role from database)
export const getCurrentUser = async (req, res) => {
  try {
    // req.user is already populated by authenticate middleware with current role from DB
    const user = await User.findById(req.user._id).select("-password");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Return fresh user data (role will be current from database)
    return res.json({
      user: {
        _id: user._id,
        email: user.email,
        role: user.role, // Current role from database
        skills: user.skills,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user info", details: error.message });
  }
};