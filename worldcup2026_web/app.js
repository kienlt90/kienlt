// Logic điều khiển và tính toán Web App World Cup 2026

document.addEventListener("DOMContentLoaded", () => {
  // --- TRẠNG THÁI ỨNG DỤNG (STATE) ---
  let matches = [];
  let teamStats = {}; // { teamId: { ... } }
  let groupStandings = {}; // { A: [team1, team2, team3, team4], ... }
  let thirdPlaceStandings = []; // Danh sách 12 đội xếp thứ 3
  let activePlayerStats = {}; // Thống kê tất cả cầu thủ thực tế ghi bàn/kiến tạo
  let isFirstLoad = true;

  // Helper lấy thông tin cầu thủ theo chỉ số mục tiêu
  function getPlayerFromTeam(teamName, idx) {
    if (typeof TEAM_PLAYERS !== "undefined" && TEAM_PLAYERS[teamName]) {
      const players = TEAM_PLAYERS[teamName];
      return players[idx % players.length];
    }
    return { name: `Cầu thủ ${idx + 1} (${teamName})`, flagCode: "" };
  }

  // Helper tìm mã cờ quốc gia của cầu thủ dựa trên tên
  function getPlayerFlagCode(teamName, playerName) {
    if (typeof TEAM_PLAYERS !== "undefined" && TEAM_PLAYERS[teamName]) {
      const players = TEAM_PLAYERS[teamName];
      const found = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
      if (found) return found.flagCode;
    }
    if (typeof TEAM_PLAYERS !== "undefined") {
      for (const tName of Object.keys(TEAM_PLAYERS)) {
        const found = TEAM_PLAYERS[tName].find(p => p.name.toLowerCase() === playerName.toLowerCase());
        if (found) return found.flagCode;
      }
    }
    return "";
  }

  // Helper thống nhất để lấy danh sách cầu thủ ghi bàn của trận đấu
  function getScorersForMatch(match, teamNum) {
    const score = teamNum === 1 ? match.score1 : match.score2;
    const scorersArray = teamNum === 1 ? match.scorers1 : match.scorers2;
    const teamName = teamNum === 1 ? match.team1 : match.team2;
    
    if (score === null || score <= 0) return [];
    
    const result = [];
    if (scorersArray && scorersArray.length > 0) {
      for (let i = 0; i < Math.min(score, scorersArray.length); i++) {
        result.push(scorersArray[i]);
      }
    }
    // Điền thêm các cầu thủ mặc định nếu thiếu
    while (result.length < score) {
      const idx = result.length;
      const player = getPlayerFromTeam(teamName, idx);
      let min = 15 + idx * 22 + (parseInt(match.id.substring(1)) * 7 + idx * 13) % 20;
      if (min > 90) min = 89;
      result.push({ name: player.name, min: min + "'" });
    }
    return result;
  }

  // --- PHẦN KHỞI TẠO (INIT) ---
  function init() {
    // 1. Tải dữ liệu từ localStorage hoặc dùng dữ liệu mặc định (Có kiểm tra phiên bản dữ liệu sạch và tự động đồng bộ kết quả chính thức đã kết thúc)
    const CURRENT_VERSION = "17.0";
    const savedVersion = localStorage.getItem("wc2026_version");
    const savedMatches = localStorage.getItem("wc2026_matches");

    if (savedVersion !== CURRENT_VERSION) {
      console.log("Phiên bản mới phát hiện. Khởi tạo lại toàn bộ dữ liệu sạch cho World Cup 2026.");
      localStorage.setItem("wc2026_version", CURRENT_VERSION);
      matches = [...DEFAULT_MATCHES];
    } else if (savedMatches) {
      try {
        const parsed = JSON.parse(savedMatches);
        // Tự động đồng bộ các trận đấu đã kết thúc từ DEFAULT_MATCHES để tránh lệch kết quả chính thức
        matches = DEFAULT_MATCHES.map(defaultMatch => {
          const savedMatch = parsed.find(m => m.id === defaultMatch.id);
          if (savedMatch) {
            // Nếu trận đấu trong mã nguồn mặc định đã Kết thúc, bắt buộc lấy từ mặc định
            if (defaultMatch.status === "Kết thúc") {
              return defaultMatch;
            }
            return savedMatch;
          }
          return defaultMatch;
        });
      } catch (e) {
        console.error("Lỗi parse savedMatches:", e);
        matches = [...DEFAULT_MATCHES];
      }
    } else {
      matches = [...DEFAULT_MATCHES];
      localStorage.setItem("wc2026_version", CURRENT_VERSION);
    }
    // Lưu lại trạng thái đã đồng bộ/cập nhật vào localStorage
    localStorage.setItem("wc2026_matches", JSON.stringify(matches));

    // 2. Thiết lập chuyển Tab
    setupTabs();

    // 3. Thiết lập các bộ lọc sự kiện
    setupFilters();

    // 4. Thiết lập các nút bấm điều hướng & hành động toàn cục
    setupGlobalActions();

    // 5. Tính toán dữ liệu & Hiển thị lần đầu
    recalculateAll();

    // 6. Tự động đồng bộ từ ESPN Live trong background (không hiện thông báo)
    setTimeout(() => {
      fetchLiveScoresFromESPN(true);
    }, 1500);

    // Thiết lập chu kỳ tự động cập nhật sau mỗi 60 giây
    setInterval(() => {
      fetchLiveScoresFromESPN(true);
    }, 60000);
  }

  // --- CHUYỂN ĐỔI TAB ---
  function setupTabs() {
    const navButtons = document.querySelectorAll(".nav-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");

        navButtons.forEach(b => b.classList.remove("active"));
        tabContents.forEach(c => c.classList.remove("active"));

        btn.classList.add("active");
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
          targetContent.classList.add("active");
        }
      });
    });

    // Tab switching inside starting lineups modal
    document.querySelectorAll(".lineup-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".lineup-tab-btn").forEach(b => {
          b.classList.remove("active");
          b.classList.add("secondary-btn");
        });
        btn.classList.add("active");
        btn.classList.remove("secondary-btn");
        
        const tab = btn.getAttribute("data-tab");
        if (tab === "list") {
          document.getElementById("lineup-tab-list").style.display = "block";
          document.getElementById("lineup-tab-pitch").style.display = "none";
        } else {
          document.getElementById("lineup-tab-list").style.display = "none";
          document.getElementById("lineup-tab-pitch").style.display = "block";
        }
      });
    });
  }

  // --- BỘ LỌC TRẬN ĐẤU ---
  function setupFilters() {
    const groupSelect = document.getElementById("filter-group-select");
    const roundSelect = document.getElementById("filter-round-select");
    const statusSelect = document.getElementById("filter-status-select");
    const dateSelect = document.getElementById("filter-date-select");

    // Điền danh sách các ngày thi đấu động từ dữ liệu trận đấu
    populateDateFilter();

    const filterHandler = () => {
      renderSimulator();
    };

    groupSelect.addEventListener("change", filterHandler);
    roundSelect.addEventListener("change", filterHandler);
    statusSelect.addEventListener("change", filterHandler);
    if (dateSelect) {
      dateSelect.addEventListener("change", filterHandler);
    }
  }

  // Tự động tạo danh sách ngày thi đấu duy nhất từ danh sách trận đấu và sắp xếp theo trình tự thời gian
  function populateDateFilter() {
    const dateSelect = document.getElementById("filter-date-select");
    if (!dateSelect) return;

    const currentValue = dateSelect.value;
    const dates = [...new Set(matches.map(m => m.date))];
    
    // Sắp xếp ngày dạng DD/MM/YYYY tăng dần
    dates.sort((a, b) => {
      const [dayA, monthA, yearA] = a.split("/").map(Number);
      const [dayB, monthB, yearB] = b.split("/").map(Number);
      return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
    });

    dateSelect.innerHTML = '<option value="ALL">Tất cả ngày</option>';
    dates.forEach(d => {
      const option = document.createElement("option");
      option.value = d;
      option.innerText = d;
      dateSelect.appendChild(option);
    });

    // Định dạng ngày hôm nay (DD/MM/YYYY)
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayStr = `${day}/${month}/${year}`;

    // Khôi phục giá trị đã chọn trước đó nếu vẫn tồn tại, hoặc tự động chọn ngày hôm nay nếu có trận đấu và là lần tải đầu tiên
    if (isFirstLoad) {
      isFirstLoad = false;
      if (dates.includes(todayStr)) {
        dateSelect.value = todayStr;
      } else {
        dateSelect.value = "ALL";
      }
    } else if (dates.includes(currentValue)) {
      dateSelect.value = currentValue;
    } else {
      dateSelect.value = "ALL";
    }
  }

  // --- CÁC HÀNH ĐỘNG TOÀN CỤC ---
  function setupGlobalActions() {
    // Nút cập nhật trực tuyến từ ESPN Live
    document.querySelectorAll(".btn-espn-live").forEach(btn => {
      btn.addEventListener("click", () => {
        fetchLiveScoresFromESPN();
      });
    });

    // Nút khôi phục dữ liệu mẫu
    document.querySelectorAll(".btn-reset-data").forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm("Bạn có chắc chắn muốn khôi phục lại toàn bộ dữ liệu mẫu ban đầu của World Cup 2026?")) {
          localStorage.removeItem("wc2026_matches");
          matches = [...DEFAULT_MATCHES];
          recalculateAll();
          alert("Đã khôi phục dữ liệu mẫu thành công!");
        }
      });
    });

    // Nút chuyển đổi giao diện sơ đồ thi đấu (r16 tree vs r32 list)
    document.querySelectorAll(".btn-toggle-bracket").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".btn-toggle-bracket").forEach(b => {
          b.classList.remove("active");
          b.classList.add("secondary-btn");
        });
        btn.classList.add("active");
        btn.classList.remove("secondary-btn");

        const targetType = btn.getAttribute("data-type");
        const r32View = document.getElementById("bracket-r32-view");
        const treeView = document.getElementById("bracket-tree-view");

        if (targetType === "r32") {
          r32View.style.display = "grid";
          treeView.style.display = "none";
        } else {
          r32View.style.display = "none";
          treeView.style.display = "flex";
        }
      });
    });
  }

  // --- THUẬT TOÁN TÍNH TOÁN & XẾP HẠNG (CORE) ---
  function recalculateAll() {
    // 0. Khởi tạo/Reset thống kê cầu thủ thực tế về rỗng
    activePlayerStats = {};

    // Khởi tạo lại thống kê cho 48 đội
    teamStats = {};
    const groupLetters = Object.keys(WORLD_CUP_DATA.groups);
    
    groupLetters.forEach(groupLetter => {
      const teams = WORLD_CUP_DATA.groups[groupLetter];
      teams.forEach(team => {
        teamStats[team.id] = {
          id: team.id,
          name: team.name,
          flag: team.flag,
          flagCode: team.flagCode,
          group: groupLetter,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0, // Bàn thắng
          ga: 0, // Bàn thua
          gd: 0, // Hiệu số
          points: 0,
          yc: 0, // Thẻ vàng
          rc: 0, // Thẻ đỏ
          fairPlay: 0
        };
      });
    });

    // Cộng dồn kết quả từ lịch thi đấu
    matches.forEach(match => {
      // Chỉ tính nếu trận đấu đã có tỉ số (không null)
      if (match.score1 !== null && match.score2 !== null) {
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

          // Tính kết quả Thắng - Hòa - Thua
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

          // Tích lũy thông số cầu thủ động từ kết quả tỉ số của trận đấu thực tế
          if (typeof TEAM_PLAYERS !== "undefined") {
            // Đội 1 ghi bàn
            if (match.score1 > 0) {
              const scorers1List = getScorersForMatch(match, 1);
              scorers1List.forEach((scorer) => {
                const sName = scorer.name;
                const fCode = getPlayerFlagCode(match.team1, sName) || match.team1FlagCode;
                if (!activePlayerStats[sName]) {
                  activePlayerStats[sName] = { name: sName, team: match.team1, flagCode: fCode, goals: 0, assists: 0, xg: 0.0, keyPasses: 0 };
                }
                activePlayerStats[sName].goals += 1;
              });
            }

            // Đội 1 kiến tạo thực tế (nếu có)
            if (match.assists1 && match.assists1.length > 0) {
              match.assists1.forEach(assister => {
                const fCode = getPlayerFlagCode(match.team1, assister) || match.team1FlagCode;
                if (!activePlayerStats[assister]) {
                  activePlayerStats[assister] = { name: assister, team: match.team1, flagCode: fCode, goals: 0, assists: 0, xg: 0.0, keyPasses: 0 };
                }
                activePlayerStats[assister].assists += 1;
              });
            }

            // Đội 2 ghi bàn
            if (match.score2 > 0) {
              const scorers2List = getScorersForMatch(match, 2);
              scorers2List.forEach((scorer) => {
                const sName = scorer.name;
                const fCode = getPlayerFlagCode(match.team2, sName) || match.team2FlagCode;
                if (!activePlayerStats[sName]) {
                  activePlayerStats[sName] = { name: sName, team: match.team2, flagCode: fCode, goals: 0, assists: 0, xg: 0.0, keyPasses: 0 };
                }
                activePlayerStats[sName].goals += 1;
              });
            }

            // Đội 2 kiến tạo thực tế (nếu có)
            if (match.assists2 && match.assists2.length > 0) {
              match.assists2.forEach(assister => {
                const fCode = getPlayerFlagCode(match.team2, assister) || match.team2FlagCode;
                if (!activePlayerStats[assister]) {
                  activePlayerStats[assister] = { name: assister, team: match.team2, flagCode: fCode, goals: 0, assists: 0, xg: 0.0, keyPasses: 0 };
                }
                activePlayerStats[assister].assists += 1;
              });
            }
          }
        }
      }
    });

    // Tính toán hiệu số & điểm Fair Play cho mỗi đội
    Object.keys(teamStats).forEach(teamId => {
      const t = teamStats[teamId];
      t.gd = t.gf - t.ga;
      // Luật Fair Play FIFA: Thẻ vàng -1, Thẻ đỏ -3
      t.fairPlay = -(t.yc * 1 + t.rc * 3);
    });

    // Tiến hành xếp hạng cho từng Bảng đấu (A -> L)
    groupStandings = {};
    groupLetters.forEach(groupLetter => {
      const teamsInGroup = WORLD_CUP_DATA.groups[groupLetter].map(team => teamStats[team.id]);
      
      // Thuật toán sắp xếp thứ hạng chuẩn FIFA vòng bảng
      teamsInGroup.sort((a, b) => {
        // 1. Điểm số (giảm dần)
        if (b.points !== a.points) return b.points - a.points;
        // 2. Hiệu số bàn thắng (giảm dần)
        if (b.gd !== a.gd) return b.gd - a.gd;
        // 3. Số bàn thắng ghi được (giảm dần)
        if (b.gf !== a.gf) return b.gf - a.gf;
        // 4. Điểm Fair Play (cao hơn / ít điểm trừ hơn)
        if (b.fairPlay !== a.fairPlay) return b.fairPlay - a.fairPlay;
        // 5. Mặc định (giữ ổn định theo ID)
        return a.id.localeCompare(b.id);
      });

      groupStandings[groupLetter] = teamsInGroup;
    });

    // Tính toán bảng xếp hạng của 12 đội đứng thứ 3
    thirdPlaceStandings = [];
    groupLetters.forEach(groupLetter => {
      const thirdPlaceTeam = groupStandings[groupLetter][2]; // Đội đứng thứ 3 (index 2)
      if (thirdPlaceTeam) {
        thirdPlaceStandings.push(thirdPlaceTeam);
      }
    });

    // Sắp xếp BXH các đội thứ 3 tốt nhất
    thirdPlaceStandings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      if (b.fairPlay !== a.fairPlay) return b.fairPlay - a.fairPlay;
      return a.id.localeCompare(b.id);
    });

    // Lưu lại lịch đấu vào localStorage
    localStorage.setItem("wc2026_matches", JSON.stringify(matches));

    // Kích hoạt vẽ lại giao diện
    renderAll();
  }

  // --- PHẦN RENDER TOÀN BỘ GIAO DIỆN ---
  function renderAll() {
    renderDashboard();
    renderStandings();
    renderSimulator();
    renderAnalytics();
    renderBracket();
  }

  // --- RENDER TAB TỔNG QUAN (DASHBOARD) ---
  function renderDashboard() {
    // 1. Cập nhật các ô số liệu thống kê giải đấu
    let totalPlayed = 0;
    let totalGoals = 0;
    let totalYellows = 0;
    let totalReds = 0;

    matches.forEach(m => {
      if (m.score1 !== null && m.score2 !== null) {
        totalPlayed++;
        totalGoals += (m.score1 + m.score2);
        totalYellows += (m.yc1 + m.yc2);
        totalReds += (m.rc1 + m.rc2);
      }
    });

    document.getElementById("stat-played").innerText = `${totalPlayed} / 72`;
    document.getElementById("stat-goals").innerText = totalGoals;
    document.getElementById("stat-yellows").innerText = totalYellows;
    document.getElementById("stat-reds").innerText = totalReds;

    // 2. Render BXH các đội đứng thứ 3 tốt nhất
    const tbody = document.getElementById("third-place-tbody");
    tbody.innerHTML = "";

    thirdPlaceStandings.forEach((team, idx) => {
      const isQualified = idx < 8; // Top 8 đội đi tiếp
      const rankClass = isQualified ? "rank-green" : "rank-neutral";
      const trClass = isQualified ? "qualified-row-1" : "";

      const tr = document.createElement("tr");
      tr.className = trClass;
      tr.innerHTML = `
        <td><span class="rank-num ${rankClass}">${idx + 1}</span></td>
        <td><span class="group-badge">Bảng ${team.group}</span></td>
        <td>
          <div class="team-cell">
            <img src="https://flagcdn.com/w40/${team.flagCode}.png" class="team-flag-img" alt="${team.name}">
            <span>${team.name}</span>
          </div>
        </td>
        <td>${team.won}</td>
        <td>${team.drawn}</td>
        <td>${team.lost}</td>
        <td style="font-weight: 700; color: ${team.gd > 0 ? "var(--emerald)" : team.gd < 0 ? "var(--red)" : "inherit"};">
          ${team.gd > 0 ? "+" + team.gd : team.gd}
        </td>
        <td>${team.gf}</td>
        <td style="white-space: nowrap;">
          <span style="color: var(--yellow); font-weight: 600;">${team.yc}🟨</span> 
          <span style="color: var(--red); font-weight: 600; margin-left: 6px;">${team.rc}🟥</span>
        </td>
        <td style="font-weight: 800; color: var(--primary); font-size: 14.5px;">${team.points}</td>
      `;
      tbody.appendChild(tr);
    });

    // 3. Render các nút truy cập nhanh Bảng đấu ở sidebar
    const quickLinksContainer = document.querySelector(".group-quick-links");
    quickLinksContainer.innerHTML = "";
    const groupLetters = Object.keys(WORLD_CUP_DATA.groups);
    
    groupLetters.forEach(letter => {
      const btn = document.createElement("button");
      btn.className = "quick-link-btn";
      btn.innerText = `Bảng ${letter}`;
      btn.addEventListener("click", () => {
        // Mở tab Xếp hạng
        document.querySelector('[data-tab="standings"]').click();
        
        // Cuộn mượt đến bảng đấu đích
        setTimeout(() => {
          const element = document.getElementById(`group-card-${letter}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            // Thêm hiệu ứng nhấp nháy làm nổi bật
            element.classList.add("flash-update");
            setTimeout(() => element.classList.remove("flash-update"), 1500);
          }
        }, 150);
      });
      quickLinksContainer.appendChild(btn);
    });

    // 4. Render Thống kê cá nhân cầu thủ trên Dashboard
    renderDashboardPlayerStats();
  }

  // --- RENDER THỐNG KÊ CẦU THỦ TRÊN TỔNG QUAN (DASHBOARD) ---
  function renderDashboardPlayerStats() {
    if (typeof activePlayerStats !== "undefined") {
      const allPlayersList = Object.values(activePlayerStats);

      let topScorers = [];
      let topAssists = [];
      let topXG = [];

      if (allPlayersList.length > 0) {
        // 1. Chiếc giày vàng (Chỉ lọc cầu thủ có bàn thắng > 0)
        const playersWithGoals = allPlayersList.filter(p => p.goals > 0);
        topScorers = [...playersWithGoals].sort((a, b) => b.goals - a.goals || b.xg - a.xg);

        // 2. Vua kiến tạo (Chỉ lọc cầu thủ có kiến tạo > 0)
        const playersWithAssists = allPlayersList.filter(p => p.assists > 0);
        topAssists = [...playersWithAssists].sort((a, b) => b.assists - a.assists || b.keyPasses - a.keyPasses);

        // 3. Hiệu suất xG (Chỉ lọc cầu thủ có bàn thắng > 0)
        topXG = [...playersWithGoals].sort((a, b) => b.xg - a.xg || b.goals - a.goals);
      }

      // 1. Chiếc Giày Vàng (Vua phá lưới)
      const dashPlayerGoalsTbody = document.getElementById("dash-player-goals-tbody");
      if (dashPlayerGoalsTbody) {
        dashPlayerGoalsTbody.innerHTML = "";
        if (topScorers.length === 0) {
          dashPlayerGoalsTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 15px;">Chưa có dữ liệu bàn thắng</td></tr>`;
        } else {
          topScorers.slice(0, 5).forEach((player, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td><span class="rank-num ${idx === 0 ? 'rank-gold' : 'rank-neutral'}">${idx + 1}</span></td>
              <td><strong>${player.name}</strong></td>
              <td>
                <div class="team-cell">
                  <img src="https://flagcdn.com/w40/${player.flagCode}.png" class="team-flag-img" alt="${player.team}">
                  <span>${player.team}</span>
                </div>
              </td>
              <td style="text-align: center; color: var(--text-muted); font-size: 13px;">${player.xg.toFixed(2)}</td>
              <td style="font-weight: 800; color: var(--primary); text-align: center; font-size: 14.5px;">${player.goals} ⚽</td>
            `;
            dashPlayerGoalsTbody.appendChild(tr);
          });
        }
      }

      // 2. Vua Kiến Tạo
      const dashPlayerAssistsTbody = document.getElementById("dash-player-assists-tbody");
      if (dashPlayerAssistsTbody) {
        dashPlayerAssistsTbody.innerHTML = "";
        if (topAssists.length === 0) {
          dashPlayerAssistsTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 15px;">Chưa có dữ liệu kiến tạo</td></tr>`;
        } else {
          topAssists.slice(0, 5).forEach((player, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td><span class="rank-num ${idx === 0 ? 'rank-gold' : 'rank-neutral'}">${idx + 1}</span></td>
              <td><strong>${player.name}</strong></td>
              <td>
                <div class="team-cell">
                  <img src="https://flagcdn.com/w40/${player.flagCode}.png" class="team-flag-img" alt="${player.team}">
                  <span>${player.team}</span>
                </div>
              </td>
              <td style="text-align: center; color: var(--text-muted); font-size: 13px;">${player.keyPasses}</td>
              <td style="font-weight: 800; color: var(--blue); text-align: center; font-size: 14.5px;">${player.assists} 🅰️</td>
            `;
            dashPlayerAssistsTbody.appendChild(tr);
          });
        }
      }

      // 3. Hiệu suất xG
      const dashPlayerXGTbody = document.getElementById("dash-player-xg-tbody");
      if (dashPlayerXGTbody) {
        dashPlayerXGTbody.innerHTML = "";
        if (topXG.length === 0) {
          dashPlayerXGTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 15px;">Chưa có dữ liệu hiệu suất</td></tr>`;
        } else {
          topXG.slice(0, 5).forEach((player, idx) => {
            const diff = player.goals - player.xg;
            const diffColor = diff >= 0 ? "var(--emerald)" : "var(--red)";
            const diffSign = diff >= 0 ? "+" : "";

            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td><span class="rank-num ${idx === 0 ? 'rank-gold' : 'rank-neutral'}">${idx + 1}</span></td>
              <td><strong>${player.name}</strong></td>
              <td>
                <div class="team-cell">
                  <img src="https://flagcdn.com/w40/${player.flagCode}.png" class="team-flag-img" alt="${player.team}">
                  <span>${player.team}</span>
                </div>
              </td>
              <td style="font-weight: 700; text-align: center; font-size: 13.5px; color: var(--text-main);">${player.goals} Bàn thắng</td>
              <td style="font-weight: 700; text-align: center; color: var(--text-muted); font-size: 13.5px;">${player.xg.toFixed(2)} xG</td>
              <td style="font-weight: 800; text-align: center; color: ${diffColor}; font-size: 13.5px;">
                ${diffSign}${diff.toFixed(2)}
              </td>
            `;
            dashPlayerXGTbody.appendChild(tr);
          });
        }
      }
    }
  }

  // --- RENDER TAB BẢNG XẾP HẠNG (STANDINGS) ---
  function renderStandings() {
    const container = document.querySelector(".groups-grid");
    container.innerHTML = "";

    const groupLetters = Object.keys(WORLD_CUP_DATA.groups);

    // Danh sách các ID đội bóng lọt top 8 đội hạng 3 tốt nhất để làm nổi bật
    const qualifiedThirdPlaceIds = thirdPlaceStandings.slice(0, 8).map(t => t.id);

    groupLetters.forEach(letter => {
      const teams = groupStandings[letter];
      
      const groupCard = document.createElement("div");
      groupCard.className = "group-container";
      groupCard.id = `group-card-${letter}`;

      let tableRowsHTML = "";
      teams.forEach((team, idx) => {
        let rowClass = "";
        let badgeClass = "rank-neutral";

        if (idx === 0 || idx === 1) {
          // Top 2 chắc chắn đi tiếp
          rowClass = "qualified-row-1";
          badgeClass = "rank-green";
        } else if (idx === 2) {
          // Đội hạng 3
          const isQualifiedThird = qualifiedThirdPlaceIds.includes(team.id);
          rowClass = isQualifiedThird ? "qualified-row-3" : "";
          badgeClass = isQualifiedThird ? "rank-gold" : "rank-neutral";
        }

        tableRowsHTML += `
          <tr class="${rowClass}">
            <td><span class="rank-num ${badgeClass}">${idx + 1}</span></td>
            <td>
              <div class="team-cell">
                <img src="https://flagcdn.com/w40/${team.flagCode}.png" class="team-flag-img" alt="${team.name}">
                <span>${team.name}</span>
              </div>
            </td>
            <td>${team.played}</td>
            <td>${team.won}</td>
            <td>${team.drawn}</td>
            <td>${team.lost}</td>
            <td>${team.gf}-${team.ga}</td>
            <td style="font-weight:700; color: ${team.gd > 0 ? "var(--emerald)" : team.gd < 0 ? "var(--red)" : "inherit"}">
              ${team.gd > 0 ? "+" + team.gd : team.gd}
            </td>
            <td style="white-space: nowrap;">
              <span style="color:var(--yellow); font-size:11.5px; font-weight:600;">${team.yc}🟨</span>
              <span style="color:var(--red); font-size:11.5px; font-weight:600; margin-left: 5px;">${team.rc}🟥</span>
            </td>
            <td style="font-weight:800; color:var(--primary); font-size: 14px;">${team.points}</td>
          </tr>
        `;
      });

      groupCard.innerHTML = `
        <div class="group-title-bar">
          <h3>BẢNG ${letter}</h3>
          <span class="info-tag" style="background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.2); color: var(--blue);">Vòng Bảng</span>
        </div>
        <div class="table-container">
          <table class="premium-table">
            <thead>
              <tr>
                <th style="width: 50px;">Hạng</th>
                <th>Đội bóng</th>
                <th style="width: 45px;">Trận</th>
                <th style="width: 35px;">T</th>
                <th style="width: 35px;">H</th>
                <th style="width: 35px;">B</th>
                <th style="width: 65px;">BT/BB</th>
                <th style="width: 45px;">HS</th>
                <th style="width: 75px;">Thẻ</th>
                <th style="width: 50px;">Điểm</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHTML}
            </tbody>
          </table>
        </div>
      `;
      container.appendChild(groupCard);
    });
  }

  // --- RENDER TAB MÔ PHỎNG TRẬN ĐẤU (SIMULATOR) ---
  function renderSimulator() {
    const container = document.getElementById("matches-container");
    container.innerHTML = "";

    const groupFilter = document.getElementById("filter-group-select").value;
    const roundFilter = document.getElementById("filter-round-select").value;
    const statusFilter = document.getElementById("filter-status-select").value;
    const dateSelectEl = document.getElementById("filter-date-select");
    const dateFilter = dateSelectEl ? dateSelectEl.value : "ALL";

    // Lọc trận đấu dựa trên bộ lọc đã chọn
    const filteredMatches = matches.filter(m => {
      const passGroup = groupFilter === "ALL" || m.group === groupFilter;
      const passRound = roundFilter === "ALL" || String(m.round) === roundFilter;
      const passStatus = statusFilter === "ALL" || m.status === statusFilter;
      const passDate = dateFilter === "ALL" || m.date === dateFilter;
      return passGroup && passRound && passStatus && passDate;
    });
    // Sắp xếp các trận đấu theo ngày và giờ (Cũ đến mới)
    filteredMatches.sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      // Fallback nếu không có timestamp (ví dụ dữ liệu cũ)
      const [dayA, monthA, yearA] = a.date.split(/[\/\-\.]/);
      const [dayB, monthB, yearB] = b.date.split(/[\/\-\.]/);
      const dateA = new Date(`${yearA}-${monthA}-${dayA}T${a.time}:00`);
      const dateB = new Date(`${yearB}-${monthB}-${dayB}T${b.time}:00`);
      return dateA - dateB;
    });

    if (filteredMatches.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); background: var(--card-bg); border-radius: 16px; border: 1px dashed var(--card-border);">
          <p style="font-size: 15px; font-weight: 500;">Không tìm thấy trận đấu nào khớp với điều kiện lọc.</p>
        </div>
      `;
      return;
    }

    filteredMatches.forEach(match => {
      const card = document.createElement("div");
      card.className = "match-card";
      card.id = `match-card-${match.id}`;

      const isPlayed = match.score1 !== null && match.score2 !== null;
      let statusClass = "status-unplayed";
      let statusText = "Chưa đấu";

      if (match.status === "Đang đá") {
        statusClass = "status-live";
        statusText = `Đang đá ${match.matchTime ? '(' + match.matchTime + ')' : ''}`;
      } else if (match.status === "Kết thúc") {
        statusClass = "status-played";
        statusText = "Kết thúc";
      }

      card.innerHTML = `
        <div class="match-top-info" style="margin-bottom: 6px;">
          <span>BẢNG ${match.group} • LƯỢT ${match.round} • TRẬN ${match.id}</span>
          <span class="match-status-badge ${statusClass}">${statusText}</span>
        </div>
        <div style="font-size: 11.5px; color: var(--primary); font-weight: 700; display: flex; align-items: center; gap: 5px; margin-top: -4px; margin-bottom: 6px; letter-spacing: 0.3px;">
          📅 ${match.date} • 🕒 ${match.time.replace(':', 'h')} (Giờ VN)
        </div>
        
        <div class="scoreboard" style="margin: 12px 0;">
          <!-- Đội 1 -->
          <div class="team-score-block team-left">
            <div class="team-identity">
              <img src="https://flagcdn.com/w40/${match.team1FlagCode}.png" class="team-flag-img" alt="${match.team1}">
              <span>${match.team1}</span>
            </div>
            <div class="score-display-value">
              ${match.score1 !== null ? match.score1 : '-'}
            </div>
          </div>
          
          <div class="vs-text" style="color: var(--text-dark); font-weight: 800; font-size: 12px;">VS</div>
          
          <!-- Đội 2 -->
          <div class="team-score-block team-right">
            <div class="team-identity">
              <img src="https://flagcdn.com/w40/${match.team2FlagCode}.png" class="team-flag-img" alt="${match.team2}">
              <span>${match.team2}</span>
            </div>
            <div class="score-display-value">
              ${match.score2 !== null ? match.score2 : '-'}
            </div>
          </div>
        </div>

        <!-- Danh sách ghi bàn -->
        ${(() => {
          const scorers1 = getScorersForMatch(match, 1);
          const scorers2 = getScorersForMatch(match, 2);
          if (scorers1.length === 0 && scorers2.length === 0) return "";
          
          const s1Html = scorers1.map(s => `<div class="scorer-item">⚽ ${s.name} <span class="minute">(${s.min})</span></div>`).join("");
          const s2Html = scorers2.map(s => `<div class="scorer-item"><span class="minute">(${s.min})</span> ${s.name} ⚽</div>`).join("");
          
          return `
            <div class="match-scorers">
              <div class="scorers-left">${s1Html}</div>
              <div class="scorers-right">${s2Html}</div>
            </div>
          `;
        })()}
      `;
      container.appendChild(card);
    });

    // Gán lại sự kiện tương tác
    attachMatchCardEvents();
  }

  // --- ĐĂNG KÝ SỰ KIỆN CHO CÁC Ô TRẬN ĐẤU ---
  function attachMatchCardEvents() {
    // 1. Sự kiện thay đổi ô nhập số tỉ số bằng bàn phím
    document.querySelectorAll(".score-val-input").forEach(input => {
      input.addEventListener("input", (e) => {
        const matchId = input.getAttribute("data-match-id");
        const val = input.value;
        const match = matches.find(m => m.id === matchId);
        
        if (match) {
          const isTeam1 = input.classList.contains("score-team-1");
          const parsedVal = val === "" ? null : Math.max(0, parseInt(val) || 0);
          
          if (isTeam1) {
            match.score1 = parsedVal;
          } else {
            match.score2 = parsedVal;
          }
          
          // Cập nhật trạng thái trận đấu
          updateMatchStatus(match);
          recalculateAll();
        }
      });
    });

    // 2. Sự kiện nhấn nút +/- cho tỉ số
    document.querySelectorAll(".btn-score-inc, .btn-score-dec").forEach(btn => {
      btn.addEventListener("click", () => {
        const matchId = btn.getAttribute("data-match-id");
        const teamNum = btn.getAttribute("data-team");
        const isInc = btn.classList.contains("btn-score-inc");
        
        const match = matches.find(m => m.id === matchId);
        if (match) {
          const scoreKey = teamNum === "1" ? "score1" : "score2";
          let curScore = match[scoreKey];
          
          if (curScore === null) {
            curScore = isInc ? 1 : 0;
          } else {
            curScore = isInc ? curScore + 1 : Math.max(0, curScore - 1);
          }
          
          match[scoreKey] = curScore;
          
          // Nếu ô còn lại rỗng thì tự điền 0 để hoàn tất trận đấu
          const otherKey = scoreKey === "score1" ? "score2" : "score1";
          if (match[otherKey] === null) {
            match[otherKey] = 0;
          }
          
          updateMatchStatus(match);
          recalculateAll();
        }
      });
    });

    // 3. Sự kiện nhấn nút +/- cho thẻ phạt
    document.querySelectorAll(".btn-card-inc, .btn-card-dec").forEach(btn => {
      btn.addEventListener("click", () => {
        const matchId = btn.getAttribute("data-match-id");
        const cardKey = btn.getAttribute("data-card"); // "yc1", "rc1", "yc2", "rc2"
        const isInc = btn.classList.contains("btn-card-inc");
        
        const match = matches.find(m => m.id === matchId);
        if (match) {
          let curCards = match[cardKey] || 0;
          curCards = isInc ? curCards + 1 : Math.max(0, curCards - 1);
          
          // Giới hạn thực tế: thẻ vàng max 5, thẻ đỏ max 2
          if (cardKey.startsWith("yc")) {
            match[cardKey] = Math.min(5, curCards);
          } else {
            match[cardKey] = Math.min(2, curCards);
          }
          
          recalculateAll();
        }
      });
    });

  }

  function updateMatchStatus(match) {
    if (match.score1 !== null && match.score2 !== null) {
      match.status = "Kết thúc";
    } else {
      match.status = "Chưa đấu";
    }
  }

  // --- RENDER TAB THỐNG KÊ (ANALYTICS) ---
  function renderAnalytics() {
    const allTeams = Object.values(teamStats);
    if (allTeams.length === 0) return;

    // 1. Thống kê tấn công (ghi bàn nhiều nhất)
    const attackers = [...allTeams].sort((a, b) => b.gf - a.gf || a.played - b.played || a.id.localeCompare(b.id));
    const attackTbody = document.getElementById("attack-tbody");
    attackTbody.innerHTML = "";
    
    attackers.slice(0, 5).forEach((team, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="rank-num ${idx === 0 ? "rank-gold" : "rank-neutral"}">${idx + 1}</span></td>
        <td>
          <div class="team-cell">
            <img src="https://flagcdn.com/w40/${team.flagCode}.png" class="team-flag-img" alt="${team.name}">
            <span>${team.name}</span>
          </div>
        </td>
        <td>${team.played}</td>
        <td style="font-weight: 800; color: var(--emerald); text-align: center; font-size: 14.5px;">${team.gf} Bàn thắng</td>
      `;
      attackTbody.appendChild(tr);
    });

    // 2. Thống kê phòng ngự (lọt lưới ít nhất - chỉ tính đội đã đấu ít nhất 1 trận)
    const defenders = allTeams.filter(t => t.played > 0)
                               .sort((a, b) => a.ga - b.ga || b.played - a.played || a.id.localeCompare(b.id));
    const defendTbody = document.getElementById("defend-tbody");
    defendTbody.innerHTML = "";
    
    if (defenders.length === 0) {
      defendTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Chưa có trận đấu nào diễn ra.</td></tr>`;
    } else {
      defenders.slice(0, 5).forEach((team, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><span class="rank-num ${idx === 0 ? "rank-gold" : "rank-neutral"}">${idx + 1}</span></td>
          <td>
            <div class="team-cell">
              <img src="https://flagcdn.com/w40/${team.flagCode}.png" class="team-flag-img" alt="${team.name}">
              <span>${team.name}</span>
            </div>
          </td>
          <td>${team.played}</td>
          <td style="font-weight: 800; color: var(--blue); text-align: center; font-size: 14.5px;">${team.ga} Bàn thua</td>
        `;
        defendTbody.appendChild(tr);
      });
    }

    // 3. Thống kê Fair Play (ít điểm trừ thẻ phạt nhất - chỉ tính đội đã đấu)
    const activeTeams = allTeams.filter(t => t.played > 0);
    const fairplayers = [...(activeTeams.length > 0 ? activeTeams : allTeams)]
                        .sort((a, b) => b.fairPlay - a.fairPlay || b.played - a.played || a.id.localeCompare(b.id));
    
    const fairplayTbody = document.getElementById("fairplay-tbody");
    fairplayTbody.innerHTML = "";
    
    fairplayers.slice(0, 5).forEach((team, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="rank-num ${idx === 0 ? "rank-gold" : "rank-neutral"}">${idx + 1}</span></td>
        <td>
          <div class="team-cell">
            <img src="https://flagcdn.com/w40/${team.flagCode}.png" class="team-flag-img" alt="${team.name}">
            <span>${team.name}</span>
          </div>
        </td>
        <td>${team.yc}🟨</td>
        <td>${team.rc}🟥</td>
        <td style="font-weight: 800; color: var(--primary); text-align: center; font-size: 14.5px;">${team.fairPlay} đ</td>
      `;
      fairplayTbody.appendChild(tr);
    });

    // 4. Đội nhận nhiều thẻ nhất (phạt nặng nhất)
    const cardScores = allTeams.map(t => ({
      ...t,
      penaltyScore: t.yc * 1 + t.rc * 3
    })).sort((a, b) => b.penaltyScore - a.penaltyScore || b.played - a.played || a.id.localeCompare(b.id));

    const naughtyTbody = document.getElementById("naughty-tbody");
    naughtyTbody.innerHTML = "";
    
    cardScores.slice(0, 5).forEach((team, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="rank-num ${idx === 0 ? "rank-gold" : "rank-neutral"}">${idx + 1}</span></td>
        <td>
          <div class="team-cell">
            <img src="https://flagcdn.com/w40/${team.flagCode}.png" class="team-flag-img" alt="${team.name}">
            <span>${team.name}</span>
          </div>
        </td>
        <td>${team.yc}🟨</td>
        <td>${team.rc}🟥</td>
        <td style="font-weight: 800; color: var(--red); text-align: center; font-size: 14.5px;">+${team.penaltyScore} Điểm</td>
      `;
      naughtyTbody.appendChild(tr);
    });
  }



  // --- RENDER TAB SƠ ĐỒ THI ĐẤU (BRACKET) ---
  function renderBracket() {
    const r32View = document.getElementById("bracket-r32-view");
    const treeView = document.getElementById("bracket-tree-view");

    if (!r32View || !treeView) return;

    // Helper 1: Lấy đội tuyển từ vòng bảng hoặc placeholder
    function getTeamOrPlaceholder(groupLetter, rankIndex, placeholderText) {
      const stands = groupStandings[groupLetter];
      if (stands && stands[rankIndex]) {
        const isGroupFinished = stands.every(t => t.played === 3);
        if (isGroupFinished) {
          const team = stands[rankIndex];
          return { id: team.id, name: team.name, flag: team.flag, flagCode: team.flagCode, isReal: true };
        }
      }
      return { id: `PLACEHOLDER-${groupLetter}-${rankIndex}`, name: placeholderText, flag: "🏳️", flagCode: "", isReal: false };
    }

    // Helper 2: Phân bổ 8 đội xếp thứ 3 tốt nhất bằng thuật toán Backtracking chính thức theo FIFA
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
        // Fallback gán theo thứ tự nếu chưa đủ 8 đội đá xong
        const fallbackAssignment = {};
        slots.forEach((slot, idx) => {
          fallbackAssignment[slot.id] = qualifiedThirds[idx] || null;
        });
        return fallbackAssignment;
      }
    }

    const allGroupsFinished = Object.values(groupStandings).every(stands => stands.every(t => t.played === 3));
    const activeThirds = allGroupsFinished ? thirdPlaceStandings.slice(0, 8) : [];
    const assignedThirds = assignThirdPlacedTeams(activeThirds);

    // Lấy thông tin đội thứ 3 đã được gán hoặc placeholder tương ứng
    function getAssignedThirdOrPlaceholder(matchKey, allowedGroupsText) {
      const team = assignedThirds[matchKey];
      if (team) {
        return { id: team.id, name: team.name, flag: team.flag, flagCode: team.flagCode, isReal: true };
      }
      return { id: `PLACEHOLDER-3RD-${matchKey}`, name: `Hạng 3 Bảng ${allowedGroupsText}`, flag: "🏳️", flagCode: "", isReal: false };
    }

    // Helper 3: Dự đoán/Xác định đội thắng cuộc đi tiếp trong sơ đồ mô phỏng
    function getWinnerOrPlaceholder(t1, t2, placeholderText) {
      if (t1.isReal && t2.isReal) {
        const stat1 = teamStats[t1.id];
        const stat2 = teamStats[t2.id];
        if (stat1 && stat2) {
          // Dự báo đi tiếp dựa trên thành tích vòng bảng (nhiều điểm hơn, hiệu số cao hơn)
          if (stat1.points !== stat2.points) {
            return stat1.points > stat2.points ? t1 : t2;
          }
          if (stat1.gd !== stat2.gd) {
            return stat1.gd > stat2.gd ? t1 : t2;
          }
        }
        return t1; // mặc định t1
      }
      if (t1.isReal) return t1;
      if (t2.isReal) return t2;
      return { id: `WINNER-OF-${t1.name}-${t2.name}`, name: placeholderText, flag: "🏳️", flagCode: "", isReal: false };
    }

    // 1. Định nghĩa 16 cặp đấu Vòng 32 Đội chính xác 100% theo mã trận đấu của FIFA (Trận 73 đến Trận 88)
    const r32Matches = [
      { id: "M73", name: "Trận 73", t1: getTeamOrPlaceholder("A", 1, "Nhì Bảng A"), t2: getTeamOrPlaceholder("B", 1, "Nhì Bảng B") },
      { id: "M74", name: "Trận 74", t1: getTeamOrPlaceholder("E", 0, "Nhất Bảng E"), t2: getAssignedThirdOrPlaceholder("M74", "A/B/C/D/F") },
      { id: "M75", name: "Trận 75", t1: getTeamOrPlaceholder("F", 0, "Nhất Bảng F"), t2: getTeamOrPlaceholder("C", 1, "Nhì Bảng C") },
      { id: "M76", name: "Trận 76", t1: getTeamOrPlaceholder("C", 0, "Nhất Bảng C"), t2: getTeamOrPlaceholder("F", 1, "Nhì Bảng F") },
      { id: "M77", name: "Trận 77", t1: getTeamOrPlaceholder("I", 0, "Nhất Bảng I"), t2: getAssignedThirdOrPlaceholder("M77", "C/D/F/G/H") },
      { id: "M78", name: "Trận 78", t1: getTeamOrPlaceholder("E", 1, "Nhì Bảng E"), t2: getTeamOrPlaceholder("I", 1, "Nhì Bảng I") },
      { id: "M79", name: "Trận 79", t1: getTeamOrPlaceholder("A", 0, "Nhất Bảng A"), t2: getAssignedThirdOrPlaceholder("M79", "C/E/F/H/I") },
      { id: "M80", name: "Trận 80", t1: getTeamOrPlaceholder("L", 0, "Nhất Bảng L"), t2: getAssignedThirdOrPlaceholder("M80", "E/H/I/J/K") },
      { id: "M81", name: "Trận 81", t1: getTeamOrPlaceholder("D", 0, "Nhất Bảng D"), t2: getAssignedThirdOrPlaceholder("M81", "B/E/F/I/J") },
      { id: "M82", name: "Trận 82", t1: getTeamOrPlaceholder("G", 0, "Nhất Bảng G"), t2: getAssignedThirdOrPlaceholder("M82", "A/E/H/I/J") },
      { id: "M83", name: "Trận 83", t1: getTeamOrPlaceholder("K", 1, "Nhì Bảng K"), t2: getTeamOrPlaceholder("L", 1, "Nhì Bảng L") },
      { id: "M84", name: "Trận 84", t1: getTeamOrPlaceholder("H", 0, "Nhất Bảng H"), t2: getTeamOrPlaceholder("J", 1, "Nhì Bảng J") },
      { id: "M85", name: "Trận 85", t1: getTeamOrPlaceholder("B", 0, "Nhất Bảng B"), t2: getAssignedThirdOrPlaceholder("M85", "E/F/G/I/J") },
      { id: "M86", name: "Trận 86", t1: getTeamOrPlaceholder("J", 0, "Nhất Bảng J"), t2: getTeamOrPlaceholder("H", 1, "Nhì Bảng H") },
      { id: "M87", name: "Trận 87", t1: getTeamOrPlaceholder("K", 0, "Nhất Bảng K"), t2: getAssignedThirdOrPlaceholder("M87", "D/E/I/J/L") },
      { id: "M88", name: "Trận 88", t1: getTeamOrPlaceholder("D", 1, "Nhì Bảng D"), t2: getTeamOrPlaceholder("G", 1, "Nhì Bảng G") }
    ];

    // 2. Render Vòng 32 Đội dưới dạng Danh Sách Cặp Đấu
    r32View.innerHTML = "";
    r32Matches.forEach(match => {
      const card = document.createElement("div");
      card.className = "match-card";
      card.innerHTML = `
        <div class="match-top-info" style="margin-bottom: 6px;">
          <span>VÒNG 32 ĐỘI • ${match.name}</span>
          <span class="match-status-badge ${match.t1.isReal && match.t2.isReal ? 'status-played' : 'status-unplayed'}">
            ${match.t1.isReal && match.t2.isReal ? 'Xác định' : 'Chưa đấu'}
          </span>
        </div>
        <div class="scoreboard" style="margin: 8px 0;">
          <div class="team-score-block team-left">
            <div class="team-identity" style="color: ${match.t1.isReal ? 'var(--text-main)' : 'var(--text-dark)'};">
              ${match.t1.isReal ? `<img src="https://flagcdn.com/w40/${match.t1.flagCode}.png" class="team-flag-img" alt="${match.t1.name}">` : `<span class="team-flag">🏳️</span>`}
              <span>${match.t1.name}</span>
            </div>
          </div>
          <div class="vs-text">VS</div>
          <div class="team-score-block team-right">
            <div class="team-identity" style="color: ${match.t2.isReal ? 'var(--text-main)' : 'var(--text-dark)'};">
              ${match.t2.isReal ? `<img src="https://flagcdn.com/w40/${match.t2.flagCode}.png" class="team-flag-img" alt="${match.t2.name}">` : `<span class="team-flag">🏳️</span>`}
              <span>${match.t2.name}</span>
            </div>
          </div>
        </div>
      `;
      r32View.appendChild(card);
    });

    // Helper phụ lấy đội thắng của vòng trước theo mã trận đấu
    function getWinnerByMatchId(matchId, placeholderText) {
      const match = r32Matches.find(m => m.id === matchId);
      if (match) {
        return getWinnerOrPlaceholder(match.t1, match.t2, placeholderText);
      }
      return { id: `WINNER-OF-${matchId}`, name: placeholderText, flag: "🏳️", flagCode: "", isReal: false };
    }

    // Vòng 16 đội (8 cặp, Trận 89 đến Trận 96 chính xác theo sơ đồ của FIFA)
    const r16Matches = [
      { id: "M89", name: "Trận 89", t1: getWinnerByMatchId("M74", "Thắng Trận 74"), t2: getWinnerByMatchId("M77", "Thắng Trận 77") },
      { id: "M90", name: "Trận 90", t1: getWinnerByMatchId("M73", "Thắng Trận 73"), t2: getWinnerByMatchId("M75", "Thắng Trận 75") },
      { id: "M91", name: "Trận 91", t1: getWinnerByMatchId("M76", "Thắng Trận 76"), t2: getWinnerByMatchId("M78", "Thắng Trận 78") },
      { id: "M92", name: "Trận 92", t1: getWinnerByMatchId("M79", "Thắng Trận 79"), t2: getWinnerByMatchId("M80", "Thắng Trận 80") },
      { id: "M93", name: "Trận 93", t1: getWinnerByMatchId("M83", "Thắng Trận 83"), t2: getWinnerByMatchId("M84", "Thắng Trận 84") },
      { id: "M94", name: "Trận 94", t1: getWinnerByMatchId("M81", "Thắng Trận 81"), t2: getWinnerByMatchId("M82", "Thắng Trận 82") },
      { id: "M95", name: "Trận 95", t1: getWinnerByMatchId("M86", "Thắng Trận 86"), t2: getWinnerByMatchId("M88", "Thắng Trận 88") },
      { id: "M96", name: "Trận 96", t1: getWinnerByMatchId("M85", "Thắng Trận 85"), t2: getWinnerByMatchId("M87", "Thắng Trận 87") }
    ];

    function getR16WinnerByMatchId(matchId, placeholderText) {
      const match = r16Matches.find(m => m.id === matchId);
      if (match) {
        return getWinnerOrPlaceholder(match.t1, match.t2, placeholderText);
      }
      return { id: `WINNER-OF-${matchId}`, name: placeholderText, flag: "🏳️", flagCode: "", isReal: false };
    }

    // Tứ kết (4 cặp, Trận 97 đến Trận 100 chính xác theo sơ đồ của FIFA)
    const qfMatches = [
      { id: "M97", name: "Trận 97 (TK 1)", t1: getR16WinnerByMatchId("M89", "Thắng Trận 89"), t2: getR16WinnerByMatchId("M90", "Thắng Trận 90") },
      { id: "M98", name: "Trận 98 (TK 2)", t1: getR16WinnerByMatchId("M93", "Thắng Trận 93"), t2: getR16WinnerByMatchId("M94", "Thắng Trận 94") },
      { id: "M99", name: "Trận 99 (TK 3)", t1: getR16WinnerByMatchId("M91", "Thắng Trận 91"), t2: getR16WinnerByMatchId("M92", "Thắng Trận 92") },
      { id: "M100", name: "Trận 100 (TK 4)", t1: getR16WinnerByMatchId("M95", "Thắng Trận 95"), t2: getR16WinnerByMatchId("M96", "Thắng Trận 96") }
    ];

    function getQFWinnerByMatchId(matchId, placeholderText) {
      const match = qfMatches.find(m => m.id === matchId);
      if (match) {
        return getWinnerOrPlaceholder(match.t1, match.t2, placeholderText);
      }
      return { id: `WINNER-OF-${matchId}`, name: placeholderText, flag: "🏳️", flagCode: "", isReal: false };
    }

    // Bán kết (2 cặp, Trận 101 và Trận 102 chính xác theo sơ đồ của FIFA)
    const sfMatches = [
      { id: "M101", name: "Trận 101 (BK 1)", t1: getQFWinnerByMatchId("M97", "Thắng Trận 97"), t2: getQFWinnerByMatchId("M98", "Thắng Trận 98") },
      { id: "M102", name: "Trận 102 (BK 2)", t1: getQFWinnerByMatchId("M99", "Thắng Trận 99"), t2: getQFWinnerByMatchId("M100", "Thắng Trận 100") }
    ];

    function getSFWinnerByMatchId(matchId, placeholderText) {
      const match = sfMatches.find(m => m.id === matchId);
      if (match) {
        return getWinnerOrPlaceholder(match.t1, match.t2, placeholderText);
      }
      return { id: `WINNER-OF-${matchId}`, name: placeholderText, flag: "🏳️", flagCode: "", isReal: false };
    }

    // Chung kết (Trận 104 chính xác theo sơ đồ của FIFA)
    const finalMatch = { id: "M104", name: "Chung Kết", t1: getSFWinnerByMatchId("M101", "Thắng BK 1"), t2: getSFWinnerByMatchId("M102", "Thắng BK 2") };
    const winner_champion = getWinnerOrPlaceholder(finalMatch.t1, finalMatch.t2, "🏆 Đội Vô Địch");

    // 4. Vẽ Sơ Đồ Nhánh Cây (Round of 16 -> Final)
    treeView.innerHTML = "";

    const col1 = createBracketColumn("Vòng 16 Đội", r16Matches);
    const col2 = createBracketColumn("Tứ Kết", qfMatches);
    const col3 = createBracketColumn("Bán Kết", sfMatches);
    
    const col4 = document.createElement("div");
    col4.className = "bracket-column";
    
    const finalRoundTitle = document.createElement("div");
    finalRoundTitle.className = "bracket-round-title";
    finalRoundTitle.innerText = "Chung Kết";
    col4.appendChild(finalRoundTitle);

    const finalMatchEl = document.createElement("div");
    finalMatchEl.className = "bracket-match";
    finalMatchEl.innerHTML = `
      <div class="bracket-match-header">
        <span>🏆 TRẬN CHUNG KẾT</span>
        <span>${finalMatch.id}</span>
      </div>
      <div class="bracket-team-row ${finalMatch.t1.isReal ? 'winner' : 'loser'}">
        <div class="bracket-team-name">
          ${finalMatch.t1.isReal ? `<img src="https://flagcdn.com/w40/${finalMatch.t1.flagCode}.png" class="team-flag-img" alt="${finalMatch.t1.name}">` : `<span>🏳️</span>`}
          <span>${finalMatch.t1.name}</span>
        </div>
      </div>
      <div class="bracket-team-row ${finalMatch.t2.isReal ? 'winner' : 'loser'}">
        <div class="bracket-team-name">
          ${finalMatch.t2.isReal ? `<img src="https://flagcdn.com/w40/${finalMatch.t2.flagCode}.png" class="team-flag-img" alt="${finalMatch.t2.name}">` : `<span>🏳️</span>`}
          <span>${finalMatch.t2.name}</span>
        </div>
      </div>
    `;
    col4.appendChild(finalMatchEl);

    // Thêm danh hiệu Nhà Vô Địch
    const championEl = document.createElement("div");
    championEl.className = "bracket-match";
    championEl.style.borderColor = "var(--primary)";
    championEl.style.background = "rgba(245,158,11,0.05)";
    championEl.innerHTML = `
      <div class="bracket-match-header" style="border-bottom-color: rgba(245,158,11,0.2);">
        <span style="color: var(--primary); font-weight: 800;">🏆 NHÀ VÔ ĐỊCH</span>
        <span>2026</span>
      </div>
      <div class="bracket-team-row" style="font-size: 16px; font-weight: 800; justify-content: center; height: 35px; color: var(--primary);">
        <div class="bracket-team-name">
          ${winner_champion.isReal ? `<img src="https://flagcdn.com/w40/${winner_champion.flagCode}.png" class="team-flag-img" alt="${winner_champion.name}">` : `<span>🏳️</span>`}
          <span>${winner_champion.name}</span>
        </div>
      </div>
    `;
    col4.appendChild(championEl);

    treeView.appendChild(col1);
    treeView.appendChild(col2);
    treeView.appendChild(col3);
    treeView.appendChild(col4);
  }

  // Helper tạo cột trong sơ đồ nhánh cây
  function createBracketColumn(title, matchesList) {
    const col = document.createElement("div");
    col.className = "bracket-column";
    
    const roundTitle = document.createElement("div");
    roundTitle.className = "bracket-round-title";
    roundTitle.innerText = title;
    col.appendChild(roundTitle);

    matchesList.forEach(match => {
      const matchEl = document.createElement("div");
      matchEl.className = "bracket-match";
      matchEl.innerHTML = `
        <div class="bracket-match-header">
          <span>${match.name}</span>
          <span>${match.id}</span>
        </div>
        <div class="bracket-team-row ${match.t1.isReal ? 'winner' : 'loser'}">
          <div class="bracket-team-name">
            ${match.t1.isReal ? `<img src="https://flagcdn.com/w40/${match.t1.flagCode}.png" class="team-flag-img" alt="${match.t1.name}">` : `<span>🏳️</span>`}
            <span>${match.t1.name}</span>
          </div>
        </div>
        <div class="bracket-team-row ${match.t2.isReal ? 'winner' : 'loser'}">
          <div class="bracket-team-name">
            ${match.t2.isReal ? `<img src="https://flagcdn.com/w40/${match.t2.flagCode}.png" class="team-flag-img" alt="${match.t2.name}">` : `<span>🏳️</span>`}
            <span>${match.t2.name}</span>
          </div>
        </div>
      `;
      col.appendChild(matchEl);
    });

    return col;
  }

  // --- MÔ PHỎNG TỈ SỐ VÀ THẺ PHẠT NGẪU NHIÊN ---
  function simulateRandomScores(allMatches = true) {
    const groupFilter = document.getElementById("filter-group-select").value;
    const roundFilter = document.getElementById("filter-round-select").value;
    const statusFilter = document.getElementById("filter-status-select").value;
    const dateSelectEl = document.getElementById("filter-date-select");
    const dateFilter = dateSelectEl ? dateSelectEl.value : "ALL";

    matches.forEach(m => {
      // Xác định xem trận đấu này có nằm trong bộ lọc không
      const passGroup = groupFilter === "ALL" || m.group === groupFilter;
      const passRound = roundFilter === "ALL" || String(m.round) === roundFilter;
      const passStatus = statusFilter === "ALL" || m.status === statusFilter;
      const passDate = dateFilter === "ALL" || m.date === dateFilter;
      const isVisible = passGroup && passRound && passStatus && passDate;

      // Điều kiện chạy mô phỏng:
      // - Nếu allMatches = true: Mô phỏng tất cả trận CHƯA ĐẤU trong hệ thống
      // - Nếu allMatches = false: Chỉ mô phỏng các trận ĐANG HIỂN THỊ và CHƯA ĐẤU
      if ((allMatches && m.status === "Chưa đấu") || (!allMatches && isVisible && m.status === "Chưa đấu")) {
        // Tạo tỉ số ngẫu nhiên theo mô hình tỉ số bóng đá phổ biến (phần lớn bàn thắng nhỏ hơn 4)
        m.score1 = getRandomSoccerScore();
        m.score2 = getRandomSoccerScore();
        
        // Thẻ phạt ngẫu nhiên
        m.yc1 = Math.floor(Math.random() * 4); // 0 đến 3 thẻ vàng
        m.rc1 = Math.random() > 0.95 ? 1 : 0;  // 5% tỉ lệ thẻ đỏ
        
        m.yc2 = Math.floor(Math.random() * 4);
        m.rc2 = Math.random() > 0.95 ? 1 : 0;
        
        m.status = "Kết thúc";
      }
    });

    recalculateAll();
  }

  // Sinh tỉ số ngẫu nhiên với tỉ lệ bàn thắng thực tế hơn
  function getRandomSoccerScore() {
    const rand = Math.random();
    if (rand < 0.25) return 0; // 25% ra 0 bàn
    if (rand < 0.60) return 1; // 35% ra 1 bàn
    if (rand < 0.85) return 2; // 25% ra 2 bàn
    if (rand < 0.95) return 3; // 10% ra 3 bàn
    return Math.floor(Math.random() * 3) + 4; // 5% ra tỉ số đậm (4-6 bàn)
  }

  // Khôi phục trạng thái chưa đấu cho các trận đang hiển thị trong bộ lọc
  function resetVisibleMatches() {
    const groupFilter = document.getElementById("filter-group-select").value;
    const roundFilter = document.getElementById("filter-round-select").value;
    const statusFilter = document.getElementById("filter-status-select").value;
    const dateSelectEl = document.getElementById("filter-date-select");
    const dateFilter = dateSelectEl ? dateSelectEl.value : "ALL";

    let resetCount = 0;
    matches.forEach(m => {
      const passGroup = groupFilter === "ALL" || m.group === groupFilter;
      const passRound = roundFilter === "ALL" || String(m.round) === roundFilter;
      const passStatus = statusFilter === "ALL" || m.status === statusFilter;
      const passDate = dateFilter === "ALL" || m.date === dateFilter;

      if (passGroup && passRound && passStatus && passDate) {
        m.score1 = null;
        m.score2 = null;
        m.yc1 = 0;
        m.rc1 = 0;
        m.yc2 = 0;
        m.rc2 = 0;
        m.status = "Chưa đấu";
        resetCount++;
      }
    });

    if (resetCount > 0) {
      recalculateAll();
    }
  }

  // Đồng bộ tỉ số trực tuyến từ API ESPN (World Cup)
  async function fetchLiveScoresFromESPN(isSilent = false) {
    const btns = document.querySelectorAll(".btn-espn-live");
    if (!isSilent) {
      btns.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = "⏳ Đang tải...";
      });
    }

    try {
      // Gọi API Scoreboard bóng đá World Cup của ESPN (CORS-enabled) với đầy đủ ngày và giới hạn số trận đấu
      const response = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=150");
      if (!response.ok) throw new Error("Không thể kết nối với máy chủ ESPN.");

      const data = await response.json();

      if (!data.events || data.events.length === 0) {
        if (!isSilent) {
          alert("Hiện tại không có trận đấu World Cup nào đang diễn ra hoặc cập nhật trên ESPN (Giải đấu sẽ bắt đầu từ 11/06/2026).");
        }
        resetButtons();
        return;
      }

      let updatedCount = 0;

      data.events.forEach(event => {
        const competition = event.competitions && event.competitions[0];
        if (!competition) return;

        const competitors = competition.competitors;
        if (!competitors || competitors.length < 2) return;

        const homeCompetitor = competitors.find(c => c.homeAway === "home");
        const awayCompetitor = competitors.find(c => c.homeAway === "away");

        if (homeCompetitor && awayCompetitor) {
          const homeAbbr = homeCompetitor.team.abbreviation;
          const awayAbbr = awayCompetitor.team.abbreviation;

          // Khớp trận đấu trong danh sách local (so sánh mã viết tắt của 2 đội)
          const matchedMatch = matches.find(m => 
            (m.team1Id === homeAbbr && m.team2Id === awayAbbr) || 
            (m.team1Id === awayAbbr && m.team2Id === homeAbbr)
          );

          if (matchedMatch) {
            const isHomeTeam1 = matchedMatch.team1Id === homeAbbr;
            const score1 = parseInt(homeCompetitor.score);
            const score2 = parseInt(awayCompetitor.score);

            const espnState = event.status.type.state; // "pre" | "in" | "post"

            if (espnState === "post" || espnState === "in") {
              matchedMatch.score1 = isHomeTeam1 ? (isNaN(score1) ? 0 : score1) : (isNaN(score2) ? 0 : score2);
              matchedMatch.score2 = isHomeTeam1 ? (isNaN(score2) ? 0 : score2) : (isNaN(score1) ? 0 : score1);
              matchedMatch.status = espnState === "post" ? "Kết thúc" : "Đang đá";
              matchedMatch.matchTime = event.status.type.shortDetail || (event.status.displayClock ? event.status.displayClock + "'" : "");

              // Trích xuất thẻ phạt và cầu thủ ghi bàn từ chi tiết trận đấu của ESPN
              let yc1 = 0, rc1 = 0, yc2 = 0, rc2 = 0;
              let scorers1 = [];
              let scorers2 = [];
              const homeUid = homeCompetitor.team.id;
              const awayUid = awayCompetitor.team.id;

              if (competition.details && competition.details.length > 0) {
                competition.details.forEach(d => {
                  // Safe check team properties
                  if (d.team && d.team.id) {
                    // Thẻ phạt
                    if (d.yellowCard === true) {
                      if (d.team.id === homeUid) { if (isHomeTeam1) yc1++; else yc2++; }
                      else if (d.team.id === awayUid) { if (isHomeTeam1) yc2++; else yc1++; }
                    }
                    if (d.redCard === true) {
                      if (d.team.id === homeUid) { if (isHomeTeam1) rc1++; else rc2++; }
                      else if (d.team.id === awayUid) { if (isHomeTeam1) rc2++; else rc1++; }
                    }
                  }
                  // Cầu thủ ghi bàn
                  if (d.scoringPlay === true || (d.type && (d.type.text === "Goal" || d.type.id === "70"))) {
                    let pName = (d.athletesInvolved && d.athletesInvolved.length > 0) ? d.athletesInvolved[0].displayName : "Unknown";
                    let min = d.clock ? d.clock.displayValue : "";
                    if (d.ownGoal === true) {
                      pName = pName + " (OG)";
                    }
                    const sObj = { name: pName, min: min };
                    if (d.team && d.team.id) {
                      if (d.team.id === homeUid) {
                        if (isHomeTeam1) scorers1.push(sObj); else scorers2.push(sObj);
                      } else if (d.team.id === awayUid) {
                        if (isHomeTeam1) scorers2.push(sObj); else scorers1.push(sObj);
                      }
                    }
                  }
                });
              }

              matchedMatch.yc1 = yc1;
              matchedMatch.rc1 = rc1;
              matchedMatch.yc2 = yc2;
              matchedMatch.rc2 = rc2;
              matchedMatch.scorers1 = scorers1;
              matchedMatch.scorers2 = scorers2;

              updatedCount++;
            }
          }
        }
      });

      if (updatedCount > 0) {
        recalculateAll();
        if (!isSilent) {
          alert(`🔴 Cập nhật thành công ${updatedCount} trận đấu trực tuyến từ ESPN Live!`);
        }
      } else {
        if (!isSilent) {
          alert("Đồng bộ thành công! Hiện chưa có trận đấu nào của World Cup 2026 chính thức diễn ra trên ESPN (Giải đấu sẽ bắt đầu từ 11/06/2026).");
        }
      }

    } catch (error) {
      console.error("Lỗi fetch ESPN:", error);
      if (!isSilent) {
        alert("Không thể tải tỉ số trực tuyến: " + error.message + "\nVui lòng thử lại sau.");
      }
    } finally {
      resetButtons();
    }

    function resetButtons() {
      if (!isSilent) {
        btns.forEach(btn => {
          btn.disabled = false;
          btn.innerHTML = btn.classList.contains("full-width") ? "🔴 Cập nhật trực tuyến từ ESPN Live" : "🔴 ESPN Live";
        });
      }
    }
  }

  // --- ĐỒNG BỘ & ĐỔI GIAO DIỆN SÁNG / TỐI ---
  window.toggleTheme = function() {
    const isLight = document.body.classList.contains('light-theme');
    const newTheme = isLight ? 'dark' : 'light';
    
    if (newTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    
    localStorage.setItem('vnpt_his_theme', newTheme);
    updateThemeIcon(newTheme);
  };

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
  }

  // Lắng nghe sự kiện lưu trữ giao diện từ các tab khác
  window.addEventListener('storage', (e) => {
    if (e.key === 'vnpt_his_theme') {
      const newTheme = e.newValue || 'dark';
      if (newTheme === 'light') {
        document.body.classList.add('light-theme');
        updateThemeIcon('light');
      } else {
        document.body.classList.remove('light-theme');
        updateThemeIcon('dark');
      }
    }
  });

  // Khởi động ứng dụng
  const savedTheme = localStorage.getItem('vnpt_his_theme') || 'dark';
  updateThemeIcon(savedTheme);
  init();
});
