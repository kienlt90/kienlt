$dataJsPath = "$PSScriptRoot\data.js"

# 1. Read the existing data.js
$lines = [System.IO.File]::ReadAllLines($dataJsPath, [System.Text.Encoding]::UTF8)

# Find boundaries dynamically using comment/variable markers
$headIndex = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -like "*OFFICIAL_MATCHES_RAW*" -or $lines[$i] -like "*FIFA_GROUP_PATTERNS*") {
        $headIndex = $i - 1
        # Backtrack to exclude any preceding comments and empty lines
        while ($headIndex -ge 0 -and ($lines[$headIndex].Trim().StartsWith("//") -or $lines[$headIndex].Trim() -eq "")) {
            $headIndex--
        }
        break
    }
}

$tailIndex = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -like "*PLAYER_STATS_DATA*") {
        $tailIndex = $i
        if ($i -gt 0 -and $lines[$i-1].Trim().StartsWith("//")) {
            $tailIndex = $i - 1
        }
        break
    }
}

if ($headIndex -eq -1 -or $tailIndex -eq -1) {
    Write-Error "Could not find file markers in data.js! headIndex=$headIndex, tailIndex=$tailIndex"
    exit 1
}

$headLines = $lines[0..$headIndex]
$tailLines = $lines[$tailIndex..($lines.Count - 1)]

# 2. Fetch the ESPN World Cup 2026 scoreboard
$uri = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=150"
$resp = Invoke-RestMethod -Uri $uri
$events = $resp.events | Select-Object -First 72

# Status variables in Vietnamese
$statusKetThuc = "K" + [char]0x1ebf + "t th" + [char]0x00fa + "c"
$statusDangDa = [char]0x0110 + "ang " + [char]0x0111 + [char]0x00e1
$statusChuaDau = "Ch" + [char]0x01b0 + "a " + [char]0x0111 + [char]0x1ea5 + "u"

$wcMatches = @()
$teamAppearances = @{}

$matchId = 1
foreach ($e in $events) {
    $comp = $e.competitions[0]
    $c1 = $comp.competitors[0]
    $c2 = $comp.competitors[1]
    
    $t1Id = $c1.team.abbreviation
    $t2Id = $c2.team.abbreviation
    
    # Track appearances for rounds
    if (-not $teamAppearances.ContainsKey($t1Id)) { $teamAppearances[$t1Id] = 0 }
    if (-not $teamAppearances.ContainsKey($t2Id)) { $teamAppearances[$t2Id] = 0 }
    
    $teamAppearances[$t1Id] += 1
    $teamAppearances[$t2Id] += 1
    
    $round = [Math]::Max($teamAppearances[$t1Id], $teamAppearances[$t2Id])
    
    # Group extraction from altGameNote
    $group = ""
    $note = $comp.altGameNote
    if ($note -match 'Group ([A-L])') {
        $group = $Matches[1]
    }
    
    # Date/Time conversion to Vietnam Time (GMT+7)
    $utcDate = [DateTimeOffset]::Parse($e.date)
    $vnDate = $utcDate.ToOffset([TimeSpan]::FromHours(7))
    $dateStr = $vnDate.ToString("dd/MM/yyyy")
    $timeStr = $vnDate.ToString("HH:mm")
    $timestamp = $utcDate.ToUnixTimeMilliseconds()
    
    # Scores and status
    $score1 = "null"
    $score2 = "null"
    $yc1 = 0
    $rc1 = 0
    $yc2 = 0
    $rc2 = 0
    $status = $statusChuaDau
    
    $scorers1 = @()
    $scorers2 = @()
    
    $state = $e.status.type.state
    if ($state -eq "post" -or $state -eq "in") {
        $status = if ($state -eq "post") { $statusKetThuc } else { $statusDangDa }
        $score1 = [int]$c1.score
        $score2 = [int]$c2.score
        
        # Extract cards and scorers dynamically from details
        $t1Uid = $c1.team.id
        $t2Uid = $c2.team.id
        if ($comp.details -ne $null) {
            foreach ($d in $comp.details) {
                # Cards
                if ($d.yellowCard -eq $true) {
                    if ($d.team.id -eq $t1Uid) { $yc1++ }
                    elseif ($d.team.id -eq $t2Uid) { $yc2++ }
                }
                if ($d.redCard -eq $true) {
                    if ($d.team.id -eq $t1Uid) { $rc1++ }
                    elseif ($d.team.id -eq $t2Uid) { $rc2++ }
                }
                # Scorers
                if ($d.scoringPlay -eq $true -or $d.type.text -eq "Goal" -or $d.type.id -eq "70") {
                    $pName = if ($d.athletesInvolved -ne $null) { $d.athletesInvolved[0].displayName } else { "Unknown" }
                    $min = $d.clock.displayValue
                    if ($d.ownGoal -eq $true) {
                        $pName = "$pName (OG)"
                    }
                    $sObj = @{ name = $pName; min = $min }
                    if ($d.team.id -eq $t1Uid) {
                        $scorers1 += $sObj
                    } else {
                        $scorers2 += $sObj
                    }
                }
            }
        }
    }
    
    $mObj = @{
        id = "M" + $matchId.ToString().PadLeft(2, '0')
        group = $group
        round = $round
        date = $dateStr
        timestamp = $timestamp
        time = $timeStr
        team1Id = $t1Id
        team2Id = $t2Id
        score1 = $score1
        score2 = $score2
        yc1 = $yc1
        rc1 = $rc1
        yc2 = $yc2
        rc2 = $rc2
        status = $status
        scorers1 = $scorers1
        scorers2 = $scorers2
    }
    $wcMatches += $mObj
    $matchId += 1
}

# 3. Format JavaScript replacement content
$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine("// Official Match Schedule for World Cup 2026 from ESPN API (72 matches)")
[void]$sb.AppendLine("const OFFICIAL_MATCHES_RAW = [")

foreach ($m in $wcMatches) {
    $scorers1Val = "[]"
    if ($m.scorers1.Count -gt 0) {
        $items = @()
        foreach ($s in $m.scorers1) {
            $cleanedName = $s.name.Replace('"', '\"')
            $items += "{ name: `"$cleanedName`", min: `"$($s.min)`" }"
        }
        $scorers1Val = "[" + ($items -join ", ") + "]"
    }
    
    $scorers2Val = "[]"
    if ($m.scorers2.Count -gt 0) {
        $items = @()
        foreach ($s in $m.scorers2) {
            $cleanedName = $s.name.Replace('"', '\"')
            $items += "{ name: `"$cleanedName`", min: `"$($s.min)`" }"
        }
        $scorers2Val = "[" + ($items -join ", ") + "]"
    }

    [void]$sb.AppendLine("  {")
    [void]$sb.AppendLine("    id: `"$($m.id)`",")
    [void]$sb.AppendLine("    group: `"$($m.group)`",")
    [void]$sb.AppendLine("    round: $($m.round),")
    [void]$sb.AppendLine("    date: `"$($m.date)`",")
    [void]$sb.AppendLine("    timestamp: $($m.timestamp),")
    [void]$sb.AppendLine("    time: `"$($m.time)`",")
    [void]$sb.AppendLine("    team1Id: `"$($m.team1Id)`",")
    [void]$sb.AppendLine("    team2Id: `"$($m.team2Id)`",")
    [void]$sb.AppendLine("    score1: $($m.score1),")
    [void]$sb.AppendLine("    score2: $($m.score2),")
    [void]$sb.AppendLine("    yc1: $($m.yc1),")
    [void]$sb.AppendLine("    rc1: $($m.rc1),")
    [void]$sb.AppendLine("    yc2: $($m.yc2),")
    [void]$sb.AppendLine("    rc2: $($m.rc2),")
    [void]$sb.AppendLine("    status: `"$($m.status)`",")
    [void]$sb.AppendLine("    scorers1: $($scorers1Val),")
    [void]$sb.AppendLine("    scorers2: $($scorers2Val),")
    [void]$sb.AppendLine("    matchTime: `"`"")
    [void]$sb.AppendLine("  },")
}
[void]$sb.AppendLine("];")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("// Helper function to find team details by ID")
[void]$sb.AppendLine("function findTeamById(teamId) {")
[void]$sb.AppendLine("  for (const groupLetter of Object.keys(WORLD_CUP_DATA.groups)) {")
[void]$sb.AppendLine("    const team = WORLD_CUP_DATA.groups[groupLetter].find(t => t.id === teamId);")
[void]$sb.AppendLine("    if (team) return team;")
[void]$sb.AppendLine("  }")
[void]$sb.AppendLine("  return null;")
[void]$sb.AppendLine("}")
[void]$sb.AppendLine("")
[void]$sb.AppendLine("// Initialize DEFAULT_MATCHES with full info")
[void]$sb.AppendLine("const DEFAULT_MATCHES = OFFICIAL_MATCHES_RAW.map(match => {")
[void]$sb.AppendLine("  const t1 = findTeamById(match.team1Id);")
[void]$sb.AppendLine("  const t2 = findTeamById(match.team2Id);")
[void]$sb.AppendLine("  return {")
[void]$sb.AppendLine("    ...match,")
[void]$sb.AppendLine("    team1: t1 ? t1.name : `"`",")
[void]$sb.AppendLine("    team1FlagCode: t1 ? t1.flagCode : `"`",")
[void]$sb.AppendLine("    team1Flag: t1 ? t1.flag : `"`",")
[void]$sb.AppendLine("    team2: t2 ? t2.name : `"`",")
[void]$sb.AppendLine("    team2FlagCode: t2 ? t2.flagCode : `"`",")
[void]$sb.AppendLine("    team2Flag: t2 ? t2.flag : `"`",")
[void]$sb.AppendLine("    matchTime: match.matchTime || `"`"")
[void]$sb.AppendLine("  };")
[void]$sb.AppendLine("});")

$middlePart = $sb.ToString()

# 4. Concatenate and write back to data.js
$newContent = ($headLines -join "`r`n") + "`r`n`r`n" + $middlePart + "`r`n`r`n" + ($tailLines -join "`r`n")
[System.IO.File]::WriteAllText($dataJsPath, $newContent, [System.Text.UTF8Encoding]::new($false))

Write-Output "Successfully updated data.js with 72 official matches, cards and scorers!"
