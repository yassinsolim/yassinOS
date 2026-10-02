import { MIN_HEIGHT, MIN_WIDTH } from "shell/geometry";

export const CAPABILITIES = ["frame-time", "wasm-bench"] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const ENTRY_TYPES = ["dom", "worker"] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

export type AppManifest = {
  appId: string;
  capabilities: readonly Capability[];
  entry: EntryType;
  height: number;
  icon: string;
  title: string;
  width: number;
};

export type ManifestIssue = {
  path: string;
  reason: string;
};

const APP_ID = /^[a-z][a-z0-9-]{0,31}$/;
const ICON = /^[a-z]{1,3}$/i;
const MANIFEST_KEYS = new Set([
  "appId",
  "capabilities",
  "entry",
  "height",
  "icon",
  "title",
  "width",
]);
const MAX_HEIGHT = 800;
const MAX_TITLE = 40;
const MAX_WIDTH = 1200;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCapability = (value: unknown): value is Capability =>
  typeof value === "string" &&
  (CAPABILITIES as readonly string[]).includes(value);

const isEntry = (value: unknown): value is EntryType =>
  value === "dom" || value === "worker";

const push = (issues: ManifestIssue[], path: string, reason: string): void => {
  issues.push({ path, reason });
};

export const validateManifest = (value: unknown): ManifestIssue[] => {
  if (!isRecord(value)) {
    return [{ path: "manifest", reason: "expected an object" }];
  }

  const issues: ManifestIssue[] = [];

  Object.keys(value).forEach((key) => {
    if (!MANIFEST_KEYS.has(key)) push(issues, key, "unknown field");
  });

  const { appId, capabilities, entry, height, icon, title, width } = value;

  if (typeof appId !== "string" || !APP_ID.test(appId)) {
    push(issues, "appId", "expected a short lowercase id");
  }

  if (typeof title !== "string" || !title.trim() || title.length > MAX_TITLE) {
    push(issues, "title", "expected a short title");
  }

  if (typeof icon !== "string" || !ICON.test(icon)) {
    push(issues, "icon", "expected 1 to 3 letters");
  }

  if (!isEntry(entry)) push(issues, "entry", "expected dom or worker");

  if (
    typeof width !== "number" ||
    !Number.isFinite(width) ||
    width < MIN_WIDTH ||
    width > MAX_WIDTH
  ) {
    push(issues, "width", "expected a width inside the shell limits");
  }

  if (
    typeof height !== "number" ||
    !Number.isFinite(height) ||
    height < MIN_HEIGHT ||
    height > MAX_HEIGHT
  ) {
    push(issues, "height", "expected a height inside the shell limits");
  }

  if (!Array.isArray(capabilities) || capabilities.length === 0) {
    push(issues, "capabilities", "expected at least one capability");
  } else {
    const seen = new Set<string>();

    capabilities.forEach((capability) => {
      if (!isCapability(capability)) {
        push(issues, "capabilities", "unknown capability");
      } else if (seen.has(capability)) {
        push(issues, "capabilities", "duplicate capability");
      }

      if (isCapability(capability)) seen.add(capability);
    });
  }

  return issues;
};

export const readManifest = (value: unknown): AppManifest | undefined => {
  if (!isRecord(value) || validateManifest(value).length > 0) return undefined;

  const { appId, capabilities, entry, height, icon, title, width } = value;

  if (
    typeof appId !== "string" ||
    typeof title !== "string" ||
    typeof icon !== "string" ||
    typeof width !== "number" ||
    typeof height !== "number" ||
    !isEntry(entry) ||
    !Array.isArray(capabilities)
  ) {
    return undefined;
  }

  const granted: Capability[] = [];

  capabilities.forEach((capability) => {
    if (isCapability(capability)) granted.push(capability);
  });

  return { appId, capabilities: granted, entry, height, icon, title, width };
};

export const registryIssues = (apps: readonly unknown[]): ManifestIssue[] => {
  const issues: ManifestIssue[] = [];
  const seen = new Set<string>();

  apps.forEach((app, index) => {
    validateManifest(app).forEach((issue) => {
      issues.push({
        path: `${index}.${issue.path}`,
        reason: issue.reason,
      });
    });

    if (isRecord(app) && typeof app.appId === "string") {
      if (seen.has(app.appId)) {
        issues.push({ path: `${index}.appId`, reason: "duplicate id" });
      }

      seen.add(app.appId);
    }
  });

  return issues;
};

export const FRAME_MONITOR: AppManifest = {
  appId: "frame-monitor",
  capabilities: ["frame-time"],
  entry: "dom",
  height: 280,
  icon: "Ft",
  title: "Frame time",
  width: 360,
};

export const WASM_BENCH: AppManifest = {
  appId: "wasm-bench",
  capabilities: ["wasm-bench"],
  entry: "worker",
  height: 300,
  icon: "Wp",
  title: "Wasm pace",
  width: 380,
};

export const APP_REGISTRY: readonly AppManifest[] = [FRAME_MONITOR, WASM_BENCH];

export const manifestById = (appId: string): AppManifest | undefined =>
  APP_REGISTRY.find((app) => app.appId === appId);
