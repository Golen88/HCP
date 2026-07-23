<#
.SYNOPSIS
    Konverterer Slopetabell.xlsx til data.json for HCP-kalkulatoren.

.DESCRIPTION
    Leser regnearket (forste ark) i en Excel-fil med kolonnene
    Kjonn, Bane, Layout, CR, Slope og skriver ut en flat JSON-liste
    som nettsiden (script.js) leser inn som datakilde.

    Krever at Microsoft Excel er installert lokalt (bruker Excel COM-automasjon).

.PARAMETER InputFile
    Sti til Excel-filen. Standard: Slopetabell.xlsx i samme mappe som scriptet.

.PARAMETER OutputFile
    Sti til JSON-filen som skal skrives. Standard: data.json i samme mappe.

.EXAMPLE
    .\convert-xlsx-to-json.ps1
    .\convert-xlsx-to-json.ps1 -InputFile "C:\sti\Slopetabell.xlsx" -OutputFile "C:\sti\data.json"
#>

param(
    [string]$InputFile = (Join-Path $PSScriptRoot "Slopetabell.xlsx"),
    [string]$OutputFile = (Join-Path $PSScriptRoot "data.json")
)

if (-not (Test-Path $InputFile)) {
    Write-Error "Fant ikke Excel-filen: $InputFile"
    exit 1
}

$excel = $null
$wb = $null
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false

    $wb = $excel.Workbooks.Open((Resolve-Path $InputFile).Path)
    $ws = $wb.Worksheets.Item(1)
    $usedRange = $ws.UsedRange
    $rowCount = $usedRange.Rows.Count
    $colCount = $usedRange.Columns.Count

    # Les header-raden og finn kolonneindekser uavhengig av rekkefolge
    $headerMap = @{}
    for ($c = 1; $c -le $colCount; $c++) {
        $header = "$($ws.Cells.Item(1, $c).Text)".Trim()
        $headerMap[$header.ToLower()] = $c
    }

    $required = @("kjønn", "bane", "layout", "cr", "slope")
    foreach ($col in $required) {
        if (-not $headerMap.ContainsKey($col)) {
            throw "Fant ikke forventet kolonne '$col' i Excel-filen. Kolonner funnet: $($headerMap.Keys -join ', ')"
        }
    }

    $rows = @()
    for ($r = 2; $r -le $rowCount; $r++) {
        $kjonn = "$($ws.Cells.Item($r, $headerMap['kjønn']).Text)".Trim()
        if ([string]::IsNullOrWhiteSpace($kjonn)) { continue }

        $bane = "$($ws.Cells.Item($r, $headerMap['bane']).Text)".Trim()
        $layout = "$($ws.Cells.Item($r, $headerMap['layout']).Text)".Trim()
        $cr = [double]$ws.Cells.Item($r, $headerMap['cr']).Value2
        $slope = [int]$ws.Cells.Item($r, $headerMap['slope']).Value2

        $rows += [PSCustomObject]@{
            kjonn  = $kjonn
            bane   = $bane
            layout = $layout
            cr     = $cr
            slope  = $slope
        }
    }

    $json = $rows | ConvertTo-Json -Depth 3
    # ConvertTo-Json skriver et enkelt objekt uten array-parenteser hvis det bare er en rad
    if ($rows.Count -eq 1) { $json = "[$json]" }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($OutputFile, $json, $utf8NoBom)
    Write-Output "Skrev $($rows.Count) rader til $OutputFile"
}
finally {
    if ($wb) { $wb.Close($false) }
    if ($excel) { $excel.Quit() }
    if ($excel) { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null }
}
