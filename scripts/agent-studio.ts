// @effect-diagnostics nodeBuiltinImport:off - Launches the app before its Effect runtime is available.
// @effect-diagnostics globalConsole:off - Startup and login instructions go to the launcher's terminal.
/* oxlint-disable t3code/no-global-process-runtime -- Standalone launcher bootstraps before an Effect runtime exists. */
import * as NodeChildProcess from "node:child_process";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import * as NodeURL from "node:url";
import {
  agentStudioEnvironment,
  findClaudeBinary,
  initializeAgentStudio,
  readClaudeLoginProfile,
} from "./agent-studio-profile.ts";

const root = NodeURL.fileURLToPath(new URL("..", import.meta.url));
const stateHome = NodePath.resolve(root, "..", ".agent-studio");
const args = process.argv.slice(2);
const modes = ["--setup-only", "--desktop", "--login-claude-1", "--login-claude-2"];
if (args.length > 1 || args.some((arg) => !modes.includes(arg))) {
  throw new Error(`Choose one option: ${modes.join(", ")}`);
}
const claudeBinary = findClaudeBinary(
  NodeOS.homedir(),
  NodeOS.platform(),
  NodePath.resolve(root, "..", ".tools"),
);
const result = initializeAgentStudio(stateHome, claudeBinary);
console.log(`Agent Studio: ${result.created ? "created" : "kept"} local account settings.`);
console.log(
  "Claude Account 1 and Codex use their native CLI sign-ins. Connect Claude accounts using the Windows launcher menu.",
);
if (args[0]?.startsWith("--login-claude-")) {
  const account = args[0] === "--login-claude-2" ? "2" : "1";
  const profile = readClaudeLoginProfile(result.settingsPath, account);
  const environment = agentStudioEnvironment(process.env);
  if (profile.homePath) {
    environment.CLAUDE_CONFIG_DIR = profile.homePath.replace(/^~(?=[/\\]|$)/, NodeOS.homedir());
  }
  console.log(
    `Sign in with Claude Account ${args[0] === "--login-claude-2" ? "2" : "1"} in the browser.`,
  );
  const login = NodeChildProcess.spawn(
    profile.binaryPath.replace(/^~(?=[/\\]|$)/, NodeOS.homedir()),
    ["auth", "login"],
    {
      cwd: root,
      env: environment,
      stdio: "inherit",
      windowsHide: true,
    },
  );
  login.on("error", (error) => {
    console.error(`Could not start Claude login: ${error.message}`);
    process.exitCode = 1;
  });
  login.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
} else if (!args.includes("--setup-only")) {
  const child = NodeChildProcess.spawn(
    NodeOS.platform() === "win32" ? "vp.exe" : "vp",
    [
      "run",
      args.includes("--desktop") ? "dev:desktop" : "dev",
      "--home-dir",
      stateHome,
      "--no-seed",
      "--host",
      "127.0.0.1",
    ],
    { cwd: root, env: agentStudioEnvironment(process.env), stdio: "inherit", windowsHide: true },
  );
  child.on("error", (error) => {
    console.error(`Could not launch Agent Studio: ${error.message}`);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
}
