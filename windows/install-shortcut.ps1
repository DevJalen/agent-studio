$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $repoRoot
$launcherDirectory = Join-Path $workspaceRoot '.agent-studio-launcher'
$stateDirectory = Join-Path $workspaceRoot '.agent-studio'
$electron = Join-Path $repoRoot 'apps\desktop\node_modules\electron\dist\electron.exe'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
foreach ($required in @($electron, $compiler, (Join-Path $repoRoot 'apps\desktop\dist-electron\main.cjs'), (Join-Path $repoRoot 'apps\server\dist\client\index.html'))) {
    if (!(Test-Path -LiteralPath $required)) { throw "Missing build prerequisite: $required. Run vp run build:desktop first." }
}
$nodeDirectory = Split-Path -Parent (& vp exec node -p 'process.execPath' | Select-Object -Last 1)
if ($LASTEXITCODE -ne 0) { throw 'Could not locate the app Node runtime.' }
$powershellDirectory = Split-Path -Parent (Get-Command pwsh -ErrorAction Stop).Source
$null = New-Item -ItemType Directory -Path $launcherDirectory -Force
$desktopBuild = Join-Path $repoRoot 'apps\desktop\dist-agent-studio'
$null = New-Item -ItemType Directory -Path $desktopBuild -Force
Get-ChildItem -LiteralPath (Join-Path $repoRoot 'apps\desktop\dist-electron') | Copy-Item -Destination $desktopBuild -Recurse -Force

Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap 256,256
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = 'AntiAlias'
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#17181c'))
$colors = @('#d97757', '#8b5cf6', '#10b981')
for ($i = 0; $i -lt 3; $i++) {
    $pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($colors[$i])),22
    $pen.StartCap = 'Round'
    $pen.EndCap = 'Round'
    $graphics.DrawLine($pen, [single](62 + 55 * $i), 177, [single](90 + 55 * $i), 79)
    $pen.Dispose()
}
$png = New-Object System.IO.MemoryStream
$bitmap.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
$bytes = $png.ToArray()
$iconPath = Join-Path $launcherDirectory 'AgentStudio.ico'
$writer = New-Object System.IO.BinaryWriter ([System.IO.File]::Create($iconPath))
try {
    $writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]1)
    $writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0)
    $writer.Write([uint16]1); $writer.Write([uint16]32)
    $writer.Write([uint32]$bytes.Length); $writer.Write([uint32]22); $writer.Write($bytes)
} finally { $writer.Dispose(); $png.Dispose(); $graphics.Dispose(); $bitmap.Dispose() }

$exePath = Join-Path $launcherDirectory 'AgentStudio.exe'
& $compiler /nologo /target:winexe /platform:x64 "/win32icon:$iconPath" "/out:$exePath" /reference:System.Windows.Forms.dll /reference:System.Web.Extensions.dll (Join-Path $PSScriptRoot 'AgentStudio.cs')
if ($LASTEXITCODE -ne 0) { throw 'Could not build the Agent Studio shortcut launcher.' }
@{
    root = $repoRoot
    electron = $electron
    stateHome = $stateDirectory
    toolPath = "$nodeDirectory;$powershellDirectory;$(Join-Path $env:APPDATA 'npm');$(Join-Path $workspaceRoot '.tools\claude-code\node_modules\@anthropic-ai\claude-code\bin')"
} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $launcherDirectory 'launcher.json') -Encoding UTF8

$shell = New-Object -ComObject WScript.Shell
foreach ($folder in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {
    $shortcutPath = Join-Path $folder 'Agent Studio.lnk'
    if (Test-Path -LiteralPath $shortcutPath) {
        $existing = $shell.CreateShortcut($shortcutPath)
        if ($existing.TargetPath -ne $exePath) { throw "A different shortcut already exists: $shortcutPath" }
    }
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $exePath
    $shortcut.WorkingDirectory = $repoRoot
    $shortcut.IconLocation = "$iconPath,0"
    $shortcut.Description = 'Open Agent Studio'
    $shortcut.Save()
}
Write-Output "Installed Agent Studio shortcuts on the Desktop and in the Start menu. Launcher: $exePath"
