export interface AdminSessionUser {
  id?: string | number;
  name: string;
  email: string;
  mobile?: string;
  role?: string;
}

const DEFAULT_EMAIL = "admin@svasthya.com";

function toTitleCaseFromEmail(email: string): string {
  const local = email.split("@")[0] || "admin";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Admin";
}

export function getAdminUserFromStorage(): AdminSessionUser {
  try {
    const raw = localStorage.getItem("adminUser");
    if (raw) {
      const parsed = JSON.parse(raw);
      const email = String(parsed?.email || "").trim();
      const name = String(parsed?.name || "").trim();
      return {
        id: parsed?.id,
        name: name || (email ? toTitleCaseFromEmail(email) : "Admin"),
        email: email || DEFAULT_EMAIL,
        mobile: parsed?.mobile ? String(parsed.mobile) : "",
        role: parsed?.role ? String(parsed.role) : "Administrator",
      };
    }
  } catch {
    // Ignore malformed JSON and fall back to defaults.
  }

  return {
    name: "Admin",
    email: DEFAULT_EMAIL,
    mobile: "",
    role: "Administrator",
  };
}

export function buildAdminUserFromCredentials(email: string): AdminSessionUser {
  const safeEmail = String(email || "").trim() || DEFAULT_EMAIL;
  return {
    name: toTitleCaseFromEmail(safeEmail),
    email: safeEmail,
    mobile: "",
    role: "Administrator",
  };
}

export function clearAdminSession() {
  localStorage.removeItem("adminAuthenticated");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
}
