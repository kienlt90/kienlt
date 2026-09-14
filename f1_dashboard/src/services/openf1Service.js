/**
 * OpenF1 API Service
 * Handles data fetching, caching, and processing from https://api.openf1.org
 */

const BASE_URL = 'https://api.openf1.org/v1';

// In-Memory cache to prevent spamming the API and provide fast snappy UX
const memoryCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute for static data

async function fetchJSON(url, useCache = true) {
  if (useCache && memoryCache.has(url)) {
    const cached = memoryCache.get(url);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const startTime = performance.now();
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenF1 API error (${response.status}): ${response.statusText}`);
  }
  const data = await response.json();
  const latency = Math.round(performance.now() - startTime);

  if (useCache) {
    memoryCache.set(url, { timestamp: Date.now(), data, latency });
  }
  return data;
}

export const OpenF1Service = {
  /**
   * Fetch meetings for a given year
   */
  async getMeetings(year = 2026) {
    const url = `${BASE_URL}/meetings?year=${year}`;
    return fetchJSON(url);
  },

  /**
   * Fetch sessions for a meeting or year
   */
  async getSessions(meetingKey = null, year = 2026) {
    let url = `${BASE_URL}/sessions?year=${year}`;
    if (meetingKey) {
      url += `&meeting_key=${meetingKey}`;
    }
    return fetchJSON(url);
  },

  /**
   * Get latest active or most recent session
   */
  async getLatestSession() {
    const url = `${BASE_URL}/sessions?session_key=latest`;
    const data = await fetchJSON(url, false);
    return Array.isArray(data) ? data[0] : data;
  },

  /**
   * Fetch all drivers in a session
   */
  async getDrivers(sessionKey) {
    const url = `${BASE_URL}/drivers?session_key=${sessionKey}`;
    return fetchJSON(url);
  },

  /**
   * Fetch laps for a session (optionally filter by driver or lap)
   */
  async getLaps(sessionKey, driverNumber = null, lapNumber = null) {
    let url = `${BASE_URL}/laps?session_key=${sessionKey}`;
    if (driverNumber) url += `&driver_number=${driverNumber}`;
    if (lapNumber) url += `&lap_number=${lapNumber}`;
    return fetchJSON(url);
  },

  /**
   * Fetch intervals (gap and interval)
   */
  async getIntervals(sessionKey) {
    const url = `${BASE_URL}/intervals?session_key=${sessionKey}`;
    return fetchJSON(url);
  },

  /**
   * Fetch stints (tyre compound and age)
   */
  async getStints(sessionKey) {
    const url = `${BASE_URL}/stints?session_key=${sessionKey}`;
    return fetchJSON(url);
  },

  /**
   * Fetch positions progression
   */
  async getPositions(sessionKey) {
    const url = `${BASE_URL}/position?session_key=${sessionKey}`;
    return fetchJSON(url);
  },

  /**
   * Fetch weather data for session
   */
  async getWeather(sessionKey) {
    const url = `${BASE_URL}/weather?session_key=${sessionKey}`;
    return fetchJSON(url);
  },

  /**
   * Fetch race control messages
   */
  async getRaceControl(sessionKey) {
    const url = `${BASE_URL}/race_control?session_key=${sessionKey}`;
    return fetchJSON(url);
  },

  /**
   * Fetch car telemetry for a specific driver
   */
  async getCarData(sessionKey, driverNumber) {
    const url = `${BASE_URL}/car_data?session_key=${sessionKey}&driver_number=${driverNumber}`;
    return fetchJSON(url, false);
  },

  /**
   * Combined fetch for complete Live Timing Board
   */
  async getFullLiveTiming(sessionKey, targetLap = null) {
    const [drivers, laps, intervals, stints, weather, raceControl, positions] = await Promise.all([
      this.getDrivers(sessionKey).catch(() => []),
      this.getLaps(sessionKey).catch(() => []),
      this.getIntervals(sessionKey).catch(() => []),
      this.getStints(sessionKey).catch(() => []),
      this.getWeather(sessionKey).catch(() => []),
      this.getRaceControl(sessionKey).catch(() => []),
      this.getPositions(sessionKey).catch(() => [])
    ]);

    // Process and merge data per driver
    const driverMap = new Map();
    drivers.forEach(d => {
      driverMap.set(d.driver_number, {
        number: d.driver_number,
        name: d.full_name,
        broadcastName: d.broadcast_name,
        code: d.name_acronym,
        team: d.team_name,
        teamColor: d.team_colour ? `#${d.team_colour}` : '#E10600',
        headshot: d.headshot_url,
        country: d.country_code,
        position: 99,
        gap: '+0.000',
        interval: '+0.000',
        lastLapTime: '--:--',
        bestLapTime: '--:--',
        s1: '--.---',
        s2: '--.---',
        s3: '--.---',
        s1Status: 'normal',
        s2Status: 'normal',
        s3Status: 'normal',
        miniSectors: [],
        compound: 'MEDIUM',
        tyreAge: 1,
        stintNumber: 1,
        pitCount: 0,
        inPit: false,
        speedTrap: '--',
        totalLapsCompleted: 0
      });
    });

    // Determine target lap range or max laps
    let maxLapInSession = 0;
    laps.forEach(l => {
      if (l.lap_number > maxLapInSession) maxLapInSession = l.lap_number;
    });

    const activeLap = targetLap || maxLapInSession || 1;

    // Filter laps up to activeLap
    const validLaps = targetLap ? laps.filter(l => l.lap_number <= targetLap) : laps;

    // Calculate session best sectors and fastest lap
    let sessionBestS1 = Infinity;
    let sessionBestS2 = Infinity;
    let sessionBestS3 = Infinity;
    let sessionFastestLap = Infinity;
    let fastestLapDriver = null;

    validLaps.forEach(l => {
      if (l.duration_sector_1 && l.duration_sector_1 < sessionBestS1) sessionBestS1 = l.duration_sector_1;
      if (l.duration_sector_2 && l.duration_sector_2 < sessionBestS2) sessionBestS2 = l.duration_sector_2;
      if (l.duration_sector_3 && l.duration_sector_3 < sessionBestS3) sessionBestS3 = l.duration_sector_3;
      if (l.lap_duration && l.lap_duration < sessionFastestLap) {
        sessionFastestLap = l.lap_duration;
        fastestLapDriver = l.driver_number;
      }
    });

    // Group laps by driver
    const driverLapsMap = new Map();
    validLaps.forEach(l => {
      if (!driverLapsMap.has(l.driver_number)) {
        driverLapsMap.set(l.driver_number, []);
      }
      driverLapsMap.get(l.driver_number).push(l);
    });

    // Attach lap timing info
    driverLapsMap.forEach((driverLaps, driverNum) => {
      const driver = driverMap.get(driverNum);
      if (!driver) return;

      driver.totalLapsCompleted = driverLaps.length;

      // Find driver personal bests
      let personalBestS1 = Infinity;
      let personalBestS2 = Infinity;
      let personalBestS3 = Infinity;
      let personalBestLap = Infinity;

      driverLaps.forEach(l => {
        if (l.duration_sector_1 && l.duration_sector_1 < personalBestS1) personalBestS1 = l.duration_sector_1;
        if (l.duration_sector_2 && l.duration_sector_2 < personalBestS2) personalBestS2 = l.duration_sector_2;
        if (l.duration_sector_3 && l.duration_sector_3 < personalBestS3) personalBestS3 = l.duration_sector_3;
        if (l.lap_duration && l.lap_duration < personalBestLap) personalBestLap = l.lap_duration;
      });

      // Latest lap
      const latestLap = driverLaps[driverLaps.length - 1];
      if (latestLap) {
        driver.lastLapTime = formatLapTime(latestLap.lap_duration);
        driver.bestLapTime = formatLapTime(personalBestLap);
        driver.isFastestLapHolder = driverNum === fastestLapDriver;

        driver.s1 = latestLap.duration_sector_1 ? latestLap.duration_sector_1.toFixed(3) : '--.---';
        driver.s2 = latestLap.duration_sector_2 ? latestLap.duration_sector_2.toFixed(3) : '--.---';
        driver.s3 = latestLap.duration_sector_3 ? latestLap.duration_sector_3.toFixed(3) : '--.---';

        // Sector status (purple, green, yellow)
        driver.s1Status = latestLap.duration_sector_1 === sessionBestS1 ? 'purple' : (latestLap.duration_sector_1 === personalBestS1 ? 'green' : 'yellow');
        driver.s2Status = latestLap.duration_sector_2 === sessionBestS2 ? 'purple' : (latestLap.duration_sector_2 === personalBestS2 ? 'green' : 'yellow');
        driver.s3Status = latestLap.duration_sector_3 === sessionBestS3 ? 'purple' : (latestLap.duration_sector_3 === personalBestS3 ? 'green' : 'yellow');

        driver.inPit = latestLap.is_pit_out_lap || false;
        driver.speedTrap = latestLap.st_speed ? `${Math.round(latestLap.st_speed)}` : (latestLap.i2_speed ? `${Math.round(latestLap.i2_speed)}` : '--');

        // Parse mini sectors (segments 1, 2, 3)
        const s1Segments = latestLap.segments_sector_1 || [];
        const s2Segments = latestLap.segments_sector_2 || [];
        const s3Segments = latestLap.segments_sector_3 || [];
        const allSegments = [...s1Segments, ...s2Segments, ...s3Segments];
        
        driver.miniSectors = allSegments.map(code => {
          if (code === 2051) return 'purple'; // session fastest
          if (code === 2049) return 'green';  // personal best
          if (code === 2048) return 'yellow'; // normal
          return 'gray';
        });
      }
    });

    // Attach latest stints (Tyres) accurately
    const driverStintsMap = new Map();
    stints.forEach(s => {
      if (!driverStintsMap.has(s.driver_number)) {
        driverStintsMap.set(s.driver_number, []);
      }
      driverStintsMap.get(s.driver_number).push(s);
    });

    driverStintsMap.forEach((driverStints, driverNum) => {
      const driver = driverMap.get(driverNum);
      if (!driver) return;

      // Sort ascending by stint_number or lap_start
      driverStints.sort((a, b) => (a.stint_number || 0) - (b.stint_number || 0));

      // Find active stint for activeLap
      let activeStint = null;
      for (const s of driverStints) {
        if (s.lap_start <= activeLap) {
          activeStint = s;
        }
      }
      if (!activeStint && driverStints.length > 0) {
        activeStint = driverStints[driverStints.length - 1];
      }

      if (activeStint) {
        const rawCompound = (activeStint.compound || 'MEDIUM').toUpperCase();
        driver.compound = rawCompound;
        const ageAtStart = activeStint.tyre_age_at_start || 0;
        const lapsOnCurrentSet = Math.max(1, (activeLap - activeStint.lap_start + 1) + ageAtStart);
        driver.tyreAge = lapsOnCurrentSet;
        driver.stintNumber = activeStint.stint_number || 1;
        driver.pitCount = Math.max(0, (activeStint.stint_number || 1) - 1);
      }
    });

    // Attach latest positions
    if (positions && positions.length > 0) {
      const driverLatestPos = new Map();
      positions.forEach(p => {
        driverLatestPos.set(p.driver_number, p.position);
      });
      driverLatestPos.forEach((pos, driverNum) => {
        const driver = driverMap.get(driverNum);
        if (driver) driver.position = pos;
      });
    }

    // Attach latest intervals
    if (intervals && intervals.length > 0) {
      const driverLatestInterval = new Map();
      intervals.forEach(i => {
        driverLatestInterval.set(i.driver_number, i);
      });
      driverLatestInterval.forEach((data, driverNum) => {
        const driver = driverMap.get(driverNum);
        if (driver) {
          driver.gap = data.gap_to_leader != null ? (typeof data.gap_to_leader === 'number' ? `+${data.gap_to_leader.toFixed(3)}` : data.gap_to_leader) : 'LEADER';
          driver.interval = data.interval != null ? (typeof data.interval === 'number' ? `+${data.interval.toFixed(3)}` : data.interval) : '--';
          if (driver.position === 1) {
            driver.gap = 'LEADER';
            driver.interval = '--';
          }
        }
      });
    }

    // Sort drivers by position
    const sortedDrivers = Array.from(driverMap.values()).sort((a, b) => a.position - b.position);

    // Latest Weather
    const latestWeather = weather.length > 0 ? weather[weather.length - 1] : null;

    // Recent Race Control
    const recentRaceControl = raceControl.slice(-8).reverse();

    return {
      sessionKey,
      maxLap: maxLapInSession,
      activeLap,
      fastestLap: formatLapTime(sessionFastestLap),
      fastestLapHolder: driverMap.get(fastestLapDriver)?.code || null,
      drivers: sortedDrivers,
      weather: latestWeather,
      raceControl: recentRaceControl
    };
  }
};

function formatLapTime(seconds) {
  if (!seconds || seconds === Infinity || isNaN(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
}
