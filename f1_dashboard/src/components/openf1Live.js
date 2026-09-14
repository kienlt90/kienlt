import { OpenF1Service } from '../services/openf1Service.js';
import Chart from 'chart.js/auto';

let livePollInterval = null;
let replayTimer = null;
let currentSessionKey = 9662; // Default to 2024 Abu Dhabi Grand Prix Race (full complete data)
let currentMeetingKey = 1252;
let currentYear = 2024;
let activeLap = null;
let maxLap = 58;
let isPlayingReplay = false;
let isLivePolling = false;
let selectedDriverTelemetry = null;
let telemetryChartInstance = null;

// Preset famous races for instant testing
const PRESET_MEETINGS = [
  { year: 2024, meeting_key: 1252, name: 'Abu Dhabi Grand Prix (Chung Kết)', session_name: 'Race', session_key: 9662, flag: '🇦🇪' },
  { year: 2024, meeting_key: 1240, name: 'British Grand Prix (Silverstone)', session_name: 'Race', session_key: 9554, flag: '🇬🇧' },
  { year: 2024, meeting_key: 1236, name: 'Monaco Grand Prix (Monte Carlo)', session_name: 'Race', session_key: 9522, flag: '🇲🇨' },
  { year: 2024, meeting_key: 1242, name: 'Belgian Grand Prix (Spa-Francorchamps)', session_name: 'Race', session_key: 9570, flag: '🇧🇪' },
  { year: 2024, meeting_key: 1238, name: 'Spanish Grand Prix (Barcelona)', session_name: 'Race', session_key: 9538, flag: '🇪🇸' },
  { year: 2024, meeting_key: 1244, name: 'Italian Grand Prix (Monza)', session_name: 'Race', session_key: 9586, flag: '🇮🇹' }
];

export async function renderOpenF1Live(container) {
  // Clear any existing polling/timers
  if (livePollInterval) clearInterval(livePollInterval);
  if (replayTimer) clearInterval(replayTimer);

  container.innerHTML = `
    <div class="openf1-container">
      <!-- Top Control Bar -->
      <div class="openf1-header glass">
        <div class="openf1-title-group">
          <div class="openf1-badge">
            <span class="live-dot" id="openf1-status-dot"></span>
            <span id="openf1-status-text">OPENF1 API ONLINE</span>
          </div>
          <h2 class="openf1-heading">Dữ Liệu Thật F1 Real-Time & Replay</h2>
        </div>

        <div class="openf1-controls">
          <!-- Preset Selector -->
          <div class="control-group">
            <label for="openf1-meeting-select">Chặng Đua:</label>
            <select id="openf1-meeting-select" class="openf1-select">
              ${PRESET_MEETINGS.map(m => `
                <option value="${m.session_key}" ${m.session_key === currentSessionKey ? 'selected' : ''}>
                  ${m.flag} ${m.name} (${m.year})
                </option>
              `).join('')}
              <option value="latest">⚡ Phiên đua Mới nhất (Live / Latest)</option>
            </select>
          </div>

          <!-- Mode Toggle: Live vs Replay -->
          <div class="control-group mode-toggle-group">
            <button id="btn-toggle-live" class="openf1-btn ${isLivePolling ? 'active' : ''}">
              <span class="pulse-icon"></span>
              <span>Live Poll (5s)</span>
            </button>
            <button id="btn-refresh-data" class="openf1-btn secondary" title="Làm mới ngay">
              🔄 Cập Nhật
            </button>
          </div>
        </div>
      </div>

      <!-- Live Weather & Race Control Ribbon -->
      <div class="openf1-ribbon-grid">
        <!-- Weather Card -->
        <div class="openf1-weather-card glass" id="openf1-weather-box">
          <div class="ribbon-label">TRẠM THỜI TIẾT ĐƯỜNG ĐUA</div>
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
              <span class="value" id="weather-wind">-- km/h</span>
            </div>
            <div class="weather-item">
              <span class="label">Mưa:</span>
              <span class="value" id="weather-rain">KHÔ RÁO</span>
            </div>
          </div>
        </div>

        <!-- Race Control Ticker -->
        <div class="openf1-rc-card glass" id="openf1-rc-box">
          <div class="ribbon-label">THÔNG BÁO RACE CONTROL (FIA)</div>
          <div class="rc-ticker" id="openf1-rc-ticker">
            <div class="rc-msg info">Đang kết nối luồng dữ liệu OpenF1...</div>
          </div>
        </div>
      </div>

      <!-- Lap Replay Scrubber -->
      <div class="openf1-replay-bar glass">
        <div class="replay-controls">
          <button id="btn-replay-prev" class="replay-btn" title="Vòng trước">⏮</button>
          <button id="btn-replay-play" class="replay-btn play" title="Phát lại tự động">
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
          <span class="fl-tag">FASTEST LAP</span>
          <span class="fl-driver" id="openf1-fl-driver">--</span>
          <span class="fl-time" id="openf1-fl-time">--:--.---</span>
        </div>
      </div>

      <!-- Main Live Timing Tower -->
      <div class="openf1-tower-container glass">
        <div class="tower-header-grid">
          <div class="col-pos">POS</div>
          <div class="col-driver">TAY ĐUA / ĐỘI</div>
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
            <span>Đang tải dữ liệu viễn trắc từ OpenF1 API...</span>
          </div>
        </div>
      </div>

      <!-- Telemetry Drawer (Hidden by default, shows on driver click) -->
      <div class="telemetry-drawer-backdrop" id="telemetry-backdrop">
        <div class="telemetry-drawer glass" id="telemetry-drawer">
          <div class="drawer-header">
            <div class="drawer-driver-info" id="drawer-driver-title">
              <h3>VIỄN TRẮC BUỒNG LÁI (TELEMETRY)</h3>
            </div>
            <button class="drawer-close-btn" id="btn-close-drawer">✕</button>
          </div>
          <div class="drawer-body" id="drawer-content">
            <!-- Dynamically populated -->
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  setupEventListeners(container);

  // Initial load
  await loadSessionData();
}

function setupEventListeners(container) {
  const selectMeeting = container.querySelector('#openf1-meeting-select');
  const btnToggleLive = container.querySelector('#btn-toggle-live');
  const btnRefresh = container.querySelector('#btn-refresh-data');
  const slider = container.querySelector('#openf1-lap-slider');
  const btnPlay = container.querySelector('#btn-replay-play');
  const btnPrev = container.querySelector('#btn-replay-prev');
  const btnNext = container.querySelector('#btn-replay-next');
  const btnCloseDrawer = container.querySelector('#btn-close-drawer');
  const backdrop = container.querySelector('#telemetry-backdrop');

  // Change Session
  selectMeeting.addEventListener('change', async (e) => {
    const val = e.target.value;
    if (val === 'latest') {
      try {
        const latest = await OpenF1Service.getLatestSession();
        currentSessionKey = latest.session_key;
      } catch (err) {
        console.error(err);
      }
    } else {
      currentSessionKey = parseInt(val, 10);
    }
    activeLap = null;
    await loadSessionData();
  });

  // Toggle Live Polling
  btnToggleLive.addEventListener('click', () => {
    isLivePolling = !isLivePolling;
    btnToggleLive.classList.toggle('active', isLivePolling);
    if (isLivePolling) {
      if (isPlayingReplay) stopReplay();
      livePollInterval = setInterval(loadSessionData, 5000);
      loadSessionData();
    } else {
      if (livePollInterval) clearInterval(livePollInterval);
    }
  });

  // Refresh
  btnRefresh.addEventListener('click', () => {
    loadSessionData();
  });

  // Slider change (Replay lap)
  slider.addEventListener('input', (e) => {
    activeLap = parseInt(e.target.value, 10);
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
      slider.value = activeLap;
      container.querySelector('#replay-current-lap-text').textContent = `Vòng ${activeLap} / ${maxLap}`;
      loadSessionData(activeLap);
    }
  });

  btnNext.addEventListener('click', () => {
    if (activeLap < maxLap) {
      activeLap++;
      slider.value = activeLap;
      container.querySelector('#replay-current-lap-text').textContent = `Vòng ${activeLap} / ${maxLap}`;
      loadSessionData(activeLap);
    }
  });

  // Close Drawer
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

  replayTimer = setInterval(() => {
    if (activeLap < maxLap) {
      activeLap++;
      const slider = document.querySelector('#openf1-lap-slider');
      const text = document.querySelector('#replay-current-lap-text');
      if (slider) slider.value = activeLap;
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

async function loadSessionData(targetLap = null) {
  const rowsContainer = document.querySelector('#openf1-tower-rows');
  const statusText = document.querySelector('#openf1-status-text');
  const statusDot = document.querySelector('#openf1-status-dot');

  try {
    if (statusText) statusText.textContent = 'ĐANG ĐỒNG BỘ DỮ LIỆU...';
    if (statusDot) statusDot.style.background = '#FFD700';

    const timingData = await OpenF1Service.getFullLiveTiming(currentSessionKey, targetLap);
    
    if (statusText) statusText.textContent = `OPENF1 ONLINE (${timingData.drivers.length} TAY ĐUA)`;
    if (statusDot) statusDot.style.background = '#00FF66';

    maxLap = timingData.maxLap || 58;
    if (!activeLap) activeLap = maxLap;

    // Update Slider limits
    const slider = document.querySelector('#openf1-lap-slider');
    const lapText = document.querySelector('#replay-current-lap-text');
    if (slider) {
      slider.max = maxLap;
      slider.value = activeLap;
    }
    if (lapText) lapText.textContent = `Vòng ${activeLap} / ${maxLap}`;

    // Update Fastest Lap
    const flDriver = document.querySelector('#openf1-fl-driver');
    const flTime = document.querySelector('#openf1-fl-time');
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
    ticker.innerHTML = `<div class="rc-msg info">Không có sự cố nào cần xử lý. Track CLEAR.</div>`;
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
    const tyreClass = getTyreClass(d.compound);

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
              <span class="driver-code">${d.code || 'DRV'}</span>
              <span class="driver-fullname">${d.broadcastName || d.name}</span>
            </div>
            <span class="driver-num">#${d.number}</span>
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
          <div class="tyre-badge ${tyreClass}">
            <span class="tyre-letter">${d.compound ? d.compound[0] : 'M'}</span>
            <span class="tyre-age">${d.tyreAge}L</span>
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

function getTyreClass(compound) {
  if (!compound) return 'tyre-medium';
  const c = compound.toUpperCase();
  if (c.includes('SOFT')) return 'tyre-soft';
  if (c.includes('HARD')) return 'tyre-hard';
  if (c.includes('INTER')) return 'tyre-inter';
  if (c.includes('WET')) return 'tyre-wet';
  return 'tyre-medium';
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
