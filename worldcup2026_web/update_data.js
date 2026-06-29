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

// Replicate assignThirdPlacedTeams from app.js
function assignThirdPlacedTeams(qualifiedThirds) {
  const slots = [
    { id: "M74", allowedGroups: ["A", "B", "C", "D", "F"] },
    { id: "M77", allowedGroups: ["C", "D", "F", "G", "H"] },
    { id: "M79", allowedGroups: ["C", "E", "F", "H", "I"] },
    { id: "M80", allowedGroups: ["E", "H", "I", "J", "K"] },
    { id: "M81", allowedGroups: ["B", "E", "F", "I", "J"] },
    { id: "M82", allowedGroups: ["A", "E", "H", "I", "J"] },
    { id: "M85", allowedGroups: ["E", "F", "G", "I", "J"] },
    { id: "M87", allowedGroups: ["D", "E", "I", "J", "L"] }
  ];

  const assignment = {};
  const used = new Array(qualifiedThirds.length).fill(false);

  function backtrack(slotIdx) {
    if (slotIdx === slots.length) return true;
    const slot = slots[slotIdx];
    for (let i = 0; i < qualifiedThirds.length; i++) {
      if (!used[i]) {
        const team = qualifiedThirds[i];
        if (slot.allowedGroups.includes(team.group)) {
          used[i] = true;
          assignment[slot.id] = team;
          if (backtrack(slotIdx + 1)) return true;
          used[i] = false;
          delete assignment[slot.id];
        }
      }
    }
    return false;
  }

  const success = backtrack(0);
  if (success) {
    return assignment;
  } else {
    const fallbackAssignment = {};
    slots.forEach((slot, idx) => {
      fallbackAssignment[slot.id] = qualifiedThirds[idx] || null;
    });
    return fallbackAssignment;
  }
}

// Replicate bracket team resolution
function resolveStandingsAndBracket(WORLD_CUP_DATA, OFFICIAL_MATCHES_RAW) {
  const teamStats = {};
  Object.keys(WORLD_CUP_DATA.groups).forEach(g => {
    WORLD_CUP_DATA.groups[g].forEach(t => {
      teamStats[t.id] = {
        id: t.id,
        name: t.name,
        group: g,
        flagCode: t.flagCode,
        flag: t.flag,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0,
        yc: 0,
        rc: 0
      };
    });
  });

  // Calculate group stage standings
  OFFICIAL_MATCHES_RAW.forEach(match => {
    if (match.round <= 3 && match.score1 !== null && match.score2 !== null) {
      const t1 = teamStats[match.team1Id];
      const t2 = teamStats[match.team2Id];
      if (t1 && t2) {
        t1.played += 1;
        t2.played += 1;
        t1.gf += match.score1;
        t1.ga += match.score2;
        t2.gf += match.score2;
        t2.ga += match.score1;
        t1.yc += match.yc1;
        t1.rc += match.rc1;
        t2.yc += match.yc2;
        t2.rc += match.rc2;
        
        if (match.score1 > match.score2) {
          t1.won += 1;
          t1.points += 3;
          t2.lost += 1;
        } else if (match.score1 < match.score2) {
          t2.won += 1;
          t2.points += 3;
          t1.lost += 1;
        } else {
          t1.drawn += 1;
          t1.points += 1;
          t2.drawn += 1;
          t2.points += 1;
        }
      }
    }
  });

  const groupStandings = {};
  const thirdPlaceStandings = [];
  
  Object.keys(WORLD_CUP_DATA.groups).forEach(g => {
    const stands = WORLD_CUP_DATA.groups[g].map(t => {
      const s = teamStats[t.id];
      s.gd = s.gf - s.ga;
      s.fairPlay = s.yc * 1 + s.rc * 3;
      return s;
    });
    stands.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      if (a.fairPlay !== b.fairPlay) return a.fairPlay - b.fairPlay;
      return a.id.localeCompare(b.id);
    });
    groupStandings[g] = stands;
    
    const thirdTeam = stands[2];
    if (thirdTeam) {
      thirdPlaceStandings.push(thirdTeam);
    }
  });

  thirdPlaceStandings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    if (a.fairPlay !== b.fairPlay) return a.fairPlay - b.fairPlay;
    return a.id.localeCompare(b.id);
  });

  const activeThirds = thirdPlaceStandings.slice(0, 8);
  const assignedThirds = assignThirdPlacedTeams(activeThirds);

  const getTeam = (group, rank) => groupStandings[group][rank];

  const resolvedTeams = {};
  const r32Slots = {
    M73: { t1: getTeam("A", 1), t2: getTeam("B", 1) },
    M74: { t1: getTeam("E", 0), t2: assignedThirds.M74 },
    M75: { t1: getTeam("F", 0), t2: getTeam("C", 1) },
    M76: { t1: getTeam("C", 0), t2: getTeam("F", 1) },
    M77: { t1: getTeam("I", 0), t2: assignedThirds.M77 },
    M78: { t1: getTeam("E", 1), t2: getTeam("I", 1) },
    M79: { t1: getTeam("A", 0), t2: assignedThirds.M79 },
    M80: { t1: getTeam("L", 0), t2: assignedThirds.M80 },
    M81: { t1: getTeam("D", 0), t2: assignedThirds.M81 },
    M82: { t1: getTeam("G", 0), t2: assignedThirds.M82 },
    M83: { t1: getTeam("K", 1), t2: getTeam("L", 1) },
    M84: { t1: getTeam("H", 0), t2: getTeam("J", 1) },
    M85: { t1: getTeam("B", 0), t2: assignedThirds.M85 },
    M86: { t1: getTeam("J", 0), t2: getTeam("H", 1) },
    M87: { t1: getTeam("K", 0), t2: assignedThirds.M87 },
    M88: { t1: getTeam("D", 1), t2: getTeam("G", 1) }
  };

  Object.keys(r32Slots).forEach(id => {
    resolvedTeams[id] = r32Slots[id];
  });

  const getWinner = (matchId) => {
    const match = OFFICIAL_MATCHES_RAW.find(m => m.id === matchId);
    const slot = resolvedTeams[matchId];
    if (match && slot && match.score1 !== null && match.score2 !== null) {
      if (match.winnerId) {
        return match.winnerId === slot.t1.id ? slot.t1 : slot.t2;
      }
      if (match.score1 > match.score2) return slot.t1;
      if (match.score2 > match.score1) return slot.t2;
    }
    return { id: `WINNER-OF-${matchId}`, name: `Thắng Trận ${matchId.replace("M", "")}` };
  };

  const getLoser = (matchId) => {
    const match = OFFICIAL_MATCHES_RAW.find(m => m.id === matchId);
    const slot = resolvedTeams[matchId];
    if (match && slot && match.score1 !== null && match.score2 !== null) {
      if (match.winnerId) {
        return match.winnerId === slot.t1.id ? slot.t2 : slot.t1;
      }
      if (match.score1 > match.score2) return slot.t2;
      if (match.score2 > match.score1) return slot.t1;
    }
    return { id: `LOSER-OF-${matchId}`, name: `Thua Trận ${matchId.replace("M", "")}` };
  };

  // R16 (M89 to M96)
  resolvedTeams.M89 = { t1: getWinner("M74"), t2: getWinner("M77") };
  resolvedTeams.M90 = { t1: getWinner("M73"), t2: getWinner("M75") };
  resolvedTeams.M91 = { t1: getWinner("M76"), t2: getWinner("M78") };
  resolvedTeams.M92 = { t1: getWinner("M79"), t2: getWinner("M80") };
  resolvedTeams.M93 = { t1: getWinner("M83"), t2: getWinner("M84") };
  resolvedTeams.M94 = { t1: getWinner("M81"), t2: getWinner("M82") };
  resolvedTeams.M95 = { t1: getWinner("M86"), t2: getWinner("M88") };
  resolvedTeams.M96 = { t1: getWinner("M85"), t2: getWinner("M87") };

  // QF (M97 to M100)
  resolvedTeams.M97 = { t1: getWinner("M89"), t2: getWinner("M90") };
  resolvedTeams.M98 = { t1: getWinner("M93"), t2: getWinner("M94") };
  resolvedTeams.M99 = { t1: getWinner("M91"), t2: getWinner("M92") };
  resolvedTeams.M100 = { t1: getWinner("M95"), t2: getWinner("M96") };

  // SF (M101 to M102)
  resolvedTeams.M101 = { t1: getWinner("M97"), t2: getWinner("M98") };
  resolvedTeams.M102 = { t1: getWinner("M99"), t2: getWinner("M100") };

  // Third place and Final (M103, M104)
  resolvedTeams.M103 = { t1: getLoser("M101"), t2: getLoser("M102") };
  resolvedTeams.M104 = { t1: getWinner("M101"), t2: getWinner("M102") };

  return resolvedTeams;
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
  
  // Evaluate the data.js content in sandbox to calculate expected teams
  const sandbox = { window: {} };
  const runCode = new Function('sandbox', content + '\nreturn { WORLD_CUP_DATA, OFFICIAL_MATCHES_RAW };');
  const { WORLD_CUP_DATA, OFFICIAL_MATCHES_RAW: originalMatches } = runCode(sandbox);
  
  // Resolve teams for bracket slots dynamically
  const resolvedSlots = resolveStandingsAndBracket(WORLD_CUP_DATA, originalMatches);
  
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
  const wcMatches = new Array(104).fill(null);
  
  const getRoundForMatchId = (matchIdNum) => {
    if (matchIdNum <= 72) return 3;
    if (matchIdNum <= 88) return 32;
    if (matchIdNum <= 96) return 16;
    if (matchIdNum <= 100) return 8;
    if (matchIdNum <= 102) return 4;
    if (matchIdNum === 103) return 2;
    return 1;
  };
  
  // First, map group stage matches (M01 to M72) chronologically
  for (let i = 0; i < 72; i++) {
    const e = events[i];
    if (!e) continue;
    
    const comp = e.competitions?.[0] || {};
    const competitors = comp.competitors || [];
    const c1 = competitors[0];
    const c2 = competitors[1];
    const t1Id = c1.team?.abbreviation;
    const t2Id = c2.team?.abbreviation;
    const t1Name = c1.team?.displayName || "";
    const t2Name = c2.team?.displayName || "";
    
    // Group stage group note
    let group = "";
    const note = comp.altGameNote || "";
    const gMatch = note.match(/Group ([A-L])/i);
    if (gMatch) {
      group = gMatch[1].toUpperCase();
    }
    
    // Date/Time conversion to Vietnam Time (GMT+7)
    const dateObj = new Date(e.date);
    const gmt7Date = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000));
    const pad = (n) => String(n).padStart(2, '0');
    const dateFormatted = `${pad(gmt7Date.getUTCDate())}/${pad(gmt7Date.getUTCMonth() + 1)}/${gmt7Date.getUTCFullYear()}`;
    const timeFormatted = `${pad(gmt7Date.getUTCHours())}:${pad(gmt7Date.getUTCMinutes())}`;
    const timestamp = dateObj.getTime();
    
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
    
    const state = e.status?.type?.state;
    if (state === "post" || state === "in") {
      status = state === "post" ? "Kết thúc" : "Đang đá";
      score1 = parseInt(c1.score);
      score2 = parseInt(c2.score);
      if (isNaN(score1)) score1 = 0;
      if (isNaN(score2)) score2 = 0;
      
      const t1Uid = c1.team?.id;
      const t2Uid = c2.team?.id;
      
      const details = comp.details || [];
      for (const d of details) {
        if (d.team?.id) {
          if (d.yellowCard === true) {
            if (String(d.team.id) === String(t1Uid)) yc1++;
            else if (String(d.team.id) === String(t2Uid)) yc2++;
          }
          if (d.redCard === true) {
            if (String(d.team.id) === String(t1Uid)) rc1++;
            else if (String(d.team.id) === String(t2Uid)) rc2++;
          }
        }
        if (d.scoringPlay === true || d.type?.text === "Goal" || String(d.type?.id) === "70") {
          const athletes = d.athletesInvolved || [];
          let pName = athletes.length > 0 ? athletes[0].displayName : "Unknown";
          const clock = d.clock?.displayValue || "";
          if (d.ownGoal === true) pName = `${pName} (OG)`;
          const sObj = { name: pName, min: clock };
          if (d.team?.id) {
            if (String(d.team.id) === String(t1Uid)) scorers1.push(sObj);
            else scorers2.push(sObj);
          }
        }
      }
      
      if (score1 > 0 || score2 > 0) {
        const resAssists = await fetchAssists(e.id, scorers1, scorers2, t1Name, t2Name);
        assists1 = resAssists[0];
        assists2 = resAssists[1];
      }
    }
    
    wcMatches[i] = {
      id: "M" + String(i + 1).padStart(2, '0'),
      group,
      round: 1,
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
      winnerId: null
    };
  }
  
  // Track appearances in group stage
  const teamAppearances = {};
  for (let i = 0; i < 72; i++) {
    const m = wcMatches[i];
    if (m) {
      if (!teamAppearances[m.team1Id]) teamAppearances[m.team1Id] = 0;
      if (!teamAppearances[m.team2Id]) teamAppearances[m.team2Id] = 0;
      teamAppearances[m.team1Id]++;
      teamAppearances[m.team2Id]++;
      m.round = Math.max(teamAppearances[m.team1Id], teamAppearances[m.team2Id]);
    }
  }
  
  // Extract remaining ESPN events (knockouts, index 72 to 103)
  const koEvents = events.slice(72);
  const matchedEventsMap = {};
  
  // Map each knockout match ID M73 to M104 to its corresponding ESPN event
  for (let matchIdNum = 73; matchIdNum <= 104; matchIdNum++) {
    const id = "M" + matchIdNum;
    const slot = resolvedSlots[id];
    
    if (!slot) continue;
    
    const slotRound = getRoundForMatchId(matchIdNum);
    
    // Find ESPN event by team IDs
    let matchedEvent = null;
    
    // 1. Try exact match by both teams (order-independent)
    if (slot.t1?.id && slot.t2?.id) {
      matchedEvent = koEvents.find(e => {
        const eventIdx = events.indexOf(e);
        const eventRound = getRoundForMatchId(eventIdx + 1);
        if (eventRound !== slotRound) return false;
        
        const comp = e.competitions?.[0] || {};
        const competitors = comp.competitors || [];
        if (competitors.length < 2) return false;
        const t1 = competitors[0].team?.abbreviation;
        const t2 = competitors[1].team?.abbreviation;
        return (t1 === slot.t1.id && t2 === slot.t2.id) || (t1 === slot.t2.id && t2 === slot.t1.id);
      });
    }
    
    // 2. Try partial match by primary team (t1) if exact match not found
    if (!matchedEvent && slot.t1?.id && !slot.t1.id.startsWith("WINNER-OF-") && !slot.t1.id.startsWith("LOSER-OF-")) {
      matchedEvent = koEvents.find(e => {
        const eventIdx = events.indexOf(e);
        const eventRound = getRoundForMatchId(eventIdx + 1);
        if (eventRound !== slotRound) return false;
        
        const comp = e.competitions?.[0] || {};
        const competitors = comp.competitors || [];
        if (competitors.length < 2) return false;
        const t1 = competitors[0].team?.abbreviation;
        const t2 = competitors[1].team?.abbreviation;
        return t1 === slot.t1.id || t2 === slot.t1.id;
      });
    }
    
    // 3. Fallback: use chronological index if still not matched
    if (!matchedEvent) {
      matchedEvent = events[matchIdNum - 1];
    }
    
    if (matchedEvent) {
      matchedEventsMap[id] = matchedEvent;
    }
  }
  
  // Format the matched knockout events and put them in wcMatches
  for (let matchIdNum = 73; matchIdNum <= 104; matchIdNum++) {
    const id = "M" + matchIdNum;
    const slot = resolvedSlots[id];
    const e = matchedEventsMap[id];
    
    if (!e) continue;
    
    const comp = e.competitions?.[0] || {};
    const competitors = comp.competitors || [];
    const c1 = competitors[0];
    const c2 = competitors[1];
    const t1Id = c1?.team?.abbreviation;
    const t2Id = c2?.team?.abbreviation;
    const t1Name = c1?.team?.displayName || "";
    const t2Name = c2?.team?.displayName || "";
    
    // Check if the home/away order in ESPN is swapped compared to our bracket slot
    // Slot expected order is: slot.t1 vs slot.t2
    // ESPN order is: t1Id vs t2Id
    const isSwapped = slot.t2?.id && (t1Id === slot.t2.id || t2Id === slot.t1.id);
    
    // Date/Time conversion to Vietnam Time (GMT+7)
    const dateObj = new Date(e.date);
    const gmt7Date = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000));
    const pad = (n) => String(n).padStart(2, '0');
    const dateFormatted = `${pad(gmt7Date.getUTCDate())}/${pad(gmt7Date.getUTCMonth() + 1)}/${gmt7Date.getUTCFullYear()}`;
    const timeFormatted = `${pad(gmt7Date.getUTCHours())}:${pad(gmt7Date.getUTCMinutes())}`;
    const timestamp = dateObj.getTime();
    
    let roundVal = getRoundForMatchId(matchIdNum);
    
    let score1 = null;
    let score2 = null;
    let yc1 = 0, rc1 = 0, yc2 = 0, rc2 = 0;
    let scorers1 = [], scorers2 = [], assists1 = [], assists2 = [];
    let winnerId = null;
    
    const state = e.status?.type?.state;
    if (state === "post" || state === "in") {
      status = state === "post" ? "Kết thúc" : "Đang đá";
      
      let rawScore1 = parseInt(c1.score);
      let rawScore2 = parseInt(c2.score);
      if (isNaN(rawScore1)) rawScore1 = 0;
      if (isNaN(rawScore2)) rawScore2 = 0;
      
      // Determine winner team ID
      let rawWinnerId = null;
      if (c1.winner === true) rawWinnerId = t1Id;
      else if (c2.winner === true) rawWinnerId = t2Id;
      
      const t1Uid = c1.team?.id;
      const t2Uid = c2.team?.id;
      
      let rawYc1 = 0, rawRc1 = 0, rawYc2 = 0, rawRc2 = 0;
      let rawScorers1 = [], rawScorers2 = [];
      
      const details = comp.details || [];
      for (const d of details) {
        if (d.team?.id) {
          if (d.yellowCard === true) {
            if (String(d.team.id) === String(t1Uid)) rawYc1++;
            else if (String(d.team.id) === String(t2Uid)) rawYc2++;
          }
          if (d.redCard === true) {
            if (String(d.team.id) === String(t1Uid)) rawRc1++;
            else if (String(d.team.id) === String(t2Uid)) rawRc2++;
          }
        }
        if (d.scoringPlay === true || d.type?.text === "Goal" || String(d.type?.id) === "70") {
          const athletes = d.athletesInvolved || [];
          let pName = athletes.length > 0 ? athletes[0].displayName : "Unknown";
          const clock = d.clock?.displayValue || "";
          if (d.ownGoal === true) pName = `${pName} (OG)`;
          const sObj = { name: pName, min: clock };
          if (d.team?.id) {
            if (String(d.team.id) === String(t1Uid)) rawScorers1.push(sObj);
            else rawScorers2.push(sObj);
          }
        }
      }
      
      let rawAssists1 = [], rawAssists2 = [];
      if (rawScore1 > 0 || rawScore2 > 0) {
        const resAssists = await fetchAssists(e.id, rawScorers1, rawScorers2, t1Name, t2Name);
        rawAssists1 = resAssists[0];
        rawAssists2 = resAssists[1];
      }
      
      // Assign and swap if necessary to match the bracket slot team order
      if (isSwapped) {
        score1 = rawScore2;
        score2 = rawScore1;
        yc1 = rawYc2;
        rc1 = rawRc2;
        yc2 = rawYc1;
        rc2 = rawRc1;
        scorers1 = rawScorers2;
        scorers2 = rawScorers1;
        assists1 = rawAssists2;
        assists2 = rawAssists1;
        winnerId = rawWinnerId;
      } else {
        score1 = rawScore1;
        score2 = rawScore2;
        yc1 = rawYc1;
        rc1 = rawRc1;
        yc2 = rawYc2;
        rc2 = rawRc2;
        scorers1 = rawScorers1;
        scorers2 = rawScorers2;
        assists1 = rawAssists1;
        assists2 = rawAssists2;
        winnerId = rawWinnerId;
      }
    } else {
      status = "Chưa đấu";
    }
    
    // The bracket match team IDs will resolve at runtime, but we write slot.t1/t2 IDs as static fallback
    const staticT1Id = slot.t1?.id && !slot.t1.id.startsWith("WINNER-OF-") && !slot.t1.id.startsWith("LOSER-OF-") ? slot.t1.id : (isSwapped ? t2Id : t1Id);
    const staticT2Id = slot.t2?.id && !slot.t2.id.startsWith("WINNER-OF-") && !slot.t2.id.startsWith("LOSER-OF-") ? slot.t2.id : (isSwapped ? t1Id : t2Id);
    
    wcMatches[matchIdNum - 1] = {
      id,
      group: "",
      round: roundVal,
      date: dateFormatted,
      timestamp,
      time: timeFormatted,
      team1Id: staticT1Id,
      team2Id: staticT2Id,
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
    };
  }
  
  // Fill any empty slots with fallback original match structure to prevent errors
  for (let i = 0; i < 104; i++) {
    if (!wcMatches[i]) {
      const orig = originalMatches[i];
      wcMatches[i] = {
        ...orig,
        winnerId: orig.winnerId || null
      };
    }
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
