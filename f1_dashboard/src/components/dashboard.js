import { schedule } from '../data/schedule.js';
import { drivers } from '../data/drivers.js';

export function getUpcomingGP() {
  const now = new Date();
  const gpDates = [
    { round: 1, name: "Australia GP", dateStr: "2026-03-08" },
    { round: 2, name: "China GP", dateStr: "2026-03-15" },
    { round: 3, name: "Japan GP", dateStr: "2026-03-29" },
    { round: 4, name: "Bahrain GP", dateStr: "2026-04-12" },
    { round: 5, name: "Saudi Arabia GP", dateStr: "2026-04-19" },
    { round: 6, name: "Miami GP", dateStr: "2026-05-03" },
    { round: 7, name: "Canada GP", dateStr: "2026-05-24" },
    { round: 8, name: "Monaco GP", dateStr: "2026-06-07" },
    { round: 9, name: "Barcelona GP", dateStr: "2026-06-14" },
    { round: 10, name: "Austria GP", dateStr: "2026-06-28" },
    { round: 11, name: "Great Britain GP", dateStr: "2026-07-05" },
    { round: 12, name: "Belgium GP", dateStr: "2026-07-19" },
    { round: 13, name: "Hungary GP", dateStr: "2026-07-26" },
    { round: 14, name: "Netherlands GP", dateStr: "2026-08-23" },
    { round: 15, name: "Italy GP", dateStr: "2026-09-06" },
    { round: 16, name: "Spain (Madrid) GP", dateStr: "2026-09-13" },
    { round: 17, name: "Azerbaijan GP", dateStr: "2026-09-27" },
    { round: 18, name: "Singapore GP", dateStr: "2026-10-11" },
    { round: 19, name: "United States GP", dateStr: "2026-10-25" },
    { round: 20, name: "Mexico GP", dateStr: "2026-11-01" },
    { round: 21, name: "Brazil GP", dateStr: "2026-11-08" },
    { round: 22, name: "Las Vegas GP", dateStr: "2026-11-21" },
    { round: 23, name: "Qatar GP", dateStr: "2026-11-29" },
    { round: 24, name: "Abu Dhabi GP", dateStr: "2026-12-06" }
  ];

  let upcomingGP = gpDates.find(gp => new Date(gp.dateStr) > now);
  if (!upcomingGP) {
    upcomingGP = gpDates[gpDates.length - 1];
  }
  return schedule.find(s => s.round === upcomingGP.round) || schedule[7];
}

let telemetryInterval = null;

export function getCircuitAnalytics(gpSlug) {
  const slug = gpSlug ? gpSlug.toLowerCase() : 'monaco';
  
  const database = {
    monaco: {
      lapRecord: "1:12.909 - L. Hamilton (2021)",
      s1: "18.642",
      s2: "32.418",
      s3: "21.849",
      shifts: "80 lần/vòng",
      throttle: "45%",
      gforce: "4.8 G",
      tyres: ["C3", "C4", "C5"],
      temp: "26.5°C",
      humidity: "62%",
      trackTemp: "38.2°C",
      weatherDesc: "Nắng nhẹ / Khô ráo"
    },
    australia: {
      lapRecord: "1:19.813 - C. Leclerc (2022)",
      s1: "26.415",
      s2: "17.923",
      s3: "35.475",
      shifts: "48 lần",
      throttle: "73%",
      gforce: "4.5 G",
      tyres: ["C3", "C4", "C5"],
      temp: "21.0°C",
      humidity: "55%",
      trackTemp: "28.5°C",
      weatherDesc: "Trời quang / Mát mẻ"
    },
    bahrain: {
      lapRecord: "1:30.252 - M. Schumacher (2004)",
      s1: "29.112",
      s2: "38.541",
      s3: "22.599",
      shifts: "58 lần",
      throttle: "64%",
      gforce: "4.2 G",
      tyres: ["C1", "C2", "C3"],
      temp: "29.8°C",
      humidity: "48%",
      trackTemp: "35.0°C",
      weatherDesc: "Gió nhẹ / Khô ráo"
    },
    china: {
      lapRecord: "1:32.238 - M. Schumacher (2004)",
      s1: "25.045",
      s2: "28.812",
      s3: "38.381",
      shifts: "52 lần",
      throttle: "58%",
      gforce: "4.6 G",
      tyres: ["C2", "C3", "C4"],
      temp: "19.5°C",
      humidity: "70%",
      trackTemp: "23.4°C",
      weatherDesc: "Nhiều mây / Khô ráo"
    },
    japan: {
      lapRecord: "1:30.983 - L. Hamilton (2019)",
      s1: "31.245",
      s2: "39.418",
      s3: "20.320",
      shifts: "42 lần",
      throttle: "70%",
      gforce: "5.2 G",
      tyres: ["C1", "C2", "C3"],
      temp: "18.2°C",
      humidity: "60%",
      trackTemp: "24.1°C",
      weatherDesc: "Trời trong / Gió nhẹ"
    },
    saudi_arabia: {
      lapRecord: "1:30.734 - L. Hamilton (2021)",
      s1: "32.142",
      s2: "28.324",
      s3: "30.268",
      shifts: "50 lần",
      throttle: "79%",
      gforce: "4.9 G",
      tyres: ["C2", "C3", "C4"],
      temp: "28.0°C",
      humidity: "65%",
      trackTemp: "32.6°C",
      weatherDesc: "Đêm quang / Khô ráo"
    },
    miami: {
      lapRecord: "1:29.708 - M. Verstappen (2023)",
      s1: "28.915",
      s2: "33.242",
      s3: "27.551",
      shifts: "56 lần",
      throttle: "68%",
      gforce: "4.4 G",
      tyres: ["C2", "C3", "C4"],
      temp: "31.2°C",
      humidity: "78%",
      trackTemp: "44.5°C",
      weatherDesc: "Nắng gắt / Khô nóng"
    },
    canada: {
      lapRecord: "1:13.078 - V. Bottas (2019)",
      s1: "19.824",
      s2: "23.415",
      s3: "29.839",
      shifts: "54 lần",
      throttle: "60%",
      gforce: "4.3 G",
      tyres: ["C3", "C4", "C5"],
      temp: "22.4°C",
      humidity: "50%",
      trackTemp: "31.2°C",
      weatherDesc: "Nắng ráo / Đẹp trời"
    },
    spain: {
      lapRecord: "1:16.330 - M. Verstappen (2023)",
      s1: "21.642",
      s2: "29.115",
      s3: "25.573",
      shifts: "46 lần",
      throttle: "65%",
      gforce: "4.7 G",
      tyres: ["C1", "C2", "C3"],
      temp: "25.8°C",
      humidity: "58%",
      trackTemp: "39.0°C",
      weatherDesc: "Nắng ấm / Khô ráo"
    },
    austria: {
      lapRecord: "1:05.619 - C. Sainz (2020)",
      s1: "16.142",
      s2: "28.956",
      s3: "20.521",
      shifts: "40 lần",
      throttle: "77%",
      gforce: "4.6 G",
      tyres: ["C3", "C4", "C5"],
      temp: "24.0°C",
      humidity: "42%",
      trackTemp: "36.8°C",
      weatherDesc: "Nắng mây rải rác"
    },
    great_britain: {
      lapRecord: "1:27.097 - M. Verstappen (2020)",
      s1: "27.124",
      s2: "35.215",
      s3: "24.758",
      shifts: "44 lần",
      throttle: "75%",
      gforce: "5.1 G",
      tyres: ["C1", "C2", "C3"],
      temp: "19.8°C",
      humidity: "68%",
      trackTemp: "22.5°C",
      weatherDesc: "Mây u ám / Có thể mưa"
    },
    belgium: {
      lapRecord: "1:46.286 - V. Bottas (2018)",
      s1: "30.412",
      s2: "45.148",
      s3: "30.726",
      shifts: "48 lần",
      throttle: "72%",
      gforce: "5.0 G",
      tyres: ["C2", "C3", "C4"],
      temp: "17.0°C",
      humidity: "75%",
      trackTemp: "19.2°C",
      weatherDesc: "Có mây mù / Khô ráo"
    },
    hungary: {
      lapRecord: "1:16.627 - L. Hamilton (2020)",
      s1: "21.942",
      s2: "26.418",
      s3: "28.267",
      shifts: "54 lần",
      throttle: "55%",
      gforce: "4.4 G",
      tyres: ["C3", "C4", "C5"],
      temp: "32.5°C",
      humidity: "40%",
      trackTemp: "48.2°C",
      weatherDesc: "Nắng gay gắt / Khô ráo"
    },
    netherlands: {
      lapRecord: "1:11.097 - L. Hamilton (2021)",
      s1: "19.542",
      s2: "26.812",
      s3: "24.743",
      shifts: "48 lần",
      throttle: "68%",
      gforce: "4.8 G",
      tyres: ["C1", "C2", "C3"],
      temp: "20.2°C",
      humidity: "64%",
      trackTemp: "27.5°C",
      weatherDesc: "Gió biển mạnh / Quang"
    },
    italy: {
      lapRecord: "1:21.046 - R. Barrichello (2004)",
      s1: "26.142",
      s2: "27.318",
      s3: "27.586",
      shifts: "36 lần",
      throttle: "85%",
      gforce: "4.7 G",
      tyres: ["C3", "C4", "C5"],
      temp: "27.4°C",
      humidity: "52%",
      trackTemp: "38.5°C",
      weatherDesc: "Nắng rực rỡ / Khô ráo"
    },
    azerbaijan: {
      lapRecord: "1:43.009 - C. Leclerc (2019)",
      s1: "33.541",
      s2: "41.642",
      s3: "27.826",
      shifts: "62 lần",
      throttle: "56%",
      gforce: "4.1 G",
      tyres: ["C3", "C4", "C5"],
      temp: "24.5°C",
      humidity: "60%",
      trackTemp: "31.4°C",
      weatherDesc: "Gió lộng / Nắng dịu"
    },
    singapore: {
      lapRecord: "1:35.867 - L. Hamilton (2023)",
      s1: "26.415",
      s2: "37.524",
      s3: "31.928",
      shifts: "74 lần",
      throttle: "48%",
      gforce: "4.6 G",
      tyres: ["C3", "C4", "C5"],
      temp: "29.5°C",
      humidity: "82%",
      trackTemp: "34.0°C",
      weatherDesc: "Nhiệt đới ẩm / Khô ráo"
    },
    usa: {
      lapRecord: "1:36.169 - C. Leclerc (2019)",
      s1: "25.142",
      s2: "37.418",
      s3: "33.609",
      shifts: "54 lần",
      throttle: "63%",
      gforce: "4.8 G",
      tyres: ["C2", "C3", "C4"],
      temp: "23.5°C",
      humidity: "48%",
      trackTemp: "33.0°C",
      weatherDesc: "Nắng hanh / Khô ráo"
    },
    mexico: {
      lapRecord: "1:17.774 - V. Bottas (2021)",
      s1: "22.642",
      s2: "28.418",
      s3: "26.714",
      shifts: "48 lần",
      throttle: "64%",
      gforce: "4.2 G",
      tyres: ["C3", "C4", "C5"],
      temp: "22.0°C",
      humidity: "35%",
      trackTemp: "38.2°C",
      weatherDesc: "Khô loãng / Nắng nhẹ"
    },
    brazil: {
      lapRecord: "1:10.540 - V. Bottas (2018)",
      s1: "18.142",
      s2: "35.218",
      s3: "17.180",
      shifts: "44 lần",
      throttle: "66%",
      gforce: "4.6 G",
      tyres: ["C3", "C4", "C5"],
      temp: "23.2°C",
      humidity: "72%",
      trackTemp: "32.0°C",
      weatherDesc: "Mây dông rải rác"
    },
    las_vegas: {
      lapRecord: "1:35.490 - O. Piastri (2023)",
      s1: "26.812",
      s2: "31.242",
      s3: "37.436",
      shifts: "46 lần",
      throttle: "74%",
      gforce: "4.0 G",
      tyres: ["C3", "C4", "C5"],
      temp: "11.5°C",
      humidity: "30%",
      trackTemp: "14.5°C",
      weatherDesc: "Lạnh buốt / Trời quang"
    },
    qatar: {
      lapRecord: "1:24.319 - M. Verstappen (2023)",
      s1: "23.415",
      s2: "36.218",
      s3: "24.686",
      shifts: "42 lần",
      throttle: "76%",
      gforce: "5.0 G",
      tyres: ["C1", "C2", "C3"],
      temp: "26.0°C",
      humidity: "55%",
      trackTemp: "29.4°C",
      weatherDesc: "Gió cát nhẹ / Đêm mát"
    },
    abu_dhabi: {
      lapRecord: "1:26.103 - M. Verstappen (2021)",
      s1: "25.642",
      s2: "36.148",
      s3: "24.313",
      shifts: "50 lần",
      throttle: "62%",
      gforce: "4.3 G",
      tyres: ["C3", "C4", "C5"],
      temp: "25.0°C",
      humidity: "62%",
      trackTemp: "32.5°C",
      weatherDesc: "Đêm ấm / Khô ráo"
    }
  };

  return database[slug] || database.monaco;
}

export function renderDashboard(container) {
  const matchedGP = getUpcomingGP();
  const analytics = getCircuitAnalytics(matchedGP.slug);
  const isMonaco = matchedGP.slug.toLowerCase().includes('monaco');
  const chicaneName = isMonaco ? "Nouvelle Chicane" : "Góc cua số 1";
  const straightName = isMonaco ? "đoạn hầm Tunnel" : "đoạn thẳng chính";

  container.innerHTML = `
    <!-- Top Stats Row -->
    <div class="db-grid">
      <!-- Thẻ 1 (Chiếm 2 cột - Grid Column Span 2): Phân tích Kỷ lục & Telemetry Chặng Sắp Tới -->
      <div class="db-card glass" style="grid-column: span 2; display: flex; flex-direction: column; gap: 16px;">
        <span class="db-card-label" style="font-family: var(--font-main);">Phân Tích Telemetry Chặng Đua (${matchedGP.gpName.replace("Grand Prix", "GP")} Preview)</span>
        
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; flex-grow: 1;">
          
          <!-- Cột trái: Kỷ lục vòng & Phân đoạn (Sectors) -->
          <div style="display: flex; flex-direction: column; gap: 12px; border-right: 1px solid var(--border-color); padding-right: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 500;">Lap Record:</span>
              <span style="font-family: var(--font-tech); font-weight: 800; font-size: 1.2rem; color: var(--f1-red);" id="upcoming-lap-record">${analytics.lapRecord.split(" - ")[0]}</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-secondary); text-align: right; margin-top: -10px; margin-bottom: 8px;" id="upcoming-lap-holder">${analytics.lapRecord.split(" - ")[1]}</div>
            
            <!-- Sector 1 -->
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                <span style="color: var(--text-secondary); font-weight: 600;">Sector 1 (Nhanh nhất)</span>
                <span style="font-family: var(--font-tech); font-weight: 700; color: #ff1a5c;" id="upcoming-s1">${analytics.s1} s</span>
              </div>
              <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; position: relative;">
                <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${(parseFloat(analytics.s1) / 35) * 100}%; background: linear-gradient(90deg, rgba(255, 26, 92, 0.4), #ff1a5c); border-radius: 3px; box-shadow: 0 0 8px rgba(255, 26, 92, 0.6); transition: width var(--transition-slow);" id="upcoming-s1-bar"></div>
              </div>
            </div>

            <!-- Sector 2 -->
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                <span style="color: var(--text-secondary); font-weight: 600;">Sector 2 (Nhanh nhất)</span>
                <span style="font-family: var(--font-tech); font-weight: 700; color: #ffc400;" id="upcoming-s2">${analytics.s2} s</span>
              </div>
              <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; position: relative;">
                <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${(parseFloat(analytics.s2) / 48) * 100}%; background: linear-gradient(90deg, rgba(255, 196, 0, 0.4), #ffc400); border-radius: 3px; box-shadow: 0 0 8px rgba(255, 196, 0, 0.6); transition: width var(--transition-slow);" id="upcoming-s2-bar"></div>
              </div>
            </div>

            <!-- Sector 3 -->
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                <span style="color: var(--text-secondary); font-weight: 600;">Sector 3 (Nhanh nhất)</span>
                <span style="font-family: var(--font-tech); font-weight: 700; color: #00e5ff;" id="upcoming-s3">${analytics.s3} s</span>
              </div>
              <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; position: relative;">
                <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${(parseFloat(analytics.s3) / 40) * 100}%; background: linear-gradient(90deg, rgba(0, 229, 255, 0.4), #00e5ff); border-radius: 3px; box-shadow: 0 0 8px rgba(0, 229, 255, 0.6); transition: width var(--transition-slow);" id="upcoming-s3-bar"></div>
              </div>
            </div>

          </div>

          <!-- Cột phải: Chỉ số thiết lập xe & lốp (Car Setup) -->
          <div style="display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">
            
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 500; font-family: var(--font-main);">Gear Shifts/Lap</span>
              <div style="display: flex; align-items: center; gap: 6px;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: var(--neon-blue);"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="m8 12 4 4 4-4"/></svg>
                <span style="font-family: var(--font-tech); font-size: 1.05rem; font-weight: 800;" id="upcoming-shifts">${analytics.shifts}</span>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 500; font-family: var(--font-main);">Full Throttle %</span>
              <div style="display: flex; align-items: center; gap: 6px;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: var(--neon-green);"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
                <span style="font-family: var(--font-tech); font-size: 1.05rem; font-weight: 800;" id="upcoming-throttle">${analytics.throttle}</span>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 500; font-family: var(--font-main);">Max Lateral G</span>
              <div style="display: flex; align-items: center; gap: 6px;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: var(--f1-red);"><path d="M2 12h20"/><path d="M12 2v20"/><circle cx="12" cy="12" r="10"/></svg>
                <span style="font-family: var(--font-tech); font-size: 1.05rem; font-weight: 800;" id="upcoming-gforce">${analytics.gforce}</span>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 500; font-family: var(--font-main);">Tyre Compounds</span>
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;" id="upcoming-tyres">
                <span class="tyre-badge C3" style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #fff; background: transparent; text-align: center; line-height: 14px; font-size: 0.6rem; font-weight: bold; color: #fff; font-family: var(--font-tech);">${analytics.tyres[0]}</span>
                <span class="tyre-badge C4" style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #FFD700; background: transparent; text-align: center; line-height: 14px; font-size: 0.6rem; font-weight: bold; color: #FFD700; font-family: var(--font-tech);">${analytics.tyres[1]}</span>
                <span class="tyre-badge C5" style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #FF1E27; background: transparent; text-align: center; line-height: 14px; font-size: 0.6rem; font-weight: bold; color: #FF1E27; font-family: var(--font-tech);">${analytics.tyres[2]}</span>
              </div>
            </div>

          </div>
          
        </div>
      </div>

      <!-- Thẻ 2 (Chiếm 1 cột): Đồng hồ đếm ngược -->
      <div class="db-card glass">
        <span class="db-card-label" style="font-family: var(--font-main);">Đồng Hồ Đếm Ngược</span>
        <div class="db-card-value" style="font-size: 1.25rem; margin-top: 5px; font-family: var(--font-main); font-weight: 700; color: var(--text-primary);" id="countdown-gp">Loading...</div>
        <div class="db-card-sub" style="margin-bottom: 12px;">
          <span id="countdown-timer" style="font-family: var(--font-tech); font-weight: 800; font-size: 1.05rem; letter-spacing: 0.5px;">00d 00h 00m 00s</span>
        </div>
        <!-- Dynamic track quick info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border-top: 1px dashed var(--border-color); padding-top: 8px; font-size: 0.72rem; color: var(--text-secondary); font-family: var(--font-main);">
          <div>Chiều dài: <span style="font-family: var(--font-tech); font-weight: 700; color: #fff;" id="countdown-track-length">${matchedGP.length}</span></div>
          <div>Laps: <span style="font-family: var(--font-tech); font-weight: 700; color: #fff;" id="countdown-track-laps">${matchedGP.laps} vòng</span></div>
        </div>
        <svg class="db-card-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>

      <!-- Thẻ 3 (Chiếm 1 cột): LIVE Telemetry & Weather -->
      <div class="db-card glass">
        <span class="db-card-label" style="font-family: var(--font-main);">Thời Tiết & Kênh Telemetry</span>
        <div class="db-card-value" style="color: var(--neon-green); font-size: 1.4rem; display: flex; align-items: center; gap: 8px; font-family: var(--font-tech);">
          <span>LIVE</span>
          <span class="status-badge" style="padding: 0; box-shadow: none; font-size: 0.65rem; border: none; background: transparent; color: var(--neon-green); font-family: var(--font-tech); display: inline-flex;">
            <span class="dot" style="display: inline-block; width: 6px; height: 6px;"></span>
          </span>
        </div>
        <div class="db-card-sub" style="margin-bottom: 8px; font-size: 0.75rem;">
          <span style="font-family: var(--font-main);">Băng thông: 45.2 Gbps</span>
          <span style="color: var(--neon-green); margin-left: auto; font-family: var(--font-tech); font-weight: 700;">Ping: 8ms</span>
        </div>
        <!-- Live-like Paddock Weather info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border-top: 1px dashed var(--border-color); padding-top: 8px; font-size: 0.72rem; color: var(--text-secondary); font-family: var(--font-main);">
          <div>Nhiệt độ: <span style="font-family: var(--font-tech); font-weight: 700; color: #fff;" id="paddock-temp">${analytics.temp}</span></div>
          <div>Độ ẩm: <span style="font-family: var(--font-tech); font-weight: 700; color: #fff;" id="paddock-humidity">${analytics.humidity}</span></div>
          <div style="grid-column: span 2; display: flex; align-items: center; gap: 4px; color: var(--text-secondary); font-size: 0.7rem; margin-top: 2px;" id="paddock-condition">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 11px; height: 11px; color: var(--neon-blue); margin-right: 4px;"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.93 15.93a5 5 0 1 1-7.86-6.03 2.5 2.5 0 1 1 4.97-1.48Z"/></svg>
            <span>${analytics.weatherDesc} | Mặt đường: ${analytics.trackTemp}</span>
          </div>
        </div>
        <svg class="db-card-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M5 17V5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v12"/><path d="M9 17v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4"/></svg>
      </div>
    </div>

    <!-- Live Analytics & News Section -->
    <div class="telemetry-row">
      <!-- Bảng Phân Tích Dữ Liệu Đua Chuyên Sâu (Race Data Analytics Center) -->
      <div class="analytics-card glass" style="padding: 24px; display: flex; flex-direction: column; min-height: 380px;">
        <div class="card-header-sec" style="margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <div class="card-title" style="font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--f1-red); width: 18px; height: 18px;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span style="font-family: var(--font-main);">Phân Tích Dữ Liệu Đua Chuyên Sâu</span>
          </div>
          <!-- Tab Buttons -->
          <div class="analytics-tabs" style="display: flex; gap: 8px;">
            <button class="btn-mini active" id="tab-telemetry">SO SÁNH TELEMETRY</button>
            <button class="btn-mini" id="tab-tyres">CHIẾN THUẬT LỐP</button>
            <button class="btn-mini" id="tab-speedtrap">SPEED TRAP</button>
          </div>
        </div>
        
        <!-- Tab Content Area -->
        <div id="analytics-tab-content" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; min-height: 240px;">
          <!-- Content dynamically rendered via Javascript tab clicks -->
        </div>
      </div>

      <!-- Live News / Race Feed -->
      <div class="news-card glass" style="display: flex; flex-direction: column;">
        <div class="card-header-sec" style="margin-bottom: 20px;">
          <div class="card-title" style="font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M16 8h2"/><path d="M16 12h2"/><path d="M16 16h2"/><path d="M6 8h6v8H6z"/></svg>
            <span>F1 Apex Feed (Tin Nhanh Paddock)</span>
          </div>
        </div>
        <div class="news-list" style="display: flex; flex-direction: column; gap: 12px; flex-grow: 1; overflow-y: auto;">
          <div class="news-item" style="padding: 10px; gap: 12px;">
            <span class="news-time-badge">HOT</span>
            <div class="news-content">
              <span class="news-title">McLaren công bố nâng cấp sàn xe cho chặng đua tiếp theo</span>
              <span class="news-desc" style="font-size: 0.7rem;">Đội vô địch thế giới 2025 đặt mục tiêu duy trì ưu thế khí động học trước sự bám đuổi của Red Bull.</span>
            </div>
          </div>
          <div class="news-item" style="padding: 10px; gap: 12px;">
            <span class="news-time-badge">2H TRƯỚC</span>
            <div class="news-content">
              <span class="news-title">Hamilton hài lòng với động cơ Ferrari mới</span>
              <span class="news-desc" style="font-size: 0.7rem;">Lewis Hamilton chia sẻ cảm nhận tích cực về động cơ hybrid của Scuderia Ferrari chuẩn bị cho 2026.</span>
            </div>
          </div>
          <div class="news-item" style="padding: 10px; gap: 12px;">
            <span class="news-time-badge">5H TRƯỚC</span>
            <div class="news-content">
              <span class="news-title">Quy chế động cơ 2026 chính thức được hoàn thiện bởi FIA</span>
              <span class="news-desc" style="font-size: 0.7rem;">Quy định mới sẽ tăng đáng kể tỷ lệ năng lượng điện và nhiên liệu bền vững 100%.</span>
            </div>
          </div>
          <div class="news-item" style="padding: 10px; gap: 12px;">
            <span class="news-time-badge">1 NGÀY</span>
            <div class="news-content">
              <span class="news-title">Antonelli ghi nhận kỷ lục giả lập tại trường đua Spa</span>
              <span class="news-desc" style="font-size: 0.7rem;">Tân binh trẻ của Mercedes chứng minh phản xạ thần sầu khi đạt thành tích cực nhanh.</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- High-Tech Broadcast Live News Ticker Tape -->
    <div style="margin-top: 24px; background: rgba(5,6,8,0.7); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 16px; display: flex; align-items: center; gap: 16px; overflow: hidden; box-shadow: inset 0 0 15px rgba(0,0,0,0.3); position: relative; width: 100%;">
      <!-- Title Badge -->
      <span style="font-family: var(--font-tech); font-size: 0.72rem; font-weight: 900; background: var(--f1-red); color: #fff; padding: 4px 8px; border-radius: 4px; z-index: 10; flex-shrink: 0; box-shadow: 0 0 10px rgba(255, 30, 39, 0.4); display: flex; align-items: center; gap: 6px;">
        <span style="display:inline-block; width:5px; height:5px; background:#fff; border-radius:50%;" class="animate-pulse"></span>
        APEX BROADCAST LIVE FEED
      </span>
      <!-- Ticker Scroll Container -->
      <div style="flex-grow: 1; overflow: hidden; white-space: nowrap; position: relative;">
        <div class="ticker-wrap" style="display: inline-block; padding-left: 100%; animation: ticker-animation 35s linear infinite; font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">
          <span style="color:#ffc400; font-weight:700;">[WEATHER ALERT]</span> ${matchedGP.gpName.replace("Grand Prix", "GP")} paddock: Air Temp ${analytics.temp}, Track Temp ${analytics.trackTemp}, Humidity ${analytics.humidity}. ${analytics.tyres.join(", ")} tyre sets are allocated. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span style="color:var(--neon-blue); font-weight:700;">[TELEMETRY SWEEP]</span> Speed comparison active at ${chicaneName}: Lando Norris is hitting 295 km/h on straight, Verstappen braking 6 meters earlier. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span style="color:#ff1e27; font-weight:700;">[TRACK HISTORY]</span> ${matchedGP.circuitName} lap record remains ${matchedGP.lapRecord}. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span style="color:var(--neon-green); font-weight:700;">[CONSTRUCTORS]</span> Mercedes AMG Petronas dominates 2026 team standings with 239 points, ahead of Scuderia Ferrari (191) and McLaren (131). &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span style="color:#d946ef; font-weight:700;">[STRATEGY CHAT]</span> Team radio broadcast channels VER, NOR, LEC, HAM, RUS are now online and streaming paddock audio.
        </div>
      </div>
    </div>
  `;

  initCountdown(container, matchedGP);

  // Tab Content Switching Logic
  const tabContent = document.getElementById('analytics-tab-content');
  const btnTelemetry = document.getElementById('tab-telemetry');
  const btnTyres = document.getElementById('tab-tyres');
  const btnSpeedtrap = document.getElementById('tab-speedtrap');

  function switchAnalyticsTab(tabId) {
    if (!tabContent || !btnTelemetry || !btnTyres || !btnSpeedtrap) return;

    stopTelemetrySimulation();

    // Toggle active classes
    btnTelemetry.classList.remove('active');
    btnTyres.classList.remove('active');
    btnSpeedtrap.classList.remove('active');

    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    if (tabId === 'telemetry') {
      tabContent.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px; height: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem;">
            <div style="display: flex; gap: 16px;">
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: #00E5FF; border-radius: 50%;"></span>
                <span style="font-weight: 700; color: #fff;">Lando Norris</span> <span style="color: var(--text-secondary); font-size: 0.65rem;">(McLaren)</span>
              </span>
              <span style="display: inline-flex; align-items: center; gap: 6px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: #FF9E00; border-radius: 50%;"></span>
                <span style="font-weight: 700; color: #fff;">Max Verstappen</span> <span style="color: var(--text-secondary); font-size: 0.65rem;">(Red Bull)</span>
              </span>
            </div>
            <div style="color: var(--text-secondary); font-size: 0.7rem;">Khu vực: <span style="color: #fff; font-weight: 700;">Đoạn xuất phát / Cua số 1 (${matchedGP.gpName.replace("Grand Prix", "GP")})</span></div>
          </div>

          <div style="position: relative; width: 100%; height: 135px; background: rgba(0,0,0,0.25); border-radius: 6px; border: 1px solid var(--border-color); padding: 8px 12px 20px 32px; overflow: hidden;">
            <div style="position: absolute; left: 6px; top: 10px; font-family: var(--font-tech); font-size: 0.55rem; color: var(--text-muted); display: flex; flex-direction: column; justify-content: space-between; height: 110px;">
              <span>300</span>
              <span>200</span>
              <span>100</span>
            </div>
            
            <svg viewBox="0 0 450 110" style="width: 100%; height: 110px; overflow: visible;">
              <line x1="0" y1="0" x2="450" y2="0" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
              <line x1="0" y1="55" x2="450" y2="55" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
              <line x1="0" y1="110" x2="450" y2="110" stroke="rgba(255,255,255,0.08)" />
              
              <line x1="112" y1="0" x2="112" y2="110" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
              <line x1="225" y1="0" x2="225" y2="110" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
              <line x1="337" y1="0" x2="337" y2="110" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
              
              <path id="telemetry-norris-path" d="M 0,20 C 60,15 120,10 160,8 C 180,6 195,15 205,65 C 212,95 220,108 230,108 C 240,108 250,80 270,50 C 310,25 370,22 450,20" fill="none" stroke="#00E5FF" stroke-width="2" />
              <path id="telemetry-verstappen-path" d="M 0,20 C 60,16 120,11 155,10 C 172,9 188,12 200,60 C 208,92 216,110 225,110 C 235,110 246,75 265,48 C 305,25 365,21 450,18" fill="none" stroke="#FF9E00" stroke-width="2" />
              
              <!-- Static Braking Reference Line -->
              <circle cx="190" cy="10" r="2.5" fill="#FF1E27" style="opacity: 0.6;" />
              <line x1="190" y1="10" x2="190" y2="110" stroke="rgba(255, 30, 39, 0.25)" stroke-width="0.8" stroke-dasharray="2 2" />

              <!-- Active Sweep Markers -->
              <line id="telemetry-sweep-line" x1="0" y1="0" x2="0" y2="110" stroke="rgba(255,255,255,0.35)" stroke-width="1.2" stroke-dasharray="2 2" />
              <circle id="telemetry-norris-dot" cx="0" cy="0" r="4.5" fill="#00E5FF" stroke="#fff" stroke-width="1.5" style="filter: drop-shadow(0 0 3px #00E5FF);" />
              <circle id="telemetry-verstappen-dot" cx="0" cy="0" r="4.5" fill="#FF9E00" stroke="#fff" stroke-width="1.5" style="filter: drop-shadow(0 0 3px #FF9E00);" />
            </svg>
            
            <div style="position: absolute; left: 32px; bottom: 4px; right: 12px; font-family: var(--font-main); font-size: 0.55rem; color: var(--text-muted); display: flex; justify-content: space-between; pointer-events: none; user-select: none;">
              <span>Đoạn thẳng (-150m)</span>
              <span style="color: rgba(255,30,39,0.7); font-weight: 700;">Điểm Phanh (-45m)</span>
              <span>Đỉnh Cua Apex</span>
              <span>Tăng tốc Ra Cua</span>
            </div>
          </div>
          
          <!-- Real-Time Telemetry Panels -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <!-- Norris Panel -->
            <div style="background: rgba(0, 229, 255, 0.02); border: 1px solid rgba(0, 229, 255, 0.12); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.72rem; font-weight: 700; color: #00E5FF; font-family: var(--font-main); letter-spacing: 0.5px;">NORRIS <span style="font-weight: normal; opacity: 0.6;">#1</span></span>
                <span style="font-family: var(--font-tech); font-size: 0.85rem; font-weight: 800; color: #fff; background: rgba(0, 229, 255, 0.15); padding: 1px 6px; border-radius: 4px; min-width: 28px; text-align: center; border: 1px solid rgba(0, 229, 255, 0.25);" id="sim-norris-gear">8G</span>
              </div>
              <div style="display: flex; align-items: baseline; justify-content: space-between;">
                <span style="font-size: 0.6rem; color: var(--text-secondary); text-transform: uppercase; font-family: var(--font-main);">Tốc độ</span>
                <span style="font-family: var(--font-tech); font-size: 1.35rem; font-weight: 900; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.15);" id="sim-norris-speed">295 <span style="font-size: 0.7rem; font-weight: 500; font-family: var(--font-main); color: var(--text-secondary);">km/h</span></span>
              </div>
              
              <!-- Inputs -->
              <div style="display: flex; flex-direction: column; gap: 5px; font-size: 0.62rem; font-family: var(--font-main);">
                <div>
                  <div style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-bottom: 2px;">
                    <span>GA (Throttle)</span>
                    <span style="font-family: var(--font-tech); font-weight: 700; color: var(--neon-green);" id="sim-norris-throttle-val">100%</span>
                  </div>
                  <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.04); border-radius: 3px; overflow: hidden; position: relative;">
                    <div style="position: absolute; left: 0; top: 0; height: 100%; width: 100%; background: linear-gradient(90deg, rgba(57, 255, 20, 0.4), var(--neon-green)); border-radius: 3px; box-shadow: 0 0 5px rgba(57, 255, 20, 0.5);" id="sim-norris-throttle-bar"></div>
                  </div>
                </div>
                
                <div>
                  <div style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-bottom: 2px;">
                    <span>PHANH (Brake)</span>
                    <span style="font-family: var(--font-tech); font-weight: 700; color: var(--f1-red);" id="sim-norris-brake-val">0%</span>
                  </div>
                  <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.04); border-radius: 3px; overflow: hidden; position: relative;">
                    <div style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: linear-gradient(90deg, rgba(255, 30, 39, 0.4), var(--f1-red)); border-radius: 3px; box-shadow: 0 0 5px rgba(255, 30, 39, 0.5);" id="sim-norris-brake-bar"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Verstappen Panel -->
            <div style="background: rgba(255, 158, 0, 0.02); border: 1px solid rgba(255, 158, 0, 0.12); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.72rem; font-weight: 700; color: #FF9E00; font-family: var(--font-main); letter-spacing: 0.5px;">VERSTAPPEN <span style="font-weight: normal; opacity: 0.6;">#3</span></span>
                <span style="font-family: var(--font-tech); font-size: 0.85rem; font-weight: 800; color: #fff; background: rgba(255, 158, 0, 0.15); padding: 1px 6px; border-radius: 4px; min-width: 28px; text-align: center; border: 1px solid rgba(255, 158, 0, 0.25);" id="sim-verstappen-gear">8G</span>
              </div>
              <div style="display: flex; align-items: baseline; justify-content: space-between;">
                <span style="font-size: 0.6rem; color: var(--text-secondary); text-transform: uppercase; font-family: var(--font-main);">Tốc độ</span>
                <span style="font-family: var(--font-tech); font-size: 1.35rem; font-weight: 900; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.15);" id="sim-verstappen-speed">292 <span style="font-size: 0.7rem; font-weight: 500; font-family: var(--font-main); color: var(--text-secondary);">km/h</span></span>
              </div>
              
              <!-- Inputs -->
              <div style="display: flex; flex-direction: column; gap: 5px; font-size: 0.62rem; font-family: var(--font-main);">
                <div>
                  <div style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-bottom: 2px;">
                    <span>GA (Throttle)</span>
                    <span style="font-family: var(--font-tech); font-weight: 700; color: var(--neon-green);" id="sim-verstappen-throttle-val">100%</span>
                  </div>
                  <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.04); border-radius: 3px; overflow: hidden; position: relative;">
                    <div style="position: absolute; left: 0; top: 0; height: 100%; width: 100%; background: linear-gradient(90deg, rgba(57, 255, 20, 0.4), var(--neon-green)); border-radius: 3px; box-shadow: 0 0 5px rgba(57, 255, 20, 0.5);" id="sim-verstappen-throttle-bar"></div>
                  </div>
                </div>
                
                <div>
                  <div style="display: flex; justify-content: space-between; color: var(--text-secondary); margin-bottom: 2px;">
                    <span>PHANH (Brake)</span>
                    <span style="font-family: var(--font-tech); font-weight: 700; color: var(--f1-red);" id="sim-verstappen-brake-val">0%</span>
                  </div>
                  <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.04); border-radius: 3px; overflow: hidden; position: relative;">
                    <div style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: linear-gradient(90deg, rgba(255, 30, 39, 0.4), var(--f1-red)); border-radius: 3px; box-shadow: 0 0 5px rgba(255, 30, 39, 0.5);" id="sim-verstappen-brake-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Dynamic high-fidelity analysis box -->
          <div style="font-size: 0.72rem; color: var(--text-secondary); background: rgba(255,255,255,0.015); padding: 8px 12px; border-radius: 4px; border-left: 3px solid var(--neon-blue); line-height: 1.4; font-family: var(--font-main); min-height: 42px; display: flex; align-items: center;" id="sim-telemetry-analysis">
            <span style="opacity: 0.7; font-style: italic;">Đang đồng bộ hóa dữ liệu telemetry...</span>
          </div>
        </div>
      `;
      startTelemetrySimulation(matchedGP);
    } else if (tabId === 'tyres') {
      tabContent.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 14px; height: 100%;">
          <div style="font-size: 0.72rem; color: var(--text-secondary); font-family: var(--font-main);">
            Mô phỏng hao mòn lốp dự kiến tại chặng ${matchedGP.gpName.replace("Grand Prix", "GP")} (vỏ nhựa đường F1 2026):
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem;">
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid #FF1E27; color: #FF1E27; font-size: 0.55rem; font-weight: bold; text-align: center; line-height: 11px; font-family: var(--font-tech);">S</span>
                  <span style="font-weight: 600; color: #fff; font-family: var(--font-main);">Soft ${analytics.tyres[2]}</span>
                </span>
                <span style="font-family: var(--font-tech); font-weight: 700; color: #FF1E27;">Hao mòn 65% (Sau 18 vòng)</span>
              </div>
              <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; position: relative;">
                <div style="position: absolute; left: 0; top: 0; height: 100%; width: 65%; background: #FF1E27; border-radius: 3px;"></div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem;">
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid #FFD700; color: #FFD700; font-size: 0.55rem; font-weight: bold; text-align: center; line-height: 11px; font-family: var(--font-tech);">M</span>
                  <span style="font-weight: 600; color: #fff; font-family: var(--font-main);">Medium ${analytics.tyres[1]}</span>
                </span>
                <span style="font-family: var(--font-tech); font-weight: 700; color: #FFD700;">Hao mòn 50% (Sau 32 vòng)</span>
              </div>
              <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; position: relative;">
                <div style="position: absolute; left: 0; top: 0; height: 100%; width: 50%; background: #FFD700; border-radius: 3px;"></div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem;">
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid #fff; color: #fff; font-size: 0.55rem; font-weight: bold; text-align: center; line-height: 11px; font-family: var(--font-tech);">H</span>
                  <span style="font-weight: 600; color: #fff; font-family: var(--font-main);">Hard ${analytics.tyres[0]}</span>
                </span>
                <span style="font-family: var(--font-tech); font-weight: 700; color: #fff;">Hao mòn 38% (Sau 52 vòng)</span>
              </div>
              <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; position: relative;">
                <div style="position: absolute; left: 0; top: 0; height: 100%; width: 38%; background: #fff; border-radius: 3px;"></div>
              </div>
            </div>
          </div>

          <div style="font-size: 0.7rem; color: var(--text-secondary); background: rgba(255,255,255,0.01); padding: 8px 12px; border-radius: 4px; border-left: 3px solid var(--neon-green); line-height: 1.35; font-family: var(--font-main);">
            <strong style="color: var(--neon-green);">Chiến thuật khuyến nghị:</strong> Đảm bảo quản lý lốp tốt ở các cua tốc độ trung bình. Khuyến nghị 1-stop (Soft/Medium -> Hard) hoặc 2-stop nếu trời nóng để tối ưu lực kéo.
          </div>
        </div>
      `;
    } else if (tabId === 'speedtrap') {
      tabContent.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px; height: 100%;">
          <div style="font-size: 0.72rem; color: var(--text-secondary); margin-bottom: 2px; font-family: var(--font-main);">
            Tốc độ Speed Trap cao nhất đo được tại ${straightName} (km/h):
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 0.72rem; color: var(--text-secondary); font-family: var(--font-main);">
            <thead>
              <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                <th style="padding: 6px 4px; color: var(--text-muted); font-weight: bold; width: 40px;">HẠNG</th>
                <th style="padding: 6px 4px; color: var(--text-muted); font-weight: bold;">TAY ĐUA</th>
                <th style="padding: 6px 4px; color: var(--text-muted); font-weight: bold;">ĐỘI ĐUA</th>
                <th style="padding: 6px 4px; color: var(--text-muted); font-weight: bold; text-align: right;">TỐC ĐỘ</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.02); height: 26px;">
                <td style="padding: 4px; font-family: var(--font-tech); font-weight: 700; color: #FFD700;">1</td>
                <td style="padding: 4px; color: #fff; font-weight: 600;">Lewis Hamilton</td>
                <td style="padding: 4px; color: var(--text-muted);">Ferrari</td>
                <td style="padding: 4px; text-align: right; font-family: var(--font-tech); font-weight: 700; color: var(--neon-green);">${isMonaco ? '298.5' : '332.4'}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.02); height: 26px;">
                <td style="padding: 4px; font-family: var(--font-tech); font-weight: 700; color: #C0C0C0;">2</td>
                <td style="padding: 4px; color: #fff; font-weight: 600;">Max Verstappen</td>
                <td style="padding: 4px; color: var(--text-muted);">Red Bull Racing</td>
                <td style="padding: 4px; text-align: right; font-family: var(--font-tech); font-weight: 700; color: var(--neon-green);">${isMonaco ? '297.8' : '331.8'}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.02); height: 26px;">
                <td style="padding: 4px; font-family: var(--font-tech); font-weight: 700; color: #CD7F32;">3</td>
                <td style="padding: 4px; color: #fff; font-weight: 600;">Lando Norris</td>
                <td style="padding: 4px; color: var(--text-muted);">McLaren</td>
                <td style="padding: 4px; text-align: right; font-family: var(--font-tech); font-weight: 700; color: var(--neon-green);">${isMonaco ? '297.2' : '331.0'}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.02); height: 26px;">
                <td style="padding: 4px; font-family: var(--font-tech); font-weight: 700;">4</td>
                <td style="padding: 4px; color: #fff; font-weight: 600;">Charles Leclerc</td>
                <td style="padding: 4px; color: var(--text-muted);">Ferrari</td>
                <td style="padding: 4px; text-align: right; font-family: var(--font-tech); font-weight: 700; color: var(--neon-green);">${isMonaco ? '296.8' : '330.2'}</td>
              </tr>
              <tr style="height: 26px;">
                <td style="padding: 4px; font-family: var(--font-tech); font-weight: 700;">5</td>
                <td style="padding: 4px; color: #fff; font-weight: 600;">George Russell</td>
                <td style="padding: 4px; color: var(--text-muted);">Mercedes-AMG</td>
                <td style="padding: 4px; text-align: right; font-family: var(--font-tech); font-weight: 700; color: var(--neon-green);">${isMonaco ? '295.9' : '329.5'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }
  }

  // Bind tab events
  btnTelemetry.addEventListener('click', () => switchAnalyticsTab('telemetry'));
  btnTyres.addEventListener('click', () => switchAnalyticsTab('tyres'));
  btnSpeedtrap.addEventListener('click', () => switchAnalyticsTab('speedtrap'));

  // Load default tab
  switchAnalyticsTab('telemetry');
}

function initCountdown(container, matchedGP) {
  const gpLabel = document.getElementById('countdown-gp');
  const timerLabel = document.getElementById('countdown-timer');
  if (!gpLabel || !timerLabel) return;

  gpLabel.textContent = `Rd ${matchedGP.round} - ${matchedGP.gpName.replace("Rolex ", "").replace("Lenovo ", "").replace("Crypto.com ", "").replace("Pirelli ", "").replace("Gulf Air ", "").replace("Qatar Airways ", "").replace("Heineken Silver ", "").replace("Etihad Airways ", "")}`;

  const analytics = getCircuitAnalytics(matchedGP.slug);

  const analyticsTitle = container.querySelector('.db-card:first-child .db-card-label');
  if (analyticsTitle) {
    analyticsTitle.textContent = `Phân Tích Telemetry Đường Đua (${matchedGP.circuitName})`;
  }

  const recordEl = document.getElementById('upcoming-lap-record');
  const holderEl = document.getElementById('upcoming-lap-holder');
  if (recordEl && holderEl && analytics.lapRecord) {
    const parts = analytics.lapRecord.split(" - ");
    recordEl.textContent = parts[0] || "";
    holderEl.textContent = parts[1] || "";
  }

  const s1El = document.getElementById('upcoming-s1');
  const s2El = document.getElementById('upcoming-s2');
  const s3El = document.getElementById('upcoming-s3');
  if (s1El) s1El.textContent = `${analytics.s1} s`;
  if (s2El) s2El.textContent = `${analytics.s2} s`;
  if (s3El) s3El.textContent = `${analytics.s3} s`;

  const s1Bar = document.getElementById('upcoming-s1-bar');
  const s2Bar = document.getElementById('upcoming-s2-bar');
  const s3Bar = document.getElementById('upcoming-s3-bar');
  if (s1Bar) s1Bar.style.width = `${(parseFloat(analytics.s1) / 35) * 100}%`;
  if (s2Bar) s2Bar.style.width = `${(parseFloat(analytics.s2) / 48) * 100}%`;
  if (s3Bar) s3Bar.style.width = `${(parseFloat(analytics.s3) / 40) * 100}%`;

  const shiftsEl = document.getElementById('upcoming-shifts');
  const throttleEl = document.getElementById('upcoming-throttle');
  const gforceEl = document.getElementById('upcoming-gforce');
  if (shiftsEl) shiftsEl.textContent = analytics.shifts;
  if (throttleEl) throttleEl.textContent = analytics.throttle;
  if (gforceEl) gforceEl.textContent = analytics.gforce;

  const tyresEl = document.getElementById('upcoming-tyres');
  if (tyresEl && analytics.tyres) {
    tyresEl.innerHTML = `
      <span class="tyre-badge" style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #fff; background: transparent; text-align: center; line-height: 16px; font-size: 0.65rem; font-weight: 800; color: #fff; font-family: var(--font-tech); cursor: help;" title="Cương: ${analytics.tyres[0]}">${analytics.tyres[0]}</span>
      <span class="tyre-badge" style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #FFD700; background: transparent; text-align: center; line-height: 16px; font-size: 0.65rem; font-weight: 800; color: #FFD700; font-family: var(--font-tech); cursor: help;" title="Trung bình: ${analytics.tyres[1]}">${analytics.tyres[1]}</span>
      <span class="tyre-badge" style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #FF1E27; background: transparent; text-align: center; line-height: 16px; font-size: 0.65rem; font-weight: 800; color: #FF1E27; font-family: var(--font-tech); cursor: help;" title="Mềm: ${analytics.tyres[2]}">${analytics.tyres[2]}</span>
    `;
  }

  const lengthEl = document.getElementById('countdown-track-length');
  const lapsEl = document.getElementById('countdown-track-laps');
  if (lengthEl) lengthEl.textContent = matchedGP.length;
  if (lapsEl) lapsEl.textContent = `${matchedGP.laps} vòng`;

  const tempEl = document.getElementById('paddock-temp');
  const humidityEl = document.getElementById('paddock-humidity');
  const conditionEl = document.getElementById('paddock-condition');
  if (tempEl) tempEl.textContent = analytics.temp;
  if (humidityEl) humidityEl.textContent = analytics.humidity;
  if (conditionEl) {
    conditionEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 11px; height: 11px; color: var(--neon-blue); margin-right: 4px;"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.93 15.93a5 5 0 1 1-7.86-6.03 2.5 2.5 0 1 1 4.97-1.48Z"/></svg>
      <span>${analytics.weatherDesc} | Mặt đường: ${analytics.trackTemp}</span>
    `;
  }

  const gpDates = [
    { round: 1, dateStr: "2026-03-08" },
    { round: 2, dateStr: "2026-03-15" },
    { round: 3, dateStr: "2026-03-29" },
    { round: 4, dateStr: "2026-04-12" },
    { round: 5, dateStr: "2026-04-19" },
    { round: 6, dateStr: "2026-05-03" },
    { round: 7, dateStr: "2026-05-24" },
    { round: 8, dateStr: "2026-06-07" },
    { round: 9, dateStr: "2026-06-14" },
    { round: 10, dateStr: "2026-06-28" },
    { round: 11, dateStr: "2026-07-05" },
    { round: 12, dateStr: "2026-07-19" },
    { round: 13, dateStr: "2026-07-26" },
    { round: 14, dateStr: "2026-08-23" },
    { round: 15, dateStr: "2026-09-06" },
    { round: 16, dateStr: "2026-09-13" },
    { round: 17, dateStr: "2026-09-27" },
    { round: 18, dateStr: "2026-10-11" },
    { round: 19, dateStr: "2026-10-25" },
    { round: 20, dateStr: "2026-11-01" },
    { round: 21, dateStr: "2026-11-08" },
    { round: 22, dateStr: "2026-11-21" },
    { round: 23, dateStr: "2026-11-29" },
    { round: 24, dateStr: "2026-12-06" }
  ];

  const matchedDate = gpDates.find(gp => gp.round === matchedGP.round);
  const targetDate = new Date((matchedDate ? matchedDate.dateStr : "2026-06-14") + "T14:00:00").getTime();

  function updateTimer() {
    const currentTime = new Date().getTime();
    const diff = targetDate - currentTime; 
    
    if (diff <= 0) {
      timerLabel.textContent = "RACE WEEKEND STARTED";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    timerLabel.innerHTML = `<span style="color: var(--f1-red);">${days}d</span> ${hours}h ${minutes}m ${seconds}s`;
  }

  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);
  
  container.addEventListener('DOMRemoved', () => {
    clearInterval(timerInterval);
    stopTelemetrySimulation();
  });
}

export function stopTelemetrySimulation() {
  if (telemetryInterval) {
    clearInterval(telemetryInterval);
    telemetryInterval = null;
  }
}

export function startTelemetrySimulation(matchedGP = getUpcomingGP()) {
  stopTelemetrySimulation();

  const sweepLine = document.getElementById('telemetry-sweep-line');
  const norrisDot = document.getElementById('telemetry-norris-dot');
  const verstappenDot = document.getElementById('telemetry-verstappen-dot');
  
  const pathNorris = document.getElementById('telemetry-norris-path');
  const pathVerstappen = document.getElementById('telemetry-verstappen-path');

  if (!sweepLine || !norrisDot || !verstappenDot || !pathNorris || !pathVerstappen) {
    return;
  }

  const isMonaco = matchedGP.slug.toLowerCase().includes('monaco');
  const straightName = isMonaco ? "Lối thoát Hầm Tunnel" : "Đoạn thẳng chính";
  const chicaneName = isMonaco ? "Nouvelle Chicane" : "Góc cua số 1";
  const exitStraightName = isMonaco ? "Đoạn thẳng hướng ra Tabac" : "Đoạn thẳng sau cua";

  const lenNorris = pathNorris.getTotalLength();
  const lenVerstappen = pathVerstappen.getTotalLength();

  let progress = 0; // 0 to 1

  // Dynamic elements
  const elNorrisSpeed = document.getElementById('sim-norris-speed');
  const elNorrisGear = document.getElementById('sim-norris-gear');
  const elNorrisThrottleBar = document.getElementById('sim-norris-throttle-bar');
  const elNorrisThrottleVal = document.getElementById('sim-norris-throttle-val');
  const elNorrisBrakeBar = document.getElementById('sim-norris-brake-bar');
  const elNorrisBrakeVal = document.getElementById('sim-norris-brake-val');

  const elVerstappenSpeed = document.getElementById('sim-verstappen-speed');
  const elVerstappenGear = document.getElementById('sim-verstappen-gear');
  const elVerstappenThrottleBar = document.getElementById('sim-verstappen-throttle-bar');
  const elVerstappenThrottleVal = document.getElementById('sim-verstappen-throttle-val');
  const elVerstappenBrakeBar = document.getElementById('sim-verstappen-brake-bar');
  const elVerstappenBrakeVal = document.getElementById('sim-verstappen-brake-val');
  
  const elTelemetryAnalysis = document.getElementById('sim-telemetry-analysis');

  telemetryInterval = setInterval(() => {
    // Safety check: if elements are gone from the DOM (e.g. tab changed or panel overwritten), stop simulation!
    if (!document.getElementById('telemetry-sweep-line')) {
      stopTelemetrySimulation();
      return;
    }

    // Increment progress
    progress += 0.0035; // speed of the sweep
    if (progress > 1) {
      progress = 0;
    }

    // Get coordinates along paths
    const ptNorris = pathNorris.getPointAtLength(progress * lenNorris);
    const ptVerstappen = pathVerstappen.getPointAtLength(progress * lenVerstappen);

    // Update SVG elements
    sweepLine.setAttribute('x1', ptNorris.x);
    sweepLine.setAttribute('x2', ptNorris.x);

    norrisDot.setAttribute('cx', ptNorris.x);
    norrisDot.setAttribute('cy', ptNorris.y);

    verstappenDot.setAttribute('cx', ptNorris.x);
    verstappenDot.setAttribute('cy', ptVerstappen.y);

    // Calculate speed from Y coordinate: speed = 320 - 2 * y
    const speedNorris = Math.max(100, Math.min(312, Math.round(320 - 2 * ptNorris.y)));
    const speedVerstappen = Math.max(100, Math.min(312, Math.round(320 - 2 * ptVerstappen.y)));

    if (elNorrisSpeed) elNorrisSpeed.innerHTML = `${speedNorris} <span style="font-size: 0.75rem; font-weight: 500; font-family: var(--font-main); color: var(--text-secondary);">km/h</span>`;
    if (elVerstappenSpeed) elVerstappenSpeed.innerHTML = `${speedVerstappen} <span style="font-size: 0.75rem; font-weight: 500; font-family: var(--font-main); color: var(--text-secondary);">km/h</span>`;

    // Dynamic inputs based on x coordinate
    const x = ptNorris.x;
    
    // ---------------- LANDO NORRIS TELEMETRY CALCULATION ----------------
    let gearNorris = 8;
    let throttleNorris = 100;
    let brakeNorris = 0;

    if (x < 152) {
      // Tunnel straight
      gearNorris = 8;
      throttleNorris = 100;
      brakeNorris = 0;
    } else if (x >= 152 && x < 228) {
      // Braking zone
      
      // Throttle drops to 0 rapidly
      throttleNorris = Math.max(0, Math.round(100 - (x - 152) * 10));
      
      // Brake spikes to 100% and then tapers off
      if (x < 172) {
        brakeNorris = Math.round(((x - 152) / 20) * 100);
      } else {
        brakeNorris = Math.max(0, Math.round(100 - ((x - 172) / (228 - 172)) * 100));
      }

      // Gear downshifts
      if (x < 162) gearNorris = 8;
      else if (x < 172) gearNorris = 7;
      else if (x < 182) gearNorris = 6;
      else if (x < 192) gearNorris = 5;
      else if (x < 202) gearNorris = 4;
      else if (x < 215) gearNorris = 3;
      else gearNorris = 2;
    } else if (x >= 228 && x < 260) {
      // Chicane apex
      gearNorris = 2;
      brakeNorris = 0;
      // Throttle slowly starts to pick up
      throttleNorris = Math.round(((x - 228) / (260 - 228)) * 30);
    } else {
      // Chicane exit and acceleration
      brakeNorris = 0;
      // Throttle ramps up to 100%
      throttleNorris = Math.min(100, Math.round(30 + ((x - 260) / (320 - 260)) * 70));
      
      // Gear upshifts
      if (x < 280) gearNorris = 3;
      else if (x < 310) gearNorris = 4;
      else if (x < 350) gearNorris = 5;
      else if (x < 400) gearNorris = 6;
      else gearNorris = 7;
    }

    // ---------------- MAX VERSTAPPEN TELEMETRY CALCULATION ----------------
    let gearVerstappen = 8;
    let throttleVerstappen = 100;
    let brakeVerstappen = 0;

    if (x < 146) {
      // Tunnel straight
      gearVerstappen = 8;
      throttleVerstappen = 100;
      brakeVerstappen = 0;
    } else if (x >= 146 && x < 222) {
      // Braking zone (brakes 6m earlier!)
      
      // Throttle drops to 0 rapidly
      throttleVerstappen = Math.max(0, Math.round(100 - (x - 146) * 10));
      
      // Brake spikes to 96% and tapers off
      if (x < 164) {
        brakeVerstappen = Math.round(((x - 146) / 18) * 96);
      } else {
        brakeVerstappen = Math.max(0, Math.round(96 - ((x - 164) / (222 - 164)) * 96));
      }

      // Gear downshifts
      if (x < 156) gearVerstappen = 8;
      else if (x < 166) gearVerstappen = 7;
      else if (x < 176) gearVerstappen = 6;
      else if (x < 186) gearVerstappen = 5;
      else if (x < 196) gearVerstappen = 4;
      else if (x < 208) gearVerstappen = 3;
      else gearVerstappen = 2;
    } else if (x >= 222 && x < 250) {
      // Chicane apex (Verstappen exits apex earlier!)
      gearVerstappen = 2;
      brakeVerstappen = 0;
      // Verstappen hits the gas earlier and harder
      throttleVerstappen = Math.round(((x - 222) / (250 - 222)) * 45);
    } else {
      // Chicane exit and acceleration
      brakeVerstappen = 0;
      // Throttle ramps up to 100% (Verstappen reaches 100% throttle by x = 300)
      throttleVerstappen = Math.min(100, Math.round(45 + ((x - 250) / (300 - 250)) * 55));
      
      // Gear upshifts
      if (x < 270) gearVerstappen = 3;
      else if (x < 300) gearVerstappen = 4;
      else if (x < 340) gearVerstappen = 5;
      else if (x < 390) gearVerstappen = 6;
      else gearVerstappen = 7;
    }

    // Apply values to UI
    if (elNorrisGear) elNorrisGear.textContent = `${gearNorris}G`;
    if (elNorrisThrottleBar) elNorrisThrottleBar.style.width = `${throttleNorris}%`;
    if (elNorrisThrottleVal) elNorrisThrottleVal.textContent = `${throttleNorris}%`;
    if (elNorrisBrakeBar) elNorrisBrakeBar.style.width = `${brakeNorris}%`;
    if (elNorrisBrakeVal) elNorrisBrakeVal.textContent = `${brakeNorris}%`;

    if (elVerstappenGear) elVerstappenGear.textContent = `${gearVerstappen}G`;
    if (elVerstappenThrottleBar) elVerstappenThrottleBar.style.width = `${throttleVerstappen}%`;
    if (elVerstappenThrottleVal) elVerstappenThrottleVal.textContent = `${throttleVerstappen}%`;
    if (elVerstappenBrakeBar) elVerstappenBrakeBar.style.width = `${brakeVerstappen}%`;
    if (elVerstappenBrakeVal) elVerstappenBrakeVal.textContent = `${brakeVerstappen}%`;

    // Dynamic analysis text based on current sweep position
    if (elTelemetryAnalysis) {
      if (x < 146) {
        elTelemetryAnalysis.innerHTML = `<span style="display:inline-block; width:6px; height:6px; background:#39FF14; border-radius:50%; margin-right:6px; box-shadow: 0 0 6px #39FF14; animation: blink 1s infinite;"></span><strong>${straightName}:</strong> Đang ở vận tốc cực đại số 8. Lando (<span style="color:#00E5FF;">${speedNorris} km/h</span>) và Max (<span style="color:#FF9E00;">${speedVerstappen} km/h</span>) đều mở hết ga 100%.`;
      } else if (x >= 146 && x < 152) {
        elTelemetryAnalysis.innerHTML = `<span style="display:inline-block; width:6px; height:6px; background:#FF9E00; border-radius:50%; margin-right:6px; box-shadow: 0 0 6px #FF9E00; animation: blink 1s infinite;"></span><strong>Max phanh sớm:</strong> Verstappen bắt đầu rà chân phanh ở vị trí <span style="color:#FF9E00; font-weight:700;">-154m</span> trước ${chicaneName}. Norris vẫn giữ ga!`;
      } else if (x >= 152 && x < 175) {
        elTelemetryAnalysis.innerHTML = `<span style="display:inline-block; width:6px; height:6px; background:#00E5FF; border-radius:50%; margin-right:6px; box-shadow: 0 0 6px #00E5FF; animation: blink 1s infinite;"></span><strong>Lando phanh cực trễ:</strong> Norris đạp kịch phanh 100% trễ hơn Max <span style="color:#00E5FF; font-weight:700;">6m</span> nhằm tối ưu hóa vận tốc đi vào góc cua (entry speed).`;
      } else if (x >= 175 && x < 222) {
        elTelemetryAnalysis.innerHTML = `<span style="display:inline-block; width:6px; height:6px; background:#FF1E27; border-radius:50%; margin-right:6px; box-shadow: 0 0 6px #FF1E27; animation: blink 1s infinite;"></span><strong>Giai đoạn hãm tốc dốc:</strong> Cả hai dồn lực phanh cực mạnh, liên tục giật số từ 8G xuống 2G. Vận tốc tụt dốc nhanh chóng từ 290 km/h xuống dưới 130 km/h.`;
      } else if (x >= 222 && x < 228) {
        elTelemetryAnalysis.innerHTML = `<span style="display:inline-block; width:6px; height:6px; background:#FF9E00; border-radius:50%; margin-right:6px; box-shadow: 0 0 6px #FF9E00; animation: blink 1s infinite;"></span><strong>Đỉnh cua Apex 1:</strong> Verstappen thoát phanh trước, bắt đầu mớm ga nhẹ ở số 2 (<span style="color:#FF9E00; font-weight:700;">15% ga</span>), Norris vẫn đang rà phanh đi vào đỉnh.`;
      } else if (x >= 228 && x < 260) {
        elTelemetryAnalysis.innerHTML = `<span style="display:inline-block; width:6px; height:6px; background:#00E5FF; border-radius:50%; margin-right:6px; box-shadow: 0 0 6px #00E5FF; animation: blink 1s infinite;"></span><strong>Apex 2 (${chicaneName}):</strong> Norris đạt đỉnh chậm hơn, vận tốc tối thiểu chạm đáy <span style="color:#00E5FF; font-weight:700;">104 km/h</span>. Verstappen đã thoát cua và tăng ga lên 35%!`;
      } else if (x >= 260 && x < 300) {
        elTelemetryAnalysis.innerHTML = `<span style="display:inline-block; width:6px; height:6px; background:#FF9E00; border-radius:50%; margin-right:6px; box-shadow: 0 0 6px #FF9E00; animation: blink 1s infinite;"></span><strong>Tăng tốc thoát cua (Exit Speed):</strong> Verstappen mở hết ga 100% sớm hơn Norris <span style="color:#FF9E00; font-weight:700;">20m</span>, tạo chênh lệch vận tốc thoát cua lên đến <span style="color:#39FF14; font-weight:700;">+3.5 km/h</span>.`;
      } else {
        elTelemetryAnalysis.innerHTML = `<span style="display:inline-block; width:6px; height:6px; background:#39FF14; border-radius:50%; margin-right:6px; box-shadow: 0 0 6px #39FF14; animation: blink 1s infinite;"></span><strong>${exitStraightName}:</strong> Cả hai xe đều đạt ga tối đa 100%, upshift lên số 7. Verstappen đang tận dụng lợi thế exit speed để kéo dãn khoảng cách.`;
      }
    }

  }, 30); // ~33 FPS
}

