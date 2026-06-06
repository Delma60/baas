// frontend/types/baas.ts

// ─── Project ──────────────────────────────────────────────────────────────────

export type ProjectStatus = "active" | "paused" | "deleted";
export type ProjectModule =
  | "sql"
  | "nosql"
  | "auth"
  | "storage"
  | "realtime"
  | "ai"
  | "functions";
export type ProjectColor = "orange" | "blue" | "green" | "purple";
export type ProjectIcon = "cart" | "mobile" | "article" | "chart" | "default";

export interface Project {
  id: string;
  name: string;
  organizationName: string;
  status: ProjectStatus;
  region: string;
  icon: ProjectIcon;
  color: ProjectColor;
  modules: readonly ProjectModule[];
  sqlRows: number;
  apiCalls: number;
  updatedAt: Date;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export type ActivityType = "auth" | "db" | "storage" | "key" | "ai" | "fn";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  icon: string;
  /** Supports **bold** markdown */
  message: string;
  projectName: string;
  projectId: string;
  timestamp: Date;
}

// ─── Plan ─────────────────────────────────────────────────────────────────────

export type PlanName = "free" | "starter" | "pro";

export interface Plan {
  name: PlanName;
  displayName: string;
  priceNgn: number;
  priceUsd: number;
  sqlRowsPerDb: number | null;
  nosqlDocumentsPerDb: number | null;
  storageGb: number;
  teamMembers: number;
}

// ─── Usage ────────────────────────────────────────────────────────────────────

export interface ProjectUsage {
  projectId: string;
  dbReads: number;
  dbWrites: number;
  nosqlReads: number;
  nosqlWrites: number;
  storageBytes: number;
  functionCalls: number;
  aiRequests: number;
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export type StaffRole = "super_admin" | "ops" | "billing" | "support";

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}