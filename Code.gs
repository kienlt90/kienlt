/**
 * ============================================================================
 * GOOGLE APPS SCRIPT - BACKEND ĐẤU TRƯỜNG TOÁN HỌC & TIẾNG ANH CHO BÉ
 * ============================================================================
 * Hướng dẫn cài đặt (chỉ làm 1 lần):
 * 1. Tạo 1 Google Sheet mới trên Google Drive của bạn.
 * 2. Vào menu: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa code mặc định, dán toàn bộ file Code.gs này vào và bấm Lưu (Ctrl+S).
 * 4. Bấm Triển khai (Deploy) -> Tùy chọn triển khai mới (New deployment).
 *    - Loại (Type): Ứng dụng web (Web app)
 *    - Thực thi dưới tên (Execute as): Tôi (Me)
 *    - Ai có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 * 5. Bấm Triển khai -> Cấp quyền -> Copy URL Web App (dạng https://script.google.com/macros/s/.../exec).
 * 6. Dán URL đó vào mục "Cài đặt Google Sheets" trong giao diện Phụ huynh/Admin.
 * ============================================================================
 */

const SHEET_NAMES = {
  MATH: 'BaiTap_Toan',
  ENGLISH: 'BaiTap_TiengAnh',
  ACCOUNTS: 'TaiKhoan_LuotQuay',
  REWARD_HISTORY: 'LichSu_Qua',
  REWARDS_CONFIG: 'CauHinh_Qua'
};

const HEADERS = {
  [SHEET_NAMES.MATH]: [
    'ID', 'ThoiGianNop', 'MaBe', 'TenBe', 'KhoiLop', 'Diem',
    'LuotQuayTiemNang', 'DaCongLuot', 'TrangThai', 'ThoiGianLam',
    'LoiPhe', 'DuyetLuc', 'ChiTietJSON'
  ],
  [SHEET_NAMES.ENGLISH]: [
    'ID', 'ThoiGianNop', 'MaBe', 'TenBe', 'KhoiLop', 'Diem',
    'LuotQuayTiemNang', 'DaCongLuot', 'TrangThai', 'ThoiGianLam',
    'LoiPhe', 'DuyetLuc', 'ChiTietJSON'
  ],
  [SHEET_NAMES.ACCOUNTS]: [
    'MaBe', 'TenBe', 'KhoiLop', 'PinHash', 'LuotQuayConLai', 'CapNhatLuc'
  ],
  [SHEET_NAMES.REWARD_HISTORY]: [
    'ID', 'ThoiGian', 'MaBe', 'TenBe', 'MonHoc', 'PhanThuong', 'TrangThai'
  ],
  [SHEET_NAMES.REWARDS_CONFIG]: [
    'MaBe', 'DanhSachQuaJSON', 'CapNhatLuc'
  ]
};

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEADERS).forEach((name) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    const headers = HEADERS[name];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#0f766e')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  });
  return ss;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const ss = ensureSheets_();
    const action = (e && e.parameter && e.parameter.action) || 'ping';

    if (action === 'ping') {
      return jsonResponse_({
        ok: true,
        message: 'Kết nối Google Sheets thành công!',
        sheets: Object.values(SHEET_NAMES),
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getAll') {
      return jsonResponse_({
        ok: true,
        kids: readAccountsAsKids_(ss),
        spins: readAccountsAsSpins_(ss),
        mathSubmissions: readSubmissions_(ss, SHEET_NAMES.MATH),
        englishSubmissions: readSubmissions_(ss, SHEET_NAMES.ENGLISH),
        rewardsByKid: readRewardsByKid_(ss),
        rewardHistory: readRewardHistory_(ss)
      });
    }

    if (action === 'getSubmissions') {
      const subject = (e.parameter && e.parameter.subject) || 'math';
      const sheetName = subject === 'english' ? SHEET_NAMES.ENGLISH : SHEET_NAMES.MATH;
      return jsonResponse_({
        ok: true,
        submissions: readSubmissions_(ss, sheetName)
      });
    }

    return jsonResponse_({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = ensureSheets_();
    const raw = (e && e.postData && e.postData.contents) || '{}';
    const body = JSON.parse(raw);
    const action = body.action;

    if (action === 'upsertSubmission') {
      const sheetName = body.subject === 'english' ? SHEET_NAMES.ENGLISH : SHEET_NAMES.MATH;
      upsertSubmission_(ss, sheetName, body.submission);
      return jsonResponse_({ ok: true });
    }

    if (action === 'clearSubmissions') {
      const sheetName = body.subject === 'english' ? SHEET_NAMES.ENGLISH : SHEET_NAMES.MATH;
      clearSheetData_(ss, sheetName);
      return jsonResponse_({ ok: true });
    }

    if (action === 'saveKids') {
      saveKidsToAccounts_(ss, body.kids || []);
      return jsonResponse_({ ok: true });
    }

    if (action === 'setKidSpin') {
      setKidSpinInAccounts_(ss, body.kidId, body.spins, body.kidName, body.grade);
      return jsonResponse_({ ok: true });
    }

    if (action === 'saveSpins') {
      const spinsMap = body.spinsMap || {};
      Object.keys(spinsMap).forEach((kidId) => {
        setKidSpinInAccounts_(ss, kidId, spinsMap[kidId]);
      });
      return jsonResponse_({ ok: true });
    }

    if (action === 'saveRewardsByKid') {
      saveRewardsByKid_(ss, body.rewardsByKid || {});
      return jsonResponse_({ ok: true });
    }

    if (action === 'addRewardHistory') {
      appendRewardHistory_(ss, body.entry);
      return jsonResponse_({ ok: true });
    }

    return jsonResponse_({ ok: false, error: 'Unknown POST action: ' + action });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function readSubmissions_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).getValues();
  const list = [];
  rows.forEach((r) => {
    if (!r[0]) return;
    let detail = {};
    try {
      if (r[12]) detail = JSON.parse(r[12]);
    } catch (e) {}
    list.push({
      id: Number(r[0]) || r[0],
      createdAt: String(r[1] || ''),
      studentId: String(r[2] || ''),
      kidId: String(r[2] || ''),
      studentName: String(r[3] || ''),
      grade: Number(r[4]) || 2,
      score: Number(r[5]) || 0,
      earnedSpins: Number(r[6]) || 0,
      spinsAwarded: r[7] === true || r[7] === 'TRUE' || r[7] === 'Đã cộng',
      status: String(r[8] || 'pending'),
      timeSpent: String(r[9] || ''),
      teacherNotes: String(r[10] || ''),
      approvedAt: String(r[11] || ''),
      userAnswers: detail.userAnswers || {},
      questions: detail.questions || []
    });
  });
  list.sort((a, b) => Number(b.id) - Number(a.id));
  return list;
}

function upsertSubmission_(ss, sheetName, sub) {
  if (!sub || !sub.id) return;
  const sheet = ss.getSheetByName(sheetName);
  const kidId = sub.studentId || sub.kidId || '';
  const detailJson = JSON.stringify({
    userAnswers: sub.userAnswers || {},
    questions: sub.questions || []
  });
  const rowValues = [
    String(sub.id),
    sub.createdAt || new Date().toLocaleString('vi-VN'),
    kidId,
    sub.studentName || '',
    Number(sub.grade) || 2,
    Number(sub.score) || 0,
    Number(sub.earnedSpins) || 0,
    sub.spinsAwarded ? 'Đã cộng' : 'Chưa cộng',
    sub.status || 'pending',
    sub.timeSpent || '',
    sub.teacherNotes || '',
    sub.approvedAt || '',
    detailJson
  ];

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(sub.id)) {
        sheet.getRange(i + 2, 1, 1, rowValues.length).setValues([rowValues]);
        return;
      }
    }
  }
  sheet.appendRow(rowValues);
}

function clearSheetData_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (sheet && sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
}

function readAccountsAsKids_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  const kids = [];
  rows.forEach((r) => {
    if (!r[0]) return;
    kids.push({
      id: String(r[0]),
      name: String(r[1] || r[0]),
      grade: Number(r[2]) || 2,
      pin: String(r[3] || '')
    });
  });
  return kids;
}

function readAccountsAsSpins_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  if (!sheet || sheet.getLastRow() <= 1) return {};
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  const spins = {};
  rows.forEach((r) => {
    if (!r[0]) return;
    spins[String(r[0])] = Number(r[4]) || 0;
  });
  return spins;
}

function saveKidsToAccounts_(ss, kids) {
  const sheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  const currentSpins = readAccountsAsSpins_(ss);
  const nowStr = new Date().toLocaleString('vi-VN');
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  kids.forEach((k) => {
    const spins = currentSpins[k.id] !== undefined ? currentSpins[k.id] : 1;
    sheet.appendRow([k.id, k.name, Number(k.grade) || 2, k.pin || '', spins, nowStr]);
  });
}

function setKidSpinInAccounts_(ss, kidId, spins, kidName, grade) {
  if (!kidId) return;
  const sheet = ss.getSheetByName(SHEET_NAMES.ACCOUNTS);
  const nowStr = new Date().toLocaleString('vi-VN');
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(kidId)) {
        sheet.getRange(i + 2, 5).setValue(Number(spins) || 0);
        sheet.getRange(i + 2, 6).setValue(nowStr);
        return;
      }
    }
  }
  sheet.appendRow([kidId, kidName || kidId, Number(grade) || 2, '', Number(spins) || 0, nowStr]);
}

function readRewardsByKid_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.REWARDS_CONFIG);
  if (!sheet || sheet.getLastRow() <= 1) return {};
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  const map = {};
  rows.forEach((r) => {
    if (!r[0]) return;
    try {
      map[String(r[0])] = JSON.parse(r[1] || '[]');
    } catch (e) {}
  });
  return map;
}

function saveRewardsByKid_(ss, map) {
  const sheet = ss.getSheetByName(SHEET_NAMES.REWARDS_CONFIG);
  const nowStr = new Date().toLocaleString('vi-VN');
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  Object.keys(map).forEach((kidId) => {
    sheet.appendRow([kidId, JSON.stringify(map[kidId] || []), nowStr]);
  });
}

function readRewardHistory_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.REWARD_HISTORY);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  const list = [];
  rows.forEach((r) => {
    if (!r[0]) return;
    list.push({
      id: Number(r[0]) || r[0],
      time: String(r[1] || ''),
      kidId: String(r[2] || ''),
      kidName: String(r[3] || ''),
      subject: String(r[4] || ''),
      reward: String(r[5] || ''),
      status: String(r[6] || 'Đã nhận')
    });
  });
  list.sort((a, b) => Number(b.id) - Number(a.id));
  return list;
}

function appendRewardHistory_(ss, entry) {
  if (!entry) return;
  const sheet = ss.getSheetByName(SHEET_NAMES.REWARD_HISTORY);
  sheet.appendRow([
    String(entry.id || Date.now()),
    entry.time || new Date().toLocaleString('vi-VN'),
    entry.kidId || '',
    entry.kidName || '',
    entry.subject || '',
    entry.reward || '',
    entry.status || 'Đã nhận'
  ]);
}
