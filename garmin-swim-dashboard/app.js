/* ==========================================================================
   Garmin Swim Dashboard - Client Controller (app.js)
   Logic: CSV Parsing, Data Normalization, Personal Records & ApexCharts
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // --- State Variables ---
  let rawActivities = [];
  let processedSwims = [];
  let currentSort = { column: 'date', direction: 'desc' };
  let currentPage = 1;
  const rowsPerPage = 10;

  // --- Chart Instances ---
  let charts = {
    volume: null,
    paceSwolf: null,
    heartRate: null,
    location: null,
    dpsRate: null,
    paceSwolfCorr: null,
    lengthPace: null,
    lengthStroke: null,
    detailStrokeType: null
  };

  // --- DOM Elements ---
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const loadDemoBtn = document.getElementById("load-demo-btn");
  const resetBtn = document.getElementById("reset-btn");
  const emptyState = document.getElementById("empty-state");
  const dashboardContent = document.getElementById("dashboard-content");
  const loader = document.getElementById("loader");
  const searchInput = document.getElementById("search-input");
  const prevPageBtn = document.getElementById("prev-page-btn");
  const nextPageBtn = document.getElementById("next-page-btn");
  const pageInfo = document.getElementById("page-info");
  const tableBody = document.getElementById("table-body");
  const rowCount = document.getElementById("row-count");

  const detailSessionContent = document.getElementById("detail-session-content");
  const backToDashboardBtn = document.getElementById("back-to-dashboard-btn");
  const loadDemoFitBtn = document.getElementById("load-demo-fit-btn");

  const STROKE_TYPES_VN = {
    0: 'Bơi Sải (Freestyle)',
    'freestyle': 'Bơi Sải (Freestyle)',
    'crawl': 'Bơi Sải (Freestyle)',
    1: 'Bơi Ếch (Breaststroke)',
    'breaststroke': 'Bơi Ếch (Breaststroke)',
    2: 'Bơi Ngửa (Backstroke)',
    'backstroke': 'Bơi Ngửa (Backstroke)',
    3: 'Bơi Bướm (Butterfly)',
    'butterfly': 'Bơi Bướm (Butterfly)',
    4: 'Bài tập (Drill)',
    'drill': 'Bài tập (Drill)',
    5: 'Hỗn hợp (Mixed)',
    'mixed': 'Hỗn hợp (Mixed)'
  };

  // --- Check if there is cached data ---
  const cachedData = localStorage.getItem('garmin_swim_data');
  if (cachedData) {
    try {
      processedSwims = JSON.parse(cachedData);
      if (processedSwims && processedSwims.length > 0) {
        // Wait a small timeout to make sure DOM and ApexCharts are fully ready
        setTimeout(() => {
          renderDashboard();
        }, 100);
      }
    } catch (e) {
      console.error("Failed to parse cached swim data", e);
      localStorage.removeItem('garmin_swim_data');
    }
  }

  // --- Uploader Drag & Drop Events ---
  dropzone.addEventListener("click", () => fileInput.click());
  
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  // --- Load Demo Data Click ---
  loadDemoBtn.addEventListener("click", () => {
    // Clear previous swims when loading demo data to avoid mixing real & demo data
    processedSwims = [];
    localStorage.removeItem('garmin_swim_data');

    showLoader(true);
    // Attempt to fetch local mock CSV file first
    fetch("mock_garmin_data.csv")
      .then(response => {
        if (!response.ok) throw new Error("Local file fetch failed");
        return response.text();
      })
      .then(csvText => {
        parseCSV(csvText);
      })
      .catch(err => {
        console.warn("Could not fetch mock_garmin_data.csv via HTTP, using fallback inline mock data.", err);
        // Fallback mock data if running from file:// protocol (CORS restriction)
        const fallbackCSV = getFallbackMockCSV();
        parseCSV(fallbackCSV);
      });
  });

  // --- Load Demo FIT Data Click ---
  loadDemoFitBtn.addEventListener("click", () => {
    showLoader(true);
    setTimeout(() => {
      showLoader(false);
      try {
        const mockData = getMockFitJson();
        processFitData(mockData);
      } catch (err) {
        console.error("Error loading mock FIT data", err);
        alert("Lỗi khi tải dữ liệu bơi mẫu: " + err.message);
      }
    }, 500);
  });

  // --- Reset Click ---
  resetBtn.addEventListener("click", () => {
    rawActivities = [];
    processedSwims = [];
    localStorage.removeItem('garmin_swim_data'); // Clear cache!
    destroyCharts();
    emptyState.style.display = "flex";
    dashboardContent.style.display = "none";
    detailSessionContent.style.display = "none";
    resetBtn.style.display = "none";
    fileInput.value = "";
    searchInput.value = "";
  });

  // --- Back to Dashboard Click ---
  backToDashboardBtn.addEventListener("click", () => {
    detailSessionContent.style.display = "none";
    if (processedSwims && processedSwims.length > 0) {
      dashboardContent.style.display = "block";
    } else {
      emptyState.style.display = "flex";
    }
  });

  // --- Search Input Listener ---
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderTable();
  });

  // --- Sort Event Listeners for Table Headers ---
  const headers = [
    { id: 'th-date', col: 'date' },
    { id: 'th-title', col: 'title' },
    { id: 'th-dist', col: 'distance' },
    { id: 'th-time', col: 'timeSec' },
    { id: 'th-pace', col: 'paceSec' },
    { id: 'th-swolf', col: 'swolf' },
    { id: 'th-hr', col: 'avgHr' },
    { id: 'th-strokes', col: 'avgStrokes' }
  ];

  headers.forEach(h => {
    const el = document.getElementById(h.id);
    if (el) {
      el.addEventListener('click', () => {
        if (currentSort.column === h.col) {
          currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
          currentSort.column = h.col;
          currentSort.direction = 'desc'; // default is desc for better visibility
        }
        updateSortIcons();
        renderTable();
      });
    }
  });

  // --- Pagination Button Click Handlers ---
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(getFilteredSwims().length / rowsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  // ==========================================================================
  // Core Functions
  // ==========================================================================

  function showLoader(show) {
    loader.style.display = show ? "flex" : "none";
  }

  function handleFile(file) {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".csv")) {
      showLoader(true);
      const reader = new FileReader();
      reader.onload = function (e) {
        parseCSV(e.target.result);
      };
      reader.readAsText(file);
    } else if (fileName.endsWith(".fit")) {
      showLoader(true);
      const reader = new FileReader();
      reader.onload = function (e) {
        parseFitFile(e.target.result);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Vui lòng tải lên tệp định dạng .CSV (Lịch sử bơi) hoặc .FIT (Chi tiết buổi bơi).");
    }
  }

  function parseCSV(csvText) {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        rawActivities = results.data;
        processGarminData();
        showLoader(false);
      },
      error: function (err) {
        showLoader(false);
        alert("Lỗi khi đọc file CSV: " + err.message);
      }
    });
  }

  // --- Data Normalization & Processing ---
  function processGarminData() {
    if (rawActivities.length === 0) {
      alert("Không tìm thấy dữ liệu trong file CSV.");
      return;
    }

    // Identify Columns based on headers
    const sampleRow = rawActivities[0];
    const colMap = mapColumns(sampleRow);

    const parsedNewSwims = rawActivities
      .map((row, idx) => {
        // Get raw values using mapped column keys
        const typeRaw = row[colMap.type] || '';
        const title = row[colMap.title] || 'Buổi bơi không tên';
        const dateRaw = row[colMap.date] || '';
        const distanceRaw = row[colMap.distance] || '0';
        const timeRaw = row[colMap.time] || '00:00:00';
        const swolfRaw = row[colMap.swolf] || '';
        const paceRaw = row[colMap.pace] || '';
        const avgHrRaw = row[colMap.avgHr] || '';
        const maxHrRaw = row[colMap.maxHr] || '';
        const calRaw = row[colMap.calories] || '';
        const strokeRateRaw = row[colMap.strokeRate] || '';
        const totalStrokesRaw = row[colMap.totalStrokes] || '';

        // Filter: Keep only Swimming activities
        const lowerType = typeRaw.toLowerCase();
        const lowerTitle = title.toLowerCase();
        const isSwim = lowerType.includes('swim') || lowerType.includes('bơi') || 
                       lowerTitle.includes('swim') || lowerTitle.includes('bơi');
        
        if (!isSwim) return null;

        // 1. Process Date
        // Format date string beautifully (Garmin defaults to YYYY-MM-DD HH:MM:SS)
        const dateStr = dateRaw.split(' ')[0] || dateRaw;

        // 2. Process Distance (Handle commas and units)
        // If distance is formatted like "1,500" or "1.50" (for km)
        let distance = parseFloat(distanceRaw.replace(/,/g, ''));
        if (isNaN(distance)) distance = 0;
        if (distance > 0 && distance < 20) {
          // If Garmin exported distance in Kilometers/Miles instead of meters
          distance = distance * 1000;
        }

        // 3. Process Time (convert hh:mm:ss or mm:ss to seconds)
        const timeSec = timeStringToSeconds(timeRaw);

        // 4. Process Pace (format like "2:15" per 100m -> convert to seconds)
        let paceSec = 0;
        if (paceRaw) {
          if (paceRaw.includes(':')) {
            paceSec = timeStringToSeconds(paceRaw);
          } else {
            // numeric average speed, convert to pace/100m
            const avgSpeed = parseFloat(paceRaw); // m/s
            if (avgSpeed > 0) {
              paceSec = Math.round(100 / avgSpeed);
            }
          }
        }
        // Fallback: calculate pace if we have distance and time
        if (paceSec === 0 && distance > 0 && timeSec > 0) {
          paceSec = Math.round((timeSec / distance) * 100);
        }

        // 5. Parse health stats & swim metrics
        const swolf = parseInt(swolfRaw) || 0;
        const avgHr = parseInt(avgHrRaw) || 0;
        const maxHr = parseInt(maxHrRaw) || 0;
        const calories = parseInt(calRaw.replace(/,/g, '')) || 0;
        const avgStrokes = parseFloat(strokeRateRaw) || 0;
        const totalStrokes = parseInt(totalStrokesRaw) || 0;

        // Advanced metrics
        const dps = totalStrokes > 0 ? parseFloat((distance / totalStrokes).toFixed(2)) : 0;
        const cpei = (avgHr > 0 && timeSec > 0) ? parseFloat((distance / (avgHr * (timeSec / 60))).toFixed(3)) : 0;

        return {
          id: idx,
          type: lowerType.includes('open') || lowerTitle.includes('open') || lowerTitle.includes('ngoài trời') ? 'Open Water' : 'Pool',
          title,
          date: dateStr,
          dateTime: dateRaw,
          distance,
          timeStr: timeRaw,
          timeSec,
          paceSec,
          paceStr: paceSecToPaceString(paceSec),
          swolf,
          avgHr,
          maxHr,
          calories,
          avgStrokes,
          totalStrokes,
          dps,
          cpei
        };
      })
      .filter(item => item !== null && item.distance > 0); // remove non-swims and invalid sessions

    if (parsedNewSwims.length === 0) {
      showLoader(false);
      alert("Không tìm thấy hoạt động bơi lội nào trong file CSV. Hãy chắc chắn rằng bạn đã xuất các hoạt động bơi lội.");
      return;
    }

    // Merge with existing data if present (Smart Merge)
    if (processedSwims.length > 0) {
      const merged = [...processedSwims];
      let addedCount = 0;

      parsedNewSwims.forEach(newItem => {
        // Compare by dateTime to check duplicates
        const exists = merged.some(oldItem => oldItem.dateTime === newItem.dateTime);
        if (!exists) {
          merged.push(newItem);
          addedCount++;
        }
      });

      processedSwims = merged;
      alert(`Đã gộp thành công ${addedCount} buổi bơi mới vào dữ liệu hiện tại! (Bỏ qua ${parsedNewSwims.length - addedCount} buổi bị trùng lặp)`);
    } else {
      processedSwims = parsedNewSwims;
    }

    // Sort by date descending initially
    processedSwims.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

    // Save to LocalStorage for persistence!
    try {
      localStorage.setItem('garmin_swim_data', JSON.stringify(processedSwims));
    } catch (e) {
      console.warn("Failed to save data to localStorage (probably quota exceeded)", e);
    }

    renderDashboard();
  }

  // --- Render Dashboard UI & Visualizations ---
  function renderDashboard() {
    // Show Dashboard UI
    emptyState.style.display = "none";
    dashboardContent.style.display = "block";
    resetBtn.style.display = "inline-flex";

    // Build Metrics & Visualizations
    calculateHeroStats();
    calculatePRs();
    renderCharts();
    renderTable();
    generateTechnicalAdvice();
    
    // Refresh Icons inside generated DOM
    lucide.createIcons();
  }

  // ==========================================================================
  // FIT FILE PARSING & DETAILS RENDERING
  // ==========================================================================

  function parseFitFile(arrayBuffer) {
    if (typeof fitDecoder === 'undefined') {
      showLoader(false);
      alert("Lỗi: Thư viện fitDecoder chưa được tải. Vui lòng kiểm tra lại kết nối mạng.");
      return;
    }

    try {
      // 1. Convert ArrayBuffer to raw JSON
      const jsonRaw = fitDecoder.fit2json(arrayBuffer);
      
      // 2. Parse raw JSON into readable records
      const fitData = fitDecoder.parseRecords(jsonRaw);
      
      showLoader(false);
      
      if (!fitData || !fitData.records || fitData.records.length === 0) {
        alert("Lỗi: Không tìm thấy bản ghi nào trong tệp FIT.");
        return;
      }
      
      processFitData(fitData);
    } catch (err) {
      showLoader(false);
      console.error("Fit file parsing error", err);
      alert("Lỗi khi giải mã tệp FIT: " + err.message);
    }
  }

  function processFitData(fitData) {
    // Extract session record
    const sessionRecord = fitData.records.find(r => r.type === 'session');
    if (!sessionRecord) {
      alert("Tệp tin FIT không chứa thông tin tổng hợp của buổi bơi (Session summary).");
      return;
    }
    const session = sessionRecord.data || {};

    let poolLength = 25;
    if (session.pool_length) {
      poolLength = session.pool_length > 500 ? Math.round(session.pool_length / 100) : session.pool_length;
    }

    // Extract active lengths
    let activeLengths = fitData.records
      .filter(r => r.type === 'length' && r.data && r.data.length_type === 'active')
      .map(r => r.data);

    if (activeLengths.length === 0) {
      alert("Tệp tin FIT này không chứa dữ liệu bơi hồ chi tiết từng chiều (Lengths). Có thể đây là buổi bơi ngoài trời (Open Water) hoặc bài tập bơi tự do.");
      return;
    }

    // Filter out glitches: strokes < 10 OR duration < 15 seconds
    const beforeCount = activeLengths.length;
    activeLengths = activeLengths.filter(len => {
      const rawDur = len.total_elapsed_time || len.total_timer_time || 0;
      const duration = rawDur > 1000 ? rawDur / 1000 : rawDur;
      const strokes = len.total_strokes || 0;
      return strokes >= 10 && duration >= 15;
    });

    const removedCount = beforeCount - activeLengths.length;
    if (removedCount > 0) {
      console.log(`Smart Clean: Removed ${removedCount} glitched lengths (stroke count < 10 or duration < 15s).`);
    }

    if (activeLengths.length === 0) {
      alert("Không tìm thấy chiều bơi hợp lệ nào sau khi loại bỏ các dữ liệu lỗi (yêu cầu >= 10 sải tay và >= 15 giây mỗi chiều).");
      return;
    }

    // Recalculate distance and times based on cleaned active lengths
    const totalDist = activeLengths.length * poolLength;
    
    // Sum of durations of cleaned lengths
    const totalTimeSec = activeLengths.reduce((sum, len) => {
      const rawDur = len.total_elapsed_time || len.total_timer_time || 0;
      return sum + (rawDur > 1000 ? rawDur / 1000 : rawDur);
    }, 0);

    const totalStrokes = activeLengths.reduce((sum, len) => sum + (len.total_strokes || 0), 0);

    const avgPaceSec = (totalDist > 0 && totalTimeSec > 0) ? Math.round((totalTimeSec / totalDist) * 100) : 0;
    
    let dateStr = "Chưa rõ ngày";
    if (session.start_time) {
      const d = new Date(session.start_time);
      dateStr = d.toLocaleDateString('vi-VN') + " " + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }

    // Process lengths
    const processedLengths = activeLengths.map((len, idx) => {
      const rawDur = len.total_elapsed_time || len.total_timer_time || 0;
      const duration = rawDur > 1000 ? rawDur / 1000 : rawDur;

      const strokes = len.total_strokes || 0;
      
      // Calculate SWOLF: time in seconds + strokes
      const swolf = len.swolf_score || Math.round(duration + strokes);
      
      // Map stroke type
      const rawStroke = len.swim_stroke;
      const strokeTypeVN = STROKE_TYPES_VN[rawStroke] || rawStroke || "Không rõ";

      // Calculate Pace/100m equivalent for this length: (duration / poolLength) * 100
      const paceSec100m = poolLength > 0 ? Math.round((duration / poolLength) * 100) : 0;
      const paceStr = paceSecToPaceString(paceSec100m);

      return {
        number: idx + 1,
        strokeType: strokeTypeVN,
        duration,
        strokes,
        swolf,
        paceSec100m,
        paceStr
      };
    });

    const calculatedAvgSwolf = Math.round(processedLengths.reduce((a, b) => a + b.swolf, 0) / processedLengths.length);

    renderDetailSession({
      title: `Phân tích Buổi bơi chi tiết - Bể bơi ${poolLength}m`,
      subtitle: `Địa điểm: Bể bơi trong nhà | Ngày bơi: ${dateStr} | Chiều dài bể: ${poolLength}m` + (removedCount > 0 ? ` | Đã lọc bỏ ${removedCount} chiều bơi lỗi` : ""),
      distance: totalDist,
      timeSec: totalTimeSec,
      timeStr: formatDuration(totalTimeSec),
      avgSwolf: calculatedAvgSwolf,
      avgPaceStr: paceSecToPaceString(avgPaceSec),
      totalStrokes: totalStrokes,
      lengths: processedLengths
    });
  }

  // Format seconds to hh:mm:ss
  function formatDuration(totalSec) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.round(totalSec % 60);
    return h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}` : `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function getSwolfClass(swolf) {
    if (swolf < 35) return "swolf-excellent";
    if (swolf <= 42) return "swolf-good";
    if (swolf <= 50) return "swolf-average";
    return "swolf-poor";
  }

  function renderDetailSession(fitData) {
    // Toggle view
    emptyState.style.display = "none";
    dashboardContent.style.display = "none";
    detailSessionContent.style.display = "block";
    resetBtn.style.display = "inline-flex";

    // Populate Cards
    document.getElementById("detail-session-title").innerText = fitData.title;
    document.getElementById("detail-session-subtitle").innerText = fitData.subtitle;
    document.getElementById("detail-dist").innerText = Number(fitData.distance).toLocaleString('vi-VN');
    document.getElementById("detail-time").innerText = fitData.timeStr;
    document.getElementById("detail-swolf").innerText = fitData.avgSwolf;
    document.getElementById("detail-pace").innerText = fitData.avgPaceStr;
    document.getElementById("detail-strokes").innerText = fitData.totalStrokes;

    // Populate Lengths Table
    const tableBodyEl = document.getElementById("lengths-table-body");
    tableBodyEl.innerHTML = "";
    fitData.lengths.forEach(len => {
      const row = document.createElement("tr");
      row.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
      row.innerHTML = `
        <td style="padding: 12px; color: var(--text-main);">Chiều thứ ${len.number}</td>
        <td style="padding: 12px; color: var(--text-muted);">${len.strokeType}</td>
        <td style="padding: 12px; color: var(--text-muted);">${len.duration.toFixed(1)}s</td>
        <td style="padding: 12px; color: var(--text-muted);">${len.paceStr}</td>
        <td style="padding: 12px; color: var(--text-muted);">${len.strokes} sải</td>
        <td style="padding: 12px; font-weight: bold;" class="${getSwolfClass(len.swolf)}">${len.swolf}</td>
      `;
      tableBodyEl.appendChild(row);
    });

    // --- Render Detail Charts ---
    const lengthNumbers = fitData.lengths.map(l => l.number);
    const lengthDurations = fitData.lengths.map(l => l.duration);
    const lengthSwolfs = fitData.lengths.map(l => l.swolf);
    const lengthStrokes = fitData.lengths.map(l => l.strokes);

    // 1. Pace vs SWOLF Chart
    const paceOptions = {
      series: [
        {
          name: 'Thời gian bơi (giây)',
          type: 'column',
          data: lengthDurations
        },
        {
          name: 'Điểm số SWOLF',
          type: 'line',
          data: lengthSwolfs
        }
      ],
      chart: {
        height: '100%',
        type: 'line',
        background: 'transparent',
        toolbar: { show: false },
        foreColor: '#9ca3af'
      },
      colors: ['#00f2fe', '#ff007f'],
      stroke: {
        width: [0, 3],
        curve: 'smooth'
      },
      plotOptions: {
        bar: {
          borderRadius: 2,
          columnWidth: '50%'
        }
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        strokeDashArray: 4
      },
      xaxis: {
        categories: lengthNumbers,
        title: { text: 'Lượt bơi (Chiều hồ bơi)', style: { color: '#9ca3af' } }
      },
      yaxis: [
        {
          title: { text: 'Thời gian (giây)', style: { color: '#9ca3af' } }
        },
        {
          opposite: true,
          title: { text: 'SWOLF', style: { color: '#9ca3af' } }
        }
      ],
      tooltip: {
        theme: 'dark',
        shared: true,
        intersect: false
      }
    };

    if (charts.lengthPace) {
      charts.lengthPace.destroy();
    }
    charts.lengthPace = new ApexCharts(document.querySelector("#length-pace-chart"), paceOptions);
    charts.lengthPace.render();

    // 2. Stroke Count Chart
    const strokeOptions = {
      series: [{
        name: 'Số sải tay',
        data: lengthStrokes
      }],
      chart: {
        height: '100%',
        type: 'area',
        background: 'transparent',
        toolbar: { show: false },
        foreColor: '#9ca3af'
      },
      colors: ['#7f00ff'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.3,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      stroke: {
        width: 3,
        curve: 'smooth'
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        strokeDashArray: 4
      },
      xaxis: {
        categories: lengthNumbers,
        title: { text: 'Lượt bơi (Chiều hồ bơi)', style: { color: '#9ca3af' } }
      },
      yaxis: {
        title: { text: 'Số sải tay (strokes)', style: { color: '#9ca3af' } }
      },
      tooltip: {
        theme: 'dark'
      }
    };

    if (charts.lengthStroke) {
      charts.lengthStroke.destroy();
    }
    charts.lengthStroke = new ApexCharts(document.querySelector("#length-stroke-chart"), strokeOptions);
    charts.lengthStroke.render();

    // 3. Stroke Type Donut Chart
    const strokeCounts = {};
    fitData.lengths.forEach(l => {
      strokeCounts[l.strokeType] = (strokeCounts[l.strokeType] || 0) + 1;
    });

    const donutLabels = Object.keys(strokeCounts);
    const donutSeries = Object.values(strokeCounts);

    const donutOptions = {
      series: donutSeries,
      labels: donutLabels,
      chart: {
        type: 'donut',
        height: '100%',
        background: 'transparent',
        foreColor: '#9ca3af'
      },
      colors: ['#00f2fe', '#7f00ff', '#ff007f', '#00ff87', '#ff9f43'],
      stroke: { show: false },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: { show: true, fontSize: '12px' },
              value: { show: true, fontSize: '18px', fontWeight: 800, color: '#f3f4f6' },
              total: {
                show: true,
                label: 'Tổng lượt',
                formatter: function (w) {
                  return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                }
              }
            }
          }
        }
      },
      legend: {
        position: 'bottom',
        fontSize: '11px',
        labels: { colors: '#9ca3af' }
      },
      tooltip: { theme: 'dark' }
    };

    if (charts.detailStrokeType) {
      charts.detailStrokeType.destroy();
    }
    charts.detailStrokeType = new ApexCharts(document.querySelector("#detail-stroke-type-chart"), donutOptions);
    charts.detailStrokeType.render();

    // --- AI Length Coach Advice ---
    const times = fitData.lengths.map(l => l.duration).filter(t => t > 0);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((a, b) => a + Math.pow(b - avgTime, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);

    let pacingAdvice = "";
    if (stdDev < 1.5) {
      pacingAdvice = "🎯 <strong>Phân phối lực: Tuyệt vời!</strong> Tốc độ giữa các chiều bơi của bạn cực kỳ đều đặn (độ lệch chuẩn chỉ <strong>" + stdDev.toFixed(1) + "s</strong>). Bạn đang kiểm soát nhịp độ bơi rất tốt và phân bổ thể lực khoa học.";
    } else if (stdDev < 3.0) {
      pacingAdvice = "👍 <strong>Phân phối lực: Ổn định.</strong> Tốc độ bơi duy trì tương đối tốt (độ lệch chuẩn <strong>" + stdDev.toFixed(1) + "s</strong>). Bạn có sự kiểm soát thể lực tốt, thích hợp cho các bài bơi sức bền dài.";
    } else {
      pacingAdvice = "⚠️ <strong>Phân phối lực: Không đều.</strong> Tốc độ bơi có sự chênh lệch lớn giữa các chiều bơi (độ lệch chuẩn lên tới <strong>" + stdDev.toFixed(1) + "s</strong>). Thường bạn đã xuất phát quá nhanh ở các chiều đầu và bị đuối sức ở các chiều cuối. Lời khuyên: Hãy bơi thả lỏng hơn ở 3 chiều đầu tiên.";
    }

    const strokes = fitData.lengths.map(l => l.strokes).filter(s => s > 0);
    const minStrokes = Math.min(...strokes);
    const maxStrokes = Math.max(...strokes);
    const strokeDiff = maxStrokes - minStrokes;
    
    let strokeAdvice = "";
    if (strokeDiff <= 2) {
      strokeAdvice = "<br><br>🌊 <strong>Hiệu quả sải tay: Cao!</strong> Số lần quạt tay mỗi chiều bể bơi dao động rất ít. Lực đẩy nước và chiều dài sải tay của bạn được duy trì cực tốt kể cả khi mệt mỏi.";
    } else {
      strokeAdvice = "<br><br>⚠️ <strong>Trượt nước khi mệt:</strong> Số lần quạt tay dao động từ <strong>" + minStrokes + "</strong> đến <strong>" + maxStrokes + "</strong> sải/chiều (lệch <strong>" + strokeDiff + "</strong> sải). Khi mệt, bạn có xu hướng quạt tay nhanh hơn nhưng lực đẩy kém đi. Hãy cố gắng giữ sải tay dài ở cuối buổi bơi.";
    }

    document.getElementById("detail-advice-text").innerHTML = pacingAdvice + strokeAdvice;

    // Refresh Icons inside generated DOM
    lucide.createIcons();
  }

  // --- Dynamic Column Mapper for Multi-Language Support ---
  function mapColumns(sampleRow) {
    const keys = Object.keys(sampleRow);
    const colMap = {
      type: '',
      date: '',
      title: '',
      distance: '',
      time: '',
      calories: '',
      avgHr: '',
      maxHr: '',
      pace: '',
      swolf: '',
      strokeRate: '',
      totalStrokes: ''
    };

    const searchKeyword = (keywords) => {
      const match = keys.find(k => {
        const lowerK = k.toLowerCase().replace(/_/g, ' ').trim();
        return keywords.some(kw => lowerK.includes(kw));
      });
      return match || '';
    };

    colMap.type = searchKeyword(['activity type', 'loại hoạt động', 'type']);
    colMap.date = searchKeyword(['date', 'ngày', 'start time']);
    colMap.title = searchKeyword(['title', 'tiêu đề', 'name']);
    colMap.distance = searchKeyword(['distance', 'quãng đường', 'khoảng cách', 'khoảng cách', 'dist']);
    colMap.time = searchKeyword(['time', 'thời gian', 'duration']);
    colMap.calories = searchKeyword(['calories', 'calo', 'kcal']);
    colMap.avgHr = searchKeyword(['avg hr', 'nhịp tim tb', 'average heart rate', 'nhịp tim trung bình', 'hr trung bình', 'hr tb']);
    colMap.maxHr = searchKeyword(['max hr', 'nhịp tim tối đa', 'maximum heart rate', 'hr tối đa']);
    colMap.pace = searchKeyword(['avg pace', 'pace tb', 'pace trung bình', 'avg speed', 'tốc độ tb', 'nhịp độ trung bình', 'nhịp độ tb']);
    colMap.swolf = searchKeyword(['avg swolf', 'swolf tb', 'swolf trung bình', 'swolf']);
    colMap.strokeRate = searchKeyword(['avg stroke rate', 'tần số quạt tay tb', 'stroke rate', 't.độ sải tay', 'tốc độ sải tay', 'đạp chân tb']);
    colMap.totalStrokes = searchKeyword(['total strokes', 'tổng số lần quạt tay', 'strokes', 'tổng sải tay', 'tổng sải']);

    return colMap;
  }

  // --- Helper Date/Time Parsers ---
  function timeStringToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':').map(Number);
    if (parts.some(isNaN)) return 0;
    if (parts.length === 3) {
      // hh:mm:ss
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // mm:ss
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }

  function paceSecToPaceString(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // --- Summary Analytics (Hero cards) ---
  function calculateHeroStats() {
    let totalDistM = 0;
    let totalSec = 0;
    let swolfSum = 0;
    let swolfCount = 0;
    let totalCalories = 0;
    
    let totalStrokesSum = 0;
    let strokesDistCount = 0;
    let cpeiSum = 0;
    let cpeiCount = 0;

    processedSwims.forEach(s => {
      totalDistM += s.distance;
      totalSec += s.timeSec;
      totalCalories += s.calories;
      if (s.swolf > 0) {
        swolfSum += s.swolf * s.distance; // Weighted SWOLF by distance
        swolfCount += s.distance;
      }
      if (s.totalStrokes > 0) {
        totalStrokesSum += s.totalStrokes;
        strokesDistCount += s.distance;
      }
      if (s.cpei > 0) {
        cpeiSum += s.cpei * s.distance; // Weighted CPEI
        cpeiCount += s.distance;
      }
    });

    const totalDistKm = (totalDistM / 1000).toFixed(2);
    const totalHours = (totalSec / 3600).toFixed(1);

    // Format total time string
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = Math.round(totalSec % 60);
    const timeDetailStr = `${h}giờ ${m}phút ${s}giây`;

    // Average SWOLF (weighted)
    const avgSwolf = swolfCount > 0 ? Math.round(swolfSum / swolfCount) : 0;
    
    // SWOLF evaluation label
    let swolfRating = "N/A";
    if (avgSwolf > 0) {
      if (avgSwolf < 35) swolfRating = "Kỹ thuật Xuất sắc (Elite)";
      else if (avgSwolf <= 42) swolfRating = "Kỹ thuật Tốt (Good)";
      else if (avgSwolf <= 50) swolfRating = "Kỹ thuật Trung bình (Average)";
      else swolfRating = "Kỹ thuật Kém (Need Focus)";
    }

    // Average Pace (Total time / total distance * 100)
    const avgPaceSec = totalDistM > 0 ? Math.round((totalSec / totalDistM) * 100) : 0;
    const avgPaceStr = paceSecToPaceString(avgPaceSec);

    // Speed translation
    const avgSpeedKmh = totalSec > 0 ? ((totalDistM / 1000) / (totalSec / 3600)).toFixed(2) : 0;

    // Date range
    let dateRange = "N/A";
    if (processedSwims.length > 0) {
      // Find oldest and newest date
      const dates = processedSwims.map(s => new Date(s.dateTime));
      const minDate = new Date(Math.min.apply(null, dates)).toLocaleDateString('vi-VN');
      const maxDate = new Date(Math.max.apply(null, dates)).toLocaleDateString('vi-VN');
      dateRange = `${minDate} - ${maxDate}`;
    }

    // Render to DOM
    document.getElementById("stat-distance").innerText = Number(totalDistKm).toLocaleString('vi-VN');
    document.getElementById("stat-time").innerText = totalHours;
    document.getElementById("stat-time-detail").innerText = timeDetailStr;
    document.getElementById("stat-swolf").innerText = avgSwolf > 0 ? avgSwolf : "--";
    document.getElementById("stat-swolf-rating").innerText = swolfRating;
    document.getElementById("stat-pace").innerText = avgPaceStr;
    document.getElementById("stat-pace-speed").innerText = `~ ${avgSpeedKmh} km/h`;
    document.getElementById("stat-sessions").innerText = processedSwims.length;
    document.getElementById("stat-sessions-range").innerText = dateRange;

    // Advanced Metrics calculation & DOM update
    const avgDps = totalStrokesSum > 0 ? (strokesDistCount / totalStrokesSum).toFixed(2) : 0;
    const avgCpei = cpeiCount > 0 ? (cpeiSum / cpeiCount).toFixed(3) : 0;

    document.getElementById("stat-dps").innerText = avgDps > 0 ? avgDps : "--";
    document.getElementById("stat-cpei").innerText = avgCpei > 0 ? avgCpei : "--";

    // Set descriptions based on average values
    if (avgDps > 0) {
      let dpsDesc = "";
      if (avgDps >= 2.0) dpsDesc = "Chu kỳ sải dài tối ưu (Excellent glide)";
      else if (avgDps >= 1.6) dpsDesc = "Lực rẽ nước tốt (Good glide)";
      else dpsDesc = "Sải tay ngắn, cần tăng độ lướt (Short glide)";
      document.getElementById("stat-dps-subtitle").innerText = dpsDesc;
    }

    if (avgCpei > 0) {
      let cpeiDesc = "";
      if (avgCpei >= 0.12) cpeiDesc = "Hệ tim mạch thích nghi rất cao";
      else if (avgCpei >= 0.09) cpeiDesc = "Sức bền tim mạch tốt";
      else cpeiDesc = "Tim đập nhanh, bơi mau mệt";
      document.getElementById("stat-cpei-subtitle").innerText = cpeiDesc;
    }

    // Calculate Month-over-Month Comparisons
    calculateMoMProgress();
  }

  // --- Month-over-Month Progression calculation ---
  function calculateMoMProgress() {
    if (processedSwims.length === 0) return;

    // Find the latest activity date
    const dates = processedSwims.map(s => new Date(s.dateTime));
    const maxDate = new Date(Math.max.apply(null, dates));

    // Define date ranges
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const boundaryDate1 = new Date(maxDate.getTime() - thirtyDaysMs);
    const boundaryDate2 = new Date(maxDate.getTime() - (2 * thirtyDaysMs));

    // Filter sessions
    const recentSwims = processedSwims.filter(s => {
      const d = new Date(s.dateTime);
      return d >= boundaryDate1 && d <= maxDate;
    });

    const previousSwims = processedSwims.filter(s => {
      const d = new Date(s.dateTime);
      return d >= boundaryDate2 && d < boundaryDate1;
    });

    const getStats = (swims) => {
      if (swims.length === 0) return null;
      let totalDist = 0;
      let totalTime = 0;
      let swolfSum = 0;
      let swolfCount = 0;
      
      swims.forEach(s => {
        totalDist += s.distance;
        totalTime += s.timeSec;
        if (s.swolf > 0) {
          swolfSum += s.swolf * s.distance;
          swolfCount += s.distance;
        }
      });

      return {
        avgPace: totalDist > 0 ? (totalTime / totalDist) * 100 : 0,
        avgSwolf: swolfCount > 0 ? swolfSum / swolfCount : 0,
        totalDist: totalDist
      };
    };

    const recent = getStats(recentSwims);
    const prev = getStats(previousSwims);

    const paceEl = document.getElementById("mom-pace");
    const swolfEl = document.getElementById("mom-swolf");
    const distEl = document.getElementById("mom-dist");

    if (!recent || !prev) {
      paceEl.innerText = "N/A";
      paceEl.className = "stat-value text-neutral";
      swolfEl.innerText = "N/A";
      swolfEl.className = "stat-value text-neutral";
      distEl.innerText = "N/A";
      distEl.className = "stat-value text-neutral";
      return;
    }

    // Pace delta (Pace is seconds per 100m, lower is better)
    const paceDelta = recent.avgPace - prev.avgPace;
    if (paceDelta < -0.5) {
      // Faster pace (improvement)
      paceEl.innerText = `-${paceSecToPaceString(Math.abs(paceDelta))}`;
      paceEl.className = "stat-value text-improvement";
    } else if (paceDelta > 0.5) {
      // Slower pace
      paceEl.innerText = `+${paceSecToPaceString(paceDelta)}`;
      paceEl.className = "stat-value text-regression";
    } else {
      paceEl.innerText = "--";
      paceEl.className = "stat-value text-neutral";
    }

    // SWOLF delta (lower is better)
    const swolfDelta = recent.avgSwolf - prev.avgSwolf;
    if (swolfDelta < -0.2) {
      // More efficient
      swolfEl.innerText = `${swolfDelta.toFixed(1)}`;
      swolfEl.className = "stat-value text-improvement";
    } else if (swolfDelta > 0.2) {
      // Less efficient
      swolfEl.innerText = `+${swolfDelta.toFixed(1)}`;
      swolfEl.className = "stat-value text-regression";
    } else {
      swolfEl.innerText = "--";
      swolfEl.className = "stat-value text-neutral";
    }

    // Distance volume delta (higher is better)
    const distDelta = recent.totalDist - prev.totalDist;
    if (distDelta > 100) {
      distEl.innerText = `+${(distDelta / 1000).toFixed(1)} km`;
      distEl.className = "stat-value text-improvement";
    } else if (distDelta < -100) {
      distEl.innerText = `${(distDelta / 1000).toFixed(1)} km`;
      distEl.className = "stat-value text-regression";
    } else {
      distEl.innerText = "--";
      distEl.className = "stat-value text-neutral";
    }
  }

  // --- Personal Records Calculations ---
  function calculatePRs() {
    let prDist = { val: 0, date: '--/--/----' };
    let prPace = { val: Infinity, date: '--/--/----' };
    let prSwolf = { val: Infinity, date: '--/--/----' };
    let prTime = { val: 0, date: '--/--/----' };
    let prCal = { val: 0, date: '--/--/----' };

    processedSwims.forEach(s => {
      // 1. Quãng đường max
      if (s.distance > prDist.val) {
        prDist.val = s.distance;
        prDist.date = formatDateVN(s.date);
      }
      // 2. Pace tốt nhất (paceSec nhỏ nhất và phải > 30s để tránh dữ liệu lỗi)
      if (s.paceSec > 30 && s.paceSec < prPace.val) {
        prPace.val = s.paceSec;
        prPace.date = formatDateVN(s.date);
      }
      // 3. SWOLF tốt nhất (nhỏ nhất và > 5)
      if (s.swolf > 5 && s.swolf < prSwolf.val) {
        prSwolf.val = s.swolf;
        prSwolf.date = formatDateVN(s.date);
      }
      // 4. Thời gian lâu nhất
      if (s.timeSec > prTime.val) {
        prTime.val = s.timeSec;
        prTime.date = formatDateVN(s.date);
      }
      // 5. Calo tiêu thụ nhiều nhất
      if (s.calories > prCal.val) {
        prCal.val = s.calories;
        prCal.date = formatDateVN(s.date);
      }
    });

    // Render to DOM
    document.getElementById("pr-dist").innerText = prDist.val > 0 ? `${prDist.val.toLocaleString('vi-VN')} m` : "--";
    document.getElementById("pr-dist-date").innerText = prDist.date;
    
    document.getElementById("pr-pace").innerText = prPace.val !== Infinity ? paceSecToPaceString(prPace.val) : "--";
    document.getElementById("pr-pace-date").innerText = prPace.date;

    document.getElementById("pr-swolf").innerText = prSwolf.val !== Infinity ? prSwolf.val : "--";
    document.getElementById("pr-swolf-date").innerText = prSwolf.date;

    if (prTime.val > 0) {
      const h = Math.floor(prTime.val / 3600);
      const m = Math.floor((prTime.val % 3600) / 60);
      const s = Math.round(prTime.val % 60);
      const timeStr = h > 0 ? `${h}h ${m}m` : `${m}:${s < 10 ? '0' : ''}${s}`;
      document.getElementById("pr-time").innerText = timeStr;
    } else {
      document.getElementById("pr-time").innerText = "--";
    }
    document.getElementById("pr-time-date").innerText = prTime.date;

    document.getElementById("pr-cal").innerText = prCal.val > 0 ? `${prCal.val} kcal` : "--";
    document.getElementById("pr-cal-date").innerText = prCal.date;
  }

  function formatDateVN(dateStr) {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  }

  // --- Dynamic AI Advice based on Data ---
  function generateTechnicalAdvice() {
    let swolfSum = 0;
    let swolfCount = 0;
    let totalDist = 0;

    processedSwims.forEach(s => {
      totalDist += s.distance;
      if (s.swolf > 0) {
        swolfSum += s.swolf * s.distance;
        swolfCount += s.distance;
      }
    });

    const avgSwolf = swolfCount > 0 ? swolfSum / swolfCount : 0;
    let advice = "";

    if (avgSwolf === 0) {
      advice = "Chưa tìm thấy dữ liệu kỹ thuật SWOLF. Hãy đảm bảo đồng hồ Garmin của bạn ghi nhận số quạt tay khi bơi trong bể bơi.";
      document.getElementById("advice-text").innerHTML = advice;
      return;
    }

    // 1. General SWOLF evaluation
    let rating = "";
    let generalTip = "";
    if (avgSwolf < 35) {
      rating = "Elite (Xuất sắc)";
      generalTip = "Bạn có khả năng lướt nước tuyệt vời và lực cản cơ thể cực thấp. Hãy thử thách bằng các bài tập tăng tần số quạt tay mà vẫn giữ nguyên chiều dài sải tay.";
    } else if (avgSwolf <= 42) {
      rating = "Tốt (Good)";
      generalTip = "Kỹ thuật của bạn rất tốt. Nên tập trung thêm vào tư thế giữ đầu ổn định và xoay hông đồng bộ để tối ưu thêm sải tay.";
    } else if (avgSwolf <= 50) {
      rating = "Trung bình (Average)";
      generalTip = "Cơ thể bạn đang bị trượt nước (quạt nước nhiều lần nhưng đi được ít). Hãy tập trung tập kéo phao chân (Pull Buoy) và bài tập Catch-up để kéo dài sải tay.";
    } else {
      rating = "Cần cải thiện (Needs Focus)";
      generalTip = "Bạn đang phải chiến đấu với nước. Hãy tập bơi chậm, hạ thấp đầu, nổi phần mông và bơi lướt nhẹ nhàng trước khi bơi nhanh.";
    }

    // 2. Efficiency Threshold Analysis (Pace vs SWOLF)
    const brackets = {
      fast: { name: 'Nhanh (<2:15)', secondsMax: 135, swolfSum: 0, count: 0 },
      medFast: { name: 'TB-Nhanh (2:15-2:45)', secondsMin: 135, secondsMax: 165, swolfSum: 0, count: 0 },
      med: { name: 'TB-Chậm (2:45-3:15)', secondsMin: 165, secondsMax: 195, swolfSum: 0, count: 0 },
      easy: { name: 'Thả lỏng (>=3:15)', secondsMin: 195, swolfSum: 0, count: 0 }
    };

    processedSwims.forEach(s => {
      if (s.swolf <= 0 || s.paceSec <= 0) return;
      if (s.paceSec < brackets.fast.secondsMax) {
        brackets.fast.swolfSum += s.swolf;
        brackets.fast.count++;
      } else if (s.paceSec >= brackets.medFast.secondsMin && s.paceSec < brackets.medFast.secondsMax) {
        brackets.medFast.swolfSum += s.swolf;
        brackets.medFast.count++;
      } else if (s.paceSec >= brackets.med.secondsMin && s.paceSec < brackets.med.secondsMax) {
        brackets.med.swolfSum += s.swolf;
        brackets.med.count++;
      } else {
        brackets.easy.swolfSum += s.swolf;
        brackets.easy.count++;
      }
    });

    let bestBracket = null;
    let worstBracket = null;
    let bestSwolf = Infinity;
    let worstSwolf = 0;

    Object.keys(brackets).forEach(key => {
      const b = brackets[key];
      if (b.count > 0) {
        const avg = b.swolfSum / b.count;
        if (avg < bestSwolf) {
          bestSwolf = avg;
          bestBracket = b.name;
        }
        if (avg > worstSwolf) {
          worstSwolf = avg;
          worstBracket = b.name;
        }
      }
    });

    let thresholdInsight = "";
    if (bestBracket && worstBracket && bestBracket !== worstBracket) {
      thresholdInsight = `<br><br>🎯 <strong>Ngưỡng hiệu quả:</strong> Bạn đạt hiệu suất kỹ thuật tốt nhất (SWOLF thấp nhất: <strong>${Math.round(bestSwolf)}</strong>) ở dải tốc độ <strong>${bestBracket}</strong>. 
      Kỹ thuật của bạn bị ảnh hưởng nhiều nhất ở dải tốc độ <strong>${worstBracket}</strong> (SWOLF cao nhất: <strong>${Math.round(worstSwolf)}</strong>).`;
    }

    advice = `<strong>Kỹ thuật chung: ${rating} (SWOLF TB: ${Math.round(avgSwolf)})</strong>
    <br>${generalTip}
    ${thresholdInsight}`;

    document.getElementById("advice-text").innerHTML = advice;
  }

  // ==========================================================================
  // APEXCHARTS RENDERING
  // ==========================================================================
  function destroyCharts() {
    Object.keys(charts).forEach(key => {
      if (charts[key]) {
        charts[key].destroy();
        charts[key] = null;
      }
    });
  }

  function renderCharts() {
    destroyCharts();

    // Prepare chronological data for trends (older to newer)
    const chronologicalSwims = [...processedSwims].reverse();
    const dates = chronologicalSwims.map(s => formatDateVN(s.date));
    const distances = chronologicalSwims.map(s => s.distance);
    const paces = chronologicalSwims.map(s => s.paceSec);
    const swolfs = chronologicalSwims.map(s => s.swolf);
    const avgHrs = chronologicalSwims.map(s => s.avgHr);
    const maxHrs = chronologicalSwims.map(s => s.maxHr);

    // --- Chart 1: Swimming Volume (Column Chart) ---
    const volumeOptions = {
      series: [{
        name: 'Quãng đường (m)',
        data: distances
      }],
      chart: {
        type: 'bar',
        height: '100%',
        background: 'transparent',
        toolbar: { show: false },
        foreColor: '#9ca3af'
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '45%',
          distributed: false
        }
      },
      colors: ['#00f2fe'],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'vertical',
          shadeIntensity: 0.5,
          gradientToColors: ['#7f00ff'],
          inverseColors: false,
          opacityFrom: 0.85,
          opacityTo: 0.5,
          stops: [0, 100]
        }
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        strokeDashArray: 4,
        yaxis: { lines: { show: true } }
      },
      xaxis: {
        categories: dates,
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        title: { text: 'Mét (m)' },
        labels: {
          formatter: function (val) { return val.toLocaleString('vi-VN') + 'm'; }
        }
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: function (val) { return val.toLocaleString('vi-VN') + ' m'; }
        }
      }
    };
    charts.volume = new ApexCharts(document.querySelector("#volume-chart"), volumeOptions);
    charts.volume.render();

    // --- Chart 2: Pace & SWOLF Progression (Dual Y-Axis Line Chart) ---
    // Note: Pace is represented in seconds. Lower seconds = faster.
    // We reverse the Pace Y-axis so faster pace is drawn HIGHER on the chart.
    const paceSwolfOptions = {
      series: [
        {
          name: 'Pace (giây/100m)',
          type: 'area',
          data: paces
        },
        {
          name: 'Chỉ số SWOLF',
          type: 'line',
          data: swolfs
        }
      ],
      chart: {
        height: '100%',
        type: 'line',
        background: 'transparent',
        toolbar: { show: false },
        foreColor: '#9ca3af'
      },
      stroke: {
        width: [3, 4],
        curve: 'smooth'
      },
      colors: ['#00f2fe', '#00ff87'],
      fill: {
        type: ['gradient', 'solid'],
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        strokeDashArray: 4
      },
      xaxis: {
        categories: dates,
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: [
        {
          title: { text: 'Tốc độ (Pace/100m)' },
          reversed: true, // Lower is faster -> Draw at the top
          labels: {
            formatter: function (val) { return paceSecToPaceString(val); }
          }
        },
        {
          opposite: true,
          title: { text: 'Chỉ số SWOLF (càng thấp càng tốt)' },
          labels: {
            formatter: function (val) { return Math.round(val); }
          }
        }
      ],
      tooltip: {
        theme: 'dark',
        shared: true,
        intersect: false,
        y: [
          {
            formatter: function (val) { return paceSecToPaceString(val) + " /100m"; }
          },
          {
            formatter: function (val) { return val ? Math.round(val) : '--'; }
          }
        ]
      }
    };
    charts.paceSwolf = new ApexCharts(document.querySelector("#pace-swolf-chart"), paceSwolfOptions);
    charts.paceSwolf.render();

    // --- Chart 3: Heart Rate Zones & Aerobic Effect (Area Chart) ---
    const hrOptions = {
      series: [
        {
          name: 'Nhịp tim cao nhất',
          data: maxHrs
        },
        {
          name: 'Nhịp tim trung bình',
          data: avgHrs
        }
      ],
      chart: {
        type: 'area',
        height: '100%',
        background: 'transparent',
        toolbar: { show: false },
        foreColor: '#9ca3af'
      },
      stroke: {
        width: 2,
        curve: 'straight'
      },
      colors: ['#ff007f', '#7f00ff'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.5,
          opacityFrom: 0.25,
          opacityTo: 0.02,
          stops: [0, 95, 100]
        }
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        strokeDashArray: 4
      },
      xaxis: {
        categories: dates,
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        title: { text: 'Nhịp tim (bpm)' },
        min: 80,
        max: 200
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: function (val) { return val ? val + " bpm" : '--'; }
        }
      }
    };
    charts.heartRate = new ApexCharts(document.querySelector("#heart-rate-chart"), hrOptions);
    charts.heartRate.render();

    // --- Chart 4: Pool vs Open Water Distribution (Donut Chart) ---
    // Count activities in categories
    let poolCount = 0;
    let owCount = 0;
    processedSwims.forEach(s => {
      if (s.type === 'Open Water') owCount++;
      else poolCount++;
    });

    const locationOptions = {
      series: [poolCount, owCount],
      labels: ['Bể bơi (Pool)', 'Tự nhiên (Open Water)'],
      chart: {
        type: 'donut',
        height: 230,
        background: 'transparent',
        foreColor: '#9ca3af'
      },
      colors: ['#00f2fe', '#7f00ff'],
      stroke: { show: false },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            background: 'transparent',
            labels: {
              show: true,
              name: { show: true, fontSize: '12px', fontFamily: 'Plus Jakarta Sans', color: '#9ca3af', offsetY: -5 },
              value: { show: true, fontSize: '18px', fontFamily: 'Outfit', fontWeight: 800, color: '#f3f4f6', offsetY: 5 },
              total: {
                show: true,
                label: 'Tổng buổi',
                fontSize: '11px',
                color: '#6b7280',
                formatter: function (w) {
                  return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                }
              }
            }
          }
        }
      },
      legend: {
        position: 'bottom',
        fontSize: '11px',
        fontFamily: 'Plus Jakarta Sans',
        labels: { colors: '#9ca3af' },
        markers: { radius: 10 }
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: function (val) { return val + " buổi"; }
        }
      }
    };
    charts.location = new ApexCharts(document.querySelector("#location-chart"), locationOptions);
    charts.location.render();

    // --- Chart 5: DPS vs Stroke Rate Correlation ---
    const dps = chronologicalSwims.map(s => s.dps);
    const strokeRates = chronologicalSwims.map(s => s.avgStrokes);

    const dpsRateOptions = {
      series: [
        {
          name: 'Tần số quạt tay (strokes/phút)',
          type: 'line',
          data: strokeRates
        },
        {
          name: 'Khoảng cách mỗi sải (DPS - m/sải)',
          type: 'area',
          data: dps
        }
      ],
      chart: {
        height: '100%',
        type: 'line',
        background: 'transparent',
        toolbar: { show: false },
        foreColor: '#9ca3af'
      },
      stroke: {
        width: [3, 2],
        curve: 'smooth'
      },
      colors: ['#7f00ff', '#00f2fe'],
      fill: {
        type: ['solid', 'gradient'],
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.25,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        strokeDashArray: 4
      },
      xaxis: {
        categories: dates,
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: [
        {
          title: { text: 'Tần số quạt tay (quạt/phút)' },
          labels: {
            formatter: function (val) { return Math.round(val); }
          }
        },
        {
          opposite: true,
          title: { text: 'Chiều dài sải tay (m/sải)' },
          labels: {
            formatter: function (val) { return val ? val.toFixed(2) + 'm' : '0m'; }
          }
        }
      ],
      tooltip: {
        theme: 'dark',
        shared: true,
        intersect: false,
        y: [
          {
            formatter: function (val) { return val ? Math.round(val) + " strokes/min" : '--'; }
          },
          {
            formatter: function (val) { return val ? val.toFixed(2) + " m/stroke" : '--'; }
          }
        ]
      }
    };
    charts.dpsRate = new ApexCharts(document.querySelector("#dps-rate-chart"), dpsRateOptions);
    charts.dpsRate.render();

    // --- Chart 6: Pace vs SWOLF Correlation (Efficiency Threshold) ---
    const brackets = {
      fast: { name: 'Nhanh (<2:15)', secondsMax: 135, swolfSum: 0, count: 0 },
      medFast: { name: 'TB-Nhanh (2:15-2:45)', secondsMin: 135, secondsMax: 165, swolfSum: 0, count: 0 },
      med: { name: 'TB-Chậm (2:45-3:15)', secondsMin: 165, secondsMax: 195, swolfSum: 0, count: 0 },
      easy: { name: 'Thả lỏng (>=3:15)', secondsMin: 195, swolfSum: 0, count: 0 }
    };

    processedSwims.forEach(s => {
      if (s.swolf <= 0 || s.paceSec <= 0) return;
      if (s.paceSec < brackets.fast.secondsMax) {
        brackets.fast.swolfSum += s.swolf;
        brackets.fast.count++;
      } else if (s.paceSec >= brackets.medFast.secondsMin && s.paceSec < brackets.medFast.secondsMax) {
        brackets.medFast.swolfSum += s.swolf;
        brackets.medFast.count++;
      } else if (s.paceSec >= brackets.med.secondsMin && s.paceSec < brackets.med.secondsMax) {
        brackets.med.swolfSum += s.swolf;
        brackets.med.count++;
      } else {
        brackets.easy.swolfSum += s.swolf;
        brackets.easy.count++;
      }
    });

    const corrX = [];
    const corrY = [];
    Object.keys(brackets).forEach(key => {
      const b = brackets[key];
      corrX.push(b.name);
      corrY.push(b.count > 0 ? parseFloat((b.swolfSum / b.count).toFixed(1)) : 0);
    });

    const corrOptions = {
      series: [{
        name: 'SWOLF trung bình',
        data: corrY
      }],
      chart: {
        type: 'bar',
        height: '100%',
        background: 'transparent',
        toolbar: { show: false },
        foreColor: '#9ca3af'
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '40%',
          distributed: true
        }
      },
      colors: ['#ff007f', '#7f00ff', '#00f2fe', '#00ff87'],
      dataLabels: {
        enabled: true,
        formatter: function (val) { return val > 0 ? val : ''; },
        style: { colors: ['#f3f4f6'] }
      },
      grid: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        strokeDashArray: 4
      },
      xaxis: {
        categories: corrX,
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        title: { text: 'SWOLF (Càng thấp = Càng hiệu quả)' }
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: function (val) { return val > 0 ? val + " SWOLF" : 'Chưa có dữ liệu'; }
        }
      }
    };
    charts.paceSwolfCorr = new ApexCharts(document.querySelector("#pace-swolf-corr-chart"), corrOptions);
    charts.paceSwolfCorr.render();
  }

  // ==========================================================================
  // TABLE RENDERING & FILTERING
  // ==========================================================================

  function getFilteredSwims() {
    const q = searchInput.value.toLowerCase().trim();
    if (!q) return processedSwims;
    return processedSwims.filter(s => s.title.toLowerCase().includes(q));
  }

  function renderTable() {
    let filtered = getFilteredSwims();

    // Update count display
    rowCount.innerText = `Hiển thị ${filtered.length} hoạt động`;

    // Sort
    sortData(filtered);

    // Paginate
    const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    pageInfo.innerText = `Trang ${currentPage} / ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;

    const startIdx = (currentPage - 1) * rowsPerPage;
    const paginated = filtered.slice(startIdx, startIdx + rowsPerPage);

    // Empty state for table
    if (paginated.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dark); padding: 30px;">Không tìm thấy hoạt động nào phù hợp.</td></tr>`;
      return;
    }

    // Build Rows
    tableBody.innerHTML = paginated.map(s => {
      const typeBadge = s.type === 'Open Water' 
        ? `<span class="badge badge-ow">Nước mở</span>`
        : `<span class="badge badge-pool">Bể bơi</span>`;

      // SWOLF color formatting
      let swolfClass = "cell-swolf";
      if (s.swolf > 0) {
        if (s.swolf < 35) swolfClass += " swolf-excellent";
        else if (s.swolf <= 42) swolfClass += " swolf-good";
        else if (s.swolf <= 50) swolfClass += " swolf-average";
        else swolfClass += " swolf-poor";
      }

      const formattedPace = s.paceStr || "--";
      const formattedSwolf = s.swolf > 0 ? s.swolf : "--";
      const formattedHr = s.avgHr > 0 ? `${s.avgHr} bpm` : "--";
      const formattedStrokes = s.avgStrokes > 0 ? Math.round(s.avgStrokes) : "--";

      return `
        <tr>
          <td style="white-space: nowrap;">
            <div style="font-weight: 600;">${formatDateVN(s.date)}</div>
            <div style="font-size: 11px; color: var(--text-dark);">${s.dateTime.split(' ')[1] || ''}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-main);">${s.title}</div>
            <div style="margin-top: 3px;">${typeBadge}</div>
          </td>
          <td style="font-family: var(--font-display); font-weight: 700; font-size: 15px;">
            ${s.distance.toLocaleString('vi-VN')}
          </td>
          <td>${s.timeStr}</td>
          <td style="font-family: var(--font-display); font-weight: 600; color: var(--primary);">
            ${formattedPace}
          </td>
          <td class="${swolfClass}">${formattedSwolf}</td>
          <td>
            <div>${formattedHr}</div>
            <div style="font-size: 10px; color: var(--text-dark);">Tối đa: ${s.maxHr > 0 ? s.maxHr : '--'}</div>
          </td>
          <td>${formattedStrokes}</td>
        </tr>
      `;
    }).join('');
  }

  function sortData(arr) {
    const col = currentSort.column;
    const dir = currentSort.direction === 'asc' ? 1 : -1;

    arr.sort((a, b) => {
      let valA = a[col];
      let valB = b[col];

      if (col === 'date') {
        valA = new Date(a.dateTime);
        valB = new Date(b.dateTime);
      }

      if (valA === undefined || valA === null) return 1 * dir;
      if (valB === undefined || valB === null) return -1 * dir;

      if (typeof valA === 'string') {
        return valA.localeCompare(valB) * dir;
      } else {
        return (valA - valB) * dir;
      }
    });
  }

  function updateSortIcons() {
    headers.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) {
        // Find existing icon placeholder or remove current icon
        let label = el.innerText.trim();
        // Clear all sort icon classes from standard columns
        let iconHtml = '<i data-lucide="chevrons-up-down" style="display:inline; width:13px; height:13px; margin-left:4px; vertical-align:middle;"></i>';
        
        if (currentSort.column === h.col) {
          if (currentSort.direction === 'asc') {
            iconHtml = '<i data-lucide="arrow-up-narrow-wide" style="display:inline; width:13px; height:13px; margin-left:4px; vertical-align:middle; color:var(--primary);"></i>';
          } else {
            iconHtml = '<i data-lucide="arrow-down-narrow-wide" style="display:inline; width:13px; height:13px; margin-left:4px; vertical-align:middle; color:var(--primary);"></i>';
          }
        }
        
        // Remove icon markup to extract clean text
        const cleanText = el.textContent.trim().split(" ")[0];
        el.innerHTML = `${cleanText} ${iconHtml}`;
      }
    });
    // Create new Lucide icons inside table headers
    lucide.createIcons();
  }

  function getMockFitJson() {
    const start = new Date(Date.now() - 24 * 3600 * 1000);
    const sessionRecord = {
      type: 'session',
      data: {
        total_distance: 1500,
        total_timer_time: 2110000,
        total_elapsed_time: 2110000,
        avg_swolf: 38,
        total_cycles: 930,
        pool_length: 2500,
        start_time: start.toISOString()
      }
    };
    
    const records = [sessionRecord];
    const strokeTypes = ['freestyle', 'freestyle', 'freestyle', 'freestyle', 'breaststroke', 'breaststroke', 'freestyle', 'freestyle'];
    
    // Generate 60 lengths of 25m
    for (let i = 0; i < 60; i++) {
      const baseTime = 19 + Math.floor(i / 15) * 1.5;
      const randomTime = Math.random() * 2 - 1;
      const duration = parseFloat((baseTime + randomTime).toFixed(1));
      
      const strokes = 14 + (i % 3 === 0 ? 1 : 0) + (i > 40 ? 1 : 0);
      const strokeType = i < 10 ? 'freestyle' : strokeTypes[i % strokeTypes.length];
      
      records.push({
        type: 'length',
        data: {
          total_elapsed_time: duration * 1000,
          total_timer_time: duration * 1000,
          total_strokes: strokes,
          swim_stroke: strokeType,
          length_type: 'active',
          swolf_score: Math.round(duration + strokes)
        }
      });
    }

    return {
      records
    };
  }

  // ==========================================================================
  // FALLBACK MOCK DATA GENERATOR (For offline browser viewing)
  // ==========================================================================
  function getFallbackMockCSV() {
    return `Activity Type,Date,Favorite,Title,Distance,Calories,Time,Avg HR,Max HR,Aerobic TE,Avg Speed,Max Speed,Avg Pace,Best Pace,Avg Stroke Rate,Max Stroke Rate,Avg Stride Length,Avg SWOLF,Best SWOLF,Total Strokes,Avg Temp,Min Temp,Max Temp,Avg Power,Max Power,Normalized Power,TSS,Min Elevation,Max Elevation,Total Ascent,Total Descent,Moving Time,Elapsed Time
Lap Swimming,2026-08-05 07:15:00,false,Morning Swim 1500m,"1,500",480,00:35:12,135,155,2.5,0.71,0.92,"2:21","1:55",28,35,1.25,38,32,490,28.0,28.0,28.0,,,,,,,,00:34:10,00:38:00
Lap Swimming,2026-08-03 18:30:00,false,Evening Recovery Swim,"1,000",320,00:25:05,128,142,2.0,0.66,0.85,"2:31","2:10",25,30,1.20,42,38,350,29.0,29.0,29.0,,,,,,,,00:24:20,00:27:00
Lap Swimming,2026-07-31 06:45:00,false,Interval Swim 2000m,"2,000",650,00:45:20,142,168,3.2,0.74,1.05,"2:16","1:42",30,42,1.30,36,30,620,28.0,28.0,28.0,,,,,,,,00:43:10,00:48:30
Lap Swimming,2026-07-28 07:00:00,false,Tuesday Technique Drill,"1,250",410,00:32:45,130,148,2.2,0.64,0.80,"2:37","2:12",24,31,1.18,44,39,410,28.0,28.0,28.0,,,,,,,,00:31:00,00:34:00
Lap Swimming,2026-07-25 08:00:00,false,Weekend Endurance 2500m,"2,500",820,00:56:40,138,158,3.0,0.73,0.95,"2:16","1:50",29,38,1.28,37,31,790,27.0,27.0,27.0,,,,,,,,00:55:00,00:59:00
Open Water Swimming,2026-07-20 16:30:00,false,Lake Swim,"1,800",580,00:42:15,140,160,2.8,0.71,0.90,"2:21","1:58",27,33,1.22,40,35,580,26.0,26.0,26.0,,,,,,,,00:41:00,00:44:00
Lap Swimming,2026-07-18 07:15:00,false,Saturday Speed Set,"1,600",530,00:36:50,145,172,3.4,0.72,1.10,"2:18","1:35",31,44,1.32,35,28,510,28.0,28.0,28.0,,,,,,,,00:35:30,00:39:00
Lap Swimming,2026-07-15 19:00:00,false,Wednesday Night Swim,"1,200",380,00:29:15,131,146,2.1,0.68,0.88,"2:26","2:02",26,32,1.21,41,36,395,29.0,29.0,29.0,,,,,,,,00:28:10,00:31:30
Lap Swimming,2026-07-12 08:30:00,false,Long Slow Distance 3000m,"3,000",990,01:10:10,133,150,3.1,0.71,0.85,"2:20","2:05",27,31,1.24,39,34,970,27.0,27.0,27.0,,,,,,,,01:08:00,01:12:00
Lap Swimming,2026-07-09 07:00:00,false,Quick 1000m Swim,"1,000",310,00:22:40,132,148,2.0,0.74,0.90,"2:16","1:55",28,34,1.26,37,32,310,28.0,28.0,28.0,,,,,,,,00:21:50,00:24:10`;
  }
});
