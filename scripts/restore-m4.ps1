param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
$manifestPath = Join-Path $taskRoot '.local/m4-change-manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ([IO.Path]::GetFullPath($manifest.root).TrimEnd('\') -ne $taskRoot) { throw 'Workspace does not match checkpoint.' }
function Assert-LocalPath([string]$RelativePath) {
    $resolved = [IO.Path]::GetFullPath((Join-Path $taskRoot $RelativePath))
    if (-not $resolved.StartsWith($taskRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "Path escapes workspace: $RelativePath" }
    $parent = Split-Path $resolved -Parent
    while ($parent.Length -gt $taskRoot.Length) {
        if ((Test-Path -LiteralPath $parent) -and ((Get-Item -LiteralPath $parent).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw "Refusing reparse point: $parent" }
        $parent = Split-Path $parent -Parent
    }
    return $resolved
}
function Hash-OrNull([string]$FilePath) {
    if (Test-Path -LiteralPath $FilePath -PathType Leaf) { return (Get-FileHash -LiteralPath $FilePath -Algorithm SHA256).Hash.ToLowerInvariant() }
    return $null
}
# Verify ALL hashes and resolved paths before making any change.
$planned = @()
foreach ($entry in $manifest.changes) {
    $destination = Assert-LocalPath $entry.path
    $actual = Hash-OrNull $destination
    if ($actual -ne $entry.after) { throw "Changed since M4 delivery; will not overwrite: $($entry.path)" }
    $original = $null
    if ($entry.before) {
        if (-not $manifest.backup.StartsWith($taskRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Backup escapes workspace.' }
        $relativeBackup = $manifest.backup.Substring($taskRoot.Length + 1) + '/files/' + $entry.path
        $original = Assert-LocalPath $relativeBackup
        if ((Hash-OrNull $original) -ne $entry.before) { throw "Backup hash mismatch: $($entry.path)" }
    }
    $planned += [pscustomobject]@{ Entry=$entry; Destination=$destination; Original=$original }
}
Write-Output "Verified $($planned.Count) paths. Original uncommitted and untracked files are included in backup."
if (-not $Apply) { Write-Output 'Check only. Use -Apply to archive current M4 files and restore the pre-M4 working tree.'; return }
$safetyRelative = '.local/m4-before-restore-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$safetyRoot = Assert-LocalPath $safetyRelative
New-Item -ItemType Directory -Path $safetyRoot | Out-Null
foreach ($operation in $planned) {
    if ($operation.Entry.after) {
        $saved = Assert-LocalPath ($safetyRelative + '/' + $operation.Entry.path)
        New-Item -ItemType Directory -Force -Path (Split-Path $saved -Parent) | Out-Null
        # One shell, literal paths, verified workspace: preserve rather than delete current files.
        Move-Item -LiteralPath $operation.Destination -Destination $saved
    }
    if ($operation.Original) {
        New-Item -ItemType Directory -Force -Path (Split-Path $operation.Destination -Parent) | Out-Null
        Copy-Item -LiteralPath $operation.Original -Destination $operation.Destination
    }
}
Write-Output "Restored pre-M4 files. M4 changes preserved in $safetyRoot. Rebuild dist before previewing."
