import { schedule } from '../data/schedule.js';

let activeViewMode = 'svg'; // 'svg' (vector diagram, default for 2026) or 'official' (F1.com image)

export function renderCircuits(container) {
  container.innerHTML = `
    <div class="circuits-layout">
      <!-- Left Column: Search & Scroll List -->
      <div class="circuits-list-card glass">
        <div class="circuits-list-search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="circuit-search" placeholder="Tìm chặng đua, quốc gia...">
        </div>
        <div class="circuits-scroll-area" id="circuits-list-container">
          <!-- Rendered dynamically -->
        </div>
      </div>

      <!-- Right Column: Detail Content -->
      <div class="circuit-detail-container" id="circuit-details-panel">
        <!-- Rendered dynamically on selection -->
      </div>
    </div>
  `;

  // 1. Populate initial circuits list
  populateCircuitsList(schedule);

  // 2. Select the first circuit by default
  if (schedule.length > 0) {
    selectCircuit(1);
  }

  // 3. Search input filtering logic
  const searchInput = document.getElementById('circuit-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = schedule.filter(item => 
        item.gpName.toLowerCase().includes(query) || 
        item.location.toLowerCase().includes(query) ||
        item.circuitName.toLowerCase().includes(query)
      );
      populateCircuitsList(filtered);
    });
  }
}

function populateCircuitsList(dataList) {
  const container = document.getElementById('circuits-list-container');
  if (!container) return;

  if (dataList.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 24px;">Không tìm thấy chặng đua phù hợp.</div>`;
    return;
  }

  container.innerHTML = dataList.map(item => `
    <div class="circuit-list-item" data-round="${item.round}" id="circuit-item-${item.round}">
      <div class="cli-round">R${item.round.toString().padStart(2, '0')}</div>
      <div class="cli-info">
        <span class="cli-name">${item.gpName.replace("Grand Prix", "GP")}</span>
        <span class="cli-loc">${item.location.split(',')[0]}</span>
      </div>
      <div class="cli-date">${item.date.split(' ')[0]}</div>
    </div>
  `).join('');

  // Add click handlers
  const items = container.querySelectorAll('.circuit-list-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      const round = parseInt(item.getAttribute('data-round'));
      selectCircuit(round);
    });
  });

  // Re-highlight active circuit if already loaded
  const activeDetailPanel = document.getElementById('circuit-details-panel');
  if (activeDetailPanel) {
    const currentRoundAttr = activeDetailPanel.getAttribute('data-active-round');
    if (currentRoundAttr) {
      const activeItem = container.querySelector(`#circuit-item-${currentRoundAttr}`);
      if (activeItem) activeItem.classList.add('active');
    }
  }
}

function selectCircuit(round) {
  const item = schedule.find(s => s.round === round);
  if (!item) return;

  // Update list highlight classes
  const container = document.getElementById('circuits-list-container');
  if (container) {
    const prevActive = container.querySelector('.circuit-list-item.active');
    if (prevActive) prevActive.classList.remove('active');

    const nextActive = container.querySelector(`#circuit-item-${round}`);
    if (nextActive) nextActive.classList.add('active');
  }

  // Populate detail panel
  const panel = document.getElementById('circuit-details-panel');
  if (!panel) return;

  panel.setAttribute('data-active-round', round);

  // Set technical simulated values for the circuit
  let downforceText = "Trung bình";
  let downforceColor = "var(--neon-blue)";
  let brakeForce = "4.8 G";
  let tyreWear = "Trung bình";
  let tyreWearColor = "var(--neon-blue)";

  if (item.difficulty === "Rất khó" || item.difficulty === "Cực kỳ khó") {
    tyreWear = "Rất cao";
    tyreWearColor = "var(--f1-red)";
  }
  if (item.circuitName.includes("Monza") || item.circuitName.includes("Spa") || item.circuitName.includes("Lusail") || item.circuitName.includes("Red Bull Ring")) {
    downforceText = "Thấp (Tốc độ cao)";
    downforceColor = "var(--neon-green)";
  } else if (item.circuitName.includes("Monaco") || item.circuitName.includes("Hungaroring") || item.circuitName.includes("Marina Bay")) {
    downforceText = "Tối đa (Lực ép cao)";
    downforceColor = "var(--f1-red)";
    brakeForce = "5.4 G";
  }

  // Official F1 CDN Image URL (using high quality 16x9 aspect ratios)
  window.currentImgIndex = 0;
  window.currentImgUrls = [
    `https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/${item.slug}_Circuit.png`,
    `https://media.formula1.com/content/dam/fom-website/circuits/${item.slug.replace(/_/g, '-')}/carbon.png`,
    `https://media.formula1.com/content/dam/fom-website/circuits/${item.slug}/carbon.png`
  ];

  // SVG technical corners setup
  let cornersHTML = '';
  let overlaysHTML = '';
  let startFinishX = 30;
  let startFinishY = 120;

  if (round === 1) { // Australia
    startFinishX = 25;
    startFinishY = 115;
    const corners = [
      { x: 25, y: 70, num: "1" },
      { x: 30, y: 40, num: "3" },
      { x: 50, y: 30, num: "4" },
      { x: 90, y: 45, num: "6" },
      { x: 120, y: 35, num: "8" },
      { x: 145, y: 35, num: "9" },
      { x: 172, y: 65, num: "11" },
      { x: 155, y: 118, num: "12" },
      { x: 110, y: 105, num: "13" },
      { x: 75, y: 95, num: "14" }
    ];
    cornersHTML = corners.map(c => `
      <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap Magenta Dot & Leader -->
      <circle cx="25" cy="95" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="25" y1="95" x2="35" y2="103" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="35" y="98.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="52" y="103.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection 1 Green Dot & Leader -->
      <circle cx="115" cy="45" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="115" y1="45" x2="107" y2="61" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="42" y="56.5" width="65" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="74.5" y="61.5" class="svg-callout-text">OVERTAKE DETECTION 1</text>
      </g>

      <!-- Overtake Detection 2 Green Dot & Leader -->
      <circle cx="75" cy="95" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="75" y1="95" x2="85" y2="81" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="85" y="76.5" width="65" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="117.5" y="81.5" class="svg-callout-text">OVERTAKE DETECTION 2</text>
      </g>
    `;
  }
  else if (round === 2) { // China
    startFinishX = 55;
    startFinishY = 100;
    const corners = [
      { x: 65, y: 55, num: "1" },
      { x: 80, y: 70, num: "2" },
      { x: 95, y: 80, num: "3" },
      { x: 55, y: 80, num: "6" },
      { x: 100, y: 105, num: "9" },
      { x: 140, y: 105, num: "11" },
      { x: 180, y: 110, num: "13" },
      { x: 155, y: 120, num: "14" },
      { x: 90, y: 120, num: "16" }
    ];
    cornersHTML = corners.map(c => `
      <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="155" cy="95" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="155" y1="95" x2="145" y2="82" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="111" y="77.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="128" y="82.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="100" cy="105" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="100" y1="105" x2="100" y2="121" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="70" y="116.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="100" y="121.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 3) { // Japan
    startFinishX = 145;
    startFinishY = 110;
    const corners = [
      { x: 30, y: 80, num: "1" },
      { x: 35, y: 50, num: "2" },
      { x: 65, y: 45, num: "4" },
      { x: 125, y: 85, num: "8" },
      { x: 180, y: 65, num: "11" },
      { x: 130, y: 35, num: "13" },
      { x: 65, y: 100, num: "15" },
      { x: 50, y: 135, num: "16" }
    ];
    cornersHTML = corners.map(c => `
      <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="95" cy="115" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="95" y1="115" x2="95" y2="99" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="78" y="94.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="95" y="99.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="165" cy="130" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="165" y1="130" x2="147" y2="130" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="87" y="125.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="117" y="130.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 4) { // Bahrain
    startFinishX = 30;
    startFinishY = 80;
    const corners = [
      { x: 30, y: 30, num: "1" },
      { x: 50, y: 40, num: "4" },
      { x: 125, y: 45, num: "8" },
      { x: 140, y: 65, num: "10" },
      { x: 120, y: 80, num: "11" },
      { x: 140, y: 100, num: "12" },
      { x: 175, y: 95, num: "13" },
      { x: 190, y: 110, num: "14" },
      { x: 170, y: 130, num: "15" }
    ];
    cornersHTML = corners.map(c => `
      <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="30" cy="50" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="30" y1="50" x2="48" y2="50" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="48" y="45.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="65" y="50.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="175" cy="75" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="175" y1="75" x2="157" y2="75" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="97" y="70.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="127" y="75.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 5) { // Saudi Arabia
    startFinishX = 45;
    startFinishY = 80;
    const corners = [
      { x: 45, y: 125, num: "1" },
      { x: 48, y: 105, num: "2" },
      { x: 45, y: 20, num: "13" },
      { x: 50, y: 65, num: "22" },
      { x: 40, y: 120, num: "27" }
    ];
    cornersHTML = corners.map(c => `
      <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="50" cy="65" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="50" y1="65" x2="68" y2="65" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="68" y="60.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="85" y="65.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="50" cy="125" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="50" y1="125" x2="68" y2="125" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="68" y="120.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="98" y="125.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 6) { // Miami
    startFinishX = 20;
    startFinishY = 65;
    const corners = [
      { x: 20, y: 35, num: "1" },
      { x: 55, y: 15, num: "4" },
      { x: 85, y: 45, num: "7" },
      { x: 135, y: 20, num: "11" },
      { x: 155, y: 75, num: "16" },
      { x: 115, y: 95, num: "17" },
      { x: 50, y: 115, num: "19" }
    ];
    cornersHTML = corners.map(c => `
      <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="155" cy="95" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="155" y1="95" x2="145" y2="82" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="111" y="77.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="128" y="82.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="70" cy="80" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="70" y1="80" x2="70" y2="96" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="40" y="91.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="70" y="96.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 7) { // Canada
    startFinishX = 35;
    startFinishY = 85;
    const corners = [
      { x: 20, y: 55, num: "2" },
      { x: 75, y: 55, num: "4" },
      { x: 110, y: 60, num: "6" },
      { x: 175, y: 45, num: "8" },
      { x: 185, y: 60, num: "10" },
      { x: 115, y: 105, num: "14" }
    ];
    cornersHTML = corners.map(c => `
      <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="140" cy="85" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="140" y1="85" x2="140" y2="99" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="123" y="94.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="140" y="99.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="90" cy="85" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="90" y1="85" x2="90" y2="71" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="60" y="66.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="90" y="71.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 8) { // Monaco
    startFinishX = 30;
    startFinishY = 100;
    const corners = [
      { x: 30, y: 85, num: "1" },
      { x: 65, y: 50, num: "3" },
      { x: 105, y: 45, num: "4" },
      { x: 105, y: 85, num: "6" }, // Loews Hairpin
      { x: 130, y: 95, num: "8" },
      { x: 150, y: 75, num: "10" },
      { x: 160, y: 115, num: "12" },
      { x: 135, y: 130, num: "16" },
      { x: 95, y: 120, num: "18" }
    ];
    cornersHTML = corners.map(c => `
      <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
    `).join('');

    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="160" cy="115" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="160" y1="115" x2="148" y2="99" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="114" y="94.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="131" y="99.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="50" cy="65" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="50" y1="65" x2="68" y2="76" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="68" y="71.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="98" y="76.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 9) { // Spain
    startFinishX = 30;
    startFinishY = 115;
    const corners = [
      { x: 30, y: 45, num: "1" },
      { x: 70, y: 60, num: "4" },
      { x: 100, y: 50, num: "5" },
      { x: 130, y: 40, num: "7" },
      { x: 175, y: 40, num: "9" },
      { x: 185, y: 65, num: "10" },
      { x: 115, y: 105, num: "12" },
      { x: 60, y: 115, num: "14" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="30" cy="80" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="30" y1="80" x2="48" y2="80" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="48" y="75.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="65" y="80.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="145" cy="95" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="145" y1="95" x2="145" y2="111" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="115" y="106.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="145" y="111.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 10) { // Austria
    startFinishX = 25;
    startFinishY = 80;
    const corners = [
      { x: 25, y: 45, num: "1" },
      { x: 45, y: 20, num: "2" },
      { x: 95, y: 25, num: "3" },
      { x: 175, y: 45, num: "4" },
      { x: 165, y: 70, num: "6" },
      { x: 135, y: 65, num: "7" },
      { x: 115, y: 90, num: "8" },
      { x: 85, y: 85, num: "9" },
      { x: 65, y: 115, num: "10" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="25" cy="50" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="25" y1="50" x2="43" y2="50" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="43" y="45.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="60" y="50.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="135" cy="65" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="135" y1="65" x2="135" y2="81" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="105" y="76.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="135" y="81.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 11) { // Great Britain
    startFinishX = 35;
    startFinishY = 105;
    const corners = [
      { x: 20, y: 70, num: "1" },
      { x: 40, y: 40, num: "3" },
      { x: 75, y: 30, num: "5" },
      { x: 120, y: 30, num: "9" },
      { x: 145, y: 45, num: "11" },
      { x: 175, y: 55, num: "12" },
      { x: 145, y: 105, num: "15" },
      { x: 110, y: 95, num: "16" },
      { x: 65, y: 100, num: "18" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="95" cy="50" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="95" y1="50" x2="95" y2="66" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="78" y="61.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="95" y="66.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="160" cy="85" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="160" y1="85" x2="142" y2="85" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="82" y="80.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="112" y="85.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 12) { // Belgium
    startFinishX = 30;
    startFinishY = 100;
    const corners = [
      { x: 30, y: 80, num: "1" },
      { x: 45, y: 75, num: "3" },
      { x: 125, y: 35, num: "5" },
      { x: 120, y: 75, num: "8" },
      { x: 165, y: 100, num: "10" },
      { x: 135, y: 45, num: "15" },
      { x: 95, y: 65, num: "18" },
      { x: 55, y: 115, num: "20" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');

    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="85" cy="35" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="85" y1="35" x2="85" y2="21" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="68" y="16.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="85" y="21.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="120" cy="75" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="120" y1="75" x2="110" y2="92" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="80" y="87.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="110" y="92.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 13) { // Hungary
    startFinishX = 30;
    startFinishY = 80;
    const corners = [
      { x: 30, y: 45, num: "1" },
      { x: 65, y: 35, num: "2" },
      { x: 90, y: 45, num: "4" },
      { x: 115, y: 35, num: "5" },
      { x: 145, y: 75, num: "8" },
      { x: 105, y: 95, num: "11" },
      { x: 95, y: 115, num: "12" },
      { x: 55, y: 115, num: "14" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="30" cy="60" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="30" y1="60" x2="48" y2="60" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="48" y="55.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="65" y="60.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="105" cy="95" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="105" y1="95" x2="105" y2="111" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="75" y="106.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="105" y="111.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 14) { // Netherlands
    startFinishX = 30;
    startFinishY = 65;
    const corners = [
      { x: 20, y: 80, num: "1" },
      { x: 65, y: 45, num: "3" },
      { x: 115, y: 35, num: "7" },
      { x: 175, y: 45, num: "9" },
      { x: 185, y: 65, num: "10" },
      { x: 145, y: 85, num: "11" },
      { x: 110, y: 95, num: "12" },
      { x: 50, y: 115, num: "14" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="85" cy="90" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="85" y1="90" x2="85" y2="106" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="68" y="101.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="85" y="106.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="125" cy="75" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="125" y1="75" x2="107" y2="75" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="47" y="70.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="77" y="75.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 15) { // Monza (Monza layout matching user image)
    startFinishX = 148;
    startFinishY = 90;
    const corners = [
      { x: 172, y: 85, num: "1" },
      { x: 185, y: 75, num: "2" },
      { x: 165, y: 55, num: "3" }, // Lesmo
      { x: 135, y: 55, num: "4" },
      { x: 90, y: 40, num: "5" },
      { x: 50, y: 55, num: "6" },
      { x: 20, y: 40, num: "7" },
      { x: 20, y: 115, num: "10" },
      { x: 80, y: 115, num: "11" },
      { x: 120, y: 115, num: "12" },
      { x: 145, y: 95, num: "13" },
      { x: 160, y: 95, num: "14" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="130" cy="115" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="130" y1="115" x2="130" y2="131" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="113" y="126.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="130" y="131.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="90" cy="55" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="90" y1="55" x2="90" y2="71" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="60" y="66.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="90" y="71.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 16) { // Madrid
    startFinishX = 38;
    startFinishY = 100;
    const corners = [
      { x: 25, y: 80, num: "1" },
      { x: 35, y: 50, num: "4" },
      { x: 55, y: 60, num: "5" },
      { x: 75, y: 42, num: "8" },
      { x: 120, y: 28, num: "10" },
      { x: 190, y: 60, num: "12" }, // La Monumental
      { x: 140, y: 85, num: "15" },
      { x: 120, y: 95, num: "18" },
      { x: 55, y: 120, num: "22" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="190" cy="60" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="190" y1="60" x2="165" y2="52" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="131" y="47.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="148" y="52.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="120" cy="28" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="120" y1="28" x2="120" y2="14" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="90" y="9.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="120" y="14.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 17) { // Azerbaijan
    startFinishX = 20;
    startFinishY = 70;
    const corners = [
      { x: 20, y: 50, num: "1" },
      { x: 175, y: 50, num: "3" },
      { x: 175, y: 90, num: "7" },
      { x: 130, y: 90, num: "8" },
      { x: 120, y: 130, num: "12" },
      { x: 70, y: 130, num: "15" },
      { x: 70, y: 90, num: "16" },
      { x: 20, y: 90, num: "20" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="95" cy="50" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="95" y1="50" x2="95" y2="34" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="78" y="29.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="95" y="34.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="120" cy="130" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="120" y1="130" x2="120" y2="114" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="90" y="109.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="120" y="114.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 18) { // Singapore
    startFinishX = 20;
    startFinishY = 90;
    const corners = [
      { x: 20, y: 50, num: "1" },
      { x: 90, y: 35, num: "5" },
      { x: 115, y: 50, num: "7" },
      { x: 155, y: 50, num: "9" },
      { x: 170, y: 75, num: "11" },
      { x: 150, y: 120, num: "13" },
      { x: 110, y: 95, num: "15" },
      { x: 75, y: 95, num: "17" },
      { x: 25, y: 125, num: "19" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="135" cy="50" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="135" y1="50" x2="135" y2="34" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="118" y="29.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="135" y="34.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="90" cy="105" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="90" y1="105" x2="90" y2="89" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="60" y="84.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="90" y="89.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 19) { // USA
    startFinishX = 25;
    startFinishY = 55;
    const corners = [
      { x: 45, y: 35, num: "1" },
      { x: 85, y: 55, num: "4" },
      { x: 115, y: 35, num: "11" },
      { x: 155, y: 65, num: "12" },
      { x: 175, y: 105, num: "15" },
      { x: 125, y: 115, num: "19" },
      { x: 65, y: 115, num: "20" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="100" cy="45" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="100" y1="45" x2="100" y2="29" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="83" y="24.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="100" y="29.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="150" cy="110" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="150" y1="110" x2="150" y2="94" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="120" y="89.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="150" y="94.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 20) { // Mexico
    startFinishX = 20;
    startFinishY = 70;
    const corners = [
      { x: 20, y: 50, num: "1" },
      { x: 165, y: 30, num: "4" },
      { x: 180, y: 60, num: "6" },
      { x: 140, y: 120, num: "12" },
      { x: 80, y: 120, num: "15" },
      { x: 50, y: 90, num: "17" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="90" cy="40" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="90" y1="40" x2="90" y2="24" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="73" y="19.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="90" y="24.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="110" cy="120" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="110" y1="120" x2="110" y2="104" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="80" y="99.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="110" y="104.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 21) { // Brazil
    startFinishX = 30;
    startFinishY = 75;
    const corners = [
      { x: 30, y: 55, num: "1" },
      { x: 90, y: 35, num: "4" },
      { x: 170, y: 100, num: "8" },
      { x: 120, y: 135, num: "10" },
      { x: 90, y: 115, num: "12" },
      { x: 30, y: 100, num: "15" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="60" cy="45" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="60" y1="45" x2="60" y2="29" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="43" y="24.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="60" y="29.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="105" cy="125" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="105" y1="125" x2="105" y2="109" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="75" y="104.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="105" y="109.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 22) { // Las Vegas
    startFinishX = 20;
    startFinishY = 75;
    const corners = [
      { x: 20, y: 40, num: "1" },
      { x: 175, y: 40, num: "5" },
      { x: 175, y: 110, num: "9" },
      { x: 105, y: 80, num: "12" },
      { x: 75, y: 110, num: "14" },
      { x: 20, y: 110, num: "17" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="95" cy="40" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="95" y1="40" x2="95" y2="24" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="78" y="19.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="95" y="24.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="135" cy="110" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="135" y1="110" x2="135" y2="94" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="105" y="89.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="135" y="94.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 23) { // Qatar
    startFinishX = 30;
    startFinishY = 85;
    const corners = [
      { x: 30, y: 60, num: "1" },
      { x: 90, y: 25, num: "4" },
      { x: 120, y: 40, num: "6" },
      { x: 180, y: 75, num: "10" },
      { x: 160, y: 125, num: "12" },
      { x: 95, y: 100, num: "14" },
      { x: 45, y: 115, num: "16" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="75" cy="30" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="75" y1="30" x2="75" y2="14" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="58" y="9.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="75" y="14.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="130" cy="115" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="130" y1="115" x2="130" y2="99" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="100" y="94.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="130" y="99.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else if (round === 24) { // Abu Dhabi
    startFinishX = 20;
    startFinishY = 70;
    const corners = [
      { x: 20, y: 45, num: "1" },
      { x: 165, y: 35, num: "5" },
      { x: 180, y: 65, num: "7" },
      { x: 155, y: 95, num: "9" },
      { x: 125, y: 125, num: "11" },
      { x: 85, y: 125, num: "14" },
      { x: 45, y: 95, num: "16" }
    ];
    cornersHTML = corners.map(c => `
      <g>
        <circle cx="${c.x}" cy="${c.y}" r="5" class="svg-corner-bg" />
        <text x="${c.x}" y="${c.y}" class="corner-text" text-anchor="middle" dominant-baseline="central">${c.num.toString().padStart(2, '0')}</text>
      </g>
    `).join('');
    
    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="90" cy="40" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="90" y1="40" x2="90" y2="24" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="73" y="19.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="90" y="24.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="105" cy="125" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="105" y1="125" x2="105" y2="109" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="75" y="104.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="105" y="109.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }
  else {
    cornersHTML = `
      <text x="50" y="42" class="corner-text" text-anchor="middle" dominant-baseline="central">01</text>
      <text x="160" y="80" class="corner-text" text-anchor="middle" dominant-baseline="central">08</text>
      <text x="90" y="115" class="corner-text" text-anchor="middle" dominant-baseline="central">14</text>
    `;

    overlaysHTML = `
      <!-- Speed Trap -->
      <circle cx="160" cy="80" r="2.2" class="svg-target-dot" fill="#ff00ff"></circle>
      <line x1="160" y1="80" x2="140" y2="67" class="svg-leader-line" stroke="#ff00ff"></line>
      <g>
        <rect x="106" y="62.5" width="34" height="9.5" rx="1.5" class="svg-callout-box" fill="#ff00ff"></rect>
        <text x="123" y="67.5" class="svg-callout-text">SPEED TRAP</text>
      </g>

      <!-- Overtake Detection -->
      <circle cx="90" cy="115" r="2.2" class="svg-target-dot" fill="#00b000"></circle>
      <line x1="90" y1="115" x2="105" y2="101" class="svg-leader-line" stroke="#00b000"></line>
      <g>
        <rect x="105" y="96.5" width="60" height="9.5" rx="1.5" class="svg-callout-box" fill="#00b000"></rect>
        <text x="135" y="101.5" class="svg-callout-text">OVERTAKE DETECTION</text>
      </g>
    `;
  }

  // Official F1 CDN Image URL (using high quality 16x9 aspect ratios)
  window.currentImgIndex = 0;
  window.currentImgUrls = [
    `https://media.formula1.com/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/${item.slug}_Circuit.png`,
    `https://media.formula1.com/content/dam/fom-website/circuits/${item.slug.replace(/_/g, '-')}/carbon.png`,
    `https://media.formula1.com/content/dam/fom-website/circuits/${item.slug}/carbon.png`
  ];

  panel.innerHTML = `
    <!-- Top Details Banner -->
    <div class="circuit-top-banner glass">
      <div class="circuit-top-title-sec">
        <span class="circuit-top-round">MÙA GIẢI 2026 • CHẶNG ${item.round.toString().padStart(2, '0')}</span>
        <h2 class="circuit-top-name">${item.gpName}</h2>
        <p class="circuit-top-circuit">${item.circuitName}</p>
      </div>
      <div class="circuit-top-date">${item.date}</div>
    </div>

    <!-- Main visual track layout and legend specs -->
    <div class="circuit-body-row">
      <!-- High contrast F1 Official image map container styled in premium dark carbon style -->
      <div class="circuit-map-card glass" id="circuit-map-card" style="background: var(--bg-card); border: 1px solid var(--border-color); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); height:390px; color:#ffffff; display:flex; flex-direction:column; padding:24px;">
        <div class="card-header-sec" style="width:100%; border-bottom: 1px solid var(--border-color); padding-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <div class="card-title" style="color:#ffffff; font-size:1rem; font-weight:700; display:flex; align-items:center; gap:8px;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--f1-red); width:18px; height:18px;"><circle cx="12" cy="12" r="10"/><path d="m12 8-4 4 4 4 4-4-4-4"/></svg>
            <span id="map-card-title">${activeViewMode === 'svg' ? 'Sơ Đồ Vector Công Nghệ Cao 2026' : 'Ảnh Sơ Đồ Chính Thức (Formula1.com)'}</span>
          </div>
          <!-- View Mode Toggle Buttons -->
          <div style="display:flex; gap:6px; background:rgba(255,255,255,0.03); border:1px solid var(--border-color); padding:2px; border-radius:4px;">
            <button id="btn-view-svg" style="border:none; padding:4px 10px; font-size:0.68rem; font-weight:bold; font-family:'Space Grotesk',sans-serif; border-radius:3px; cursor:pointer; background:${activeViewMode === 'svg' ? 'var(--f1-red)' : 'transparent'}; color:${activeViewMode === 'svg' ? '#fff' : 'var(--text-secondary)'}; transition:all 0.2s;">VECTOR 2026</button>
            <button id="btn-view-official" style="border:none; padding:4px 10px; font-size:0.68rem; font-weight:bold; font-family:'Space Grotesk',sans-serif; border-radius:3px; cursor:pointer; background:${activeViewMode === 'official' ? 'var(--f1-red)' : 'transparent'}; color:${activeViewMode === 'official' ? '#fff' : 'var(--text-secondary)'}; transition:all 0.2s;">ẢNH F1.COM</button>
          </div>
        </div>
        
        <div class="circuit-svg-container" style="padding-top: 12px; display:flex; align-items:center; justify-content:center; height:290px; position:relative; width:100%;">
          ${activeViewMode === 'svg' ? `
            <!-- Vector Map Drawing -->
            <svg viewBox="0 0 200 150" style="width:90%; height:90%; overflow:visible;" id="circuit-vector-svg">
              <defs>
                <linearGradient id="vector-glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#00E5FF" stop-opacity="0.95" />
                  <stop offset="100%" stop-color="#a855f7" stop-opacity="0.95" />
                </linearGradient>
              </defs>
              <style>
                .corner-text {
                  fill: #ffffff;
                  font-size: 6px;
                  font-family: var(--font-tech);
                  font-weight: 900;
                }
                .svg-target-dot {
                  filter: drop-shadow(0 0 4px currentColor);
                }
                .svg-leader-line {
                  stroke-width: 0.7px;
                  stroke-dasharray: 1.5 1.5;
                  opacity: 0.65;
                }
                .svg-callout-box {
                  opacity: 0.15;
                }
                .svg-callout-text {
                  fill: #ffffff;
                  font-size: 5.5px;
                  font-family: var(--font-tech);
                  font-weight: bold;
                  text-anchor: middle;
                  dominant-baseline: central;
                }
                .svg-corner-bg {
                  fill: rgba(7, 8, 10, 0.9);
                  stroke: rgba(255,255,255,0.22);
                  stroke-width: 0.6px;
                }
              </style>
              <!-- Thick track background line -->
              <path d="${item.svgPath}" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
              <!-- Glowing neon track path -->
              <path d="${item.svgPath}" fill="none" stroke="url(#vector-glow-grad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.45));" />
              <!-- Start/Finish line -->
              <line x1="${startFinishX}" y1="${startFinishY - 6}" x2="${startFinishX}" y2="${startFinishY + 6}" stroke="#ffffff" stroke-width="1.8" stroke-dasharray="1.5 1.5" />
              <!-- Render corners -->
              ${cornersHTML}
              <!-- Render technical overlays -->
              ${overlaysHTML}
            </svg>
          ` : `
            <!-- 1. Official F1 Image -->
            <div id="circuit-official-container" style="width:100%; text-align:center;">
              <img 
                src="${window.currentImgUrls[0]}" 
                alt="Official F1 Circuit Map for ${item.circuitName}" 
                id="circuit-official-img"
                style="max-width:95%; max-height:260px; object-fit:contain;"
                onerror="handleImageError(this)"
              />
              <div id="img-loading-fallback" style="display:none; color:var(--text-secondary); font-size:0.85rem; text-align:center; padding: 40px 0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 8px; color:var(--f1-red);" class="animate-spin"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                <span>Đang tải ảnh sơ đồ đường đua...</span>
              </div>
              <div id="img-error-fallback" style="display:none; color:var(--text-secondary); font-size:0.85rem; text-align:center; padding: 40px 0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 8px; color:var(--f1-red);"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>Không thể kết nối F1 CDN. Vui lòng kiểm tra mạng!</span>
              </div>
            </div>
          `}
        </div>
      </div>

      <!-- Specs Technical Grid -->
      <div class="circuit-specs-grid">
        <div class="spec-box glass">
          <span class="spec-lbl">Chiều dài vòng đua</span>
          <span class="spec-val spec-val-blue">${item.length}</span>
        </div>
        <div class="spec-box glass">
          <span class="spec-lbl">Số vòng đua</span>
          <span class="spec-val">${item.laps} Laps</span>
        </div>
        <div class="spec-box glass">
          <span class="spec-lbl">Tổng quãng đường</span>
          <span class="spec-val">${item.distance}</span>
        </div>
        <div class="spec-box glass">
          <span class="spec-lbl">Số góc cua</span>
          <span class="spec-val">${item.corners} cua</span>
        </div>
        <div class="spec-box glass">
          <span class="spec-lbl">Số phân đoạn Active Aero</span>
          <span class="spec-val spec-val-blue" style="color: var(--f1-red);">${item.aeroZones} vùng</span>
        </div>
        <div class="spec-box glass">
          <span class="spec-lbl">Độ khó đường đua</span>
          <span class="spec-val ${item.difficulty.includes('Khó') || item.difficulty.includes('cực') ? 'spec-val-red' : ''}">${item.difficulty}</span>
        </div>
        <div class="spec-box glass" style="grid-column: span 2;">
          <span class="spec-lbl">Kỷ lục vòng chạy (Lap Record)</span>
          <span class="spec-val" style="font-size:1rem; color:#fff;">${item.lapRecord}</span>
        </div>
      </div>
    </div>

    <!-- Telemetry Track Metrics & Details -->
    <div class="circuit-body-row" style="grid-template-columns: 1fr 1.2fr;">
      <!-- Track Telemetry Metrics -->
      <div class="circuit-specs-grid" style="grid-template-columns: 1fr 1fr; height: 100%;">
        <div class="spec-box glass">
          <span class="spec-lbl">Loại đường đua</span>
          <span class="spec-val" style="font-size:0.85rem; color:#fff; font-family:var(--font-main);">${item.type}</span>
        </div>
        <div class="spec-box glass">
          <span class="spec-lbl">Lực ép cánh gió (Aerodynamics)</span>
          <span class="spec-val" style="font-size:0.9rem; color:${downforceColor}; font-family:var(--font-main);">${downforceText}</span>
        </div>
        <div class="spec-box glass">
          <span class="spec-lbl">Độ hao mòn lốp</span>
          <span class="spec-val" style="font-size:0.9rem; color:${tyreWearColor}; font-family:var(--font-main);">${tyreWear}</span>
        </div>
        <div class="spec-box glass">
          <span class="spec-lbl">Lực phanh lớn nhất</span>
          <span class="spec-val spec-val-red">${brakeForce}</span>
        </div>
      </div>

      <!-- Description Card -->
      <div class="circuit-desc-card glass">
        <h3>Giới thiệu & Đặc trưng kỹ thuật</h3>
        <p>${item.desc}</p>
      </div>
    </div>
  `;

  // Attach Toggle Events
  const btnSvg = document.getElementById('btn-view-svg');
  const btnOfficial = document.getElementById('btn-view-official');
  if (btnSvg && btnOfficial) {
    btnSvg.addEventListener('click', () => {
      activeViewMode = 'svg';
      selectCircuit(round);
    });
    btnOfficial.addEventListener('click', () => {
      activeViewMode = 'official';
      selectCircuit(round);
    });
  }

  // Handle image loading fallback sequentially
  window.handleImageError = function(img) {
    const fallbackMessage = document.getElementById('img-loading-fallback');
    const errorMessage = document.getElementById('img-error-fallback');
    
    window.currentImgIndex++;
    if (window.currentImgIndex < window.currentImgUrls.length) {
      console.log(`Trying secondary F1 CDN asset: ${window.currentImgUrls[window.currentImgIndex]}`);
      if (fallbackMessage) fallbackMessage.style.display = 'block';
      img.src = window.currentImgUrls[window.currentImgIndex];
    } else {
      console.warn("All official F1.com CDN map URLs failed.");
      img.style.display = 'none';
      if (fallbackMessage) fallbackMessage.style.display = 'none';
      if (errorMessage) errorMessage.style.display = 'block';
    }
  };
}
