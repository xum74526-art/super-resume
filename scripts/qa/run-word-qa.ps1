param(
    [Parameter(Mandatory = $true)] [string] $RendererPath,
    [string] $Image = 'super-resume-qa:node22',
    [string[]] $Templates = @()
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$rendererFile = (Resolve-Path -LiteralPath $RendererPath).Path
if (-not (Test-Path -LiteralPath $rendererFile -PathType Leaf)) { throw 'RendererPath must point to render_docx.py.' }
$version = (Get-Content (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
$sampleDir = Join-Path $projectRoot "artifacts/samples/$version"
$fixtureDir = Join-Path $projectRoot ".cache/qa/$version"
foreach ($inputFile in @((Join-Path $sampleDir 'resume-modern.docx'), (Join-Path $fixtureDir 'multipage-modern.docx'))) {
    if (-not (Test-Path -LiteralPath $inputFile -PathType Leaf)) { throw 'Run npm run samples:generate before Word QA.' }
}
$outputDir = Join-Path $fixtureDir 'word'
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
$dockerArgs = @(
    'run', '--rm', '--network', 'none',
    '--mount', "type=bind,source=$sampleDir,target=/samples,readonly",
    '--mount', "type=bind,source=$fixtureDir,target=/fixtures,readonly",
    '--mount', "type=bind,source=$rendererFile,target=/qa/render_docx.py,readonly",
    '--mount', "type=bind,source=$PSScriptRoot/render-design-collection.py,target=/qa/driver.py,readonly",
    '--mount', "type=bind,source=$outputDir,target=/out",
    $Image, '/opt/qa-python/bin/python', '/qa/driver.py',
    '--renderer', '/qa/render_docx.py', '--samples', '/samples', '--qa', '/fixtures', '--out', '/out'
)
if ($Templates.Count) { $dockerArgs += @('--ids') + $Templates }
& docker @dockerArgs
if ($LASTEXITCODE -ne 0) { throw 'Word collection rendering failed.' }
$manifest = Get-Content (Join-Path $outputDir 'manifest.json') -Raw | ConvertFrom-Json
foreach ($entry in $manifest | Where-Object { $_.id.EndsWith('-long') }) {
    $pdf = Join-Path $outputDir ($entry.pdf -replace '^/out/', '')
    & node (Join-Path $PSScriptRoot 'verify-word-pagination.mjs') $pdf
    if ($LASTEXITCODE -ne 0) { throw "Rendered Word pagination checks failed: $($entry.id)" }
}
Write-Output "Review every page PNG under $outputDir. Automated text checks do not replace visual inspection."
