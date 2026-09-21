param(
    [Parameter(Mandatory = $true)]
    [string]$FeatureName,

    [Parameter(Mandatory = $true)]
    [string[]]$Files,

    [string]$Root = (Get-Location).Path,

    [string]$Summary = 'Pacote de feature Memora pronto para upload.',

    [string]$PostUpload = '',

    [switch]$SkipLint
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ptA = [char]0x00E1
$ptATilde = [char]0x00E3
$ptC = [char]0x00E7
$ptO = [char]0x00F3
$ptI = [char]0x00ED
$ptAAcute = [char]0x00C1
$ptNao = 'N' + $ptATilde + 'o'
$ptNaoLower = 'n' + $ptATilde + 'o'
$ptHa = 'h' + $ptA
$ptApos = 'ap' + $ptO + 's'
$ptValidacao = 'Valida' + $ptC + $ptATilde + 'o'
$ptArvore = $ptA + 'rvore'
$ptArvoreTitle = $ptAAcute + 'rvore'
$ptComparacao = 'Compara' + $ptC + $ptATilde + 'o'
$ptDisponivel = 'dispon' + $ptI + 'vel'

if ([string]::IsNullOrWhiteSpace($PostUpload)) {
    $PostUpload = "$ptNao $ptHa etapas adicionais."
}

function Get-FullPath([string]$Path) {
    return [System.IO.Path]::GetFullPath($Path)
}

function Test-IsUnder([string]$Child, [string]$Parent) {
    $fullChild = Get-FullPath $Child
    $fullParent = (Get-FullPath $Parent).TrimEnd('\', '/')
    return $fullChild.StartsWith($fullParent + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)
}

function Convert-ToSlug([string]$Name) {
    $slug = $Name.Trim() -replace '[\\/]+', '-' -replace '[^a-zA-Z0-9_-]+', '-'
    $slug = $slug.Trim('-').ToLowerInvariant()
    if (-not $slug.StartsWith('feature-')) {
        $slug = 'feature-' + $slug
    }
    return $slug
}

$rootFull = Get-FullPath $Root
if (-not (Test-Path -LiteralPath $rootFull)) {
    throw "Root $ptNaoLower encontrado: $rootFull"
}

$tmpRoot = Get-FullPath (Join-Path $rootFull 'tmp')
$folderName = Convert-ToSlug $FeatureName
$featureRoot = Get-FullPath (Join-Path $tmpRoot $folderName)

if (-not (Test-IsUnder $featureRoot $tmpRoot)) {
    throw "Destino fora de tmp/: $featureRoot"
}

New-Item -ItemType Directory -Path $featureRoot -Force | Out-Null

$copied = New-Object System.Collections.Generic.List[object]
$phpCommand = Get-Command php -ErrorAction SilentlyContinue

foreach ($file in $Files) {
    $relative = ($file -replace '/', '\').TrimStart('\')
    $source = Get-FullPath (Join-Path $rootFull $relative)
    if (-not (Test-IsUnder $source $rootFull)) {
        throw "Arquivo fora do root: $file"
    }
    if (-not (Test-Path -LiteralPath $source)) {
        throw "Arquivo $ptNaoLower encontrado: $relative"
    }

    $destination = Get-FullPath (Join-Path $featureRoot $relative)
    if (-not (Test-IsUnder $destination $featureRoot)) {
        throw "Destino fora do pacote: $destination"
    }

    $destinationDir = Split-Path $destination -Parent
    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $destination -Force

    $sourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $source).Hash
    $packageHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $destination).Hash
    $lintResult = 'not-applicable'

    if (-not $SkipLint -and [System.IO.Path]::GetExtension($relative).Equals('.php', [System.StringComparison]::OrdinalIgnoreCase)) {
        if ($phpCommand) {
            $lintOutput = & php -l $destination 2>&1
            if ($LASTEXITCODE -ne 0) {
                $lintResult = 'failed'
                $lintOutput | ForEach-Object { Write-Host $_ }
            } else {
                $lintResult = 'ok'
            }
        } else {
            $lintResult = 'php-not-found'
        }
    }

    $copied.Add([PSCustomObject]@{
        File = $relative
        HashMatch = ($sourceHash -eq $packageHash)
        Lint = $lintResult
    }) | Out-Null
}

$manifestPath = Join-Path $featureRoot 'MANIFESTO.txt'
$manifestLines = New-Object System.Collections.Generic.List[string]
$manifestLines.Add("Feature: $folderName") | Out-Null
$manifestLines.Add("Data: $(Get-Date -Format 'yyyy-MM-dd')") | Out-Null
$manifestLines.Add('') | Out-Null
$manifestLines.Add('Resumo') | Out-Null
foreach ($line in ($Summary -split "`r?`n")) {
    if ($line.Trim()) {
        $manifestLines.Add("- $($line.Trim())") | Out-Null
    }
}
$manifestLines.Add('') | Out-Null
$manifestLines.Add('Arquivos para upload') | Out-Null
foreach ($item in $copied) {
    $manifestLines.Add("- $($item.File -replace '\\', '/')") | Out-Null
}
$manifestLines.Add('') | Out-Null
$manifestLines.Add("Passos $ptApos upload") | Out-Null
foreach ($line in ($PostUpload -split "`r?`n")) {
    if ($line.Trim()) {
        $manifestLines.Add("- $($line.Trim())") | Out-Null
    }
}
$manifestLines.Add('') | Out-Null
$manifestLines.Add("$ptValidacao local") | Out-Null
$manifestLines.Add("- Arquivos copiados em $ptArvore espelhada dentro de tmp/.") | Out-Null
$manifestLines.Add("- $ptComparacao SHA-256 feita entre origem e pacote.") | Out-Null
if (-not $SkipLint) {
    $manifestLines.Add("- php -l executado nos PHPs copiados quando o comando php estava $ptDisponivel.") | Out-Null
}

Set-Content -LiteralPath $manifestPath -Value $manifestLines -Encoding UTF8

Write-Host "Pacote: $featureRoot"
Write-Host ''
Write-Host "${ptValidacao}:"
$copied | Format-Table -AutoSize | Out-String | Write-Host

$failedHash = $copied | Where-Object { -not $_.HashMatch }
$failedLint = $copied | Where-Object { $_.Lint -eq 'failed' }
if ($failedHash -or $failedLint) {
    throw "Pacote criado, mas a $($ptValidacao.ToLowerInvariant()) falhou. Corrija antes do handoff."
}

Write-Host "$ptArvoreTitle final:"
Get-ChildItem -Path $featureRoot -Recurse | ForEach-Object {
    $_.FullName.Replace($rootFull + [System.IO.Path]::DirectorySeparatorChar, '')
}
