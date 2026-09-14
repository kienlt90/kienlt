import { schedule } from '../data/schedule.js';
import { getUpcomingGP, getCircuitAnalytics } from './dashboard.js';

let liveSimInterval = null;

function getTeamLogoSVG(teamName) {
  const team = teamName.toLowerCase();
  if (team.includes('mercedes')) {
    return `<svg viewBox="0 0 24 24" style="width:12px; height:12px; fill:none; stroke:#fff; stroke-width:2.2; vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M12 12V3M12 12l7.8 4.5M12 12L4.2 16.5"/></svg>`;
  }
  if (team.includes('ferrari')) {
    return `<svg viewBox="0 0 24 24" style="width:12px; height:12px; vertical-align:middle; display:inline-block;"><path d="M5 2h14v12c0 5-7 8-7 8s-7-3-7-8V2z" fill="#FFEB3B"/><text x="12" y="14" font-size="11" font-weight="950" fill="#000" text-anchor="middle" font-family="sans-serif">F</text></svg>`;
  }
  if (team.includes('red bull')) {
    return `<svg viewBox="0 0 24 24" style="width:12px; height:12px; vertical-align:middle;"><circle cx="12" cy="12" r="10" fill="#001845"/><circle cx="12" cy="12" r="4" fill="#FFD700"/><path d="M4 14c2-1 4-2 7 0s5 2 9 0" stroke="#FF1E27" stroke-width="2.2" fill="none"/></svg>`;
  }
  if (team.includes('mclaren')) {
    return `<svg viewBox="0 0 24 24" style="width:12px; height:12px; fill:none; stroke:#FF8000; stroke-width:3; vertical-align:middle;"><path d="M4 16c6-10 12-8 16-2-4-4-10-4-16 2z" fill="#FF8000"/></svg>`;
  }
  if (team.includes('aston martin')) {
    return `<svg viewBox="0 0 24 24" style="width:12px; height:12px; fill:none; stroke:#00e070; stroke-width:2; vertical-align:middle;"><path d="M2 10h20M2 10c4 4 14 4 20 0M5 10v4M19 10v4M12 7v7"/></svg>`;
  }
  if (team.includes('alpine')) {
    return `<svg viewBox="0 0 24 24" style="width:12px; height:12px; fill:#0050A0; stroke:none; vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M8 17l4-10 4 10M9.5 13h5" stroke="#fff" stroke-width="2.5" fill="none"/></svg>`;
  }
  if (team.includes('williams')) {
    return `<svg viewBox="0 0 24 24" style="width:12px; height:12px; fill:#005AFF; stroke:none; vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M7 8l2.5 8L12 11l2.5 5L17 8" stroke="#fff" stroke-width="2.2" fill="none"/></svg>`;
  }
  if (team.includes('haas')) {
    return `<svg viewBox="0 0 24 24" style="width:12px; height:12px; fill:#E60000; stroke:none; vertical-align:middle;"><circle cx="12" cy="12" r="10" fill="#FFFFFF" stroke="#CCCCCC" stroke-width="1.2"/><path d="M8 7v10M16 7v10M8 12h8" stroke="#E60000" stroke-width="3"/></svg>`;
  }
  if (team.includes('racing bulls') || team.includes('vcarb')) {
    return `<svg viewBox="0 0 24 24" style="width:12px; height:12px; vertical-align:middle;"><circle cx="12" cy="12" r="10" fill="#001845"/><circle cx="12" cy="12" r="4" fill="#CCCCCC"/><path d="M4 14c2-1 4-2 7 0s5 2 9 0" stroke="#0070FF" stroke-width="2.2" fill="none"/></svg>`;
  }
  if (team.includes('sauber') || team.includes('kick')) {
    return `<svg viewBox="0 0 24 24" style="width:12px; height:12px; fill:#00E600; stroke:none; vertical-align:middle;"><circle cx="12" cy="12" r="10" fill="#000000" stroke="#00E600" stroke-width="1.8"/><path d="M8 9c0-1.5 1-2 2-2h4c1 0 2 .5 2 2 0 1.5-1.5 2-3 2s-3 .5-3 2 1 2 3 2h1" stroke="#00E600" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`;
  }
  return '';
}

export function renderLiveMap(container) {
  // Clear any active interval first
  if (liveSimInterval) {
    clearInterval(liveSimInterval);
    liveSimInterval = null;
  }

  const matchedGP = getUpcomingGP();
  const analytics = getCircuitAnalytics(matchedGP.slug);
  const isMonaco = matchedGP.slug.toLowerCase().includes('monaco');

  container.innerHTML = `
    <div class="live-map-layout" style="display: grid; grid-template-columns: 1.1fr 1.05fr; gap: 24px; width: 100%; min-height: 570px; font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">
      
      <!-- Left Column: Interactive Neon Track Map -->
      <div class="db-card glass" style="display: flex; flex-direction: column; gap: 16px; padding: 24px; height: 100%; position: relative;">
        <!-- Header status -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 4px;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <span style="font-size: 0.78rem; color: var(--text-secondary); text-transform: uppercase; font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-weight: 700; letter-spacing: 0.5px;">Bản Đồ Động Vị Trí Vòng Đua</span>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--neon-blue); width: 22px; height: 22px;" class="animate-pulse"><circle cx="12" cy="12" r="10"/><path d="m12 8-4 4 4 4 4-4-4-4"/></svg>
              <span>${matchedGP.gpName.replace("Grand Prix", "GP").toUpperCase()} TELEMETRY LIVE</span>
            </h3>
          </div>
          <!-- Flag status -->
          <div style="display: flex; gap: 10px; align-items: center;">
            <span style="font-size: 0.65rem; color: rgba(57, 255, 20, 0.7); font-family: var(--font-tech); font-weight: bold; padding: 4px 8px; border-radius: 4px; background: rgba(57, 255, 20, 0.05); border: 1px solid rgba(57, 255, 20, 0.2); letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 4px;">
              <span style="display:inline-block; width:5px; height:5px; background:rgba(57,255,20,0.8); border-radius:50%;" class="animate-pulse"></span>
              LIVE FEED: CONNECTED
            </span>
            <div id="sim-status-flag" style="display: inline-flex; align-items: center; gap: 8px; background: rgba(57, 255, 20, 0.1); border: 1px solid rgba(57, 255, 20, 0.3); padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; color: var(--neon-green); font-family: var(--font-tech);">
              <span style="display: inline-block; width: 8px; height: 8px; background: var(--neon-green); border-radius: 50%; box-shadow: 0 0 10px var(--neon-green);" class="animate-pulse"></span>
              <span>GREEN FLAG</span>
            </div>
            
            <button id="btn-trigger-safety" title="Kích hoạt trạng thái mô phỏng để kiểm tra giao diện trước giờ đua" style="background: rgba(255, 196, 0, 0.1); border: 1px solid rgba(255, 196, 0, 0.3); color: #ffc400; padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; cursor: pointer; transition: all var(--transition-fast);" onmouseover="this.style.background='rgba(255,196,0,0.2)'" onmouseout="this.style.background='rgba(255,196,0,0.1)'">
              OVERRIDE: KÍCH HOẠT SC (TEST)
            </button>
          </div>
        </div>

        <!-- SVG Track Canvas Container -->
        <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.15); border-radius: 8px; border: 1px solid var(--border-color); height: 335px; position: relative; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.2);">
          
          <svg viewBox="0 0 200 150" style="width: 95%; height: 95%; overflow: visible;" id="live-svg-canvas">
            <!-- Neon glows defs -->
            <defs>
              <linearGradient id="neon-glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.8" />
                <stop offset="50%" stop-color="#7B2CBF" stop-opacity="0.8" />
                <stop offset="100%" stop-color="#FF1E27" stop-opacity="0.8" />
              </linearGradient>
            </defs>

            <!-- Thick track line backroad -->
            <path d="${matchedGP.svgPath}" 
                  fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />

            <!-- Glowing high contrast neon track path -->
            <path id="live-track-path" d="${matchedGP.svgPath}" 
                  fill="none" stroke="url(#neon-glow-grad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 4px rgba(0, 229, 255, 0.45));" />

            <!-- Checkered Start/Finish Grid line -->
            <g id="live-start-finish-container"></g>

            <!-- Active Aero / ERS Override Zone indicators -->
            <path id="live-aero-zone-1" d="${matchedGP.svgPath}" fill="none" stroke="#d946ef" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8; filter: drop-shadow(0 0 2px #d946ef);" />
            <path id="live-aero-zone-2" d="${matchedGP.svgPath}" fill="none" stroke="#d946ef" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8; filter: drop-shadow(0 0 2px #d946ef);" />

            <g id="live-aero-labels-container"></g>

            <!-- Sector lines labels -->
            <g id="live-sectors-container"></g>

            <!-- Dynamic driver elements will be injected here on load -->
            <g id="svg-drivers-container"></g>
          </svg>
        </div>

        <!-- High-tech stats bar -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; font-size: 0.82rem; color: var(--text-secondary); background: rgba(255,255,255,0.015); border: 1px solid var(--border-color); padding: 10px 16px; border-radius: 6px; font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">
          <div>VÒNG CHẠY (Lap): <span id="live-lap-display" style="font-family: var(--font-tech); color: #fff; font-weight: 700;">14 / ${matchedGP.laps}</span></div>
          <div>ACTIVE AERO: <span style="font-family: var(--font-tech); color: var(--neon-blue); font-weight: 700;">ACTIVE (A-MODE)</span></div>
          <div>BẦU TRỜI: <span style="font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; color: #fff; font-weight: 700;">${analytics.weatherDesc}</span></div>
          <div>NHIỆT ĐỘ KHÍ: <span style="font-family: var(--font-tech); color: #fff; font-weight: 700;">${analytics.temp}</span></div>
        </div>

        <!-- High-Tech Live Team Radio Widget -->
        <div id="live-radio-widget" style="background: rgba(5,6,8,0.45); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 16px; position: relative; overflow: hidden; min-height: 85px; box-shadow: inset 0 0 15px rgba(0,0,0,0.3); margin-top: 12px;">
          <!-- Radio Status & Wave Visualizer -->
          <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 95px; border-right: 1px solid rgba(255,255,255,0.06); padding-right: 16px;">
            <span id="radio-status-badge" style="font-family: var(--font-tech); font-size: 0.65rem; font-weight: bold; color: var(--text-muted); text-transform: uppercase; display: flex; align-items: center; gap: 5px; letter-spacing: 0.5px;">
              <span id="radio-dot" style="display: inline-block; width: 6px; height: 6px; background: #8E9AA8; border-radius: 50%;"></span>
              STANDBY
            </span>
            <!-- Equalizer bars -->
            <div id="radio-eq-bars" style="display: flex; align-items: flex-end; gap: 2.5px; height: 18px; width: 45px; justify-content: center;">
              <span class="eq-bar" style="display: inline-block; width: 3px; height: 3px; background: var(--neon-blue); border-radius: 1px; transition: height 0.1s ease;"></span>
              <span class="eq-bar" style="display: inline-block; width: 3px; height: 3px; background: var(--neon-blue); border-radius: 1px; transition: height 0.1s ease;"></span>
              <span class="eq-bar" style="display: inline-block; width: 3px; height: 3px; background: var(--neon-blue); border-radius: 1px; transition: height 0.1s ease;"></span>
              <span class="eq-bar" style="display: inline-block; width: 3px; height: 3px; background: var(--neon-blue); border-radius: 1px; transition: height 0.1s ease;"></span>
              <span class="eq-bar" style="display: inline-block; width: 3px; height: 3px; background: var(--neon-blue); border-radius: 1px; transition: height 0.1s ease;"></span>
            </div>
          </div>
          
          <!-- Radio Transcript Content -->
          <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px; justify-content: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="radio-driver-badge" style="font-family: var(--font-tech); font-size: 0.72rem; font-weight: 900; color: #fff; padding: 2px 6px; border-radius: 3px; display: none;"></span>
              <span id="radio-time" style="font-size: 0.68rem; color: var(--text-muted); font-family: var(--font-tech); display: none;"></span>
            </div>
            <div id="radio-message-body" style="font-size: 0.82rem; line-height: 1.4; color: var(--text-secondary); font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">
              Đang quét các kênh vô tuyến (Team Radio) của paddock...
            </div>
          </div>
          
          <!-- Audio play effect indicator -->
          <div id="radio-beep-indicator" style="position: absolute; right: 16px; top: 10px; display: flex; align-items: center; gap: 6px; cursor: pointer; opacity: 0.55; transition: opacity 0.2s;" title="Bật/Tắt âm thanh bíp thông báo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: var(--neon-blue);" id="radio-sound-icon"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <span style="font-size: 0.65rem; font-family: var(--font-tech); color: var(--text-muted);" id="radio-sound-text">AUDIO ON</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Premium Live Timing Tower -->
      <div class="db-card glass" style="display: flex; flex-direction: column; gap: 12px; padding: 20px 12px; height: 100%; overflow: hidden;">
        <div class="card-header-sec" style="border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 0;">
          <div class="card-title" style="font-size: 1.05rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--f1-red); width: 16px; height: 16px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>BẢNG ĐỒNG HỒ LIVE TIMING</span>
          </div>
        </div>

        <div style="flex-grow: 1; overflow-y: auto; overflow-x: auto; max-height: 520px; width: 100%;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; min-width: 920px;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; height: 32px; font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;">
                <th style="padding: 6px 4px; font-weight: bold; width: 30px; text-align: center;">PIT</th>
                <th style="padding: 6px 4px; font-weight: bold; min-width: 120px;">DRIVER</th>
                <th style="padding: 6px 4px; font-weight: bold; text-align: right; width: 65px;">INTERVAL</th>
                <th style="padding: 6px 4px; font-weight: bold; text-align: center; width: 55px;">TYRE</th>
                <th style="padding: 6px 4px; font-weight: bold; text-align: right; width: 80px;">BEST LAP</th>
                <th style="padding: 6px 4px; font-weight: bold; text-align: right; width: 65px;">LEADER</th>
                <th style="padding: 6px 4px; font-weight: bold; text-align: right; width: 80px;">LAST LAP</th>
                <th style="padding: 6px 4px; font-weight: bold; text-align: center; width: 100px;">MINI SECTORS</th>
                <th style="padding: 6px 4px; font-weight: bold; text-align: center; width: 145px;">LAST SECTORS</th>
                <th style="padding: 6px 4px; font-weight: bold; text-align: center; width: 145px;">BEST SECTORS</th>
              </tr>
            </thead>
            <tbody id="live-timing-body">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  `;

  initLiveSimulation(matchedGP, isMonaco, analytics);
}

function initLiveSimulation(matchedGP, isMonaco, analytics) {
  const trackPath = document.getElementById('live-track-path');
  const svgDriversContainer = document.getElementById('svg-drivers-container');
  const timingBody = document.getElementById('live-timing-body');
  const btnTriggerSafety = document.getElementById('btn-trigger-safety');
  const simStatusFlag = document.getElementById('sim-status-flag');

  if (!trackPath || !svgDriversContainer || !timingBody) return;

  const totalLength = trackPath.getTotalLength();

  // Draw Checkered S/F line dynamically perpendicular to track orientation at progress 0.0
  const startFinishContainer = document.getElementById('live-start-finish-container');
  if (startFinishContainer) {
    const ptStart = trackPath.getPointAtLength(0);
    const ptStartNext = trackPath.getPointAtLength(0.01 * totalLength);
    const dx = ptStartNext.x - ptStart.x;
    const dy = ptStartNext.y - ptStart.y;
    const len = Math.sqrt(dx*dx + dy*dy);
    let px = -1.5, py = 0;
    if (len > 0) {
      px = (-dy / len) * 2.0;
      py = (dx / len) * 2.0;
    }
    const x1 = ptStart.x - px;
    const y1 = ptStart.y - py;
    const x2 = ptStart.x + px;
    const y2 = ptStart.y + py;
    
    startFinishContainer.innerHTML = `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="0.5 0.5" />
      <text x="${ptStart.x}" y="${ptStart.y - 3}" fill="rgba(255,255,255,0.6)" font-family="var(--font-tech)" font-size="3.2px" font-weight="bold" text-anchor="middle">S/F</text>
    `;
  }

  // Draw Aero Zones overlays along the track path dynamically using dasharray tricks
  const aeroZone1 = document.getElementById('live-aero-zone-1');
  const aeroZone2 = document.getElementById('live-aero-zone-2');
  if (aeroZone1) {
    aeroZone1.style.strokeDasharray = `0, ${0.35 * totalLength}, ${0.13 * totalLength}, ${totalLength}`;
  }
  if (aeroZone2) {
    aeroZone2.style.strokeDasharray = `0, ${0.88 * totalLength}, ${0.10 * totalLength}, ${totalLength}`;
  }

  const aeroLabelsContainer = document.getElementById('live-aero-labels-container');
  if (aeroLabelsContainer) {
    const ptAero1 = trackPath.getPointAtLength(0.415 * totalLength);
    const ptAero2 = trackPath.getPointAtLength(0.93 * totalLength);
    
    aeroLabelsContainer.innerHTML = `
      <text x="${ptAero1.x}" y="${ptAero1.y - 3}" fill="#d946ef" font-family="var(--font-tech)" font-size="3px" font-weight="bold" text-anchor="middle">AERO 1</text>
      <text x="${ptAero2.x}" y="${ptAero2.y - 3}" fill="#d946ef" font-family="var(--font-tech)" font-size="3px" font-weight="bold" text-anchor="middle">AERO 2</text>
    `;
  }

  // Draw Sector labels dynamically along track path
  const sectorsContainer = document.getElementById('live-sectors-container');
  if (sectorsContainer) {
    const ptS1 = trackPath.getPointAtLength(0.25 * totalLength);
    const ptS2 = trackPath.getPointAtLength(0.50 * totalLength);
    const ptS3 = trackPath.getPointAtLength(0.75 * totalLength);
    
    sectorsContainer.innerHTML = `
      <text x="${ptS1.x}" y="${ptS1.y - 3}" fill="rgba(255,255,255,0.2)" font-family="var(--font-tech)" font-size="3.5px" font-weight="bold" text-anchor="middle">SEC 1</text>
      <text x="${ptS2.x}" y="${ptS2.y - 3}" fill="rgba(255,255,255,0.2)" font-family="var(--font-tech)" font-size="3.5px" font-weight="bold" text-anchor="middle">SEC 2</text>
      <text x="${ptS3.x}" y="${ptS3.y - 3}" fill="rgba(255,255,255,0.2)" font-family="var(--font-tech)" font-size="3.5px" font-weight="bold" text-anchor="middle">SEC 3</text>
    `;
  }

  // State: 22 F1 Drivers with realistic positions, tyre stop simulator, mini sectors, sector times
  let driversList = [
    { pos: 1, no: "12", code: "ANT", name: "Kimi Antonelli", team: "Mercedes", color: "#27F4D2", progress: 0.98, tyre: "S", tyreAge: 14, lastLap: "1:14.285", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "19.722", lastS2: "35.243", lastS3: "20.649", bestS1: 19.379, bestS2: 34.566, bestS3: 19.536, rawBestLapSec: 73.481, bestLap: "1:13.481" },
    { pos: 2, no: "44", code: "HAM", name: "Lewis Hamilton", team: "Ferrari", color: "#E80020", progress: 0.94, tyre: "S", tyreAge: 14, lastLap: "1:14.643", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "20.099", lastS2: "35.490", lastS3: "20.202", bestS1: 19.879, bestS2: 35.004, bestS3: 19.735, rawBestLapSec: 74.618, bestLap: "1:14.618" },
    { pos: 3, no: "6", code: "HAD", name: "Isack Hadjar", team: "Racing Bulls", color: "#6692FF", progress: 0.90, tyre: "S", tyreAge: 14, lastLap: "1:15.669", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "19.910", lastS2: "35.603", lastS3: "20.260", bestS1: 19.910, bestS2: 35.578, bestS3: 20.110, rawBestLapSec: 75.598, bestLap: "1:15.598" },
    { pos: 4, no: "81", code: "PIA", name: "Oscar Piastri", team: "McLaren", color: "#FF8000", progress: 0.86, tyre: "S", tyreAge: 14, lastLap: "1:15.816", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "20.044", lastS2: "35.532", lastS3: "20.286", bestS1: 19.979, bestS2: 35.532, bestS3: 20.205, rawBestLapSec: 75.716, bestLap: "1:15.716" },
    { pos: 5, no: "30", code: "LAW", name: "Liam Lawson", team: "Racing Bulls", color: "#6692FF", progress: 0.82, tyre: "S", tyreAge: 16, lastLap: "1:15.754", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "20.031", lastS2: "35.735", lastS3: "20.197", bestS1: 20.031, bestS2: 35.665, bestS3: 20.042, rawBestLapSec: 75.738, bestLap: "1:15.738" },
    { pos: 6, no: "2", code: "LIN", name: "Arvid Lindblad", team: "Red Bull Racing", color: "#3671C6", progress: 0.78, tyre: "S", tyreAge: 0, lastLap: "1:15.908", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "19.973", lastS2: "35.787", lastS3: "20.200", bestS1: 19.973, bestS2: 35.773, bestS3: 20.094, rawBestLapSec: 75.840, bestLap: "1:15.840" },
    { pos: 7, no: "10", code: "GAS", name: "Pierre Gasly", team: "Alpine", color: "#FF87BC", progress: 0.74, tyre: "S", tyreAge: 14, lastLap: "1:15.497", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "19.923", lastS2: "35.652", lastS3: "20.306", bestS1: 19.791, bestS2: 35.426, bestS3: 20.139, rawBestLapSec: 75.356, bestLap: "1:15.356" },
    { pos: 8, no: "23", code: "ALB", name: "Alexander Albon", team: "Williams", color: "#64C4FF", progress: 0.70, tyre: "S", tyreAge: 16, lastLap: "1:16.393", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "20.308", lastS2: "35.859", lastS3: "20.226", bestS1: 20.241, bestS2: 35.795, bestS3: 20.226, rawBestLapSec: 76.262, bestLap: "1:16.262" },
    { pos: 9, no: "31", code: "OCO", name: "Esteban Ocon", team: "Haas", color: "#B6BABD", progress: 0.66, tyre: "S", tyreAge: 11, lastLap: "1:16.914", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "20.346", lastS2: "36.216", lastS3: "20.495", bestS1: 20.303, bestS2: 36.150, bestS3: 20.275, rawBestLapSec: 76.728, bestLap: "1:16.728" },
    { pos: 10, no: "11", code: "PER", name: "Sergio Perez", team: "Red Bull Racing", color: "#3671C6", progress: 0.62, tyre: "S", tyreAge: 0, lastLap: "1:16.891", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "20.437", lastS2: "35.919", lastS3: "20.535", bestS1: 20.343, bestS2: 35.919, bestS3: 20.454, rawBestLapSec: 76.716, bestLap: "1:16.716" },
    { pos: 11, no: "14", code: "ALO", name: "Fernando Alonso", team: "Aston Martin", color: "#229971", progress: 0.58, tyre: "S", tyreAge: 18, lastLap: "1:17.120", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "20.342", lastS2: "36.359", lastS3: "20.439", bestS1: 20.291, bestS2: 36.348, bestS3: 20.427, rawBestLapSec: 77.066, bestLap: "1:17.066" },
    { pos: 12, no: "5", code: "BOR", name: "Gabriel Bortoleto", team: "Kick Sauber", color: "#a3e635", progress: 0.54, tyre: "S", tyreAge: 11, lastLap: "1:16.803", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "20.202", lastS2: "36.331", lastS3: "20.779", bestS1: 20.127, bestS2: 35.982, bestS3: 20.507, rawBestLapSec: 76.616, bestLap: "1:16.616" },
    { pos: 13, no: "63", code: "RUS", name: "George Russell", team: "Mercedes", color: "#27F4D2", progress: 0.50, tyre: "S", tyreAge: 14, lastLap: "1:15.773", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "20.243", lastS2: "36.187", lastS3: "20.827", bestS1: 19.770, bestS2: 35.542, bestS3: 20.209, rawBestLapSec: 75.521, bestLap: "1:15.521" },
    { pos: 14, no: "27", code: "HUL", name: "Nico Hulkenberg", team: "Haas", color: "#B6BABD", progress: 0.46, tyre: "S", tyreAge: 11, lastLap: "1:16.332", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "20.119", lastS2: "36.168", lastS3: "20.224", bestS1: 20.078, bestS2: 35.793, bestS3: 20.224, rawBestLapSec: 76.095, bestLap: "1:16.095" },
    { pos: 15, no: "43", code: "COL", name: "Franco Colapinto", team: "Alpine", color: "#FF87BC", progress: 0.42, tyre: "S", tyreAge: 0, lastLap: "1:16.316", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "19.982", lastS2: "36.293", lastS3: "20.379", bestS1: 19.982, bestS2: 35.900, bestS3: 20.069, rawBestLapSec: 75.951, bestLap: "1:15.951" },
    { pos: 16, no: "55", code: "SAI", name: "Carlos Sainz", team: "Williams", color: "#64C4FF", progress: 0.38, tyre: "S", tyreAge: 6, lastLap: "1:18.022", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "26.457", lastS2: "51.219", lastS3: "78.575", bestS1: 20.326, bestS2: 36.647, bestS3: 20.600, rawBestLapSec: 77.573, bestLap: "1:17.573" },
    { pos: 17, no: "16", code: "LEC", name: "Charles Leclerc", team: "Ferrari", color: "#E80020", progress: 0.34, tyre: "S", tyreAge: 8, lastLap: "1:15.964", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "32.644", lastS2: "56.148", lastS3: "31.008", bestS1: 19.934, bestS2: 35.827, bestS3: 20.137, rawBestLapSec: 75.898, bestLap: "1:15.898" },
    { pos: 18, no: "18", code: "STR", name: "Lance Stroll", team: "Aston Martin", color: "#229971", progress: 0.30, tyre: "S", tyreAge: 52, lastLap: "1:18.845", speed: 0, pit: 0, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "23.577", lastS2: "37.839", lastS3: "21.017", bestS1: 20.629, bestS2: 36.363, bestS3: 20.930, rawBestLapSec: 77.922, bestLap: "1:17.922" },
    { pos: 19, no: "1", code: "NOR", name: "Lando Norris", team: "McLaren", color: "#FF8000", progress: 0.26, tyre: "M", tyreAge: 43, lastLap: "1:17.670", speed: 0, pit: 1, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "20.617", lastS2: "41.184", lastS3: "20.788", bestS1: 20.317, bestS2: 36.379, bestS3: 20.636, rawBestLapSec: 77.332, bestLap: "1:17.332" },
    { pos: 20, no: "87", code: "BEA", name: "Oliver Bearman", team: "Haas", color: "#B6BABD", progress: 0.22, tyre: "H", tyreAge: 26, lastLap: "1:18.475", speed: 0, pit: 1, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "20.700", lastS2: "37.555", lastS3: "20.983", bestS1: 20.669, bestS2: 36.585, bestS3: 20.865, rawBestLapSec: 78.119, bestLap: "1:18.119" },
    { pos: 21, no: "77", code: "BOT", name: "Valtteri Bottas", team: "Kick Sauber", color: "#a3e635", progress: 0.18, tyre: "M", tyreAge: 14, lastLap: "1:20.494", speed: 0, pit: 1, pitSpeedPenaltyTicks: 0, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "22.007", lastS2: "39.762", lastS3: "21.601", bestS1: 21.202, bestS2: 37.604, bestS3: 21.160, rawBestLapSec: 79.966, bestLap: "1:19.966" },
    { pos: 22, no: "3", code: "VER", name: "Max Verstappen", team: "Red Bull Racing", color: "#3671C6", progress: 0.14, tyre: "M", tyreAge: 0, lastLap: "---", speed: 0, pit: 1, pitSpeedPenaltyTicks: 100, miniSectors: Array(20).fill('Y'), lastActiveSectorIdx: -1, lastS1: "---", lastS2: "50.987", lastS3: "---", bestS1: 19.380, bestS2: 34.600, bestS3: 19.550, rawBestLapSec: 73.530, bestLap: "1:13.530" }
  ];

  let sessionBestS1 = 19.379;
  let sessionBestS2 = 34.566;
  let sessionBestS3 = 19.536;
  let sessionBestLap = 73.481;

  // Pre-populate mini sectors based on initial progress so they don't load empty
  driversList.forEach(d => {
    const activeSectorIdx = Math.floor(d.progress * 20);
    d.miniSectors = Array(20).fill('Y').map((status, idx) => {
      if (idx <= activeSectorIdx) {
        const rand = Math.random();
        if (rand > 0.88) return 'P'; // Purple
        if (rand > 0.70) return 'G'; // Green
        return 'Y'; // Yellow
      }
      return 'Y';
    });
    d.lastActiveSectorIdx = activeSectorIdx;
  });

  let safetyCarActive = false;

  // Render initial dots in SVG with scaled-down label background capsule
  svgDriversContainer.innerHTML = driversList.map(d => `
    <g id="live-driver-group-${d.code}" transform="translate(0, 0)">
      <!-- Glowing dot ring -->
      <circle id="dot-ring-${d.code}" cx="0" cy="0" r="4.5" fill="transparent" stroke="${d.color}" stroke-width="0.8" style="opacity: 0.75;" />
      <!-- Solid dot -->
      <circle id="dot-solid-${d.code}" cx="0" cy="0" r="2.5" fill="${d.color}" stroke="#fff" stroke-width="0.8" style="filter: drop-shadow(0 0 2px ${d.color});" />
      <!-- Text label background capsule -->
      <rect x="4" y="-3.5" width="10" height="7" fill="rgba(7, 8, 10, 0.85)" rx="1" stroke="rgba(255,255,255,0.18)" stroke-width="0.3" style="pointer-events:none;" />
      <!-- Label -->
      <text x="9" y="0" fill="#ffffff" font-family="var(--font-tech)" font-size="4.5px" font-weight="900" text-anchor="middle" dominant-baseline="central" style="pointer-events:none; user-select:none;">${d.code}</text>
    </g>
  `).join('');

  // Speed profile
  function getSpeedAtProgress(progress) {
    if (safetyCarActive) {
      return 100 + Math.sin(progress * Math.PI * 4) * 20;
    }
    if (progress < 0.08) return 240 + (progress / 0.08) * 50; 
    if (progress < 0.15) return 290 - ((progress - 0.08) / 0.07) * 110; 
    if (progress < 0.22) return 180 - ((progress - 0.15) / 0.07) * 70; 
    if (progress < 0.28) return 110 - ((progress - 0.22) / 0.06) * 60; 
    if (progress < 0.35) return 50 + ((progress - 0.28) / 0.07) * 130; 
    if (progress < 0.50) return 180 + ((progress - 0.35) / 0.15) * 118; 
    if (progress < 0.60) return 298 - ((progress - 0.50) / 0.10) * 218; 
    if (progress < 0.70) return 80 + ((progress - 0.60) / 0.10) * 130; 
    if (progress < 0.85) return 210 - ((progress - 0.70) / 0.15) * 100; 
    return 110 + ((progress - 0.85) / 0.15) * 130; 
  }

  // Bind Safety Car toggle button
  btnTriggerSafety.addEventListener('click', () => {
    safetyCarActive = !safetyCarActive;
    if (safetyCarActive) {
      btnTriggerSafety.textContent = "OVERRIDE: KÍCH HOẠT GF (TEST)";
      btnTriggerSafety.style.color = "#39FF14";
      btnTriggerSafety.style.border = "1px solid rgba(57,255,20,0.3)";
      btnTriggerSafety.style.background = "rgba(57,255,20,0.1)";
      
      simStatusFlag.innerHTML = `
        <span style="display: inline-block; width: 6px; height: 6px; background: #ffc400; border-radius: 50%; box-shadow: 0 0 8px #ffc400;" class="animate-pulse"></span>
        <span>SAFETY CAR ACTIVE</span>
      `;
      simStatusFlag.style.color = "#ffc400";
      simStatusFlag.style.background = "rgba(255, 196, 0, 0.1)";
      simStatusFlag.style.borderColor = "rgba(255, 196, 0, 0.3)";
    } else {
      btnTriggerSafety.textContent = "OVERRIDE: KÍCH HOẠT SC (TEST)";
      btnTriggerSafety.style.color = "#ffc400";
      btnTriggerSafety.style.border = "1px solid rgba(255, 196, 0, 0.25)";
      btnTriggerSafety.style.background = "rgba(255, 196, 0, 0.1)";

      simStatusFlag.innerHTML = `
        <span style="display: inline-block; width: 6px; height: 6px; background: var(--neon-green); border-radius: 50%; box-shadow: 0 0 8px var(--neon-green);" class="animate-pulse"></span>
        <span>GREEN FLAG</span>
      `;
      simStatusFlag.style.color = "var(--neon-green)";
      simStatusFlag.style.background = "rgba(57, 255, 20, 0.1)";
      simStatusFlag.style.borderColor = "rgba(57, 255, 20, 0.3)";
    }
  });

  const baseDelta = 0.00028;

  // Main Simulation Loop
  liveSimInterval = setInterval(() => {
    if (!document.getElementById('live-timing-body')) {
      clearInterval(liveSimInterval);
      liveSimInterval = null;
      return;
    }

    // 1. Update Physics and Dots coordinates
    driversList.forEach((d) => {
      let targetSpeed = getSpeedAtProgress(d.progress);

      const isInPits = d.pitSpeedPenaltyTicks && d.pitSpeedPenaltyTicks > 0;
      if (isInPits) {
        targetSpeed = 50; // slow down to pit lane speed limit
        d.pitSpeedPenaltyTicks--;
      }

      d.speed = Math.round(targetSpeed);
      const speedFactor = d.speed / 200;
      const noise = (Math.random() - 0.495) * 0.00003;
      const previousProgress = d.progress;
      
      d.progress += baseDelta * speedFactor + noise;
      
      // Update mini sector status
      const activeSectorIdx = Math.floor(d.progress * 20);
      if (d.lastActiveSectorIdx !== activeSectorIdx && activeSectorIdx >= 0 && activeSectorIdx < 20) {
        d.lastActiveSectorIdx = activeSectorIdx;
        
        // Roll for status
        const rand = Math.random();
        if (rand > 0.88) d.miniSectors[activeSectorIdx] = 'P'; // Purple
        else if (rand > 0.70) d.miniSectors[activeSectorIdx] = 'G'; // Green
        else d.miniSectors[activeSectorIdx] = 'Y'; // Yellow
      }

      // Sectors crossing check and simulated sector times
      if (previousProgress < 0.33 && d.progress >= 0.33) {
        let s1Sec = 19.1 + (Math.random() * 0.7) + (d.pos * 0.02);
        if (isInPits) s1Sec += 22.0; // add pit lane entry delay
        d.lastS1 = s1Sec.toFixed(3);
        if (!isInPits) {
          if (!d.bestS1 || s1Sec < d.bestS1) d.bestS1 = s1Sec;
          if (s1Sec < sessionBestS1) sessionBestS1 = s1Sec;
        }
      } else if (previousProgress < 0.66 && d.progress >= 0.66) {
        let s2Sec = 34.0 + (Math.random() * 1.2) + (d.pos * 0.04);
        if (isInPits) s2Sec += 22.0; // pitstop active box stop delay
        d.lastS2 = s2Sec.toFixed(3);
        if (!isInPits) {
          if (!d.bestS2 || s2Sec < d.bestS2) d.bestS2 = s2Sec;
          if (s2Sec < sessionBestS2) sessionBestS2 = s2Sec;
        }
      }

      if (d.progress > 1) {
        d.progress -= 1; // wrapping
        d.tyreAge += 1;
        
        // Reset mini sectors on new lap
        d.miniSectors = Array(20).fill('Y');
        d.lastActiveSectorIdx = -1;

        // Generate Sector 3 time and complete lap
        let s3Sec = 19.1 + (Math.random() * 0.6) + (d.pos * 0.02);
        if (isInPits) s3Sec += 22.0; // pit exit speed delay
        d.lastS3 = s3Sec.toFixed(3);
        if (!isInPits) {
          if (!d.bestS3 || s3Sec < d.bestS3) d.bestS3 = s3Sec;
          if (s3Sec < sessionBestS3) sessionBestS3 = s3Sec;
        }

        // Calculate lap time from the actual sectors crossed
        const lapSec = parseFloat(d.lastS1) + parseFloat(d.lastS2) + s3Sec;
        d.rawLapSec = lapSec;
        
        const minutes = Math.floor(lapSec / 60);
        const seconds = Math.floor(lapSec % 60);
        const millis = Math.round((lapSec % 1) * 1000);
        d.lastLap = `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;

        if (!d.rawBestLapSec || lapSec < d.rawBestLapSec) {
          d.rawBestLapSec = lapSec;
          d.bestLap = d.lastLap;
        }
        if (lapSec < sessionBestLap) {
          sessionBestLap = lapSec;
        }

        // Pit stop trigger
        const shouldPit = (d.tyre === "S" && d.tyreAge >= 14) || 
                          (d.tyre === "M" && d.tyreAge >= 22) || 
                          (d.tyre === "H" && d.tyreAge >= 32);

        if (shouldPit && !safetyCarActive) {
          d.pit += 1;
          d.tyreAge = 0;
          const prevTyre = d.tyre;
          d.tyre = prevTyre === "S" ? "M" : prevTyre === "M" ? "H" : "S";
          d.pitSpeedPenaltyTicks = 120; // slow down for pit lane limit

          if (window.triggerCustomRadioMessage) {
            const teamCode = d.team.split(" ")[0].toUpperCase();
            window.triggerCustomRadioMessage({
              driver: `${teamCode} ENG`,
              name: `${d.name} Engineer`,
              team: d.team,
              color: d.color,
              text: `BOX BOX. Box now, box now. Fitting fresh ${d.tyre === "S" ? "Soft" : d.tyre === "M" ? "Medium" : "Hard"} tyres.`
            });
          }
        }
      }

      // Fetch coordinate on path
      const pt = trackPath.getPointAtLength(d.progress * totalLength);
      const group = document.getElementById(`live-driver-group-${d.code}`);
      const ring = document.getElementById(`dot-ring-${d.code}`);

      if (group && ring) {
        group.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
        if (d.ovr) {
          ring.setAttribute('r', 4.5 + Math.sin(Date.now() / 100) * 0.8);
          ring.setAttribute('stroke-width', '1.0');
        } else {
          ring.setAttribute('r', 4.5);
          ring.setAttribute('stroke-width', '0.8');
        }
      }

      const inAeroZone = (d.progress >= 0.35 && d.progress <= 0.48) || 
                         (d.progress >= 0.88 && d.progress <= 0.98);
      d.ovr = inAeroZone && !safetyCarActive;
    });

    // 2. Dynamic Overtaking & Re-ranking Logic
    const sortedProgress = [...driversList].sort((a, b) => b.progress - a.progress);
    const leader = sortedProgress[0];
    
    let prevGapSec = 0;
    sortedProgress.forEach((d, idx) => {
      d.pos = idx + 1;
      if (idx === 0) {
        d.delta = "LAP 14";
        d.interval = "LEADER";
        prevGapSec = 0;
      } else {
        let dist = leader.progress - d.progress;
        if (dist < 0) dist += 1.0; 
        
        const gapSec = dist * 25.0; 
        const intSec = gapSec - prevGapSec;
        prevGapSec = gapSec;
        
        if (gapSec < 0.22 && !safetyCarActive && Math.random() > 0.995) {
          const temp = d.progress;
          d.progress = sortedProgress[idx-1].progress;
          sortedProgress[idx-1].progress = temp;
        }

        d.delta = `+${gapSec.toFixed(3)}s`;
        d.interval = `+${intSec.toFixed(3)}s`;
      }
    });

    driversList = sortedProgress;

    // 3. Render Timing Tower Columns
    timingBody.innerHTML = driversList.map((d) => {
      const isInPits = d.pitSpeedPenaltyTicks && d.pitSpeedPenaltyTicks > 0;

      // Left Pit Status
      const leftPitBadge = isInPits 
        ? `<span style="font-size: 0.65rem; font-family: var(--font-tech); background: #ff1e27; color: #fff; padding: 2px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 0 6px #ff1e27; display: inline-block; animation: live-blink 1s infinite;">PIT</span>` 
        : '';

      // Driver Pill (includes position, logo, code)
      const driverPillHTML = `
        <div style="display: flex; align-items: center; gap: 6px; background: ${d.color}22; border: 1px solid ${d.color}55; padding: 3px 8px; border-radius: 4px; font-family: var(--font-tech); font-weight: 800; color: #fff; width: fit-content; min-width: 90px; box-shadow: inset 0 0 5px ${d.color}11;">
          <span style="font-size: 0.82rem; font-weight: 900; color: ${d.pos <= 3 ? '#FFD700' : '#8E9AA8'}; width: 14px; display: inline-block; text-align: center;">${d.pos}</span>
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px;">${getTeamLogoSVG(d.team)}</span>
          <span style="font-size: 0.85rem; font-weight: 900; letter-spacing: 0.5px; margin-left: 2px;">${d.code}</span>
        </div>
      `;

      // Tyre Compound Badge
      let tyreClass = "S";
      let tyreColor = "#ff1e27";
      if (d.tyre === "M") { tyreClass = "M"; tyreColor = "#ffd700"; }
      if (d.tyre === "H") { tyreClass = "H"; tyreColor = "#ffffff"; }
      const tyreHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
          <span style="font-size:0.8rem; color:#fff; font-family: var(--font-tech); font-weight:bold;">${d.tyreAge}</span>
          <span style="display: inline-block; width: 15px; height: 15px; border-radius: 50%; border: 1.5px solid ${tyreColor}; color: ${tyreColor}; font-size: 0.65rem; font-weight: 900; text-align: center; line-height: 12px; font-family: var(--font-tech); background: rgba(0,0,0,0.4);" title="${d.tyre === "S" ? "Soft (Mềm)" : d.tyre === "M" ? "Medium (Trung bình)" : "Hard (Cứng)"}">${tyreClass}</span>
        </div>
      `;

      // Best Lap highlighting
      const isSessionFastestLap = d.rawBestLapSec && d.rawBestLapSec === sessionBestLap;
      const bestLapHTML = isSessionFastestLap 
        ? `<span style="font-family: var(--font-tech); font-weight: bold; background: #b026ff; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.82rem; box-shadow: 0 0 8px rgba(176, 38, 255, 0.6);">${d.bestLap}</span>`
        : `<span style="font-family: var(--font-tech); font-weight: 500; color: #22c55e; font-size: 0.82rem;">${d.bestLap || '---'}</span>`;

      // Last Lap
      const lastLapHTML = `<span style="font-family: var(--font-tech); color: #fff; font-size: 0.82rem; font-weight: 500;">${d.lastLap}</span>`;

      // Mini-sectors block rendering (20 segments)
      const activeSectorIdx = Math.floor(d.progress * 20);
      const miniSectorsHTML = d.miniSectors.map((status, idx) => {
        let color = "rgba(255,255,255,0.06)"; // grey for inactive
        if (isInPits) {
          color = "rgba(0, 180, 216, 0.15)";
        } else if (idx <= activeSectorIdx) {
          if (status === 'P') color = "#d946ef"; // Purple
          else if (status === 'G') color = "#22c55e"; // Green
          else color = "#df8020"; // Orange/Yellow
        }
        return `<span style="display: inline-block; width: 2.5px; height: 12px; background: ${color}; border-radius: 0.5px; transition: background 0.08s ease;"></span>`;
      }).join('');

      // Last Sectors block rendering
      const getSectorSpan = (secVal, bestVal, sessionBestVal) => {
        if (!secVal || secVal === "---") return `<span style="display: inline-block; width: 44px; text-align: center; color: var(--text-muted); font-size: 0.78rem;">---</span>`;
        
        const val = parseFloat(secVal);
        let bg = "transparent";
        let color = "#df8020"; // yellow/orange for slower
        let shadow = "none";
        let padding = "2px 4px";
        
        if (val <= sessionBestVal) {
          bg = "#b026ff"; // purple overall fastest
          color = "#fff";
          shadow = "0 0 6px rgba(176, 38, 255, 0.5)";
        } else if (val <= bestVal) {
          bg = "#22c55e"; // green personal best
          color = "#fff";
          shadow = "0 0 6px rgba(34, 197, 94, 0.5)";
        }
        
        return `<span style="display: inline-block; width: 44px; text-align: center; background: ${bg}; color: ${color}; font-family: var(--font-tech); font-weight: 600; font-size: 0.78rem; border-radius: 3px; box-shadow: ${shadow}; margin: 0 2px; padding: ${padding};">${secVal}</span>`;
      };

      const lastSectorsHTML = `
        <div style="display: flex; gap: 2px; justify-content: center; align-items: center;">
          ${getSectorSpan(d.lastS1, d.bestS1, sessionBestS1)}
          ${getSectorSpan(d.lastS2, d.bestS2, sessionBestS2)}
          ${getSectorSpan(d.lastS3, d.bestS3, sessionBestS3)}
        </div>
      `;

      // Best Sectors block rendering
      const getBestSectorSpan = (bestVal, sessionBestVal) => {
        if (!bestVal || bestVal === 999.0) return `<span style="display: inline-block; width: 44px; text-align: center; color: var(--text-muted); font-size: 0.78rem;">---</span>`;
        
        let bg = "transparent";
        let color = "#22c55e"; // green personal best text
        let shadow = "none";
        let padding = "2px 4px";
        
        if (bestVal <= sessionBestVal) {
          bg = "#b026ff"; // purple overall fastest background
          color = "#fff";
          shadow = "0 0 6px rgba(176, 38, 255, 0.5)";
        } else {
          color = "#22c55e";
          padding = "2px 2px";
        }
        
        return `<span style="display: inline-block; width: 44px; text-align: center; background: ${bg}; color: ${color}; font-family: var(--font-tech); font-weight: 600; font-size: 0.78rem; border-radius: 3px; box-shadow: ${shadow}; margin: 0 2px; padding: ${padding};">${bestVal.toFixed(3)}</span>`;
      };

      const bestSectorsHTML = `
        <div style="display: flex; gap: 2px; justify-content: center; align-items: center;">
          ${getBestSectorSpan(d.bestS1, sessionBestS1)}
          ${getBestSectorSpan(d.bestS2, sessionBestS2)}
          ${getBestSectorSpan(d.bestS3, sessionBestS3)}
        </div>
      `;

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); height: 42px; transition: all var(--transition-fast);">
          <!-- Left Pit Status -->
          <td style="padding: 4px; text-align: center; vertical-align: middle;">
            ${leftPitBadge}
          </td>
          <!-- Driver Pill -->
          <td style="padding: 4px; vertical-align: middle;">
            ${driverPillHTML}
          </td>
          <!-- Interval -->
          <td style="padding: 4px; text-align: right; vertical-align: middle;">
            <span style="font-family: var(--font-tech); font-weight: 600; color: var(--text-secondary); font-size: 0.82rem;">${d.interval}</span>
          </td>
          <!-- Tyre and Age -->
          <td style="padding: 4px; text-align: center; vertical-align: middle;">
            ${tyreHTML}
          </td>
          <!-- Best Lap -->
          <td style="padding: 4px; text-align: right; vertical-align: middle;">
            ${bestLapHTML}
          </td>
          <!-- Gap to Leader (LEADER) -->
          <td style="padding: 4px; text-align: right; vertical-align: middle;">
            <span style="font-family: var(--font-tech); font-weight: bold; color: ${d.pos === 1 ? 'var(--f1-red)' : 'var(--text-secondary)'}; font-size: 0.82rem;">${d.delta}</span>
          </td>
          <!-- Last Lap -->
          <td style="padding: 4px; text-align: right; vertical-align: middle;">
            ${lastLapHTML}
          </td>
          <!-- Mini Sectors -->
          <td style="padding: 4px; text-align: center; vertical-align: middle;">
            <div style="display: flex; gap: 1px; justify-content: center; align-items: center; height: 12px; pointer-events: none;">
              ${miniSectorsHTML}
            </div>
          </td>
          <!-- Last Sectors -->
          <td style="padding: 4px; text-align: center; vertical-align: middle;">
            ${lastSectorsHTML}
          </td>
          <!-- Best Sectors -->
          <td style="padding: 4px; text-align: center; vertical-align: middle;">
            ${bestSectorsHTML}
          </td>
        </tr>
      `;
    }).join('');

  }, 30); // ~33 FPS

  // Start Team Radio monitoring
  initTeamRadio(isMonaco);
}

let radioAudioMuted = false;

function playF1Beep() {
  if (radioAudioMuted) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = audioCtx.createOscillator();
    const gainNode1 = audioCtx.createGain();
    osc1.connect(gainNode1);
    gainNode1.connect(audioCtx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2000, audioCtx.currentTime);
    gainNode1.gain.setValueAtTime(0.015, audioCtx.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
    
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.15);
    
    setTimeout(() => {
      try {
        const audioCtx2 = new (window.AudioContext || window.webkitAudioContext)();
        const osc2 = audioCtx2.createOscillator();
        const gainNode2 = audioCtx2.createGain();
        osc2.connect(gainNode2);
        gainNode2.connect(audioCtx2.destination);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1620, audioCtx2.currentTime);
        gainNode2.gain.setValueAtTime(0.012, audioCtx2.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.0001, audioCtx2.currentTime + 0.1);
        
        osc2.start();
        osc2.stop(audioCtx2.currentTime + 0.12);
      } catch(e){}
    }, 60);
  } catch (e) {
    console.warn("Audio Context failed: ", e);
  }
}

function initTeamRadio(isMonaco) {
  const badge = document.getElementById('radio-driver-badge');
  const timeEl = document.getElementById('radio-time');
  const msgEl = document.getElementById('radio-message-body');
  const dot = document.getElementById('radio-dot');
  const statusBadge = document.getElementById('radio-status-badge');
  const eqBars = document.querySelectorAll('.eq-bar');
  const beepIndicator = document.getElementById('radio-beep-indicator');
  const soundIcon = document.getElementById('radio-sound-icon');
  const soundText = document.getElementById('radio-sound-text');

  if (!msgEl) return;

  if (beepIndicator && soundIcon && soundText) {
    beepIndicator.addEventListener('click', () => {
      radioAudioMuted = !radioAudioMuted;
      if (radioAudioMuted) {
        soundText.textContent = "AUDIO OFF";
        soundText.style.color = "var(--text-muted)";
        soundIcon.style.color = "var(--text-muted)";
        beepIndicator.style.opacity = "0.35";
      } else {
        soundText.textContent = "AUDIO ON";
        soundText.style.color = "var(--neon-blue)";
        soundIcon.style.color = "var(--neon-blue)";
        beepIndicator.style.opacity = "0.85";
        playF1Beep();
      }
    });
  }

  const radioMessages = [
    { driver: "VER", name: "Verstappen", team: "Red Bull", color: "#FF9E00", text: "Lốp sau bắt đầu trượt rồi. Cân bằng xe không ổn chút nào!" },
    { driver: "RBR ENG", name: "Red Bull Engineer", team: "Red Bull", color: "#FF9E00", text: `Đã rõ Max, chúng tôi đang theo dõi dữ liệu. Cố gắng giữ ga ${isMonaco ? "khúc cua Rascasse" : "khúc cua cuối"}. Box vòng này.` },
    { driver: "NOR", name: "Norris", team: "McLaren", color: "#FF8000", text: "Chế độ cánh gió Active Aero (A-mode) phản hơi chậm trên đoạn thẳng Pit Straight. Kiểm tra hộ tôi." },
    { driver: "MCL ENG", name: "McLaren Engineer", team: "McLaren", color: "#FF8000", text: "Đã nhận thông tin Lando, chúng tôi đang kiểm tra áp lực bộ kích hoạt. Cứ tiếp tục chạy ngoài đường đua." },
    { driver: "LEC", name: "Leclerc", team: "Ferrari", color: "#e00404", text: `Gió đang thổi rất mạnh ở cua ${isMonaco ? "Saint Devote" : "số 1"}. Rất khó căn điểm phanh.` },
    { driver: "SF ENG", name: "Ferrari Engineer", team: "Ferrari", color: "#e00404", text: "Nghe rõ Charles, chú ý gió đuôi. Tập trung vào lực bám đường khi thoát cua." },
    { driver: "HAM", name: "Hamilton", team: "Ferrari", color: "#b90000", text: `Chiếc xe Haas phía trước đang cản đường tôi ${isMonaco ? "trong đường hầm" : "ở đoạn thẳng sau"}! Rất nguy hiểm!` },
    { driver: "SF ENG", name: "Ferrari Engineer", team: "Ferrari", color: "#b90000", text: "Đó là Bearman. Chúng tôi đã báo cáo cho giám sát chặng đua. Lewis, push vòng này." },
    { driver: "RUS", name: "Russell", team: "Mercedes", color: "#22d3ee", text: "Lốp đang ở cửa sổ nhiệt độ hoàn hảo rồi. Cho tôi thêm thời gian trước khi pit." },
    { driver: "MER ENG", name: "Mercedes Engineer", team: "Mercedes", color: "#22d3ee", text: "Đồng ý George, kéo dài stint. Khoảng cách với Piastri là 4.2 giây." }
  ];

  let eqInterval = null;
  
  function startEqAnimation() {
    if (eqInterval) clearInterval(eqInterval);
    eqInterval = setInterval(() => {
      eqBars.forEach(bar => {
        const height = Math.floor(Math.random() * 14) + 3;
        bar.style.height = `${height}px`;
      });
    }, 100);
  }

  function stopEqAnimation() {
    if (eqInterval) {
      clearInterval(eqInterval);
      eqInterval = null;
    }
    eqBars.forEach(bar => {
      bar.style.height = '3px';
    });
  }

  function triggerTransmission(msg) {
    playF1Beep();
    if (badge && timeEl) {
      badge.style.display = 'inline-block';
      badge.style.background = `${msg.color}20`;
      badge.style.border = `1px solid ${msg.color}45`;
      badge.style.color = msg.color;
      badge.textContent = msg.driver;
      
      const now = new Date();
      timeEl.style.display = 'inline-block';
      timeEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} UTC`;
    }
    
    if (dot && statusBadge) {
      dot.style.background = '#ff1e27';
      dot.style.boxShadow = '0 0 8px #ff1e27';
      statusBadge.style.color = '#ff1e27';
      statusBadge.textContent = 'TRANSMITTING';
      statusBadge.classList.add('animate-pulse');
    }
    
    startEqAnimation();
    
    let charIndex = 0;
    msgEl.innerHTML = '';
    msgEl.style.color = '#fff';
    msgEl.style.fontWeight = '500';
    
    const typingTimer = setInterval(() => {
      if (!document.getElementById('live-radio-widget')) {
        clearInterval(typingTimer);
        return;
      }
      
      if (charIndex < msg.text.length) {
        msgEl.innerHTML += msg.text.charAt(charIndex);
        charIndex++;
      } else {
        clearInterval(typingTimer);
        setTimeout(() => {
          const checkWidget = document.getElementById('live-radio-widget');
          if (!checkWidget) return;
          
          if (dot && statusBadge) {
            dot.style.background = '#8E9AA8';
            dot.style.boxShadow = 'none';
            statusBadge.style.color = 'var(--text-muted)';
            statusBadge.textContent = 'STANDBY';
            statusBadge.classList.remove('animate-pulse');
          }
          stopEqAnimation();
          msgEl.style.color = 'var(--text-secondary)';
          msgEl.style.fontWeight = 'normal';
        }, 3500);
      }
    }, 25);
  }

  window.triggerCustomRadioMessage = function(msg) {
    if (!document.getElementById('live-radio-widget')) return;
    triggerTransmission(msg);
  };

  let messageIndex = 0;
  setTimeout(() => {
    if (!document.getElementById('live-radio-widget')) return;
    triggerTransmission(radioMessages[0]);
    messageIndex = 1;
  }, 3500);

  const radioTimer = setInterval(() => {
    if (!document.getElementById('live-radio-widget')) {
      clearInterval(radioTimer);
      if (eqInterval) clearInterval(eqInterval);
      return;
    }
    
    const isTransmitting = statusBadge && statusBadge.textContent === 'TRANSMITTING';
    if (!isTransmitting) {
      triggerTransmission(radioMessages[messageIndex]);
      messageIndex = (messageIndex + 1) % radioMessages.length;
    }
  }, 18000);
}
