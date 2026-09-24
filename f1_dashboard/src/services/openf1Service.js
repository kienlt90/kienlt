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
  let apiKey = null;
  try {
    if (typeof localStorage !== 'undefined') apiKey = localStorage.getItem('openf1_api_key');
  } catch (e) {}

  const headers = {};
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`OpenF1 API error (${response.status}): ${response.statusText}`);
  }
  const data = await response.json();
  const latency = Math.round(performance.now() - startTime);

  // If OpenF1 returns a live restriction notice object
  if (data && data.detail) {
    console.warn(`[OpenF1 Server Notice] ${data.detail}`);
    OpenF1Service.lastRestrictionNotice = data.detail;
  } else {
    OpenF1Service.lastRestrictionNotice = null;
  }

  if (useCache && data && !data.detail) {
    memoryCache.set(url, { timestamp: Date.now(), data, latency });
  }
  return data;
}

export const OpenF1Service = {
  lastRestrictionNotice: null,

  /**
   * Fetch meetings for a given year
   */
  async getMeetings(year = 2026) {
    try {
      const url = `${BASE_URL}/meetings?year=${year}`;
      const data = await fetchJSON(url);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      console.warn('getMeetings fallback:', err.message);
    }
    return getFallbackMeetings(year);
  },

  /**
   * Fetch sessions for a meeting or year
   */
  async getSessions(meetingKey = null, year = 2026) {
    try {
      let url = `${BASE_URL}/sessions?year=${year}`;
      if (meetingKey && meetingKey !== 'latest') {
        url += `&meeting_key=${meetingKey}`;
      }
      const data = await fetchJSON(url);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      console.warn('getSessions fallback:', err.message);
    }
    return getFallbackSessions(meetingKey, year);
  },

  /**
   * Fetch single session details
   */
  async getSession(sessionKey) {
    if (!sessionKey || sessionKey === 'latest') return null;
    try {
      const url = `${BASE_URL}/sessions?session_key=${sessionKey}`;
      const data = await fetchJSON(url);
      if (Array.isArray(data) && data.length > 0) return data[0];
      if (data && !data.detail) return data;
    } catch (err) {}
    return getFallbackSession(sessionKey);
  },

  /**
   * Get latest active or most recent session
   */
  async getLatestSession() {
    try {
      const url = `${BASE_URL}/sessions?session_key=latest`;
      const data = await fetchJSON(url, false);
      if (Array.isArray(data) && data.length > 0) return data[0];
      if (data && !data.detail) return data;
    } catch (err) {}
    return getFallbackSession(11370) || getFallbackSession(11369);
  },

  /**
   * Fetch all drivers in a session
   */
  async getDrivers(sessionKey, useCache = true) {
    try {
      const url = `${BASE_URL}/drivers?session_key=${sessionKey}`;
      const data = await fetchJSON(url, useCache);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (err) {}
    return getFallbackDrivers();
  },

  /**
   * Fetch laps for a session (optionally filter by driver or lap)
   */
  async getLaps(sessionKey, driverNumber = null, lapNumber = null, useCache = true) {
    try {
      let url = `${BASE_URL}/laps?session_key=${sessionKey}`;
      if (driverNumber) url += `&driver_number=${driverNumber}`;
      if (lapNumber) url += `&lap_number=${lapNumber}`;
      const data = await fetchJSON(url, useCache);
      if (Array.isArray(data)) return data;
    } catch (err) {}
    return [];
  },

  /**
   * Fetch intervals (gap and interval)
   */
  async getIntervals(sessionKey, useCache = true) {
    try {
      const url = `${BASE_URL}/intervals?session_key=${sessionKey}`;
      const data = await fetchJSON(url, useCache);
      if (Array.isArray(data)) return data;
    } catch (err) {}
    return [];
  },

  /**
   * Fetch stints (tyre compound and age)
   */
  async getStints(sessionKey, useCache = true) {
    try {
      const url = `${BASE_URL}/stints?session_key=${sessionKey}`;
      const data = await fetchJSON(url, useCache);
      if (Array.isArray(data)) return data;
    } catch (err) {}
    return [];
  },

  /**
   * Fetch positions progression
   */
  async getPositions(sessionKey, useCache = true) {
    try {
      const url = `${BASE_URL}/position?session_key=${sessionKey}`;
      const data = await fetchJSON(url, useCache);
      if (Array.isArray(data)) return data;
    } catch (err) {}
    return [];
  },

  /**
   * Fetch weather data for session
   */
  async getWeather(sessionKey, useCache = true) {
    try {
      const url = `${BASE_URL}/weather?session_key=${sessionKey}`;
      const data = await fetchJSON(url, useCache);
      if (Array.isArray(data)) return data;
    } catch (err) {}
    return [];
  },

  /**
   * Fetch race control messages
   */
  async getRaceControl(sessionKey, useCache = true) {
    try {
      const url = `${BASE_URL}/race_control?session_key=${sessionKey}`;
      const data = await fetchJSON(url, useCache);
      if (Array.isArray(data)) return data;
    } catch (err) {}
    return [];
  },

  /**
   * Fetch car telemetry for a specific driver
   */
  async getCarData(sessionKey, driverNumber) {
    try {
      const url = `${BASE_URL}/car_data?session_key=${sessionKey}&driver_number=${driverNumber}`;
      const data = await fetchJSON(url, false);
      if (Array.isArray(data)) return data;
    } catch (err) {}
    return [];
  },

  /**
   * Combined fetch for complete Live Timing Board
   */
  async getFullLiveTiming(sessionKey, targetLap = null, bypassCache = false) {
    const useCache = !bypassCache;
    const [rawSessionInfo, rawDrivers, rawLaps, rawIntervals, rawStints, rawWeather, rawRaceControl, rawPositions] = await Promise.all([
      this.getSession(sessionKey).catch(() => null),
      this.getDrivers(sessionKey, useCache).catch(() => []),
      this.getLaps(sessionKey, null, null, useCache).catch(() => []),
      this.getIntervals(sessionKey, useCache).catch(() => []),
      this.getStints(sessionKey, useCache).catch(() => []),
      this.getWeather(sessionKey, useCache).catch(() => []),
      this.getRaceControl(sessionKey, useCache).catch(() => []),
      this.getPositions(sessionKey, useCache).catch(() => [])
    ]);

    const sessionInfo = (rawSessionInfo && !rawSessionInfo.detail) ? rawSessionInfo : getFallbackSession(sessionKey);
    const drivers = Array.isArray(rawDrivers) && rawDrivers.length > 0 ? rawDrivers : getFallbackDrivers();
    const laps = Array.isArray(rawLaps) ? rawLaps : [];
    const intervals = Array.isArray(rawIntervals) ? rawIntervals : [];
    const stints = Array.isArray(rawStints) ? rawStints : [];
    const weather = Array.isArray(rawWeather) ? rawWeather : [];
    const raceControl = Array.isArray(rawRaceControl) ? rawRaceControl : [];
    const positions = Array.isArray(rawPositions) ? rawPositions : [];

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
        personalBestLap: Infinity,
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

      driver.personalBestLap = personalBestLap;

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

    // Detect session type (Practice / Qualifying vs Race / Sprint)
    const sessionType = (sessionInfo?.session_type || '').toLowerCase();
    const sessionName = (sessionInfo?.session_name || '').toLowerCase();
    const isTimedSession = sessionType === 'practice' || sessionType === 'qualifying' || sessionName.includes('practice') || sessionName.includes('qualifying') || sessionName.includes('shootout') || sessionName.includes('testing') || sessionName.includes('day');

    let sortedDrivers = [];

    if (isTimedSession) {
      // In Practice & Qualifying, rank drivers by their Personal Best Lap!
      const driversWithTime = Array.from(driverMap.values()).filter(d => d.personalBestLap < Infinity);
      driversWithTime.sort((a, b) => a.personalBestLap - b.personalBestLap);

      const driversWithoutTime = Array.from(driverMap.values()).filter(d => d.personalBestLap === Infinity);
      driversWithoutTime.sort((a, b) => (a.number || 0) - (b.number || 0));

      driversWithTime.forEach((driver, idx) => {
        driver.position = idx + 1;
        if (idx === 0) {
          driver.gap = 'FASTEST';
          driver.interval = '--';
        } else {
          const gapVal = driver.personalBestLap - sessionFastestLap;
          const prevDriver = driversWithTime[idx - 1];
          const intVal = driver.personalBestLap - prevDriver.personalBestLap;
          driver.gap = `+${gapVal.toFixed(3)}`;
          driver.interval = `+${intVal.toFixed(3)}`;
        }
      });

      driversWithoutTime.forEach((driver, idx) => {
        driver.position = driversWithTime.length + idx + 1;
        driver.gap = 'NO TIME';
        driver.interval = '--';
      });

      sortedDrivers = [...driversWithTime, ...driversWithoutTime];
    } else {
      // In Race & Sprint, compute target timestamp for filtering positions and intervals to match activeLap
      let targetTimestamp = null;
      if (targetLap && maxLapInSession > 0) {
        const activeLapDates = laps
          .filter(l => l.lap_number === targetLap && l.date_start)
          .map(l => new Date(l.date_start).getTime());
        
        if (activeLapDates.length > 0) {
          targetTimestamp = Math.max(...activeLapDates) + 100000;
        }
      }

      // Filter positions and intervals by targetTimestamp
      const validPositions = (targetTimestamp && positions)
        ? positions.filter(p => !p.date || new Date(p.date).getTime() <= targetTimestamp)
        : (positions || []);

      const validIntervals = (targetTimestamp && intervals)
        ? intervals.filter(i => !i.date || new Date(i.date).getTime() <= targetTimestamp)
        : (intervals || []);

      // Attach latest positions
      if (validPositions.length > 0) {
        const driverLatestPos = new Map();
        validPositions.forEach(p => {
          driverLatestPos.set(p.driver_number, p.position);
        });
        driverLatestPos.forEach((pos, driverNum) => {
          const driver = driverMap.get(driverNum);
          if (driver) driver.position = pos;
        });
      }

      // Attach latest intervals
      if (validIntervals.length > 0) {
        const driverLatestInterval = new Map();
        validIntervals.forEach(i => {
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

      sortedDrivers = Array.from(driverMap.values()).sort((a, b) => a.position - b.position);
      sortedDrivers.forEach((d, idx) => {
        if (d.position === 99 || !d.position) {
          d.position = idx + 1;
        }
      });
    }

    // Latest Weather
    const latestWeather = weather.length > 0 ? weather[weather.length - 1] : null;

    // Recent Race Control
    const recentRaceControl = raceControl.slice(-8).reverse();

    return {
      sessionKey,
      sessionInfo,
      sessionType: sessionInfo?.session_type || (isTimedSession ? 'Practice' : 'Race'),
      sessionName: sessionInfo?.session_name || 'Session',
      isTimedSession,
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

// ----------------------------------------------------
// FALLBACK DATASETS (Keeps App 100% functional during OpenF1 Live Lock)
// ----------------------------------------------------
const FALLBACK_MEETINGS_2026 = [
  { meeting_key: 1295, meeting_name: 'Azerbaijan Grand Prix', location: 'Baku', circuit_short_name: 'Baku City Circuit', year: 2026, country_name: 'Azerbaijan', country_code: 'AZE' },
  { meeting_key: 1294, meeting_name: 'Spanish Grand Prix', location: 'Madrid', circuit_short_name: 'Madring', year: 2026, country_name: 'Spain', country_code: 'ESP' },
  { meeting_key: 1293, meeting_name: 'Italian Grand Prix', location: 'Monza', circuit_short_name: 'Monza', year: 2026, country_name: 'Italy', country_code: 'ITA' },
  { meeting_key: 1292, meeting_name: 'Dutch Grand Prix', location: 'Zandvoort', circuit_short_name: 'Zandvoort', year: 2026, country_name: 'Netherlands', country_code: 'NED' },
  { meeting_key: 1291, meeting_name: 'Belgian Grand Prix', location: 'Spa-Francorchamps', circuit_short_name: 'Spa', year: 2026, country_name: 'Belgium', country_code: 'BEL' },
  { meeting_key: 1290, meeting_name: 'Hungarian Grand Prix', location: 'Budapest', circuit_short_name: 'Hungaroring', year: 2026, country_name: 'Hungary', country_code: 'HUN' },
  { meeting_key: 1289, meeting_name: 'British Grand Prix', location: 'Silverstone', circuit_short_name: 'Silverstone', year: 2026, country_name: 'Great Britain', country_code: 'GBR' },
  { meeting_key: 1288, meeting_name: 'Austrian Grand Prix', location: 'Spielberg', circuit_short_name: 'Red Bull Ring', year: 2026, country_name: 'Austria', country_code: 'AUT' },
  { meeting_key: 1287, meeting_name: 'Spanish Grand Prix', location: 'Barcelona', circuit_short_name: 'Catalunya', year: 2026, country_name: 'Spain', country_code: 'ESP' },
  { meeting_key: 1286, meeting_name: 'Monaco Grand Prix', location: 'Monte Carlo', circuit_short_name: 'Monaco', year: 2026, country_name: 'Monaco', country_code: 'MON' },
  { meeting_key: 1285, meeting_name: 'Miami Grand Prix', location: 'Miami Gardens', circuit_short_name: 'Miami', year: 2026, country_name: 'United States', country_code: 'USA' },
  { meeting_key: 1279, meeting_name: 'Australian Grand Prix', location: 'Melbourne', circuit_short_name: 'Albert Park', year: 2026, country_name: 'Australia', country_code: 'AUS' },
  { meeting_key: 1278, meeting_name: 'Bahrain Grand Prix', location: 'Sakhir', circuit_short_name: 'Bahrain', year: 2026, country_name: 'Bahrain', country_code: 'BHR' }
];

const FALLBACK_MEETINGS_2024 = [
  { meeting_key: 1252, meeting_name: 'Abu Dhabi Grand Prix', location: 'Yas Island', circuit_short_name: 'Yas Marina', year: 2024, country_name: 'United Arab Emirates', country_code: 'UAE' },
  { meeting_key: 1251, meeting_name: 'Qatar Grand Prix', location: 'Lusail', circuit_short_name: 'Lusail', year: 2024, country_name: 'Qatar', country_code: 'QAT' },
  { meeting_key: 1250, meeting_name: 'Las Vegas Grand Prix', location: 'Las Vegas', circuit_short_name: 'Las Vegas', year: 2024, country_name: 'United States', country_code: 'USA' },
  { meeting_key: 1249, meeting_name: 'São Paulo Grand Prix', location: 'São Paulo', circuit_short_name: 'Interlagos', year: 2024, country_name: 'Brazil', country_code: 'BRA' },
  { meeting_key: 1248, meeting_name: 'Mexico City Grand Prix', location: 'Mexico City', circuit_short_name: 'Rodriguez', year: 2024, country_name: 'Mexico', country_code: 'MEX' },
  { meeting_key: 1247, meeting_name: 'United States Grand Prix', location: 'Austin', circuit_short_name: 'COTA', year: 2024, country_name: 'United States', country_code: 'USA' },
  { meeting_key: 1246, meeting_name: 'Singapore Grand Prix', location: 'Marina Bay', circuit_short_name: 'Marina Bay', year: 2024, country_name: 'Singapore', country_code: 'SGP' },
  { meeting_key: 1245, meeting_name: 'Azerbaijan Grand Prix', location: 'Baku', circuit_short_name: 'Baku', year: 2024, country_name: 'Azerbaijan', country_code: 'AZE' },
  { meeting_key: 1244, meeting_name: 'Italian Grand Prix', location: 'Monza', circuit_short_name: 'Monza', year: 2024, country_name: 'Italy', country_code: 'ITA' },
  { meeting_key: 1240, meeting_name: 'British Grand Prix', location: 'Silverstone', circuit_short_name: 'Silverstone', year: 2024, country_name: 'Great Britain', country_code: 'GBR' }
];

const FALLBACK_ALL_SESSIONS = [
  // Azerbaijan 2026 (Meeting 1295)
  { session_key: 11370, meeting_key: 1295, session_name: 'Practice 1', session_type: 'Practice', date_start: '2026-09-24T08:30:00+00:00', date_end: '2026-09-24T09:30:00+00:00', year: 2026, meeting_name: 'Azerbaijan Grand Prix', location: 'Baku' },
  { session_key: 11371, meeting_key: 1295, session_name: 'Practice 2', session_type: 'Practice', date_start: '2026-09-24T12:00:00+00:00', date_end: '2026-09-24T13:00:00+00:00', year: 2026, meeting_name: 'Azerbaijan Grand Prix', location: 'Baku' },
  { session_key: 11372, meeting_key: 1295, session_name: 'Practice 3', session_type: 'Practice', date_start: '2026-09-25T08:30:00+00:00', date_end: '2026-09-25T09:30:00+00:00', year: 2026, meeting_name: 'Azerbaijan Grand Prix', location: 'Baku' },
  { session_key: 11373, meeting_key: 1295, session_name: 'Qualifying', session_type: 'Qualifying', date_start: '2026-09-25T12:00:00+00:00', date_end: '2026-09-25T13:00:00+00:00', year: 2026, meeting_name: 'Azerbaijan Grand Prix', location: 'Baku' },
  { session_key: 11377, meeting_key: 1295, session_name: 'Race', session_type: 'Race', date_start: '2026-09-26T11:00:00+00:00', date_end: '2026-09-26T13:00:00+00:00', year: 2026, meeting_name: 'Azerbaijan Grand Prix', location: 'Baku' },

  // Madrid 2026 (Meeting 1294)
  { session_key: 11365, meeting_key: 1294, session_name: 'Practice 1', session_type: 'Practice', date_start: '2026-09-11T11:30:00+00:00', date_end: '2026-09-11T12:30:00+00:00', year: 2026, meeting_name: 'Spanish Grand Prix (Madrid)', location: 'Madrid' },
  { session_key: 11366, meeting_key: 1294, session_name: 'Practice 2', session_type: 'Practice', date_start: '2026-09-11T15:00:00+00:00', date_end: '2026-09-11T16:00:00+00:00', year: 2026, meeting_name: 'Spanish Grand Prix (Madrid)', location: 'Madrid' },
  { session_key: 11367, meeting_key: 1294, session_name: 'Practice 3', session_type: 'Practice', date_start: '2026-09-12T10:30:00+00:00', date_end: '2026-09-12T11:30:00+00:00', year: 2026, meeting_name: 'Spanish Grand Prix (Madrid)', location: 'Madrid' },
  { session_key: 11368, meeting_key: 1294, session_name: 'Qualifying', session_type: 'Qualifying', date_start: '2026-09-12T14:00:00+00:00', date_end: '2026-09-12T15:00:00+00:00', year: 2026, meeting_name: 'Spanish Grand Prix (Madrid)', location: 'Madrid' },
  { session_key: 11369, meeting_key: 1294, session_name: 'Race', session_type: 'Race', date_start: '2026-09-13T13:00:00+00:00', date_end: '2026-09-13T15:00:00+00:00', year: 2026, meeting_name: 'Spanish Grand Prix (Madrid)', location: 'Madrid' },

  // Italian GP 2026 (Meeting 1293)
  { session_key: 11357, meeting_key: 1293, session_name: 'Practice 1', session_type: 'Practice', year: 2026, meeting_name: 'Italian Grand Prix', location: 'Monza' },
  { session_key: 11358, meeting_key: 1293, session_name: 'Practice 2', session_type: 'Practice', year: 2026, meeting_name: 'Italian Grand Prix', location: 'Monza' },
  { session_key: 11359, meeting_key: 1293, session_name: 'Practice 3', session_type: 'Practice', year: 2026, meeting_name: 'Italian Grand Prix', location: 'Monza' },
  { session_key: 11360, meeting_key: 1293, session_name: 'Qualifying', session_type: 'Qualifying', year: 2026, meeting_name: 'Italian Grand Prix', location: 'Monza' },
  { session_key: 11361, meeting_key: 1293, session_name: 'Race', session_type: 'Race', year: 2026, meeting_name: 'Italian Grand Prix', location: 'Monza' },

  // Abu Dhabi 2024 (Meeting 1252)
  { session_key: 9461, meeting_key: 1252, session_name: 'Practice 1', session_type: 'Practice', year: 2024, meeting_name: 'Abu Dhabi Grand Prix', location: 'Yas Island' },
  { session_key: 9656, meeting_key: 1252, session_name: 'Practice 2', session_type: 'Practice', year: 2024, meeting_name: 'Abu Dhabi Grand Prix', location: 'Yas Island' },
  { session_key: 9657, meeting_key: 1252, session_name: 'Practice 3', session_type: 'Practice', year: 2024, meeting_name: 'Abu Dhabi Grand Prix', location: 'Yas Island' },
  { session_key: 9658, meeting_key: 1252, session_name: 'Qualifying', session_type: 'Qualifying', year: 2024, meeting_name: 'Abu Dhabi Grand Prix', location: 'Yas Island' },
  { session_key: 9662, meeting_key: 1252, session_name: 'Race', session_type: 'Race', year: 2024, meeting_name: 'Abu Dhabi Grand Prix', location: 'Yas Island' }
];

const FALLBACK_DRIVERS = [
  { driver_number: 1, full_name: 'Max VERSTAPPEN', broadcast_name: 'M VERSTAPPEN', name_acronym: 'VER', team_name: 'Red Bull Racing', team_colour: '3671C6', country_code: 'NED' },
  { driver_number: 4, full_name: 'Lando NORRIS', broadcast_name: 'L NORRIS', name_acronym: 'NOR', team_name: 'McLaren', team_colour: 'FF8000', country_code: 'GBR' },
  { driver_number: 16, full_name: 'Charles LECLERC', broadcast_name: 'C LECLERC', name_acronym: 'LEC', team_name: 'Ferrari', team_colour: 'E80020', country_code: 'MON' },
  { driver_number: 44, full_name: 'Lewis HAMILTON', broadcast_name: 'L HAMILTON', name_acronym: 'HAM', team_name: 'Ferrari', team_colour: 'E80020', country_code: 'GBR' },
  { driver_number: 81, full_name: 'Oscar PIASTRI', broadcast_name: 'O PIASTRI', name_acronym: 'PIA', team_name: 'McLaren', team_colour: 'FF8000', country_code: 'AUS' },
  { driver_number: 63, full_name: 'George RUSSELL', broadcast_name: 'G RUSSELL', name_acronym: 'RUS', team_name: 'Mercedes', team_colour: '27F4D2', country_code: 'GBR' },
  { driver_number: 12, full_name: 'Kimi ANTONELLI', broadcast_name: 'K ANTONELLI', name_acronym: 'ANT', team_name: 'Mercedes', team_colour: '27F4D2', country_code: 'ITA' },
  { driver_number: 14, full_name: 'Fernando ALONSO', broadcast_name: 'F ALONSO', name_acronym: 'ALO', team_name: 'Aston Martin', team_colour: '229971', country_code: 'ESP' },
  { driver_number: 55, full_name: 'Carlos SAINZ', broadcast_name: 'C SAINZ', name_acronym: 'SAI', team_name: 'Williams', team_colour: '64C4FF', country_code: 'ESP' },
  { driver_number: 23, full_name: 'Alexander ALBON', broadcast_name: 'A ALBON', name_acronym: 'ALB', team_name: 'Williams', team_colour: '64C4FF', country_code: 'THA' },
  { driver_number: 10, full_name: 'Pierre GASLY', broadcast_name: 'P GASLY', name_acronym: 'GAS', team_name: 'Alpine', team_colour: '0093CC', country_code: 'FRA' },
  { driver_number: 7, full_name: 'Jack DOOHAN', broadcast_name: 'J DOOHAN', name_acronym: 'DOO', team_name: 'Alpine', team_colour: '0093CC', country_code: 'AUS' },
  { driver_number: 30, full_name: 'Liam LAWSON', broadcast_name: 'L LAWSON', name_acronym: 'LAW', team_name: 'Red Bull Racing', team_colour: '3671C6', country_code: 'NZL' },
  { driver_number: 22, full_name: 'Yuki TSUNODA', broadcast_name: 'Y TSUNODA', name_acronym: 'TSU', team_name: 'Racing Bulls', team_colour: '6692FF', country_code: 'JPN' },
  { driver_number: 6, full_name: 'Isack HADJAR', broadcast_name: 'I HADJAR', name_acronym: 'HAD', team_name: 'Racing Bulls', team_colour: '6692FF', country_code: 'FRA' },
  { driver_number: 18, full_name: 'Lance STROLL', broadcast_name: 'L STROLL', name_acronym: 'STR', team_name: 'Aston Martin', team_colour: '229971', country_code: 'CAN' },
  { driver_number: 27, full_name: 'Nico HULKENBERG', broadcast_name: 'N HULKENBERG', name_acronym: 'HUL', team_name: 'Kick Sauber', team_colour: '52E252', country_code: 'GER' },
  { driver_number: 5, full_name: 'Gabriel BORTOLETO', broadcast_name: 'G BORTOLETO', name_acronym: 'BOR', team_name: 'Kick Sauber', team_colour: '52E252', country_code: 'BRA' },
  { driver_number: 31, full_name: 'Esteban OCON', broadcast_name: 'E OCON', name_acronym: 'OCO', team_name: 'Haas F1 Team', team_colour: 'B6BABD', country_code: 'FRA' },
  { driver_number: 87, full_name: 'Oliver BEARMAN', broadcast_name: 'O BEARMAN', name_acronym: 'BEA', team_name: 'Haas F1 Team', team_colour: 'B6BABD', country_code: 'GBR' },
  { driver_number: 43, full_name: 'Franco COLAPINTO', broadcast_name: 'F COLAPINTO', name_acronym: 'COL', team_name: 'Cadillac F1 Team', team_colour: 'FFD700', country_code: 'ARG' },
  { driver_number: 77, full_name: 'Valtteri BOTTAS', broadcast_name: 'V BOTTAS', name_acronym: 'BOT', team_name: 'Cadillac F1 Team', team_colour: 'FFD700', country_code: 'FIN' }
];

function getFallbackMeetings(year) {
  if (parseInt(year, 10) === 2024) return FALLBACK_MEETINGS_2024;
  return FALLBACK_MEETINGS_2026;
}

function getFallbackSessions(meetingKey, year) {
  const mKey = meetingKey ? parseInt(meetingKey, 10) : null;
  const y = year ? parseInt(year, 10) : 2026;
  if (mKey) {
    const list = FALLBACK_ALL_SESSIONS.filter(s => s.meeting_key === mKey);
    if (list.length > 0) return list;
  }
  return FALLBACK_ALL_SESSIONS.filter(s => s.year === y);
}

function getFallbackSession(sessionKey) {
  const sKey = sessionKey ? parseInt(sessionKey, 10) : 11370;
  return FALLBACK_ALL_SESSIONS.find(s => s.session_key === sKey) || FALLBACK_ALL_SESSIONS[0];
}

function getFallbackDrivers() {
  return FALLBACK_DRIVERS;
}
