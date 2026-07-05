import { prisma } from "../config/prisma.js";

// Data-access layer for the User model (PostgreSQL via Prisma).
// Adapter mappers translate Postgres `id` -> legacy `_id`. Email is normalised
// to lowercase so uniqueness is effectively case-insensitive.

const norm = (email) => (email ?? "").toLowerCase().trim();

// public shape (never includes password)
const toPublic = (u) =>
  u && {
    _id: u.id,
    email: u.email,
    role: u.role,
    skills: u.skills,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };

// includes password - only for auth (login) comparison
const toWithPassword = (u) => u && { ...toPublic(u), password: u.password };

export const userRepository = {
  // --- ticket flow ---

  // moderators + admins, minimal fields, sorted by email
  async findModerators() {
    const rows = await prisma.user.findMany({
      where: { role: { in: ["moderator", "admin"] } },
      select: { id: true, email: true, role: true },
      orderBy: { email: "asc" },
    });
    return rows.map((u) => ({ _id: u.id, email: u.email, role: u.role }));
  },

  // a moderator whose skills overlap the ticket's related skills (replaces the
  // old fragile regex join with a native array overlap)
  async findModeratorBySkills(skills) {
    if (!skills?.length) return null;
    const u = await prisma.user.findFirst({
      where: { role: "moderator", skills: { hasSome: skills } },
    });
    return toPublic(u);
  },

  // used to validate an assignee and to resolve the current user's role (auth)
  async findById(id) {
    const u = await prisma.user.findUnique({ where: { id } });
    return toPublic(u);
  },

  // the admin used as the email "from" address / assignment fallback
  async findFirstAdmin() {
    const u = await prisma.user.findFirst({ where: { role: "admin" } });
    return toPublic(u);
  },

  // --- user/auth feature ---

  async create({ email, password, skills = [] }) {
    const u = await prisma.user.create({
      data: { email: norm(email), password, skills },
    });
    return toPublic(u); // no password leaked back to the client
  },

  // full doc incl. password - for login comparison only
  async findByEmail(email) {
    const u = await prisma.user.findUnique({ where: { email: norm(email) } });
    return toWithPassword(u);
  },

  async updateByEmail(email, patch) {
    await prisma.user.update({ where: { email: norm(email) }, data: patch });
  },

  async findAllPublic() {
    const rows = await prisma.user.findMany();
    return rows.map(toPublic);
  },

  async findAssignable() {
    const rows = await prisma.user.findMany({
      where: { role: { in: ["moderator", "admin"] } },
      select: { id: true, email: true, role: true, skills: true },
    });
    return rows.map((u) => ({
      _id: u.id,
      email: u.email,
      role: u.role,
      skills: u.skills,
    }));
  },

  async findByIdPublic(id) {
    const u = await prisma.user.findUnique({ where: { id } });
    return toPublic(u);
  },
};
