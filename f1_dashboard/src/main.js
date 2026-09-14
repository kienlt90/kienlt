import './style.css';
import { createIcons, Gauge, Award, Calendar, Radio, Activity } from 'lucide';
import { renderDashboard } from './components/dashboard.js';
import { renderStandings } from './components/standings.js';
import { renderCircuits } from './components/circuits.js';
import { renderLiveMap } from './components/liveMap.js';
import { renderOpenF1Live } from './components/openf1Live.js';

// Elements
const btnDashboard = document.getElementById('btn-dashboard');
const btnStandings = document.getElementById('btn-standings');
const btnCircuits = document.getElementById('btn-circuits');
const btnLiveMap = document.getElementById('btn-live-map');
const btnOpenF1 = document.getElementById('btn-openf1');

const panelDashboard = document.getElementById('panel-dashboard');
const panelStandings = document.getElementById('panel-standings');
const panelCircuits = document.getElementById('panel-circuits');
const panelLiveMap = document.getElementById('panel-live-map');
const panelOpenF1 = document.getElementById('panel-openf1');

const headerTitle = document.getElementById('header-panel-title');
const headerSubtitle = document.getElementById('header-panel-subtitle');
const clockDisplay = document.getElementById('header-real-clock');

// State
let activeTab = 'dashboard';

// Initialize Lucide Icons
function initIcons() {
  createIcons({
    icons: {
      Gauge,
      Award,
      Calendar,
      Radio,
      Activity
    }
  });
}

// Router
function switchTab(tabId) {
  if (activeTab === tabId) return;
  activeTab = tabId;

  // Deactivate all
  btnDashboard.classList.remove('active');
  btnStandings.classList.remove('active');
  btnCircuits.classList.remove('active');
  btnLiveMap.classList.remove('active');
  if (btnOpenF1) btnOpenF1.classList.remove('active');

  panelDashboard.classList.remove('active');
  panelStandings.classList.remove('active');
  panelCircuits.classList.remove('active');
  panelLiveMap.classList.remove('active');
  if (panelOpenF1) panelOpenF1.classList.remove('active');

  // Activate selected
  if (tabId === 'dashboard') {
    btnDashboard.classList.add('active');
    panelDashboard.classList.add('active');
    headerTitle.textContent = 'Tổng Quan Mùa Giải';
    headerSubtitle.textContent = 'HỆ THỐNG GIÁM SÁT VIỄN TRẮC TRỰC TUYẾN';
    renderDashboard(panelDashboard);
  } else if (tabId === 'standings') {
    btnStandings.classList.add('active');
    panelStandings.classList.add('active');
    headerTitle.textContent = 'Bảng Xếp Hạng Tay Đua';
    headerSubtitle.textContent = 'SO SÁNH ĐIỂM SỐ & THÔNG TIN CHI TIẾT';
    renderStandings(panelStandings);
  } else if (tabId === 'circuits') {
    btnCircuits.classList.add('active');
    panelCircuits.classList.add('active');
    headerTitle.textContent = 'Chi Tiết Chặng Đua';
    headerSubtitle.textContent = 'BẢN ĐỒ NEON & PHÂN TÍCH KỸ THUẬT';
    renderCircuits(panelCircuits);
  } else if (tabId === 'live-map') {
    btnLiveMap.classList.add('active');
    panelLiveMap.classList.add('active');
    headerTitle.textContent = 'Bản Đồ Live GP';
    headerSubtitle.textContent = 'MÔ PHỎNG VỊ TRÍ ĐUA & ĐỒNG HỒ LIVE TIMING';
    renderLiveMap(panelLiveMap);
  } else if (tabId === 'openf1') {
    if (btnOpenF1) btnOpenF1.classList.add('active');
    if (panelOpenF1) panelOpenF1.classList.add('active');
    headerTitle.textContent = 'Dữ Liệu Thật OpenF1';
    headerSubtitle.textContent = 'LIVE TIMING & VIỄN TRẮC CHÍNH THỨC TỪ FIA TIMING FEED';
    renderOpenF1Live(panelOpenF1);
  }

  initIcons();
}

// Live High-Tech Clock
function initClock() {
  // We'll base the clock on the year 2026, running dynamically.
  // The system's time will run but we will output it in 2026
  setInterval(() => {
    const now = new Date();
    // Keep 2026 year but use current month, date, time
    const year = 2026;
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    if (clockDisplay) {
      clockDisplay.textContent = `${year}-${month}-${date} ${hours}:${minutes}:${seconds} UTC`;
    }
  }, 1000);
}

// App bootstrapping
function initApp() {
  // 1. Start live clock
  initClock();

  // 2. Bind navigation events
  btnDashboard.addEventListener('click', () => switchTab('dashboard'));
  btnStandings.addEventListener('click', () => switchTab('standings'));
  btnCircuits.addEventListener('click', () => switchTab('circuits'));
  btnLiveMap.addEventListener('click', () => switchTab('live-map'));
  if (btnOpenF1) btnOpenF1.addEventListener('click', () => switchTab('openf1'));

  // 3. Load default tab
  renderDashboard(panelDashboard);
  
  // 4. Draw icons
  initIcons();
}

// Run bootstrapping once DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
// Fallback if DOM already loaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initApp();
}
