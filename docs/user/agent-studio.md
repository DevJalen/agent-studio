# Agent Studio

Agent Studio is an unofficial personal fork of [T3 Code](https://github.com/pingdotgg/t3code).
It is not affiliated with, endorsed by, or maintained by T3 Tools. The upstream MIT license is retained.

## Start locally

If the Windows shortcut is installed, open **Agent Studio** from your Desktop or Start menu.
It opens the built desktop app without a terminal or menu. Right-click its running taskbar icon
and choose **Pin to taskbar** for one-click access. Reopening it brings up the existing app.
Close the browser development launcher before opening the desktop app; they share the same chats.

To install these shortcuts from a source checkout, first build with `vp run build:desktop`, then
run `powershell -File windows/install-shortcut.ps1` from a terminal with Vite+ and PowerShell 7
available. The local launcher stays beside the checkout in `.agent-studio-launcher`. Keep the
checkout and its dependencies there; the shortcut is not a portable installer. Rebuild after
updating the source. Account sign-in remains available from `Start-Agent-Studio.cmd`.

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

The account bar shows each account's name and reported usage limits, without displaying email addresses. Select **Usage details**
for all limits, or refresh to request updated readings. Missing readings stay unavailable, and old
readings are marked. **Project folders** switches between chat cards and collapsible project groups.
Available reset credits appear under their account, including model-specific credits. Choose **Use**
or **Use reset** and confirm the named credit to redeem it. Opening the controls never spends a credit.

Open the chat's details panel to see its model companion below the workspace controls. It shows the
current account, model, and whether work is running or waiting for you. Each model has its own full-body
ASCII character; model versions have different details. Choose **Animated**, **Still**,
or **Off** under **Model faces**. Faces and their animations run locally without model requests or
tokens; reduced-motion preferences disable the animation. Sidebar faces remain still.

## Images and game projects

T3's existing chat renders supported image attachments and Markdown image outputs, including its
zoomable image viewer. The Codex preset enables its native image-generation feature for new sessions,
without changing your shared Codex configuration. Generation still requires a supporting model and
account; the flag does not add an entitlement. See [Codex images](providers-codex.md#generate-images).
Plugins in the official Codex desktop app are not automatically available to the standalone Codex CLI.

Expand **Chat images** beneath the companion to browse image attachments and image links from loaded
messages. The shelf shows up to 48 of each and opens the existing image viewer. It does not search
other chats or generate new images.

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
