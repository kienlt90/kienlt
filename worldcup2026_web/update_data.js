const fs = require('fs');
const https = require('https');
const path = require('path');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

function normalizeName(name) {
  if (!name) return "";
  let norm = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  norm = norm.toLowerCase().replace(/-/g, " ").trim();
  norm = norm.replace(/\s*\(og\)/g, "").replace(/\(og\)/g, "");
  return norm.trim();
}

function isInScorers(name, scorersList) {
  const norm = normalizeName(name);
  return scorersList.some(s => normalizeName(s.name) === norm);
}

async function fetchAssists(eventId, scorers1, scorers2, t1Name, t2Name) {
  const assists1 = [];
  const assists2 = [];
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${eventId}`;
  
  try {
    const summary = await fetchJson(url);
    const commentary = summary.commentary || [];
    
    for (const c of commentary) {
      const text = c.text || "";
      if (text.toLowerCase().includes("goal!")) {
        const play = c.play || {};
        const participants = play.participants || [];
        if (participants.length >= 2) {
          const scorerName = participants[0]?.athlete?.displayName;
          const assister = participants[1]?.athlete?.displayName;
          const playTeam = play.team?.displayName || "";
          
          if (assister && scorerName) {
            if (isInScorers(scorerName, scorers1)) {
              assists1.push(assister);
            } else if (isInScorers(scorerName, scorers2)) {
              assists2.push(assister);
            } else if (playTeam) {
              const normPlayTeam = normalizeName(playTeam);
              const normT1 = normalizeName(t1Name);
              const normT2 = normalizeName(t2Name);
              if (normPlayTeam === normT1 || normPlayTeam.includes(normT1) || normT1.includes(normPlayTeam)) {
                assists1.push(assister);
              } else if (normPlayTeam === normT2 || normPlayTeam.includes(normT2) || normT2.includes(normPlayTeam)) {
                assists2.push(assister);
              }
            }
          }
        }
      }
    }
  } catch (ex) {
    // Ignore summary fetch errors silently
  }
  return [assists1, assists2];
}

async function run() {
  const dataJsPath = path.join(__dirname, 'data.js');
  
  // 1. Read existing data.js
  if (!fs.existsSync(dataJsPath)) {
    console.error("data.js not found in current directory!");
    process.exit(1);
  }
  
  const content = fs.readFileSync(dataJsPath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  let headIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("OFFICIAL_MATCHES_RAW") || lines[i].includes("FIFA_GROUP_PATTERNS")) {
      headIndex = i - 1;
      while (headIndex >= 0 && (lines[headIndex].trim().startsWith("//") || lines[headIndex].trim() === "")) {
        headIndex--;
      }
      break;
    }
  }
  
  let tailIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("PLAYER_STATS_DATA")) {
      tailIndex = i;
      if (i > 0 && lines[i - 1].trim().startsWith("//")) {
        tailIndex = i - 1;
      }
      break;
    }
  }
  
  if (headIndex === -1 || tailIndex === -1) {
    console.error(`Boundaries not found in data.js! headIndex=${headIndex}, tailIndex=${tailIndex}`);
    process.exit(1);
  }
  
  const headLines = lines.slice(0, headIndex + 1);
  const tailLines = lines.slice(tailIndex);
  
  // 2. Fetch the ESPN World Cup 2026 scoreboard
  console.log("Fetching ESPN World Cup 2026 scoreboard...");
  const scoreboardUrl = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=150";
  let scoreboardData;
  try {
    scoreboardData = await fetchJson(scoreboardUrl);
  } catch (e) {
    console.error("Error fetching scoreboard:", e.message);
    process.exit(1);
  }
  
  const events = (scoreboardData.events || []).slice(0, 104);
  const wcMatches = [];
  const teamAppearances = {};
  
  let matchId = 1;
  for (const e of events) {
    const comp = e.competitions?.[0] || {};
    const competitors = comp.competitors || [];
    if (competitors.length < 2) continue;
    
    const c1 = competitors[0];
    const c2 = competitors[1];
    
    const t1Id = c1.team?.abbreviation;
    const t2Id = c2.team?.abbreviation;
    const t1Name = c1.team?.displayName || "";
    const t2Name = c2.team?.displayName || "";
    
    // Round logic
    let roundVal = 1;
    if (matchId <= 72) {
      if (!teamAppearances[t1Id]) teamAppearances[t1Id] = 0;
      if (!teamAppearances[t2Id]) teamAppearances[t2Id] = 0;
      teamAppearances[t1Id]++;
      teamAppearances[t2Id]++;
      roundVal = Math.max(teamAppearances[t1Id], teamAppearances[t2Id]);
    } else {
      if (matchId <= 88) roundVal = 32;       // Round of 32
      else if (matchId <= 96) roundVal = 16;  // Round of 16
      else if (matchId <= 100) roundVal = 8;  // Quarter-finals
      else if (matchId <= 102) roundVal = 4;  // Semi-finals
      else if (matchId === 103) roundVal = 2; // Third place
      else roundVal = 1;                      // Final
    }
    
    // Group from altGameNote
    let group = "";
    if (matchId <= 72) {
      const note = comp.altGameNote || "";
      const gMatch = note.match(/Group ([A-L])/i);
      if (gMatch) {
        group = gMatch[1].toUpperCase();
      }
    }
    
    // Date/Time conversion to Vietnam Time (GMT+7)
    const dateObj = new Date(e.date);
    const gmt7Date = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000));
    const pad = (n) => String(n).padStart(2, '0');
    const dateFormatted = `${pad(gmt7Date.getUTCDate())}/${pad(gmt7Date.getUTCMonth() + 1)}/${gmt7Date.getUTCFullYear()}`;
    const timeFormatted = `${pad(gmt7Date.getUTCHours())}:${pad(gmt7Date.getUTCMinutes())}`;
    const timestamp = dateObj.getTime();
    
    // Scores and status
    let score1 = null;
    let score2 = null;
    let yc1 = 0;
    let rc1 = 0;
    let yc2 = 0;
    let rc2 = 0;
    let status = "Chưa đấu";
    
    let scorers1 = [];
    let scorers2 = [];
    let assists1 = [];
    let assists2 = [];
    let winnerId = null;
    
    const state = e.status?.type?.state; // "pre" | "in" | "post"
    if (state === "post" || state === "in") {
      status = state === "post" ? "Kết thúc" : "Đang đá";
      score1 = parseInt(c1.score);
      score2 = parseInt(c2.score);
      if (isNaN(score1)) score1 = 0;
      if (isNaN(score2)) score2 = 0;
      
      // Determine winnerId from ESPN API (specifically for penalties or active winners)
      if (c1.winner === true) {
        winnerId = t1Id;
      } else if (c2.winner === true) {
        winnerId = t2Id;
      }
      
      const t1Uid = c1.team?.id;
      const t2Uid = c2.team?.id;
      
      // Extract cards and scorers from details
      const details = comp.details || [];
      for (const d of details) {
        if (d.team?.id) {
          // Yellow cards
          if (d.yellowCard === true) {
            if (String(d.team.id) === String(t1Uid)) yc1++;
            else if (String(d.team.id) === String(t2Uid)) yc2++;
          }
          // Red cards
          if (d.redCard === true) {
            if (String(d.team.id) === String(t1Uid)) rc1++;
            else if (String(d.team.id) === String(t2Uid)) rc2++;
          }
        }
        
        // Scorers
        if (d.scoringPlay === true || d.type?.text === "Goal" || String(d.type?.id) === "70") {
          const athletes = d.athletesInvolved || [];
          let pName = athletes.length > 0 ? athletes[0].displayName : "Unknown";
          const clock = d.clock?.displayValue || "";
          if (d.ownGoal === true) {
            pName = `${pName} (OG)`;
          }
          const sObj = { name: pName, min: clock };
          if (d.team?.id) {
            if (String(d.team.id) === String(t1Uid)) {
              scorers1.push(sObj);
            } else {
              scorers2.push(sObj);
            }
          }
        }
      }
      
      // Fetch assists from ESPN summary API
      if (score1 > 0 || score2 > 0) {
        console.log(`Fetching assists for Match ${matchId}: ${t1Id} vs ${t2Id} (${e.id})...`);
        const resAssists = await fetchAssists(e.id, scorers1, scorers2, t1Name, t2Name);
        assists1 = resAssists[0];
        assists2 = resAssists[1];
      }
    }
    
    wcMatches.push({
      id: "M" + String(matchId).padStart(2, '0'),
      group,
      round: roundVal,
      date: dateFormatted,
      timestamp,
      time: timeFormatted,
      team1Id: t1Id,
      team2Id: t2Id,
      score1,
      score2,
      yc1,
      rc1,
      yc2,
      rc2,
      status,
      scorers1,
      scorers2,
      assists1,
      assists2,
      winnerId
    });
    
    matchId++;
  }
  
  // 3. Format JavaScript replacement content
  const sb = [];
  sb.push("// Dữ liệu lịch thi đấu chính thức vòng bảng World Cup 2026 từ ESPN API (72 trận đấu)");
  sb.push("const OFFICIAL_MATCHES_RAW = [");
  
  for (const m of wcMatches) {
    const scorers1Val = m.scorers1.length > 0
      ? "[" + m.scorers1.map(s => `{ name: "${s.name.replace(/"/g, '\\"')}", min: "${s.min}" }`).join(", ") + "]"
      : "[]";
    const scorers2Val = m.scorers2.length > 0
      ? "[" + m.scorers2.map(s => `{ name: "${s.name.replace(/"/g, '\\"')}", min: "${s.min}" }`).join(", ") + "]"
      : "[]";
    const assists1Val = m.assists1.length > 0
      ? "[" + m.assists1.map(a => `"${a.replace(/"/g, '\\"')}"`).join(", ") + "]"
      : "[]";
    const assists2Val = m.assists2.length > 0
      ? "[" + m.assists2.map(a => `"${a.replace(/"/g, '\\"')}"`).join(", ") + "]"
      : "[]";
      
    const winnerIdVal = m.winnerId ? `"${m.winnerId}"` : "null";
    const score1Val = m.score1 !== null ? m.score1 : "null";
    const score2Val = m.score2 !== null ? m.score2 : "null";
    
    sb.push("  {");
    sb.push(`    id: "${m.id}",`);
    sb.push(`    group: "${m.group}",`);
    sb.push(`    round: ${m.round},`);
    sb.push(`    date: "${m.date}",`);
    sb.push(`    timestamp: ${m.timestamp},`);
    sb.push(`    time: "${m.time}",`);
    sb.push(`    team1Id: "${m.team1Id}",`);
    sb.push(`    team2Id: "${m.team2Id}",`);
    sb.push(`    score1: ${score1Val},`);
    sb.push(`    score2: ${score2Val},`);
    sb.push(`    yc1: ${m.yc1},`);
    sb.push(`    rc1: ${m.rc1},`);
    sb.push(`    yc2: ${m.yc2},`);
    sb.push(`    rc2: ${m.rc2},`);
    sb.push(`    status: "${m.status}",`);
    sb.push(`    scorers1: ${scorers1Val},`);
    sb.push(`    scorers2: ${scorers2Val},`);
    sb.push(`    assists1: ${assists1Val},`);
    sb.push(`    assists2: ${assists2Val},`);
    sb.push(`    winnerId: ${winnerIdVal},`);
    sb.push('    matchTime: ""');
    sb.push("  },");
  }
  sb.push("];");
  sb.push("");
  sb.push("// Hàm bổ trợ tìm kiếm thông tin chi tiết của đội bóng theo ID");
  sb.push("function findTeamById(teamId) {");
  sb.push("  for (const groupLetter of Object.keys(WORLD_CUP_DATA.groups)) {");
  sb.push("    const team = WORLD_CUP_DATA.groups[groupLetter].find(t => t.id === teamId);");
  sb.push("    if (team) return team;");
  sb.push("  }");
  sb.push("  return null;");
  sb.push("}");
  sb.push("");
  sb.push("// Khởi tạo DEFAULT_MATCHES với đầy đủ thông tin tên tiếng Việt, cờ và cờ hiệu");
  sb.push("const DEFAULT_MATCHES = OFFICIAL_MATCHES_RAW.map(match => {");
  sb.push("  const t1 = findTeamById(match.team1Id);");
  sb.push("  const t2 = findTeamById(match.team2Id);");
  sb.push("  return {");
  sb.push("    ...match,");
  sb.push("    team1: t1 ? t1.name : \"\",");
  sb.push("    team1FlagCode: t1 ? t1.flagCode : \"\",");
  sb.push("    team1Flag: t1 ? t1.flag : \"\",");
  sb.push("    team2: t2 ? t2.name : \"\",");
  sb.push("    team2FlagCode: t2 ? t2.flagCode : \"\",");
  sb.push("    team2Flag: t2 ? t2.flag : \"\",");
  sb.push("    matchTime: match.matchTime || \"\"");
  sb.push("  };");
  sb.push("});");
  
  const middlePart = sb.join("\n");
  
  // 4. Concatenate and write back to data.js
  const newContent = headLines.join("\n") + "\n\n" + middlePart + "\n\n" + tailLines.join("\n");
  fs.writeFileSync(dataJsPath, newContent, 'utf8');
  console.log("Successfully updated data.js with 104 official matches, cards, scorers, assists and winnerId!");
  
  // 5. Update index.html query string version to force browser cache bypass
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    const now = new Date();
    const gmt7Now = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const pad2 = (n) => String(n).padStart(2, '0');
    const currentDateStr = `${gmt7Now.getUTCFullYear()}${pad2(gmt7Now.getUTCMonth() + 1)}${pad2(gmt7Now.getUTCDate())}_${pad2(gmt7Now.getUTCHours())}${pad2(gmt7Now.getUTCMinutes())}${pad2(gmt7Now.getUTCSeconds())}`;
    
    indexContent = indexContent.replace(/data\.js\?v=[a-zA-Z0-9_-]+/g, `data.js?v=${currentDateStr}`);
    indexContent = indexContent.replace(/app\.js\?v=[a-zA-Z0-9_-]+/g, `app.js?v=${currentDateStr}`);
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log(`Successfully updated cache-busting version in index.html to ${currentDateStr}`);
  }
}

run().catch(console.error);
