/**
 * Google Sheets & LocalStorage Sync Module (replaces legacy Firebase RTDB)
 * Keeps window.CloudSync API compatible across index.html, main.html, math_game.html, english_game.html
 */

const LS_KEYS = {
  WEB_APP_URL: 'kienlt_sheets_webapp_url',
  KIDS: 'kienlt_kids_list',
  SPINS: 'kienlt_spins_map',
  MATH_SUBS: 'kienlt_math_submissions',
  ENG_SUBS: 'kienlt_english_submissions',
  REWARDS_BY_KID: 'kienlt_rewards_by_kid',
  REWARD_HISTORY: 'kienlt_reward_history'
};

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeLS(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

function getWebAppUrl() {
  try {
    return (localStorage.getItem(LS_KEYS.WEB_APP_URL) || '').trim();
  } catch (e) {
    return '';
  }
}

function setWebAppUrl(url) {
  try {
    const clean = (url || '').trim();
    if (clean) localStorage.setItem(LS_KEYS.WEB_APP_URL, clean);
    else localStorage.removeItem(LS_KEYS.WEB_APP_URL);
    updateCloudStatusBadge(clean ? 'syncing' : 'local');
    return clean;
  } catch (e) {
    return '';
  }
}

function updateCloudStatusBadge(mode, customText) {
  const el = document.getElementById('cloud-sync-status');
  if (!el) return;
  if (mode === 'connected') {
    el.className = 'px-1.5 sm:px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[9px] sm:text-[10px] font-extrabold flex items-center space-x-1 shrink-0';
    el.title = 'Đã kết nối Google Sheets';
    el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span class="hidden sm:inline">${customText || 'Google Sheets'}</span>`;
  } else if (mode === 'syncing') {
    el.className = 'px-1.5 sm:px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full text-[9px] sm:text-[10px] font-extrabold flex items-center space-x-1 shrink-0';
    el.title = 'Đang đồng bộ Google Sheets...';
    el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span><span class="hidden sm:inline">${customText || 'Đang đồng bộ...'}</span>`;
  } else if (mode === 'error') {
    el.className = 'px-1.5 sm:px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[9px] sm:text-[10px] font-extrabold flex items-center space-x-1 shrink-0';
    el.title = 'Không kết nối được Google Sheets (đang lưu tạm trên máy)';
    el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span><span class="hidden sm:inline">${customText || 'Lỗi Sheet (Lưu máy)'}</span>`;
  } else {
    el.className = 'px-1.5 sm:px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[9px] sm:text-[10px] font-extrabold flex items-center space-x-1 shrink-0';
    el.title = 'Chưa dán URL Google Apps Script - Đang lưu trên trình duyệt';
    el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span class="hidden sm:inline">${customText || 'Lưu trên máy'}</span>`;
  }
}

async function gasGet(action, params = {}) {
  const url = getWebAppUrl();
  if (!url) return { ok: false, skipped: true, error: 'Chưa cấu hình URL Web App' };
  try {
    const qs = new URLSearchParams({ action, ...params }).toString();
    const sep = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${sep}${qs}`, { method: 'GET' });
    const data = await res.json();
    if (data && data.ok) updateCloudStatusBadge('connected');
    else updateCloudStatusBadge('error');
    return data;
  } catch (err) {
    console.warn('Google Sheets GET error:', err);
    updateCloudStatusBadge('error');
    return { ok: false, error: String(err) };
  }
}

async function gasPost(payload) {
  const url = getWebAppUrl();
  if (!url) {
    updateCloudStatusBadge('local');
    return { ok: false, skipped: true };
  }
  try {
    updateCloudStatusBadge('syncing');
    // Use text/plain to avoid CORS preflight with Google Apps Script
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data && data.ok) {
      updateCloudStatusBadge('connected');
      return { ok: true, data };
    }
    updateCloudStatusBadge('error');
    return { ok: false, error: (data && data.error) || 'Unknown error' };
  } catch (err) {
    console.warn('Google Sheets POST error:', err);
    updateCloudStatusBadge('error');
    return { ok: false, error: String(err) };
  }
}

let _sheetsCachePromise = null;
let _sheetsCacheData = null;

async function fetchAllFromSheets(force = false) {
  const url = getWebAppUrl();
  if (!url) {
    updateCloudStatusBadge('local');
    return null;
  }
  if (_sheetsCacheData && !force) return _sheetsCacheData;
  if (_sheetsCachePromise && !force) return _sheetsCachePromise;

  updateCloudStatusBadge('syncing');
  _sheetsCachePromise = gasGet('getAll').then((res) => {
    _sheetsCachePromise = null;
    if (res && res.ok) {
      _sheetsCacheData = res;
      if (Array.isArray(res.kids) && res.kids.length > 0) writeLS(LS_KEYS.KIDS, res.kids);
      if (res.spins && Object.keys(res.spins).length > 0) writeLS(LS_KEYS.SPINS, res.spins);
      if (Array.isArray(res.mathSubmissions)) writeLS(LS_KEYS.MATH_SUBS, res.mathSubmissions);
      if (Array.isArray(res.englishSubmissions)) writeLS(LS_KEYS.ENG_SUBS, res.englishSubmissions);
      if (res.rewardsByKid && Object.keys(res.rewardsByKid).length > 0) writeLS(LS_KEYS.REWARDS_BY_KID, res.rewardsByKid);
      if (Array.isArray(res.rewardHistory)) writeLS(LS_KEYS.REWARD_HISTORY, res.rewardHistory);
      return res;
    }
    return null;
  });
  return _sheetsCachePromise;
}

window.CloudSync = {
  getWebAppUrl,
  setWebAppUrl,
  updateCloudStatusBadge,

  async testConnection(testUrl) {
    const prev = getWebAppUrl();
    if (testUrl !== undefined) setWebAppUrl(testUrl);
    const res = await gasGet('ping');
    if ((!res || !res.ok) && testUrl !== undefined && !testUrl) {
      setWebAppUrl(prev);
    }
    return res;
  },

  async syncAllFromSheets() {
    return await fetchAllFromSheets(true);
  },

  getKids(callback) {
    const local = readLS(LS_KEYS.KIDS, []);
    if (local.length > 0 && callback) callback(local);
    fetchAllFromSheets().then((res) => {
      if (res && Array.isArray(res.kids) && res.kids.length > 0) {
        if (callback) callback(res.kids);
      } else if (local.length === 0 && callback) {
        callback([]);
      }
    });
  },

  async saveKids(kids) {
    writeLS(LS_KEYS.KIDS, kids || []);
    return await gasPost({ action: 'saveKids', kids: kids || [] });
  },

  getSubmissions(callback) {
    const local = readLS(LS_KEYS.MATH_SUBS, []);
    if (callback) callback(local);
    fetchAllFromSheets().then((res) => {
      if (res && Array.isArray(res.mathSubmissions) && callback) {
        callback(res.mathSubmissions);
      }
    });
  },

  async saveSubmission(sub) {
    const list = readLS(LS_KEYS.MATH_SUBS, []);
    const idx = list.findIndex((s) => String(s.id) === String(sub.id));
    if (idx !== -1) list[idx] = sub;
    else list.unshift(sub);
    writeLS(LS_KEYS.MATH_SUBS, list);
    return await gasPost({ action: 'upsertSubmission', subject: 'math', submission: sub });
  },

  async clearAllSubmissions() {
    writeLS(LS_KEYS.MATH_SUBS, []);
    return await gasPost({ action: 'clearSubmissions', subject: 'math' });
  },

  getEnglishSubmissions(callback) {
    const local = readLS(LS_KEYS.ENG_SUBS, []);
    if (callback) callback(local);
    fetchAllFromSheets().then((res) => {
      if (res && Array.isArray(res.englishSubmissions) && callback) {
        callback(res.englishSubmissions);
      }
    });
  },

  async saveEnglishSubmission(sub) {
    const list = readLS(LS_KEYS.ENG_SUBS, []);
    const idx = list.findIndex((s) => String(s.id) === String(sub.id));
    if (idx !== -1) list[idx] = sub;
    else list.unshift(sub);
    writeLS(LS_KEYS.ENG_SUBS, list);
    return await gasPost({ action: 'upsertSubmission', subject: 'english', submission: sub });
  },

  async clearAllEnglishSubmissions() {
    writeLS(LS_KEYS.ENG_SUBS, []);
    return await gasPost({ action: 'clearSubmissions', subject: 'english' });
  },

  getSpins(callback) {
    const local = readLS(LS_KEYS.SPINS, null);
    if (local && callback) callback(local);
    fetchAllFromSheets().then((res) => {
      if (res && res.spins && Object.keys(res.spins).length > 0 && callback) {
        callback(res.spins);
      }
    });
  },

  async saveSpins(spinsMap) {
    writeLS(LS_KEYS.SPINS, spinsMap || {});
    return await gasPost({ action: 'saveSpins', spinsMap: spinsMap || {} });
  },

  async setKidSpin(kidId, spins, kidName, grade) {
    const map = readLS(LS_KEYS.SPINS, {});
    map[kidId] = Number(spins) || 0;
    writeLS(LS_KEYS.SPINS, map);
    return await gasPost({
      action: 'setKidSpin',
      kidId,
      spins: Number(spins) || 0,
      kidName: kidName || '',
      grade: grade || 2
    });
  },

  getRewardsByKid(callback) {
    const local = readLS(LS_KEYS.REWARDS_BY_KID, null);
    if (local && callback) callback(local);
    fetchAllFromSheets().then((res) => {
      if (res && res.rewardsByKid && Object.keys(res.rewardsByKid).length > 0 && callback) {
        callback(res.rewardsByKid);
      }
    });
  },

  async saveRewardsByKid(rewardsMapByKid) {
    writeLS(LS_KEYS.REWARDS_BY_KID, rewardsMapByKid || {});
    return await gasPost({ action: 'saveRewardsByKid', rewardsByKid: rewardsMapByKid || {} });
  },

  getRewardHistory(callback) {
    const local = readLS(LS_KEYS.REWARD_HISTORY, []);
    if (callback) callback(local);
    fetchAllFromSheets().then((res) => {
      if (res && Array.isArray(res.rewardHistory) && callback) {
        callback(res.rewardHistory);
      }
    });
  },

  async addRewardHistory(entry) {
    const list = readLS(LS_KEYS.REWARD_HISTORY, []);
    list.unshift(entry);
    writeLS(LS_KEYS.REWARD_HISTORY, list);
    return await gasPost({ action: 'addRewardHistory', entry });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  updateCloudStatusBadge(getWebAppUrl() ? 'syncing' : 'local');
});
