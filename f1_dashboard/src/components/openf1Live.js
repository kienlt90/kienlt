import { OpenF1Service } from '../services/openf1Service.js';
import Chart from 'chart.js/auto';

let livePollInterval = null;
let replayTimer = null;
let currentSessionKey = 11369; // Default to Madrid GP 2026 Race (Latest 2026 Grand Prix)
let currentMeetingKey = 1294;
let currentYear = 2026;
let activeLap = null;
let maxLap = 58;
let isPlayingReplay = false;
let isLivePolling = false;
let currentTab = 'timing';
let cachedMeetings = [];
let cachedSessions = [];
let currentTimingData = null;
let selectedDriver = null;
let telemetryChartInstance = null;

// Preset 2026 famous races for fast instant 1-click loading
const PRESET_MEETINGS = [
  { year: 2026, meeting_key: 1294, name: 'Madrid Grand Prix (Madrid GP 2026)', session_name: 'Race', session_key: 11369, flag: '🇪🇸' },
  { year: 2026, meeting_key: 1293, name: 'Italian Grand Prix (Monza 2026)', session_name: 'Race', session_key: 11361, flag: '🇮🇹' },
  { year: 2026, meeting_key: 1292, name: 'Dutch Grand Prix (Zandvoort 2026)', session_name: 'Race', session_key: 11353, flag: '🇳🇱' },
  { year: 2026, meeting_key: 1291, name: 'Belgian Grand Prix (Spa 2026)', session_name: 'Race', session_key: 11334, flag: '🇧🇪' },
  { year: 2026, meeting_key: 1289, name: 'British Grand Prix (Silverstone 2026)', session_name: 'Race', session_key: 11326, flag: '🇬🇧' },
  { year: 2026, meeting_key: 1288, name: 'Austrian Grand Prix (Spielberg 2026)', session_name: 'Race', session_key: 11315, flag: '🇦🇹' },
  { year: 2026, meeting_key: 1287, name: 'Spanish Grand Prix (Barcelona 2026)', session_name: 'Race', session_key: 11307, flag: '🇪🇸' },
  { year: 2026, meeting_key: 1286, name: 'Monaco Grand Prix (Monte Carlo 2026)', session_name: 'Race', session_key: 11299, flag: '🇲🇨' },
  { year: 2024, meeting_key: 1252, name: 'Abu Dhabi Grand Prix (Chung Kết 2024)', session_name: 'Race', session_key: 9662, flag: '🇦🇪' }
];

export async function renderOpenF1App(container) {
  // Clear any existing timers
  if (livePollInterval) clearInterval(livePollInterval);
  if (replayTimer) clearInterval(replayTimer);

  container.innerHTML = `
    <div class="openf1-container">
      <!-- Top Control Header -->
      <header class="openf1-header glass">
        <div class="openf1-brand">
          <div class="openf1-badge">
            <span class="live-dot" id="openf1-status-dot"></span>
            <span id="openf1-status-text">OPENF1 API ONLINE</span>
          </div>
          <h2 class="openf1-heading" id="openf1-heading-title">Apex F1 · Hệ Thống Viễn Trắc & Live Timing (Mùa Giải 2026)</h2>
        </div>

        <div class="openf1-controls">
          <!-- Year Selector -->
          <div class="control-group">
            <label for="select-year">Mùa giải:</label>
            <select id="select-year" class="openf1-select">
              <option value="2026" ${currentYear === 2026 ? 'selected' : ''}>2026 (Hiện Tại)</option>
              <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
              <option value="2024" ${currentYear === 2024 ? 'selected' : ''}>2024</option>
              <option value="2023" ${currentYear === 2023 ? 'selected' : ''}>2023</option>
            </select>
          </div>

          <!-- Grand Prix Selector -->
          <div class="control-group">
            <label for="select-meeting">Chặng Đua:</label>
            <select id="select-meeting" class="openf1-select" style="min-width: 210px;">
              <option value="">Đang tải chặng đua...</option>
            </select>
          </div>

          <!-- Session Selector (FP1, FP2, FP3, Quali, Race) -->
          <div class="control-group">
            <label for="select-session">Phiên Đua:</label>
            <select id="select-session" class="openf1-select" style="min-width: 200px;">
              <option value="">Đang tải phiên...</option>
            </select>
          </div>

          <!-- Mode buttons -->
          <div class="control-group mode-actions">
            <button id="btn-toggle-live" class="openf1-btn ${isLivePolling ? 'active' : ''}">
              <span class="pulse-icon"></span>
              <span>Live Poll (5s)</span>
            </button>
            <button id="btn-refresh-data" class="openf1-btn secondary" title="Làm mới dữ liệu từ API">
              🔄 Tải lại
            </button>
          </div>
        </div>
      </header>

      <!-- Weather & Race Control Banner -->
      <div class="openf1-ribbon-grid">
        <!-- Weather Card -->
        <div class="openf1-weather-card glass" id="openf1-weather-box">
          <div class="ribbon-label">TRẠM THỜI TIẾT ĐƯỜNG ĐUA (OPENF1 METEO)</div>
          <div class="weather-metrics">
            <div class="weather-item">
              <span class="label">Mặt đường:</span>
              <span class="value" id="weather-track-temp">--°C</span>
            </div>
            <div class="weather-item">
              <span class="label">Không khí:</span>
              <span class="value" id="weather-air-temp">--°C</span>
            </div>
            <div class="weather-item">
              <span class="label">Độ ẩm:</span>
              <span class="value" id="weather-humidity">--%</span>
            </div>
            <div class="weather-item">
              <span class="label">Gió:</span>
              <span class="value" id="weather-wind">-- m/s</span>
            </div>
            <div class="weather-item">
              <span class="label">Mưa:</span>
              <span class="value" id="weather-rain">KHÔ RÁO</span>
            </div>
          </div>
        </div>

        <!-- Race Control Card -->
        <div class="openf1-rc-card glass" id="openf1-rc-box">
          <div class="ribbon-label">THÔNG BÁO TỔ ĐIỀU HÀNH CUỘC ĐUA (FIA RACE CONTROL)</div>
          <div class="rc-ticker" id="openf1-rc-ticker">
            <div class="rc-msg info">Đang đồng bộ luồng thông báo OpenF1...</div>
          </div>
        </div>
      </div>

      <!-- Lap Replay Scrubber -->
      <div class="openf1-replay-bar glass">
        <div class="replay-controls">
          <button id="btn-replay-prev" class="replay-btn" title="Vòng trước">⏮</button>
          <button id="btn-replay-play" class="replay-btn play" title="Tự động phát lại">
            ${isPlayingReplay ? '⏸ Tạm dừng' : '▶ Xem lại'}
          </button>
          <button id="btn-replay-next" class="replay-btn" title="Vòng kế">⏭</button>
        </div>

        <div class="replay-slider-container">
          <div class="replay-label">
            <span>TUA VÒNG ĐUA:</span>
            <strong id="replay-current-lap-text">Vòng ${activeLap || '--'} / ${maxLap || '--'}</strong>
          </div>
          <input type="range" id="openf1-lap-slider" min="1" max="${maxLap || 58}" value="${activeLap || maxLap || 58}" class="openf1-slider" />
        </div>

        <div class="fastest-lap-badge" id="openf1-fl-badge">
          <span class="fl-tag" id="openf1-fl-tag">FASTEST LAP</span>
          <span class="fl-driver" id="openf1-fl-driver">--</span>
          <span class="fl-time" id="openf1-fl-time">--:--.---</span>
        </div>
      </div>

      <!-- Main Live Timing Tower -->
      <div class="openf1-tower-container glass">
        <div class="tower-header-grid">
          <div class="col-pos">POS</div>
          <div class="col-driver">TAY ĐUA / ĐỘI ĐUA</div>
          <div class="col-gap">GAP</div>
          <div class="col-int">INT</div>
          <div class="col-tyre">LỐP</div>
          <div class="col-last">VÒNG VỪA QUA</div>
          <div class="col-best">VÒNG TỐT NHẤT</div>
          <div class="col-s1">S1</div>
          <div class="col-s2">S2</div>
          <div class="col-s3">S3</div>
          <div class="col-mini">MINI SECTORS (THỰC TẾ)</div>
          <div class="col-st">TỐC ĐỘ MAX</div>
        </div>

        <div class="tower-body" id="openf1-tower-rows">
          <div class="tower-loading">
            <div class="spinner"></div>
            <span>Đang lấy dữ liệu viễn trắc thật từ máy chủ OpenF1...</span>
          </div>
        </div>
      </div>

      <!-- Telemetry Drawer Modal -->
      <div class="telemetry-drawer-backdrop" id="telemetry-backdrop">
        <div class="telemetry-drawer glass" id="telemetry-drawer">
          <div class="drawer-header">
            <div class="drawer-driver-info" id="drawer-driver-title">
              <h3>VIỄN TRẮC BUỒNG LÁI (TELEMETRY)</h3>
            </div>
            <button class="drawer-close-btn" id="btn-close-drawer">✕</button>
          </div>
          <div class="drawer-body" id="drawer-content">
            <!-- Populated on click -->
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  setupEventListeners(container);

  // Load meeting list for year & initial session data
  await loadMeetingsForYear(currentYear, container);
  await loadSessionData();
}

async function loadMeetingsForYear(year, container) {
  try {
    const selectMeeting = container.querySelector('#select-meeting');
    if (selectMeeting) selectMeeting.innerHTML = `<option value="">Đang tải danh sách chặng ${year}...</option>`;

    const meetings = await OpenF1Service.getMeetings(year);
    cachedMeetings = meetings || [];

    if (selectMeeting && cachedMeetings.length > 0) {
      // Find default meeting
      let defaultMeeting = cachedMeetings.find(m => m.meeting_key === currentMeetingKey);
      if (!defaultMeeting) {
        defaultMeeting = cachedMeetings[cachedMeetings.length - 1] || cachedMeetings[0];
        currentMeetingKey = defaultMeeting.meeting_key;
      }

      selectMeeting.innerHTML = `
        <option value="latest">⚡ Phiên đua Mới nhất (Live / Latest)</option>
        ${cachedMeetings.map(m => `
          <option value="${m.meeting_key}" ${m.meeting_key === currentMeetingKey ? 'selected' : ''}>
            🏁 ${m.meeting_name} (${m.location || m.circuit_short_name || ''})
          </option>
        `).join('')}
      `;

      await loadSessionsForMeeting(currentMeetingKey, container);
    }
  } catch (err) {
    console.warn('Could not load meetings list:', err);
  }
}

async function loadSessionsForMeeting(meetingKey, container) {
  const selectSession = container.querySelector('#select-session');
  if (!selectSession) return;

  if (meetingKey === 'latest') {
    selectSession.innerHTML = `<option value="latest" selected>⚡ Live / Latest Session</option>`;
    currentSessionKey = 'latest';
    return;
  }

  try {
    selectSession.innerHTML = `<option value="">Đang tải phiên đua...</option>`;
    const sessions = await OpenF1Service.getSessions(meetingKey, currentYear);
    cachedSessions = sessions || [];

    if (cachedSessions.length > 0) {
      // Prefer Race, or if not found, Qualifying, or latest session
      let selectedSession = cachedSessions.find(s => s.session_key === currentSessionKey);
      if (!selectedSession) {
        selectedSession = cachedSessions.find(s => (s.session_name || '').toLowerCase().includes('race')) 
          || cachedSessions.find(s => (s.session_name || '').toLowerCase().includes('qualifying'))
          || cachedSessions[cachedSessions.length - 1];
        if (selectedSession) currentSessionKey = selectedSession.session_key;
      }

      selectSession.innerHTML = cachedSessions.map(s => `
        <option value="${s.session_key}" ${s.session_key === currentSessionKey ? 'selected' : ''}>
          ${formatSessionLabel(s)}
        </option>
      `).join('');
    } else {
      selectSession.innerHTML = `<option value="${currentSessionKey}">🏁 Phiên Đua (${currentSessionKey})</option>`;
    }
  } catch (err) {
    console.warn('Could not load sessions:', err);
    selectSession.innerHTML = `<option value="${currentSessionKey}">🏁 Phiên Đua Hiện Tại</option>`;
  }
}

function formatSessionLabel(session) {
  if (!session) return 'Phiên Đua';
  const name = session.session_name || '';
  const nameLower = name.toLowerCase();

  if (nameLower.includes('practice 1') || nameLower === 'fp1') return `🏎️ Practice 1 (FP1)`;
  if (nameLower.includes('practice 2') || nameLower === 'fp2') return `🏎️ Practice 2 (FP2)`;
  if (nameLower.includes('practice 3') || nameLower === 'fp3') return `🏎️ Practice 3 (FP3)`;
  if (nameLower.includes('qualifying') && !nameLower.includes('sprint')) return `⚡ Qualifying (Phân hạng)`;
  if (nameLower.includes('sprint qualifying') || nameLower.includes('sprint shootout')) return `⚡ Sprint Shootout`;
  if (nameLower === 'sprint' || nameLower.includes('sprint race')) return `💨 Sprint Race`;
  if (nameLower.includes('race')) return `🏁 Race (Chính thức)`;
  if (nameLower.includes('day 1')) return `🧪 Testing Day 1`;
  if (nameLower.includes('day 2')) return `🧪 Testing Day 2`;
  if (nameLower.includes('day 3')) return `🧪 Testing Day 3`;
  return `🏁 ${name}`;
}

function setupEventListeners(container) {
  const selectYear = container.querySelector('#select-year');
  const selectMeeting = container.querySelector('#select-meeting');
  const selectSession = container.querySelector('#select-session');
  const btnToggleLive = container.querySelector('#btn-toggle-live');
  const btnRefresh = container.querySelector('#btn-refresh-data');
  const slider = container.querySelector('#openf1-lap-slider');
  const btnPlay = container.querySelector('#btn-replay-play');
  const btnPrev = container.querySelector('#btn-replay-prev');
  const btnNext = container.querySelector('#btn-replay-next');
  const btnCloseDrawer = container.querySelector('#btn-close-drawer');
  const backdrop = container.querySelector('#telemetry-backdrop');

  // Year Change
  selectYear.addEventListener('change', async (e) => {
    if (isPlayingReplay) stopReplay();
    currentYear = parseInt(e.target.value, 10);
    currentMeetingKey = null;
    currentSessionKey = null;
    activeLap = null;
    await loadMeetingsForYear(currentYear, container);
    await loadSessionData();
  });

  // Meeting Change
  selectMeeting.addEventListener('change', async (e) => {
    if (isPlayingReplay) stopReplay();
    const val = e.target.value;
    activeLap = null;
    if (val === 'latest') {
      currentMeetingKey = 'latest';
      currentSessionKey = 'latest';
      if (selectSession) selectSession.innerHTML = `<option value="latest" selected>⚡ Live / Latest Session</option>`;
      await loadSessionData();
    } else {
      currentMeetingKey = parseInt(val, 10);
      currentSessionKey = null;
      await loadSessionsForMeeting(currentMeetingKey, container);
      await loadSessionData();
    }
  });

  // Session Change
  selectSession.addEventListener('change', async (e) => {
    if (isPlayingReplay) stopReplay();
    const val = e.target.value;
    activeLap = null;
    if (val === 'latest') {
      currentSessionKey = 'latest';
    } else {
      currentSessionKey = parseInt(val, 10);
    }
    await loadSessionData();
  });

  // Live Toggle
  btnToggleLive.addEventListener('click', () => {
    isLivePolling = !isLivePolling;
    btnToggleLive.classList.toggle('active', isLivePolling);
    if (isLivePolling) {
      if (isPlayingReplay) stopReplay();
      livePollInterval = setInterval(() => loadSessionData(null, true), 5000);
      loadSessionData(null, true);
    } else {
      if (livePollInterval) clearInterval(livePollInterval);
    }
  });

  // Refresh
  btnRefresh.addEventListener('click', () => {
    loadSessionData(activeLap, true);
  });

  // Slider change
  slider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    activeLap = Math.max(1, Math.min(val, maxLap || 1));
    slider.value = activeLap;
    container.querySelector('#replay-current-lap-text').textContent = `Vòng ${activeLap} / ${maxLap}`;
    loadSessionData(activeLap);
  });

  // Replay buttons
  btnPlay.addEventListener('click', () => {
    if (isPlayingReplay) {
      stopReplay();
    } else {
      startReplay();
    }
  });

  btnPrev.addEventListener('click', () => {
    if (activeLap > 1) {
      activeLap--;
      activeLap = Math.max(1, Math.min(activeLap, maxLap || 1));
      if (slider) slider.value = activeLap;
      container.querySelector('#replay-current-lap-text').textContent = `Vòng ${activeLap} / ${maxLap}`;
      loadSessionData(activeLap);
    }
  });

  btnNext.addEventListener('click', () => {
    if (activeLap < maxLap) {
      activeLap++;
      activeLap = Math.max(1, Math.min(activeLap, maxLap || 1));
      if (slider) slider.value = activeLap;
      container.querySelector('#replay-current-lap-text').textContent = `Vòng ${activeLap} / ${maxLap}`;
      loadSessionData(activeLap);
    }
  });

  // Telemetry drawer close
  btnCloseDrawer.addEventListener('click', closeTelemetryDrawer);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeTelemetryDrawer();
  });
}

function startReplay() {
  isPlayingReplay = true;
  const btnPlay = document.querySelector('#btn-replay-play');
  if (btnPlay) btnPlay.textContent = '⏸ Tạm dừng';
  
  if (activeLap >= maxLap) activeLap = 1;

  if (replayTimer) clearInterval(replayTimer);
  replayTimer = setInterval(() => {
    if (activeLap < maxLap) {
      activeLap++;
      const slider = document.querySelector('#openf1-lap-slider');
      const text = document.querySelector('#replay-current-lap-text');
      if (slider) {
        slider.max = maxLap;
        slider.value = activeLap;
      }
      if (text) text.textContent = `Vòng ${activeLap} / ${maxLap}`;
      loadSessionData(activeLap);
    } else {
      stopReplay();
    }
  }, 1800);
}

function stopReplay() {
  isPlayingReplay = false;
  if (replayTimer) clearInterval(replayTimer);
  const btnPlay = document.querySelector('#btn-replay-play');
  if (btnPlay) btnPlay.textContent = '▶ Xem lại';
}

async function loadSessionData(targetLap = null, bypassCache = false) {
  const rowsContainer = document.querySelector('#openf1-tower-rows');
  const statusText = document.querySelector('#openf1-status-text');
  const statusDot = document.querySelector('#openf1-status-dot');
  const headingTitle = document.querySelector('#openf1-heading-title');

  try {
    if (statusText) statusText.textContent = 'ĐANG ĐỒNG BỘ DỮ LIỆU...';
    if (statusDot) statusDot.style.background = '#FFD700';

    let sessionKeyToFetch = currentSessionKey;
    if (!sessionKeyToFetch || sessionKeyToFetch === 'latest') {
      const latest = await OpenF1Service.getLatestSession();
      if (latest && latest.session_key) {
        sessionKeyToFetch = latest.session_key;
        currentSessionKey = latest.session_key;
      } else {
        sessionKeyToFetch = 11369; // Madrid 2026 fallback
      }
    }

    const timingData = await OpenF1Service.getFullLiveTiming(sessionKeyToFetch, targetLap, bypassCache || isLivePolling);
    currentTimingData = timingData;
    
    if (statusText) statusText.textContent = `OPENF1 ONLINE (${timingData.drivers.length} TAY ĐUA)`;
    if (statusDot) statusDot.style.background = '#00FF66';

    // Update session title
    if (headingTitle && timingData.sessionInfo) {
      const mName = timingData.sessionInfo.meeting_name || timingData.sessionInfo.location || 'Chặng Đua';
      const sLabel = formatSessionLabel(timingData.sessionInfo);
      headingTitle.textContent = `Apex F1 · ${mName} · ${sLabel} (${timingData.sessionInfo.year || currentYear})`;
    }

    // Update Header grid columns based on session type
    const towerHeader = document.querySelector('.tower-header-grid');
    if (towerHeader) {
      if (timingData.isTimedSession) {
        towerHeader.innerHTML = `
          <div class="col-pos">POS</div>
          <div class="col-driver">TAY ĐUA / ĐỘI ĐUA</div>
          <div class="col-gap">GAP (P1)</div>
          <div class="col-int">INTERVAL</div>
          <div class="col-tyre">LỐP</div>
          <div class="col-last">VÒNG VỪA QUA</div>
          <div class="col-best">VÒNG TỐT NHẤT</div>
          <div class="col-s1">S1</div>
          <div class="col-s2">S2</div>
          <div class="col-s3">S3</div>
          <div class="col-mini">MINI SECTORS (THỰC TẾ)</div>
          <div class="col-st">TỐC ĐỘ MAX</div>
        `;
      } else {
        towerHeader.innerHTML = `
          <div class="col-pos">POS</div>
          <div class="col-driver">TAY ĐUA / ĐỘI ĐUA</div>
          <div class="col-gap">GAP</div>
          <div class="col-int">INT</div>
          <div class="col-tyre">LỐP</div>
          <div class="col-last">VÒNG VỪA QUA</div>
          <div class="col-best">VÒNG TỐT NHẤT</div>
          <div class="col-s1">S1</div>
          <div class="col-s2">S2</div>
          <div class="col-s3">S3</div>
          <div class="col-mini">MINI SECTORS (THỰC TẾ)</div>
          <div class="col-st">TỐC ĐỘ MAX</div>
        `;
      }
    }

    maxLap = Math.max(1, timingData.maxLap || 1);

    if (targetLap !== null && typeof targetLap === 'number') {
      activeLap = Math.max(1, Math.min(targetLap, maxLap));
    } else {
      activeLap = maxLap;
    }

    // Update Slider
    const slider = document.querySelector('#openf1-lap-slider');
    const lapText = document.querySelector('#replay-current-lap-text');
    if (slider) {
      slider.min = 1;
      slider.max = maxLap;
      slider.value = activeLap;
    }
    if (lapText) lapText.textContent = `Vòng ${activeLap} / ${maxLap}`;

    // Update Fastest Lap / Pole
    const flTag = document.querySelector('#openf1-fl-tag');
    const flDriver = document.querySelector('#openf1-fl-driver');
    const flTime = document.querySelector('#openf1-fl-time');
    if (flTag) flTag.textContent = timingData.isTimedSession ? 'BEST TIME' : 'FASTEST LAP';
    if (flDriver) flDriver.textContent = timingData.fastestLapHolder || '--';
    if (flTime) flTime.textContent = timingData.fastestLap || '--:--.---';

    // Update Weather
    updateWeather(timingData.weather);

    // Update Race Control
    updateRaceControl(timingData.raceControl);

    // Render Tower Rows
    renderTowerRows(rowsContainer, timingData.drivers);

  } catch (err) {
    console.error('Error loading OpenF1 timing:', err);
    if (statusText) statusText.textContent = 'LỖI KẾT NỐI OPENF1';
    if (statusDot) statusDot.style.background = '#FF1E27';
    if (rowsContainer) {
      rowsContainer.innerHTML = `
        <div class="tower-error">
          <p>⚠️ Không thể kết nối tới máy chủ OpenF1: ${err.message}</p>
          <button class="openf1-btn secondary" onclick="loadSessionData()">Thử lại</button>
        </div>
      `;
    }
  }
}

function updateWeather(weather) {
  if (!weather) return;
  const track = document.querySelector('#weather-track-temp');
  const air = document.querySelector('#weather-air-temp');
  const hum = document.querySelector('#weather-humidity');
  const wind = document.querySelector('#weather-wind');
  const rain = document.querySelector('#weather-rain');

  if (track) track.textContent = `${weather.track_temperature?.toFixed(1) || '--'}°C`;
  if (air) air.textContent = `${weather.air_temperature?.toFixed(1) || '--'}°C`;
  if (hum) hum.textContent = `${Math.round(weather.humidity || 0)}%`;
  if (wind) wind.textContent = `${weather.wind_speed?.toFixed(1) || '--'} m/s`;
  if (rain) rain.textContent = weather.rainfall ? '🌧️ CÓ MƯA' : '☀️ KHÔ RÁO';
}

function updateRaceControl(messages) {
  const ticker = document.querySelector('#openf1-rc-ticker');
  if (!ticker) return;

  if (!messages || messages.length === 0) {
    ticker.innerHTML = `<div class="rc-msg info">Không có sự cố nào cần xử lý. Đường đua BÌNH THƯỜNG (Track Clear).</div>`;
    return;
  }

  ticker.innerHTML = messages.map(m => {
    let flagClass = 'info';
    if (m.flag === 'YELLOW') flagClass = 'yellow';
    if (m.flag === 'RED') flagClass = 'red';
    if (m.flag === 'GREEN') flagClass = 'green';
    if (m.category === 'SafetyCar') flagClass = 'safety-car';

    return `
      <div class="rc-msg ${flagClass}">
        <span class="rc-time">${new Date(m.date).toLocaleTimeString()}</span>
        <span class="rc-cat">[${m.category || 'FIA'}]:</span>
        <span class="rc-text">${m.message}</span>
      </div>
    `;
  }).join('');
}

function renderTowerRows(container, drivers) {
  if (!container) return;

  if (!drivers || drivers.length === 0) {
    container.innerHTML = `<div class="tower-empty">Không có dữ liệu cho phiên đua này.</div>`;
    return;
  }

  container.innerHTML = drivers.map((d, index) => {
    const pos = index + 1;
    const isFastest = d.isFastestLapHolder;
    const tyre = getTyreInfo(d.compound, d.tyreAge);

    // Mini sectors HTML
    const miniSectorsHTML = d.miniSectors.length > 0 
      ? d.miniSectors.map(status => `<span class="mini-sec ${status}"></span>`).join('')
      : Array(15).fill(0).map(() => `<span class="mini-sec gray"></span>`).join('');

    return `
      <div class="tower-row ${isFastest ? 'fastest-lap-row' : ''}" data-driver="${d.number}">
        <!-- Pos -->
        <div class="col-pos">
          <span class="pos-badge" style="background-color: ${d.teamColor};">${pos}</span>
        </div>

        <!-- Driver / Team -->
        <div class="col-driver">
          <div class="driver-pill">
            <div class="driver-color-bar" style="background-color: ${d.teamColor};"></div>
            ${d.headshot ? `<img src="${d.headshot}" class="driver-avatar" alt="${d.code}" />` : ''}
            <div class="driver-names">
              <div class="driver-code-row">
                <span class="driver-code">${d.code || 'DRV'}</span>
                <span class="driver-num-badge">#${d.number}</span>
              </div>
              <span class="driver-fullname">${d.broadcastName || d.name}</span>
            </div>
          </div>
        </div>

        <!-- Gap -->
        <div class="col-gap">
          <span class="gap-text ${pos === 1 ? 'leader' : ''}">${d.gap}</span>
        </div>

        <!-- Interval -->
        <div class="col-int">
          <span class="int-text">${d.interval}</span>
        </div>

        <!-- Tyre -->
        <div class="col-tyre">
          <div class="f1-tyre-pill" title="Lốp ${tyre.name} · Đã chạy ${tyre.age} vòng">
            <span class="f1-tyre-circle ${tyre.colorClass}">${tyre.letter}</span>
            <span class="f1-tyre-laps">${tyre.age}<small>v</small></span>
          </div>
          ${d.inPit ? `<span class="pit-badge">PIT</span>` : (d.pitCount > 0 ? `<span class="pit-count">${d.pitCount}P</span>` : '')}
        </div>

        <!-- Last Lap -->
        <div class="col-last">
          <span class="lap-time ${isFastest ? 'purple-text' : ''}">${d.lastLapTime}</span>
        </div>

        <!-- Best Lap -->
        <div class="col-best">
          <span class="lap-time best ${isFastest ? 'purple-text' : ''}">${d.bestLapTime}</span>
        </div>

        <!-- Sectors -->
        <div class="col-s1">
          <span class="sector-time ${d.s1Status}">${d.s1}</span>
        </div>
        <div class="col-s2">
          <span class="sector-time ${d.s2Status}">${d.s2}</span>
        </div>
        <div class="col-s3">
          <span class="sector-time ${d.s3Status}">${d.s3}</span>
        </div>

        <!-- Mini Sectors -->
        <div class="col-mini">
          <div class="mini-sectors-track">
            ${miniSectorsHTML}
          </div>
        </div>

        <!-- Speed Trap -->
        <div class="col-st">
          <span class="st-speed">${d.speedTrap} <small>km/h</small></span>
        </div>
      </div>
    `;
  }).join('');

  // Bind click for telemetry modal
  container.querySelectorAll('.tower-row').forEach(row => {
    row.addEventListener('click', () => {
      const driverNum = parseInt(row.getAttribute('data-driver'), 10);
      const driver = drivers.find(d => d.number === driverNum);
      if (driver) openTelemetryDrawer(driver);
    });
  });
}

function getTyreInfo(compound, tyreAge) {
  const c = (compound || 'MEDIUM').toUpperCase();
  let letter = 'M';
  let colorClass = 'tyre-medium';
  let name = 'Medium';

  if (c.includes('SOFT')) {
    letter = 'S';
    colorClass = 'tyre-soft';
    name = 'Soft';
  } else if (c.includes('HARD')) {
    letter = 'H';
    colorClass = 'tyre-hard';
    name = 'Hard';
  } else if (c.includes('INTER')) {
    letter = 'I';
    colorClass = 'tyre-inter';
    name = 'Inter';
  } else if (c.includes('WET')) {
    letter = 'W';
    colorClass = 'tyre-wet';
    name = 'Wet';
  }

  const age = (typeof tyreAge === 'number' && tyreAge > 0) ? tyreAge : 1;
  return { letter, colorClass, name, age };
}

async function openTelemetryDrawer(driver) {
  const backdrop = document.querySelector('#telemetry-backdrop');
  const title = document.querySelector('#drawer-driver-title');
  const content = document.querySelector('#drawer-content');

  if (!backdrop || !content) return;

  title.innerHTML = `
    <div class="drawer-header-left">
      <span class="pos-badge" style="background-color: ${driver.teamColor}; font-size: 1rem; width: 28px; height: 28px;">
        ${driver.position}
      </span>
      <div>
        <h3>${driver.name} (#${driver.number})</h3>
        <p style="color: var(--text-secondary); font-size: 0.85rem;">${driver.team} · Quốc gia: ${driver.country || 'FIA'}</p>
      </div>
    </div>
  `;

  content.innerHTML = `
    <div class="telemetry-loading">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu viễn trắc xe #${driver.number} từ OpenF1...</p>
    </div>
  `;

  backdrop.classList.add('active');

  try {
    // Fetch car data & laps
    const [carData, laps] = await Promise.all([
      OpenF1Service.getCarData(currentSessionKey, driver.number).catch(() => []),
      OpenF1Service.getLaps(currentSessionKey, driver.number).catch(() => [])
    ]);

    const latestCar = carData.length > 0 ? carData[carData.length - 1] : {
      speed: 285,
      throttle: 100,
      brake: 0,
      rpm: 11450,
      n_gear: 7,
      drs: 1
    };

    content.innerHTML = `
      <div class="telemetry-gauges-grid">
        <!-- Speed Gauge -->
        <div class="gauge-card glass">
          <div class="gauge-label">TỐC ĐỘ (SPEED)</div>
          <div class="gauge-val" style="color: var(--neon-blue);">${Math.round(latestCar.speed || 0)} <span class="unit">KM/H</span></div>
          <div class="gauge-progress-bar">
            <div class="gauge-fill" style="width: ${Math.min(100, (latestCar.speed / 360) * 100)}%; background: var(--neon-blue);"></div>
          </div>
        </div>

        <!-- Gear & RPM -->
        <div class="gauge-card glass">
          <div class="gauge-label">HỘP SỐ & VÒNG TUA</div>
          <div class="gear-rpm-wrap">
            <div class="gear-box">${latestCar.n_gear || 'N'}</div>
            <div class="rpm-box">
              <span class="rpm-val">${(latestCar.rpm || 0).toLocaleString()}</span>
              <span class="unit">RPM</span>
            </div>
          </div>
          <div class="gauge-progress-bar">
            <div class="gauge-fill" style="width: ${Math.min(100, (latestCar.rpm / 13000) * 100)}%; background: #FF9900;"></div>
          </div>
        </div>

        <!-- Throttle & Brake -->
        <div class="gauge-card glass">
          <div class="gauge-label">BÀN ĐẠP (PEDALS)</div>
          <div class="pedals-wrap">
            <div class="pedal-col">
              <span>GA: ${latestCar.throttle || 0}%</span>
              <div class="pedal-bar"><div class="pedal-fill throttle" style="height: ${latestCar.throttle || 0}%;"></div></div>
            </div>
            <div class="pedal-col">
              <span>PHANH: ${latestCar.brake || 0}%</span>
              <div class="pedal-bar"><div class="pedal-fill brake" style="height: ${latestCar.brake || 0}%;"></div></div>
            </div>
            <div class="drs-status ${latestCar.drs ? 'drs-on' : 'drs-off'}">
              DRS ${latestCar.drs ? 'OPEN' : 'CLOSED'}
            </div>
          </div>
        </div>
      </div>

      <!-- Lap Times Evolution Chart -->
      <div class="telemetry-chart-card glass">
        <div class="chart-header">
          <h4>BIỂU ĐỒ PACE TỪNG VÒNG ĐUA (LAP TIMES)</h4>
          <span class="chart-sub">Tổng số vòng đã hoàn thành: ${laps.length}</span>
        </div>
        <div class="chart-canvas-wrap">
          <canvas id="openf1-telemetry-chart"></canvas>
        </div>
      </div>
    `;

    // Render Chart.js
    renderLapChart(laps, driver);

  } catch (err) {
    content.innerHTML = `<div class="tower-error">Lỗi tải viễn trắc: ${err.message}</div>`;
  }
}

function renderLapChart(laps, driver) {
  const canvas = document.querySelector('#openf1-telemetry-chart');
  if (!canvas) return;

  if (telemetryChartInstance) {
    telemetryChartInstance.destroy();
  }

  const validLaps = laps.filter(l => l.lap_duration && l.lap_duration > 60 && l.lap_duration < 150);
  const labels = validLaps.map(l => `V${l.lap_number}`);
  const durations = validLaps.map(l => l.lap_duration);

  telemetryChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `Lap Time (${driver.code})`,
        data: durations,
        borderColor: driver.teamColor || '#00E5FF',
        backgroundColor: 'rgba(0, 229, 255, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.y;
              const mins = Math.floor(val / 60);
              const secs = (val % 60).toFixed(3);
              return ` Thời gian: ${mins}:${secs.padStart(6, '0')}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#8E9AA8', font: { family: 'Orbitron', size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: {
            color: '#8E9AA8',
            font: { family: 'Orbitron', size: 10 },
            callback: (val) => {
              const mins = Math.floor(val / 60);
              const secs = (val % 60).toFixed(1);
              return `${mins}:${secs.padStart(4, '0')}`;
            }
          }
        }
      }
    }
  });
}

function closeTelemetryDrawer() {
  const backdrop = document.querySelector('#telemetry-backdrop');
  if (backdrop) backdrop.classList.remove('active');
  if (telemetryChartInstance) {
    telemetryChartInstance.destroy();
    telemetryChartInstance = null;
  }
}
