$ErrorActionPreference = 'Stop'

$root = (Get-Location).Path
$outputPath = Join-Path $root 'docs\Conflict_Report.md'

$ignoredNames = @('.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.expo')

function Get-TargetFiles($dir) {
  $items = @()
  $entries = Get-ChildItem -LiteralPath $dir -Force -ErrorAction SilentlyContinue
  foreach ($entry in $entries) {
    if ($entry.PSIsContainer) {
      if ($ignoredNames -contains $entry.Name) {
        continue
      }
      $items += Get-TargetFiles $entry.FullName
    } else {
      $items += $entry.FullName
    }
  }
  return $items
}

function Find-Conflicts($content) {
  $lines = $content -split "`r?`n"
  $conflicts = @()
  $i = 0
  while ($i -lt $lines.Length) {
    if ($lines[$i] -like '<<<<<<<*') {
      $start = $i
      $end = $i + 1
      while ($end -lt $lines.Length -and $lines[$end] -notlike '>>>>>>>*') {
        $end++
      }
      if ($end -lt $lines.Length) {
        $block = $lines[$start..$end]
        $conflicts += [pscustomobject]@{
          StartLine = $start + 1
          EndLine   = $end + 1
          Block     = $block
        }
        $i = $end + 1
        continue
      }
    }
    $i++
  }
  return $conflicts
}

$items = @()
$files = Get-TargetFiles $root
foreach ($path in $files) {
  if ($path -eq $outputPath) {
    continue
  }
  try {
    $content = Get-Content -Raw -LiteralPath $path
  } catch {
    continue
  }
  if ($content -notmatch '<<<<<<<') {
    continue
  }
  $conflicts = Find-Conflicts $content
  if ($conflicts.Count -gt 0) {
    $items += [pscustomobject]@{
      Path      = $path
      Conflicts = $conflicts
    }
  }
}

$lines = @()
$lines += '# コンフリクトレポート'
$lines += ''
if ($items.Count -eq 0) {
  $lines += 'コンフリクトは見つかりませんでした。'
} else {
  $lines += "コンフリクト数: $($items.Count)ファイル"
  $lines += ''
  foreach ($item in $items) {
    $rel = $item.Path.Replace($root, '').TrimStart([IO.Path]::DirectorySeparatorChar).Replace([IO.Path]::DirectorySeparatorChar, '/')
    $lines += "## $rel"
    $lines += ''
    $index = 1
    foreach ($conflict in $item.Conflicts) {
      $lines += "### 競合 $index ($($conflict.StartLine)行目-$($conflict.EndLine)行目)"
      $lines += ''
      $lines += '```'
      $lines += $conflict.Block
      $lines += '```'
      $lines += ''
      $index++
    }
  }
}

$lines -join "`n" | Set-Content -LiteralPath $outputPath -Encoding UTF8
Write-Output "Conflict report generated: $outputPath"
