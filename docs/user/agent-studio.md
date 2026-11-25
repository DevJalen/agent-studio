# Agent Studio

Agent Studio is an unofficial personal fork of [T3 Code](https://github.com/pingdotgg/t3code).
It is not affiliated with, endorsed by, or maintained by T3 Tools. The upstream MIT license is retained.

## Start locally

Install the Vite+ version listed in `pnpm-workspace.yaml`, then run:

```sh
vp install --frozen-lockfile
vp run studio
```

On Windows, `Start-Agent-Studio.cmd` offers a browser view, a desktop window, and account sign-in.
For the browser view, open the pairing URL printed in its terminal. Keep the launcher's terminal
open while using either view. Close the running launcher before switching between browser and
desktop modes; both use the same chats and settings. Neither mode needs the Claude or Codex
desktop app open. To start the desktop window from a terminal, run `vp run studio:desktop`.
The desktop development shell needs Electron's additional runtime dependencies; this fork does
not yet ship a signed installer.

The launcher keeps its database and account settings in `.agent-studio` beside the source checkout,
outside the Git repository. This also allows chats without a project.
It does not import your existing T3 chats or change your normal Claude/Codex configuration.
Back up this directory privately if you want to preserve the fork's chats across machines.
Never commit it or share a pairing URL publicly.

## Your three accounts

The initial setup creates these entries in **Settings → Providers**:

| Account            | Colour | Sign-in                                            |
| ------------------ | ------ | -------------------------------------------------- |
| Claude · Account 1 | Orange | Existing default Claude Code login                 |
| Claude · Account 2 | Purple | Separate login stored under this app's local state |
| Codex              | Green  | Existing Codex CLI login                           |

Use the Windows launcher's **Connect Claude Account 1** and **Connect Claude Account 2** options.
Each opens the official Claude login; select the matching account in your browser. On other systems,
run `vp run studio --login-claude-1` or `vp run studio --login-claude-2`. Check the account shown by the
sign-in screen, then refresh its provider status. Rename the entries to meaningful labels once connected.
Select the account in the chat's model picker. The chat header also displays its name, with the
running account taking priority while a turn is active. Subagents remain attached to their parent
conversation through T3's existing agent view.

The launcher removes inherited API-key and Claude-account environment overrides from its own child
process, so a shell's API key does not silently replace a subscription login. Explicit API settings
inside a CLI configuration or a provider you configure yourself still apply. Subscription availability
and quotas remain with Anthropic and OpenAI; adding an account does not merge allowances.

Setup is create-once. Relaunching preserves saved settings, account names, and provider choices.

## Images and game projects

T3's existing chat renders supported image attachments and Markdown image outputs, including its
zoomable image viewer. The Codex preset enables its native image-generation feature for new sessions,
without changing your shared Codex configuration. Generation still requires a supporting model and
account; the flag does not add an entitlement. See [Codex images](providers-codex.md#generate-images).
Plugins in the official Codex desktop app are not automatically available to the standalone Codex CLI.

Add your game workspace as a project. Its existing `AGENTS.md`/`CLAUDE.md` and shared vault remain
the source of game-specific instructions. Keep game work in that workspace; keep this public fork
limited to app source. The fork does not copy game notes, configure Studio MCP, claim Studio objects,
or publish games automatically.

## Local defaults and limits

The launcher binds the backend to `127.0.0.1`, disables T3 product telemetry, disables automatic
copying of existing chat databases, and initially chooses supervised permissions. The upstream
pairing and tool-approval boundaries stay in place. Remote sharing is not enabled by this launcher.
These defaults do not sandbox the entire app or prevent a permitted agent/tool from accessing files.
Only connect tools and projects you intend those agents to use.

Use Git to update this fork deliberately. No Agent Studio release feed or hosted service is configured.
The local development launcher is the supported entry point for this initial version.
