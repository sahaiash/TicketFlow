import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userRepository } from "../repositories/user.repository.js";
import { sendMail } from "../utils/mailer.js";
import { AppError } from "../utils/appError.js";

// Business-logic / orchestration layer for users & auth.
// No req/res here - methods throw AppError to signal HTTP status + body; the
// thin controllers translate that. Logic relocated verbatim from the old
// controllers/user.js (Phase A refactor) so behaviour is identical.
//
// PHASE B: signup/login currently return the full user doc (incl. password
// hash). Preserved here as-is; strip via a DTO in the bug-fix phase.

const signToken = (user) =>
  jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });

export const userService = {
  // from signup
  async signup({ email, password, skills = [] }) {
    const hashed = await bcrypt.hash(password, 10);

    let user;
    try {
      user = await userRepository.create({ email, password: hashed, skills });
    } catch (error) {
      // Duplicate email -> same 400 body the controller returned before.
      // P2002 is Prisma's unique-constraint violation (email is the only unique).
      if (error.code === "P2002") {
        throw new AppError("Email already exists", 400, {
          error: "Email already exists",
          message:
            "An account with this email already exists. Please use a different email or try logging in.",
        });
      }
      throw error; // unexpected -> controller maps to its 500 shape
    }

    const token = signToken(user);

    // Best-effort welcome email - fire-and-forget so signup doesn't pay the
    // SMTP round-trip. Failures are logged, never surfaced to the client.
    (async () => {
      const adminUser = await userRepository.findFirstAdmin();
      const adminEmail = adminUser ? adminUser.email : null;
      const subject = `Welcome to TicketFlow - Your Account is Ready!`;
      const message = `Hello ${email.split("@")[0]},\n\nWelcome to TicketFlow! Your account has been successfully created.\n\nYou can now:\n• Create support tickets for IT issues\n• Track the status of your requests\n• Receive updates on ticket progress\n• Access our AI-powered support system\n\nGetting Started:\n1. Log into TicketFlow\n2. Create your first support ticket\n3. Track your ticket progress in the dashboard\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nTicketFlow Admin Team`;
      await sendMail(email, subject, message, adminEmail);
      console.log("Welcome email sent (reply-to admin):", adminEmail);
    })().catch((emailError) =>
      console.error("Welcome email failed:", emailError.message)
    );

    return { user, token };
  },

  // from login
  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User not found", 401, { error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid credentials", 401, {
        error: "Invalid credentials",
      });
    }

    // Never return the password hash to the client.
    const { password: _pw, ...safeUser } = user;
    return { user: safeUser, token: signToken(user) };
  },

  // from updateUser
  async updateUser({ actorRole, email, skills = [], role }) {
    if (actorRole !== "admin") {
      throw new AppError("Forbidden", 403, { error: "Forbidden" });
    }
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User not found", 401, { error: "User not found" });
    }
    await userRepository.updateByEmail(email, {
      skills: skills.length ? skills : user.skills,
      role,
    });
  },

  // from getUsers
  getUsers({ role }) {
    if (role !== "admin") {
      throw new AppError("Forbidden", 403, { error: "Forbidden" });
    }
    return userRepository.findAllPublic();
  },

  // from getAssignableUsers
  getAssignableUsers({ role }) {
    if (role === "user") {
      throw new AppError("Forbidden", 403, { error: "Forbidden" });
    }
    return userRepository.findAssignable();
  },

  // from getCurrentUser
  async getCurrentUser({ userId }) {
    const user = await userRepository.findByIdPublic(userId);
    if (!user) {
      throw new AppError("User not found", 404, { error: "User not found" });
    }
    return user;
  },
};
