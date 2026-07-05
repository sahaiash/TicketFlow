import express from "express";
import {
  getUsers,
  login,
  signup,
  updateUser,
  logout,
  getAssignableUsers,
  getCurrentUser,
} from "../controllers/user.js";

import { authenticate } from "../middlewares/auth.js";
const router = express.Router();

router.post("/update-user", authenticate, updateUser);
router.get("/users", authenticate, getUsers);
router.get("/assignable-users", authenticate, getAssignableUsers);
router.get("/me", authenticate, getCurrentUser); // Get current user info

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;