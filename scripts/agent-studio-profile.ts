// @effect-diagnostics nodeBuiltinImport:off - Standalone profile bootstrap works before the app runtime is started.
import * as NodeFS from "node:fs";
import * as NodePath from "node:path";

export function createAgentStudioSettings(stateHome: string, claudeBinary = "claude") {
  return {
    defaultRuntimeMode: "approval-required",
    enableAgentDeviceAccess: false,
    providerInstances: {
      claudeAgent: {
        driver: "claudeAgent",
        displayName: "Claude · Account 1",
        accentColor: "#d97757",
        enabled: true,
        config: { binaryPath: claudeBinary, homePath: "" },
      },
      claudeSecondary: {
        driver: "claudeAgent",
        displayName: "Claude · Account 2",
        accentColor: "#8b5cf6",
        enabled: true,
        config: {
          binaryPath: claudeBinary,
          homePath: NodePath.join(stateHome, "accounts", "claude-secondary"),
        },
      },
      codex: {
        driver: "codex",
        displayName: "Codex",
        accentColor: "#10b981",
        enabled: true,
        config: { launchArgs: "-c features.image_generation=true" },
      },
    },
  };
}

export function initializeAgentStudio(stateHome: string, claudeBinary = "claude") {
  const settingsPath = NodePath.join(stateHome, "userdata", "settings.json");
  NodeFS.mkdirSync(NodePath.dirname(settingsPath), { recursive: true });
  NodeFS.mkdirSync(NodePath.join(stateHome, "accounts", "claude-secondary"), { recursive: true });
  try {
    // Never overwrite accounts or preferences changed in the running app.
    NodeFS.writeFileSync(
      settingsPath,
      JSON.stringify(createAgentStudioSettings(stateHome, claudeBinary), null, 2) + "\n",
      { flag: "wx", mode: 0o600 },
    );
    return { settingsPath, created: true };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") {
      return { settingsPath, created: false };
    }
    throw error;
  }
}

export function agentStudioEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const result = { ...environment };
  // These are process-local overrides: native CLI sign-ins stay with their account.
  for (const key of [
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_AUTH_TOKEN",
    "ANTHROPIC_BASE_URL",
    "CLAUDE_CODE_OAUTH_TOKEN",
    "CLAUDE_CONFIG_DIR",
    "CLAUDECODE",
    "CLAUDE_CODE_USE_BEDROCK",
    "CLAUDE_CODE_USE_VERTEX",
    "CLAUDE_CODE_USE_FOUNDRY",
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "CODEX_API_KEY",
    "VITE_HTTP_URL",
    "VITE_WS_URL",
    "T3CODE_DEV_AUTH_TOKEN",
  ])
    delete result[key];
  result.T3CODE_TELEMETRY_ENABLED = "false";
  result.T3CODE_DEV_SEED = "0";
  return result;
}

export function readClaudeLoginProfile(settingsPath: string, account: "1" | "2") {
  const settings = JSON.parse(NodeFS.readFileSync(settingsPath, "utf8")) as {
    providerInstances?: Record<
      string,
      { driver?: unknown; config?: { homePath?: unknown; binaryPath?: unknown } }
    >;
  };
  const instance =
    settings.providerInstances?.[account === "1" ? "claudeAgent" : "claudeSecondary"];
  if (instance?.driver !== "claudeAgent")
    throw new Error(
      "This Claude account was removed. Add or sign in to it through your provider settings.",
    );
  const homePath = instance.config?.homePath ?? "";
  const binaryPath = instance.config?.binaryPath ?? "claude";
  if (typeof homePath !== "string" || typeof binaryPath !== "string" || !binaryPath.trim()) {
    throw new Error("Invalid Claude account configuration. Check Settings > Providers.");
  }
  return { homePath, binaryPath };
}

export function findClaudeBinary(
  homeDirectory: string,
  platform: NodeJS.Platform,
  toolsDirectory?: string,
): string {
  const candidates =
    platform === "win32"
      ? [
          NodePath.join(homeDirectory, ".local", "bin", "claude.exe"),
          NodePath.join(
            homeDirectory,
            "AppData",
            "Local",
            "Microsoft",
            "WinGet",
            "Links",
            "claude.exe",
          ),
        ]
      : [NodePath.join(homeDirectory, ".local", "bin", "claude")];
  if (toolsDirectory && platform === "win32") {
    candidates.push(
      NodePath.join(
        toolsDirectory,
        "claude-code",
        "node_modules",
        "@anthropic-ai",
        "claude-code",
        "bin",
        "claude.exe",
      ),
    );
  }
  return candidates.find((candidate) => NodeFS.existsSync(candidate)) ?? "claude";
}
