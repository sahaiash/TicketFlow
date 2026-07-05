import jwt from "jsonwebtoken";
import { userService } from "../services/user.service.js";
import { AppError } from "../utils/appError.js";

export const signup = async (req, res) => {
  try {
    const { user, token } = await userService.signup(req.body);
    res.json({ user, token });
  } catch (error) {
    if (error instanceof AppError) return res.status(error.status).json(error.body);
    console.error("Signup error:", error);
    res.status(500).json({ error: "Signup failed", details: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { user, token } = await userService.login(req.body);
    res.json({ user, token });
  } catch (error) {
    if (error instanceof AppError) return res.status(error.status).json(error.body);
    res.status(500).json({ error: "Login failed", details: error.message });
  }
};

// Unchanged in Phase A: no DB / business logic to extract (HTTP + JWT only).
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
  try {
    const { skills = [], role, email } = req.body;
    await userService.updateUser({
      actorRole: req.user?.role,
      email,
      skills,
      role,
    });
    return res.json({ message: "User updated successfully" });
  } catch (error) {
    if (error instanceof AppError) return res.status(error.status).json(error.body);
    res.status(500).json({ error: "Update failed", details: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers({ role: req.user.role });
    return res.json(users);
  } catch (error) {
    if (error instanceof AppError) return res.status(error.status).json(error.body);
    res.status(500).json({ error: "Update failed", details: error.message });
  }
};

export const getAssignableUsers = async (req, res) => {
  try {
    const users = await userService.getAssignableUsers({ role: req.user.role });
    return res.json(users);
  } catch (error) {
    if (error instanceof AppError) return res.status(error.status).json(error.body);
    res
      .status(500)
      .json({ error: "Failed to fetch assignable users", details: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await userService.getCurrentUser({ userId: req.user._id });
    return res.json({
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        skills: user.skills,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return res.status(error.status).json(error.body);
    res.status(500).json({ error: "Failed to fetch user info", details: error.message });
  }
};
