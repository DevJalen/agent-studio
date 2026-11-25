using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

[assembly: AssemblyTitle("Agent Studio")]
[assembly: AssemblyProduct("Agent Studio")]
internal static class AgentStudio
{
    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr window);
    [DllImport("user32.dll")]
    private static extern bool ShowWindowAsync(IntPtr window, int command);

    [STAThread]
    private static void Main()
    {
        bool firstInstance;
        using (var mutex = new Mutex(true, "Local\\DevJalen.AgentStudio.Launcher", out firstInstance))
        {
            if (!firstInstance)
            {
                FocusExistingWindow();
                return;
            }
            try { Run(); }
            finally { mutex.ReleaseMutex(); }
        }
    }

    private static void FocusExistingWindow()
    {
        for (int attempt = 0; attempt < 50; attempt++)
        {
            try
            {
                string[] record = File.ReadAllLines(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "window-process.txt"));
                using (var child = Process.GetProcessById(int.Parse(record[0])))
                {
                    if (child.StartTime.ToUniversalTime().Ticks != long.Parse(record[1])) return;
                    if (child.MainWindowHandle != IntPtr.Zero)
                    {
                        ShowWindowAsync(child.MainWindowHandle, 9);
                        SetForegroundWindow(child.MainWindowHandle);
                        return;
                    }
                }
            }
            catch (IOException) { }
            catch (ArgumentException) { }
            catch (InvalidOperationException) { }
            catch (System.ComponentModel.Win32Exception) { }
            catch (FormatException) { }
            catch (IndexOutOfRangeException) { }
            Thread.Sleep(100);
        }
    }

    private static void Run()
    {
        try
        {
            string directory = AppDomain.CurrentDomain.BaseDirectory;
            var config = new JavaScriptSerializer().Deserialize<Dictionary<string, string>>(
                File.ReadAllText(Path.Combine(directory, "launcher.json")));
            var start = new ProcessStartInfo(config["electron"], "\"" + Path.Combine(config["root"], "windows", "desktop-bootstrap.cjs") + "\"");
            start.WorkingDirectory = config["root"];
            start.UseShellExecute = false;
            start.CreateNoWindow = true;
            start.RedirectStandardOutput = true;
            start.RedirectStandardError = true;
            foreach (string key in new[] { "ELECTRON_RUN_AS_NODE", "VITE_DEV_SERVER_URL", "VITE_HTTP_URL", "VITE_WS_URL", "T3CODE_PORT", "T3CODE_DEV_AUTH_TOKEN", "T3CODE_MODE", "T3CODE_NO_BROWSER", "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL", "CLAUDE_CODE_OAUTH_TOKEN", "CLAUDE_CONFIG_DIR", "CLAUDECODE", "CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_VERTEX", "CLAUDE_CODE_USE_FOUNDRY", "OPENAI_API_KEY", "OPENAI_BASE_URL", "CODEX_API_KEY" })
                start.EnvironmentVariables.Remove(key);
            start.EnvironmentVariables["PATH"] = config["toolPath"] + ";" + Environment.GetEnvironmentVariable("PATH");
            start.EnvironmentVariables["T3CODE_HOME"] = config["stateHome"];
            start.EnvironmentVariables["T3CODE_TELEMETRY_ENABLED"] = "false";
            start.EnvironmentVariables["T3CODE_DISABLE_AUTO_UPDATE"] = "true";
            start.EnvironmentVariables["T3CODE_DESKTOP_APP_USER_MODEL_ID"] = "com.devjalen.AgentStudio";
            start.EnvironmentVariables["AGENT_STUDIO_LAUNCHER_PATH"] = Application.ExecutablePath;
            start.EnvironmentVariables["AGENT_STUDIO_ICON_PATH"] = Path.Combine(directory, "AgentStudio.ico");
            string logPath = Path.Combine(directory, "launch-" + DateTime.Now.ToString("yyyyMMdd-HHmmss-fff") + ".log");
            using (var log = new StreamWriter(logPath))
            using (var child = new Process())
            {
                log.AutoFlush = true;
                child.StartInfo = start;
                DataReceivedEventHandler record = (sender, args) => { if (args.Data != null) lock (log) log.WriteLine(args.Data); };
                child.OutputDataReceived += record;
                child.ErrorDataReceived += record;
                child.Start();
                File.WriteAllLines(Path.Combine(directory, "window-process.txt"), new[] { child.Id.ToString(), child.StartTime.ToUniversalTime().Ticks.ToString() });
                child.BeginOutputReadLine();
                child.BeginErrorReadLine();
                child.WaitForExit();
                if (child.ExitCode != 0)
                    MessageBox.Show("Agent Studio could not start. Details were saved to:\n" + logPath, "Agent Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        catch (Exception error)
        {
            MessageBox.Show(error.Message, "Agent Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
