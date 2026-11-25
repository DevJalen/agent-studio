const { app } = require("electron");

app.on("browser-window-created", (_event, window) => {
  const icon = process.env.AGENT_STUDIO_ICON_PATH;
  const launcher = process.env.AGENT_STUDIO_LAUNCHER_PATH;
  if (icon) window.setIcon(icon);
  if (launcher) {
    window.setAppDetails({
      appId: "com.devjalen.AgentStudio",
      appIconPath: icon,
      relaunchCommand: `"${launcher}"`,
      relaunchDisplayName: "Agent Studio",
    });
  }
});

require("../apps/desktop/dist-agent-studio/main.cjs");
