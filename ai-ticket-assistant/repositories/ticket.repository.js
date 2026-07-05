import { prisma } from "../config/prisma.js";

// Data-access layer for the Ticket model (PostgreSQL via Prisma).
// The ONLY place that runs DB queries for tickets. It also acts as an adapter:
// Postgres uses `id` (uuid) and FK columns (createdById/assignedToId), but the
// rest of the app still speaks the legacy Mongo shape (`_id`, populated
// `assignedTo`/`createdBy` objects). The mappers below translate between them so
// services, DTOs and the frontend are untouched by the migration.

const refSelect = { select: { id: true, email: true } };

// user relation -> legacy { _id, email } (or null)
const toRef = (u) => (u ? { _id: u.id, email: u.email } : null);

// scalar fields shared by every ticket shape
const scalars = (t) => ({
  _id: t.id,
  title: t.title,
  description: t.description,
  category: t.category,
  status: t.status,
  priority: t.priority,
  helpfulNotes: t.helpfulNotes,
  relatedSkills: t.relatedSkills,
  deadline: t.deadline,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

// Populated shape for list / update responses. In the old code, list queries
// populated only `assignedTo` (createdBy stayed an id string), while update
// populated both - preserved via the populateCreatedBy flag.
const toPopulated = (t, { populateCreatedBy = false } = {}) => ({
  ...scalars(t),
  assignedTo: toRef(t.assignedTo),
  createdBy: populateCreatedBy ? toRef(t.createdBy) : t.createdById,
});

// Raw shape for service-side logic: unpopulated refs are id strings (or null),
// matching Mongo's `findById` without populate.
const toRaw = (t) => ({
  ...scalars(t),
  assignedTo: t.assignedToId ?? null,
  createdBy: t.createdById,
});

// Translate legacy input keys (createdBy/assignedTo) to Prisma FK columns and
// drop empty enum values so Postgres enums aren't handed "".
const toData = ({ createdBy, assignedTo, ...rest }) => {
  const data = { ...rest };
  if (createdBy !== undefined) data.createdById = createdBy;
  if (assignedTo !== undefined) data.assignedToId = assignedTo;
  if (data.priority === "" || data.priority == null) delete data.priority;
  if (data.status === "" || data.status == null) delete data.status;
  return data;
};

export const ticketRepository = {
  async create(data) {
    const t = await prisma.ticket.create({ data: toData(data) });
    return toRaw(t);
  },

  async findForList({ role, userId }) {
    const rows = await prisma.ticket.findMany({
      where: role !== "user" ? {} : { createdById: userId },
      include: { assignedTo: refSelect },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((t) => toPopulated(t));
  },

  async findById(id) {
    const t = await prisma.ticket.findUnique({ where: { id } });
    return t ? toRaw(t) : null;
  },

  async findOwnedById(id, userId) {
    const t = await prisma.ticket.findFirst({
      where: { id, createdById: userId },
    });
    return t ? toRaw(t) : null;
  },

  async updateById(id, patch) {
    const t = await prisma.ticket.update({
      where: { id },
      data: toData(patch),
      include: { assignedTo: refSelect, createdBy: refSelect },
    });
    return toPopulated(t, { populateCreatedBy: true });
  },

  // Lightweight update for the Inngest job (no populate needed).
  async updateFields(id, patch) {
    const t = await prisma.ticket.update({ where: { id }, data: toData(patch) });
    return toRaw(t);
  },

  async deleteById(id) {
    await prisma.ticket.delete({ where: { id } });
  },
};
