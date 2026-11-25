// @effect-diagnostics nodeBuiltinImport:off - Tests the standalone bootstrap against real temporary files.
import * as NodeAssert from "node:assert/strict";
import * as NodeFS from "node:fs";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import { describe, it } from "vite-plus/test";
import { ClaudeSettings, ServerSettings } from "@t3tools/contracts";
import * as Schema from "effect/Schema";
import {
  agentStudioEnvironment,
  createAgentStudioSettings,
  initializeAgentStudio,
  readClaudeLoginProfile,
} from "./agent-studio-profile.ts";

const decodeSettings = Schema.decodeUnknownSync(ServerSettings);
const decodeClaudeSettings = Schema.decodeUnknownSync(ClaudeSettings);

describe("Agent Studio account setup", () => {
  it("separates the second Claude login and keeps native CLI homes for existing accounts", () => {
    const settings = createAgentStudioSettings(NodePath.resolve("test-home"));
    decodeSettings(settings);
    decodeClaudeSettings(settings.providerInstances.claudeSecondary.config);
    NodeAssert.equal(settings.providerInstances.claudeAgent.config.homePath, "");
    NodeAssert.equal(
      settings.providerInstances.claudeSecondary.config.homePath,
      NodePath.resolve("test-home", "accounts", "claude-secondary"),
    );
    NodeAssert.equal(settings.defaultRuntimeMode, "approval-required");
    NodeAssert.equal(
      settings.providerInstances.codex.config.launchArgs,
      "-c features.image_generation=true",
    );
  });

  it("preserves existing settings byte for byte on repeated setup", () => {
    const directory = NodeFS.mkdtempSync(NodePath.join(NodeOS.tmpdir(), "agent-studio-profile-"));
    try {
      const first = initializeAgentStudio(directory);
      NodeAssert.equal(first.created, true);
      const custom =
        '{"providerInstances":{"claudeSecondary":{"driver":"claudeAgent","config":{"homePath":"custom-account","binaryPath":"custom-claude"}}}}\n';
      NodeFS.writeFileSync(first.settingsPath, custom);
      NodeAssert.equal(initializeAgentStudio(directory).created, false);
      NodeAssert.equal(NodeFS.readFileSync(first.settingsPath, "utf8"), custom);
      NodeAssert.deepEqual(readClaudeLoginProfile(first.settingsPath, "2"), {
        homePath: "custom-account",
        binaryPath: "custom-claude",
      });
      NodeAssert.throws(() => readClaudeLoginProfile(first.settingsPath, "1"), /removed/);
    } finally {
      NodeFS.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("does not pass ambient API billing or a Claude account override to the child", () => {
    const original = {
      ANTHROPIC_API_KEY: "test-only",
      CLAUDE_CONFIG_DIR: "other-account",
      OPENAI_API_KEY: "test-only",
      PATH: "tools",
      CODEX_HOME: "native-codex",
    };
    const result = agentStudioEnvironment(original);
    NodeAssert.equal(result.ANTHROPIC_API_KEY, undefined);
    NodeAssert.equal(result.CLAUDE_CONFIG_DIR, undefined);
    NodeAssert.equal(result.OPENAI_API_KEY, undefined);
    NodeAssert.equal(result.CODEX_HOME, "native-codex");
    NodeAssert.equal(result.PATH, "tools");
    NodeAssert.equal(result.T3CODE_TELEMETRY_ENABLED, "false");
    NodeAssert.equal(result.T3CODE_DEV_SEED, "0");
    NodeAssert.equal(original.ANTHROPIC_API_KEY, "test-only");
  });
});
