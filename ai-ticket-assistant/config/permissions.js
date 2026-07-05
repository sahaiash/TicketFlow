// Role -> capabilities. Single source of truth for role-level access.
// Ownership/scope checks (e.g. "is this ticket assigned to me") live in the
// service layer; this map only answers "can this ROLE do X at all".
export const PERMISSIONS = {
  user: ["ticket:create"],
  moderator: [
    "ticket:create",
    "ticket:update",
    "ticket:read:all",
    "user:list-assignable",
  ],
  admin: [
    "ticket:create",
    "ticket:update",
    "ticket:read:all",
    "user:list-assignable",
    "user:manage",
  ],
};

export const can = (role, permission) =>
  PERMISSIONS[role]?.includes(permission) ?? false;
