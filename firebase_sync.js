// ===================================================
// FIREBASE REALTIME CLOUD SYNC ENGINE - KIENLT90 PORTAL
// Đồng bộ Dữ liệu Đám Mây Realtime đa thiết bị (Google Firebase)
// ===================================================

const firebaseConfig = {
  apiKey: "AIzaSyApRnH16YUsuAd6EMWEACJ4QY4XteOmSMs",
  authDomain: "math-game-98acc.firebaseapp.com",
  databaseURL: "https://math-game-98acc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "math-game-98acc",
  storageBucket: "math-game-98acc.firebasestorage.app",
  messagingSenderId: "265538011433",
  appId: "1:265538011433:web:c7e228f2d5e94a94b2b738",
  measurementId: "G-DM7Q8YVP04"
};

let db = null;
let isFirebaseReady = false;

try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();
    isFirebaseReady = true;
    console.log("🟢 Firebase Realtime Database initialized successfully!");
  }
} catch (err) {
  console.warn("⚠️ Firebase init warning (Falling back to local storage):", err);
}

const defaultKidsList = [
  { id: 'kid_thoc', name: 'THÓC', grade: 2, username: 'thoc', pin: '1234' },
  { id: 'kid_gau', name: 'Gấu', grade: 5, username: 'Gau', pin: '1234' }
];

const defaultRewardsList = [
  "🍬 10 Viên Kẹo",
  "✏️ 1 Cây Bút Chì Màu",
  "🎮 30 Phút Chơi Game",
  "🍦 1 Cây Kem Ngon",
  "📚 1 Cuốn Truyện Tranh",
  "🎡 +1 Lượt Quay Thưởng",
  "🌟 Huy Hiệu Toán Học",
  "🎡 +2 Lượt Quay Thưởng"
];

window.CloudSync = {
  isOnline() {
    return isFirebaseReady && db !== null;
  },

  // ==========================================
  // 1. KID ACCOUNTS SYNC
  // ==========================================
  getKids(callback) {
    let localKids = defaultKidsList;
    try {
      const stored = localStorage.getItem('kienlt_kid_accounts');
      if (stored) localKids = JSON.parse(stored);
    } catch(e) {}
    if (callback) callback(localKids);

    if (isFirebaseReady && db) {
      db.ref('math_game/kids').on('value', (snap) => {
        const val = snap.val();
        if (val && Array.isArray(val) && val.length > 0) {
          try {
            localStorage.setItem('kienlt_kid_accounts', JSON.stringify(val));
          } catch(e) {}
          if (callback) callback(val);
        } else if (!val) {
          this.saveKids(localKids);
        }
      });
    }
  },

  saveKids(kids) {
    try {
      localStorage.setItem('kienlt_kid_accounts', JSON.stringify(kids));
    } catch(e) {}
    if (isFirebaseReady && db) {
      db.ref('math_game/kids').set(kids).catch(e => console.error("Firebase saveKids error:", e));
    }
  },

  // ==========================================
  // 2. PER-KID SPINS SYNC
  // ==========================================
  getSpins(callback) {
    let localSpins = { 'kid_thoc': 1, 'kid_gau': 1 };
    try {
      const stored = localStorage.getItem('kienlt_kid_spins_map');
      if (stored) localSpins = JSON.parse(stored);
    } catch(e) {}
    if (callback) callback(localSpins);

    if (isFirebaseReady && db) {
      db.ref('math_game/spins').on('value', (snap) => {
        const val = snap.val();
        if (val && typeof val === 'object') {
          try {
            localStorage.setItem('kienlt_kid_spins_map', JSON.stringify(val));
          } catch(e) {}
          if (callback) callback(val);
        } else if (!val) {
          this.saveSpins(localSpins);
        }
      });
    }
  },

  saveSpins(spinsMap) {
    try {
      localStorage.setItem('kienlt_kid_spins_map', JSON.stringify(spinsMap));
    } catch(e) {}
    if (isFirebaseReady && db) {
      db.ref('math_game/spins').set(spinsMap).catch(e => console.error("Firebase saveSpins error:", e));
    }
  },

  setKidSpin(kidId, count) {
    let spinsMap = { 'kid_thoc': 1, 'kid_gau': 1 };
    try {
      const stored = localStorage.getItem('kienlt_kid_spins_map');
      if (stored) spinsMap = JSON.parse(stored);
    } catch(e) {}
    spinsMap[kidId] = Math.max(0, parseInt(count, 10) || 0);
    this.saveSpins(spinsMap);
  },

  // ==========================================
  // 3. SUBMISSIONS & TEACHER REVIEW SYNC
  // ==========================================
  getSubmissions(callback) {
    let localSubs = [];
    try {
      const stored = localStorage.getItem('kienlt_math_submissions');
      if (stored) localSubs = JSON.parse(stored);
    } catch(e) {}
    if (callback) callback(localSubs);

    if (isFirebaseReady && db) {
      db.ref('math_game/submissions').on('value', (snap) => {
        const val = snap.val();
        let list = [];
        if (val) {
          list = Object.values(val).sort((a, b) => (b.id || 0) - (a.id || 0));
        }
        try {
          localStorage.setItem('kienlt_math_submissions', JSON.stringify(list));
        } catch(e) {}
        if (callback) callback(list);
      });
    }
  },

  saveSubmission(submission) {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem('kienlt_math_submissions') || '[]');
    } catch(e) {}
    const existingIdx = list.findIndex(s => s.id === submission.id);
    if (existingIdx >= 0) {
      list[existingIdx] = submission;
    } else {
      list.unshift(submission);
    }
    try {
      localStorage.setItem('kienlt_math_submissions', JSON.stringify(list));
    } catch(e) {}

    if (isFirebaseReady && db) {
      db.ref('math_game/submissions/' + submission.id).set(submission)
        .catch(e => console.error("Firebase saveSubmission error:", e));
    }
  },

  clearAllSubmissions() {
    try {
      localStorage.removeItem('kienlt_math_submissions');
    } catch(e) {}
    if (isFirebaseReady && db) {
      db.ref('math_game/submissions').remove()
        .catch(e => console.error("Firebase clearAllSubmissions error:", e));
    }
  },

  // ==========================================
  // 4. ENGLISH ARENA SUBMISSIONS SYNC
  // ==========================================
  getEnglishSubmissions(callback) {
    let localSubs = [];
    try {
      const stored = localStorage.getItem('kienlt_english_submissions');
      if (stored) localSubs = JSON.parse(stored);
    } catch(e) {}
    if (callback) callback(localSubs);

    if (isFirebaseReady && db) {
      db.ref('english_game/submissions').on('value', (snap) => {
        const val = snap.val();
        let list = [];
        if (val) {
          list = Object.values(val).sort((a, b) => (b.id || 0) - (a.id || 0));
        }
        try {
          localStorage.setItem('kienlt_english_submissions', JSON.stringify(list));
        } catch(e) {}
        if (callback) callback(list);
      });
    }
  },

  saveEnglishSubmission(submission) {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem('kienlt_english_submissions') || '[]');
    } catch(e) {}
    const existingIdx = list.findIndex(s => s.id === submission.id);
    if (existingIdx >= 0) {
      list[existingIdx] = submission;
    } else {
      list.unshift(submission);
    }
    try {
      localStorage.setItem('kienlt_english_submissions', JSON.stringify(list));
    } catch(e) {}

    if (isFirebaseReady && db) {
      db.ref('english_game/submissions/' + submission.id).set(submission)
        .catch(e => console.error("Firebase saveEnglishSubmission error:", e));
    }
  },

  clearAllEnglishSubmissions() {
    try {
      localStorage.removeItem('kienlt_english_submissions');
    } catch(e) {}
    if (isFirebaseReady && db) {
      db.ref('english_game/submissions').remove()
        .catch(e => console.error("Firebase clearAllEnglishSubmissions error:", e));
    }
  },

  // ==========================================
  // 5. REWARDS CATALOG SYNC
  // ==========================================
  getRewards(callback) {
    let localRewards = defaultRewardsList;
    try {
      const stored = localStorage.getItem('kienlt_math_rewards');
      if (stored) localRewards = JSON.parse(stored);
    } catch(e) {}
    if (callback) callback(localRewards);

    if (isFirebaseReady && db) {
      db.ref('math_game/rewards').on('value', (snap) => {
        const val = snap.val();
        if (val && Array.isArray(val) && val.length > 0) {
          try {
            localStorage.setItem('kienlt_math_rewards', JSON.stringify(val));
          } catch(e) {}
          if (callback) callback(val);
        } else if (!val) {
          this.saveRewards(localRewards);
        }
      });
    }
  },

  saveRewards(rewards) {
    try {
      localStorage.setItem('kienlt_math_rewards', JSON.stringify(rewards));
    } catch(e) {}
    if (isFirebaseReady && db) {
      db.ref('math_game/rewards').set(rewards).catch(e => console.error("Firebase saveRewards error:", e));
    }
  }
};
