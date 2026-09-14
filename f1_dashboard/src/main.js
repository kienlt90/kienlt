import './style.css';
import { createIcons, Gauge, Radio, Activity, Wind, Thermometer, Flag, Zap, Clock } from 'lucide';
import { renderOpenF1App } from './components/openf1Live.js';

// Elements
const appContainer = document.getElementById('openf1-app-root');
const clockDisplay = document.getElementById('header-real-clock');

// Initialize Lucide Icons
function initIcons() {
  createIcons({
    icons: {
      Gauge,
      Radio,
      Activity,
      Wind,
      Thermometer,
      Flag,
      Zap,
      Clock
    }
  });
}

// Live High-Tech Clock
function initClock() {
  setInterval(() => {
    const now = new Date();
    const year = now.getFullYear();
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

// Bootstrapping
function initApp() {
  initClock();
  if (appContainer) {
    renderOpenF1App(appContainer);
  }
  initIcons();
}

document.addEventListener('DOMContentLoaded', initApp);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initApp();
}
