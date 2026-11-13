export type DashboardRole = "USER" | "AUTHOR" | "ADMIN";

// Presentation data only; the shell neither authenticates nor grants access.
export type DashboardIdentity = {
  name: string | null;
  username: string;
  role: DashboardRole;
};

export type DashboardDestination = { href: string; label: string };
