import { can } from "../config/permissions.js";

// Route-level RBAC guard. Use after `authenticate` so req.user.role is set
// (and, since authenticate resolves the role from the DB, always current).
export const authorize = (permission) => (req, res, next) => {
  if (!can(req.user?.role, permission)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};
