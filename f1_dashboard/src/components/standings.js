import { drivers2025, drivers2026 } from '../data/drivers.js';
import Chart from 'chart.js/auto';

let activeSeason = '2026'; // Default to 2026 current
let activeChartInstance = null;

export function renderStandings(container) {
  container.innerHTML = `
    <div class="standings-layout">
      <!-- Left Column: Chart.js Bar Chart -->
      <div class="chart-card glass">
        <div class="card-header-sec">
          <div class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span id="chart-dynamic-title">Bảng Xếp Hạng Đồng Đội (Mùa giải 2026)</span>
          </div>
        </div>
        <div class="chart-wrapper">
          <canvas id="drivers-chart"></canvas>
        </div>
      </div>

      <!-- Right Column: Interactive Drivers Scroll List -->
      <div class="drivers-list-card glass">
        <div class="card-header-sec" style="margin-bottom: 20px;">
          <div class="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Bảng Xếp Hạng Chi Tiết</span>
          </div>
          <div class="card-actions">
            <button class="btn-mini ${activeSeason === '2026' ? 'active' : ''}" id="btn-season-2026">2026</button>
            <button class="btn-mini ${activeSeason === '2025' ? 'active' : ''}" id="btn-season-2025">2025</button>
          </div>
        </div>
        
        <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-tech); margin-bottom: 12px; display: flex; justify-content: space-between;">
          <span id="season-status-text">TRẠNG THÁI: SAU CHẶNG MONACO GP (07/06/2026)</span>
          <span>CLICK TAY ĐUA XEM CHI TIẾT</span>
        </div>

        <div class="drivers-scroll" id="drivers-scroll-list">
          <!-- Rendered dynamically -->
        </div>
      </div>
    </div>

    <!-- Glassmorphic Driver Modal Detail Overlay -->
    <div class="driver-overlay" id="driver-detail-overlay">
      <div class="driver-modal glass" id="driver-detail-modal">
        <button class="modal-close-btn" id="modal-close-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div id="modal-body-content">
          <!-- Rendered dynamically -->
        </div>
      </div>
    </div>
  `;

  // Get active driver dataset
  const currentDrivers = activeSeason === '2026' ? drivers2026 : drivers2025;

  // 1. Render drivers list
  populateDriversList(currentDrivers);

  // 2. Initialize Chart.js
  initDriversChart(currentDrivers);

  // 3. Bind season toggle event listeners
  const btn2026 = document.getElementById('btn-season-2026');
  const btn2025 = document.getElementById('btn-season-2025');
  const chartTitle = document.getElementById('chart-dynamic-title');
  const statusText = document.getElementById('season-status-text');

  if (btn2026 && btn2025) {
    btn2026.addEventListener('click', () => {
      if (activeSeason === '2026') return;
      activeSeason = '2026';
      btn2026.classList.add('active');
      btn2025.classList.remove('active');
      chartTitle.textContent = 'Bảng Xếp Hạng Đồng Đội (Mùa giải 2026)';
      statusText.textContent = 'TRẠNG THÁI: SAU CHẶNG MONACO GP (07/06/2026)';
      
      const data = drivers2026;
      populateDriversList(data);
      updateDriversChart(data);
    });

    btn2025.addEventListener('click', () => {
      if (activeSeason === '2025') return;
      activeSeason = '2025';
      btn2025.classList.add('active');
      btn2026.classList.remove('active');
      chartTitle.textContent = 'Bảng Xếp Hạng Đồng Đội (Chung cuộc 2025)';
      statusText.textContent = 'TRẠNG THÁI: MÙA GIẢI ĐÃ KẾT THÚC CHUNG CUỘC';
      
      const data = drivers2025;
      populateDriversList(data);
      updateDriversChart(data);
    });
  }

  // 4. Event listeners for modal closing
  const overlay = document.getElementById('driver-detail-overlay');
  const closeBtn = document.getElementById('modal-close-btn');
  if (overlay && closeBtn) {
    closeBtn.addEventListener('click', () => {
      overlay.style.display = 'none';
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });
  }
}

function populateDriversList(dataset) {
  const listContainer = document.getElementById('drivers-scroll-list');
  if (!listContainer) return;

  listContainer.innerHTML = dataset.map(driver => `
    <div class="driver-card-row glass" data-driver-pos="${driver.position}">
      <div class="driver-rank">#${driver.position}</div>
      <div class="driver-team-stripe" style="background-color: ${driver.color};"></div>
      <div class="driver-identity">
        <div class="driver-name-row">
          <span class="driver-name-text">${driver.name}</span>
          <span class="driver-number-badge">${driver.number}</span>
          <span style="font-size: 0.9rem;">${driver.flag}</span>
        </div>
        <span class="driver-team-text">${driver.team}</span>
      </div>
      <div class="driver-stats-summary">
        <div class="driver-stat-unit">
          <span class="driver-stat-val">${driver.wins}</span>
          <span class="driver-stat-lbl">WINS</span>
        </div>
        <div class="driver-stat-unit">
          <span class="driver-stat-val">${driver.podiums}</span>
          <span class="driver-stat-lbl">PODIUMS</span>
        </div>
      </div>
      <div class="driver-points-wrap">
        <div class="driver-points-val">${driver.points}</div>
        <div class="driver-points-lbl">POINTS</div>
      </div>
    </div>
  `).join('');

  // Add click events to open modal
  const rows = listContainer.querySelectorAll('.driver-card-row');
  rows.forEach(row => {
    row.addEventListener('click', () => {
      const pos = parseInt(row.getAttribute('data-driver-pos'));
      const driver = dataset.find(d => d.position === pos);
      if (driver) {
        openDriverModal(driver);
      }
    });
  });
}

function openDriverModal(driver) {
  const overlay = document.getElementById('driver-detail-overlay');
  const modalContent = document.getElementById('modal-body-content');
  if (!overlay || !modalContent) return;

  // Find max points for performance percentage scale
  const maxPts = activeSeason === '2026' ? Math.max(...drivers2026.map(d => d.points)) : 423;

  modalContent.innerHTML = `
    <div class="modal-header">
      <div class="modal-avatar-box" style="border-color: ${driver.color}; color: ${driver.color};">
        ${driver.avatar}
      </div>
      <div class="modal-driver-info">
        <h2>${driver.name} ${driver.flag}</h2>
        <p>${driver.team} • Xe số #${driver.number}</p>
        <p style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--f1-red); font-weight: bold; margin-top: 4px;">
          Quốc tịch: ${driver.nationality}
        </p>
      </div>
    </div>
    
    <div class="modal-stats-grid">
      <div class="modal-stat-card">
        <span class="modal-stat-num">${driver.points}</span>
        <span class="modal-stat-title">Điểm số</span>
      </div>
      <div class="modal-stat-card">
        <span class="modal-stat-num">${driver.wins}</span>
        <span class="modal-stat-title">Chiến thắng</span>
      </div>
      <div class="modal-stat-card">
        <span class="modal-stat-num">${driver.podiums}</span>
        <span class="modal-stat-title">Podiums</span>
      </div>
    </div>

    <div class="modal-stats-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 24px;">
      <div class="modal-stat-card">
        <span class="modal-stat-num" style="color: var(--neon-blue);">${driver.fastestLaps}</span>
        <span class="modal-stat-title">Vòng nhanh nhất</span>
      </div>
      <div class="modal-stat-card">
        <span class="modal-stat-num" style="color: var(--neon-green);">${Math.round((driver.points/maxPts)*100)}%</span>
        <span class="modal-stat-title">Tỷ lệ dẫn đầu</span>
      </div>
    </div>
    
    <div class="modal-bio">
      <p>${driver.bio}</p>
    </div>
  `;

  // Set modal border top color to match team
  const modal = document.getElementById('driver-detail-modal');
  if (modal) {
    modal.style.borderTopColor = driver.color;
  }

  overlay.style.display = 'flex';
}

function getTeamStandings(dataset) {
  // Return authentic constructors points for 2026 (after Monaco GP)
  if (dataset === drivers2026) {
    return [
      { name: "Mercedes", points: 239, color: "#27F4D2", wins: 5, podiums: 9 },
      { name: "Ferrari", points: 191, color: "#E80020", wins: 2, podiums: 8 },
      { name: "Red Bull Racing", points: 142, color: "#3671C6", wins: 0, podiums: 4 },
      { name: "McLaren", points: 131, color: "#FF8000", wins: 1, podiums: 5 },
      { name: "Aston Martin", points: 48, color: "#229971", wins: 0, podiums: 0 },
      { name: "Racing Bulls", points: 36, color: "#6692FF", wins: 0, podiums: 0 },
      { name: "Alpine", points: 32, color: "#FF87BC", wins: 0, podiums: 0 },
      { name: "Haas", points: 28, color: "#FFFFFF", wins: 0, podiums: 0 },
      { name: "Williams", points: 24, color: "#64C4FF", wins: 0, podiums: 0 },
      { name: "Kick Sauber", points: 8, color: "#a3e635", wins: 0, podiums: 0 }
    ].sort((a, b) => b.points - a.points);
  } else {
    // Return authentic constructors points for 2025 (Chung cuộc)
    return [
      { name: "McLaren", points: 833, color: "#FF8000", wins: 12, podiums: 26 },
      { name: "Red Bull Racing", points: 544, color: "#3671C6", wins: 9, podiums: 16 },
      { name: "Ferrari", points: 488, color: "#E80020", wins: 3, podiums: 14 },
      { name: "Mercedes", points: 469, color: "#27F4D2", wins: 3, podiums: 12 },
      { name: "Williams", points: 137, color: "#64C4FF", wins: 0, podiums: 1 },
      { name: "Aston Martin", points: 86, color: "#229971", wins: 0, podiums: 1 },
      { name: "Alpine", points: 42, color: "#FF87BC", wins: 0, podiums: 0 },
      { name: "Haas", points: 27, color: "#FFFFFF", wins: 0, podiums: 0 },
      { name: "Racing Bulls", points: 25, color: "#6692FF", wins: 0, podiums: 0 },
      { name: "Kick Sauber", points: 4, color: "#a3e635", wins: 0, podiums: 0 }
    ].sort((a, b) => b.points - a.points);
  }
}

function initDriversChart(dataset) {
  const canvas = document.getElementById('drivers-chart');
  if (!canvas) return;

  if (activeChartInstance) {
    activeChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  const teamsData = getTeamStandings(dataset);
  const maxScale = activeSeason === '2026' ? 250 : 900;

  activeChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: teamsData.map(t => t.name),
      datasets: [{
        label: 'Điểm số đội đua',
        data: teamsData.map(t => t.points),
        backgroundColor: teamsData.map(t => t.color),
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.65,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(10, 11, 13, 0.95)',
          titleFont: { family: 'Space Grotesk', size: 13, weight: 'bold' },
          bodyFont: { family: 'Space Grotesk', size: 12 },
          borderColor: 'rgba(255, 255, 255, 0.15)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              const team = teamsData[context.dataIndex];
              return ` Điểm: ${context.parsed.x} pts (${team.wins} Wins, ${team.podiums} Podiums)`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)', drawTicks: false },
          ticks: {
            color: '#8E9AA8',
            font: { family: 'Orbitron', size: 10 }
          },
          max: maxScale
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#FFFFFF',
            font: { family: 'Space Grotesk', size: 11, weight: 'bold' }
          }
        }
      }
    }
  });
}

function updateDriversChart(dataset) {
  if (!activeChartInstance) return;

  const teamsData = getTeamStandings(dataset);
  const maxScale = activeSeason === '2026' ? 250 : 900;
  
  activeChartInstance.data.labels = teamsData.map(t => t.name);
  activeChartInstance.data.datasets[0].data = teamsData.map(t => t.points);
  activeChartInstance.data.datasets[0].backgroundColor = teamsData.map(t => t.color);
  
  // Re-adjust max scales dynamically
  activeChartInstance.options.scales.x.max = maxScale;
  
  // Re-attach tooltip callbacks to correctly show active teams
  activeChartInstance.options.plugins.tooltip.callbacks.label = function(context) {
    const team = teamsData[context.dataIndex];
    return ` Điểm: ${context.parsed.x} pts (${team.wins} Wins, ${team.podiums} Podiums)`;
  };

  activeChartInstance.update();
}
