import urllib.request
import json
import re
import sys
import calendar
from datetime import datetime, timezone
import os

# Set encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

script_dir = os.path.dirname(os.path.abspath(__file__))
data_js_path = os.path.join(script_dir, "data.js")

# 1. Read existing data.js to get header and footer
try:
    with open(data_js_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
except Exception as e:
    print(f"Error reading data.js: {e}")
    sys.exit(1)

# Find header and footer boundaries
head_index = -1
for i, line in enumerate(lines):
    if "OFFICIAL_MATCHES_RAW" in line or "FIFA_GROUP_PATTERNS" in line:
        head_index = i - 1
        while head_index >= 0 and (lines[head_index].strip().startswith("//") or lines[head_index].strip() == ""):
            head_index -= 1
        break

tail_index = -1
for i, line in enumerate(lines):
    if "PLAYER_STATS_DATA" in line:
        tail_index = i
        if i > 0 and lines[i-1].strip().startswith("//"):
            tail_index = i - 1
        break

if head_index == -1 or tail_index == -1:
    print(f"Error: Boundaries not found! head={head_index}, tail={tail_index}")
    sys.exit(1)

head_lines = lines[:head_index + 1]
tail_lines = lines[tail_index:]

# 2. Fetch the ESPN World Cup 2026 scoreboard
print("Fetching ESPN scoreboard...")
scoreboard_url = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=150"
req = urllib.request.Request(scoreboard_url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
except Exception as e:
    print(f"Error fetching scoreboard: {e}")
    sys.exit(1)

events = data.get('events', [])
events = events[:104]

# Helper to fetch assists from summary
def fetch_assists(event_id, scorers1, scorers2, t1_name, t2_name):
    assists1 = []
    assists2 = []
    summary_url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event={event_id}"
    req_summary = urllib.request.Request(summary_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req_summary, timeout=5) as resp:
            summary = json.loads(resp.read().decode('utf-8'))
            
        def normalize(name):
            if not name:
                return ""
            import unicodedata
            res = ''.join(c for c in unicodedata.normalize('NFD', name)
                             if unicodedata.category(c) != 'Mn').lower().replace('-', ' ').strip()
            res = res.replace(' (og)', '').replace('(og)', '').strip()
            return res
                             
        def is_in_scorers(name, scorers_list):
            norm = normalize(name)
            return any(normalize(s['name']) == norm for s in scorers_list)

        commentary = summary.get('commentary', [])
        for c in commentary:
            text = c.get('text', '')
            if 'goal!' in text.lower():
                play = c.get('play', {})
                participants = play.get('participants', [])
                if len(participants) >= 2:
                    scorer_name = participants[0].get('athlete', {}).get('displayName')
                    assister = participants[1].get('athlete', {}).get('displayName')
                    play_team = play.get('team', {}).get('displayName', '')
                    if assister and scorer_name:
                        if is_in_scorers(scorer_name, scorers1):
                            assists1.append(assister)
                        elif is_in_scorers(scorer_name, scorers2):
                            assists2.append(assister)
                        elif play_team:
                            norm_play_team = normalize(play_team)
                            norm_t1 = normalize(t1_name)
                            norm_t2 = normalize(t2_name)
                            if norm_play_team == norm_t1 or norm_play_team in norm_t1 or norm_t1 in norm_play_team:
                                assists1.append(assister)
                            elif norm_play_team == norm_t2 or norm_play_team in norm_t2 or norm_t2 in norm_play_team:
                                assists2.append(assister)
    except Exception as ex:
        print(f"  Warning: Could not fetch assists for event {event_id}: {ex}")
    return assists1, assists2

# Parse date helper
def parse_date_time(date_str):
    try:
        dt_match = re.search(r'(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})', date_str)
        if dt_match:
            year, month, day, hour, minute = map(int, dt_match.groups())
            utc_ts = calendar.timegm((year, month, day, hour, minute, 0))
            timestamp = utc_ts * 1000
            
            # GMT+7 time
            local_ts = utc_ts + 7 * 3600
            vn_dt = datetime.fromtimestamp(local_ts, timezone.utc)
            date_formatted = vn_dt.strftime("%d/%m/%Y")
            time_formatted = vn_dt.strftime("%H:%M")
            return timestamp, date_formatted, time_formatted
    except Exception as ex:
        print(f"Error parsing date {date_str}: {ex}")
    return 0, "", ""

wc_matches = []
team_appearances = {}
match_id = 1

for e in events:
    comp = e.get('competitions', [{}])[0]
    competitors = comp.get('competitors', [])
    if len(competitors) < 2:
        continue
    c1 = competitors[0]
    c2 = competitors[1]
    
    t1_id = c1.get('team', {}).get('abbreviation')
    t2_id = c2.get('team', {}).get('abbreviation')
    t1_name = c1.get('team', {}).get('displayName')
    t2_name = c2.get('team', {}).get('displayName')
    
    # Calculate round
    team_appearances[t1_id] = team_appearances.get(t1_id, 0) + 1
    team_appearances[t2_id] = team_appearances.get(t2_id, 0) + 1
    
    if match_id <= 72:
        round_val = max(team_appearances[t1_id], team_appearances[t2_id])
    elif match_id <= 88:
        round_val = 32
    elif match_id <= 96:
        round_val = 16
    elif match_id <= 100:
        round_val = 8
    elif match_id <= 102:
        round_val = 4
    elif match_id == 103:
        round_val = 2
    else:
        round_val = 1
        
    group = ""
    if match_id <= 72:
        note = comp.get('altGameNote', '')
        g_match = re.search(r'Group ([A-L])', note)
        if g_match:
            group = g_match.group(1)
        
    timestamp, date_formatted, time_formatted = parse_date_time(e.get('date', ''))

    score1 = "null"
    score2 = "null"
    yc1, rc1, yc2, rc2 = 0, 0, 0, 0
    status = "Chưa đấu"
    scorers1, scorers2 = [], []
    assists1, assists2 = [], []
    penaltyWinner = "null"
    shootoutScore1 = "null"
    shootoutScore2 = "null"
    
    state = e.get('status', {}).get('type', {}).get('state', '')
    if state in ("post", "in"):
        status = "Kết thúc" if state == "post" else "Đang đá"
        try:
            score1 = int(c1.get('score', 0))
            score2 = int(c2.get('score', 0))
        except:
            score1 = 0
            score2 = 0
            
        t1_uid = c1.get('team', {}).get('id')
        t2_uid = c2.get('team', {}).get('id')
        details = comp.get('details', [])
        for d in details:
            if d.get('yellowCard') is True:
                if str(d.get('team', {}).get('id')) == str(t1_uid): yc1 += 1
                elif str(d.get('team', {}).get('id')) == str(t2_uid): yc2 += 1
            if d.get('redCard') is True:
                if str(d.get('team', {}).get('id')) == str(t1_uid): rc1 += 1
                elif str(d.get('team', {}).get('id')) == str(t2_uid): rc2 += 1
            if d.get('scoringPlay') is True or d.get('type', {}).get('text') == 'Goal' or d.get('type', {}).get('id') == '70':
                athletes = d.get('athletesInvolved', [])
                p_name = athletes[0].get('displayName') if athletes else "Unknown"
                clock = d.get('clock', {}).get('displayValue', '')
                if d.get('ownGoal') is True: p_name = f"{p_name} (OG)"
                s_obj = {"name": p_name, "min": clock}
                if str(d.get('team', {}).get('id')) == str(t1_uid): scorers1.append(s_obj)
                else: scorers2.append(s_obj)
                    
        if score1 > 0 or score2 > 0:
            print(f"Fetching assists for Match {match_id}: {t1_id} vs {t2_id} ({e.get('id')})...")
            assists1, assists2 = fetch_assists(e.get('id'), scorers1, scorers2, t1_name, t2_name)
            
        # Parse Penalty
        if score1 == score2 and match_id > 72:
            s_score1 = c1.get('shootoutScore')
            s_score2 = c2.get('shootoutScore')
            if s_score1 is not None and s_score2 is not None:
                shootoutScore1 = int(s_score1)
                shootoutScore2 = int(s_score2)
            
            w1 = c1.get('winner')
            w2 = c2.get('winner')
            if w1 is True:
                penaltyWinner = 1
            elif w2 is True:
                penaltyWinner = 2

    m_obj = {
        "id": f"M{str(match_id).zfill(2)}",
        "group": group,
        "round": round_val,
        "date": date_formatted,
        "timestamp": timestamp,
        "time": time_formatted,
        "team1Id": t1_id,
        "team2Id": t2_id,
        "score1": score1,
        "score2": score2,
        "yc1": yc1,
        "rc1": rc1,
        "yc2": yc2,
        "rc2": rc2,
        "status": status,
        "scorers1": scorers1,
        "scorers2": scorers2,
        "assists1": assists1,
        "assists2": assists2,
        "penaltyWinner": penaltyWinner,
        "shootoutScore1": shootoutScore1,
        "shootoutScore2": shootoutScore2
    }
    wc_matches.append(m_obj)
    match_id += 1

# Write to data.js
sb = []
sb.append("// Dữ liệu lịch thi đấu chính thức vòng bảng World Cup 2026 từ ESPN API (72 trận đấu)")
sb.append("const OFFICIAL_MATCHES_RAW = [")

for m in wc_matches:
    s1_items = [f'{{ name: "{s["name"]}", min: "{s["min"]}" }}' for s in m["scorers1"]]
    s1_str = "[" + ", ".join(s1_items) + "]"
    
    s2_items = [f'{{ name: "{s["name"]}", min: "{s["min"]}" }}' for s in m["scorers2"]]
    s2_str = "[" + ", ".join(s2_items) + "]"
    
    a1_items = [f'"{a}"' for a in m["assists1"]]
    a1_str = "[" + ", ".join(a1_items) + "]"
    
    a2_items = [f'"{a}"' for a in m["assists2"]]
    a2_str = "[" + ", ".join(a2_items) + "]"

    sb.append("  {")
    sb.append(f'    id: "{m["id"]}",')
    sb.append(f'    group: "{m["group"]}",')
    sb.append(f'    round: {m["round"]},')
    sb.append(f'    date: "{m["date"]}",')
    sb.append(f'    timestamp: {m["timestamp"]},')
    sb.append(f'    time: "{m["time"]}",')
    sb.append(f'    team1Id: "{m["team1Id"]}",')
    sb.append(f'    team2Id: "{m["team2Id"]}",')
    sb.append(f'    score1: {m["score1"]},')
    sb.append(f'    score2: {m["score2"]},')
    sb.append(f'    yc1: {m["yc1"]},')
    sb.append(f'    rc1: {m["rc1"]},')
    sb.append(f'    yc2: {m["yc2"]},')
    sb.append(f'    rc2: {m["rc2"]},')
    sb.append(f'    status: "{m["status"]}",')
    sb.append(f'    scorers1: {s1_str},')
    sb.append(f'    scorers2: {s2_str},')
    sb.append(f'    assists1: {a1_str},')
    sb.append(f'    assists2: {a2_str},')
    sb.append(f'    penaltyWinner: {m["penaltyWinner"]},')
    sb.append(f'    shootoutScore1: {m["shootoutScore1"]},')
    sb.append(f'    shootoutScore2: {m["shootoutScore2"]},')
    sb.append('    matchTime: ""')
    sb.append("  },")

sb.append("];")
sb.append("")
sb.append("// Hàm bổ trợ tìm kiếm thông tin chi tiết của đội bóng theo ID")
sb.append("function findTeamById(teamId) {")
sb.append("  for (const groupLetter of Object.keys(WORLD_CUP_DATA.groups)) {")
sb.append("    const team = WORLD_CUP_DATA.groups[groupLetter].find(t => t.id === teamId);")
sb.append("    if (team) return team;")
sb.append("  }")
sb.append("  return null;")
sb.append("}")
sb.append("")
sb.append("// Khởi tạo DEFAULT_MATCHES với đầy đủ thông tin tên tiếng Việt, cờ và cờ hiệu")
sb.append("const DEFAULT_MATCHES = OFFICIAL_MATCHES_RAW.map(match => {")
sb.append("  const t1 = findTeamById(match.team1Id);")
sb.append("  const t2 = findTeamById(match.team2Id);")
sb.append("  return {")
sb.append("    ...match,")
sb.append("    team1: t1 ? t1.name : \"\",")
sb.append("    team1FlagCode: t1 ? t1.flagCode : \"\",")
sb.append("    team1Flag: t1 ? t1.flag : \"\",")
sb.append("    team2: t2 ? t2.name : \"\",")
sb.append("    team2FlagCode: t2 ? t2.flagCode : \"\",")
sb.append("    team2Flag: t2 ? t2.flag : \"\",")
sb.append("    matchTime: match.matchTime || \"\"")
sb.append("  };")
sb.append("});")

middle_part = "\n".join(sb)

# Concatenate and write back
new_content = "".join(head_lines) + "\n\n" + middle_part + "\n\n" + "".join(tail_lines)

try:
    with open(data_js_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully updated data.js with 104 official matches, cards, scorers AND assists!")
except Exception as e:
    print(f"Error writing to data.js: {e}")

# 5. Update index.html query string version to force browser cache bypass
index_path = os.path.join(script_dir, "index.html")
if os.path.exists(index_path):
    try:
        with open(index_path, "r", encoding="utf-8") as f:
            index_content = f.read()
        current_date_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        new_index_content = re.sub(r'data\.js\?v=[a-zA-Z0-9_-]+', f"data.js?v={current_date_str}", index_content)
        new_index_content = re.sub(r'app\.js\?v=[a-zA-Z0-9_-]+', f"app.js?v={current_date_str}", new_index_content)
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(new_index_content)
        print(f"Successfully updated cache-busting version in index.html to {current_date_str}")
    except Exception as e:
        print(f"Error updating index.html cache-busting version: {e}")
