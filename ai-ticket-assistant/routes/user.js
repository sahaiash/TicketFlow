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
import { authorize } from "../middlewares/authorize.js";
const router = express.Router();

router.post("/update-user", authenticate, authorize("user:manage"), updateUser);
router.get("/users", authenticate, authorize("user:manage"), getUsers);
router.get(
  "/assignable-users",
  authenticate,
  authorize("user:list-assignable"),
  getAssignableUsers
);
router.get("/me", authenticate, getCurrentUser); // Get current user info

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;