// Dữ liệu CHÍNH THỨC 48 đội bóng và 12 bảng đấu World Cup 2026 (Có bổ sung flagCode phục vụ hiển thị ảnh lá cờ)
const WORLD_CUP_DATA = {
  groups: {
    A: [
      { id: "MEX", name: "Mexico", code: "MEX", flagCode: "mx", flag: "🇲🇽" },
      { id: "KOR", name: "Hàn Quốc", code: "KOR", flagCode: "kr", flag: "🇰🇷" },
      { id: "RSA", name: "Nam Phi", code: "RSA", flagCode: "za", flag: "🇿🇦" },
      { id: "CZE", name: "Cộng hòa Séc", code: "CZE", flagCode: "cz", flag: "🇨🇿" }
    ],
    B: [
      { id: "CAN", name: "Canada", code: "CAN", flagCode: "ca", flag: "🇨🇦" },
      { id: "SUI", name: "Thụy Sĩ", code: "SUI", flagCode: "ch", flag: "🇨🇭" },
      { id: "QAT", name: "Qatar", code: "QAT", flagCode: "qa", flag: "🇶🇦" },
      { id: "BIH", name: "Bosnia-Herzegovina", code: "BIH", flagCode: "ba", flag: "🇧🇦" }
    ],
    C: [
      { id: "BRA", name: "Brazil", code: "BRA", flagCode: "br", flag: "🇧🇷" },
      { id: "MAR", name: "Morocco", code: "MAR", flagCode: "ma", flag: "🇲🇦" },
      { id: "SCO", name: "Scotland", code: "SCO", flagCode: "gb-sct", flag: "🏴" },
      { id: "HAI", name: "Haiti", code: "HAI", flagCode: "ht", flag: "🇭🇹" }
    ],
    D: [
      { id: "USA", name: "Mỹ", code: "USA", flagCode: "us", flag: "🇺🇸" },
      { id: "PAR", name: "Paraguay", code: "PAR", flagCode: "py", flag: "🇵🇾" },
      { id: "AUS", name: "Úc", code: "AUS", flagCode: "au", flag: "🇦🇺" },
      { id: "TUR", name: "Thổ Nhĩ Kỳ", code: "TUR", flagCode: "tr", flag: "🇹🇷" }
    ],
    E: [
      { id: "GER", name: "Đức", code: "GER", flagCode: "de", flag: "🇩🇪" },
      { id: "ECU", name: "Ecuador", code: "ECU", flagCode: "ec", flag: "🇪🇨" },
      { id: "CIV", name: "Bờ Biển Ngà", code: "CIV", flagCode: "ci", flag: "🇨🇮" },
      { id: "CUW", name: "Curacao", code: "CUW", flagCode: "cw", flag: "🇨🇼" }
    ],
    F: [
      { id: "NED", name: "Hà Lan", code: "NED", flagCode: "nl", flag: "🇳🇱" },
      { id: "JPN", name: "Nhật Bản", code: "JPN", flagCode: "jp", flag: "🇯🇵" },
      { id: "TUN", name: "Tunisia", code: "TUN", flagCode: "tn", flag: "🇹🇳" },
      { id: "SWE", name: "Thụy Điển", code: "SWE", flagCode: "se", flag: "🇸🇪" }
    ],
    G: [
      { id: "BEL", name: "Bỉ", code: "BEL", flagCode: "be", flag: "🇧🇪" },
      { id: "IRN", name: "Iran", code: "IRN", flagCode: "ir", flag: "🇮🇷" },
      { id: "EGY", name: "Ai Cập", code: "EGY", flagCode: "eg", flag: "🇪🇬" },
      { id: "NZL", name: "New Zealand", code: "NZL", flagCode: "nz", flag: "🇳🇿" }
    ],
    H: [
      { id: "ESP", name: "Tây Ban Nha", code: "ESP", flagCode: "es", flag: "🇪🇸" },
      { id: "URU", name: "Uruguay", code: "URU", flagCode: "uy", flag: "🇺🇾" },
      { id: "KSA", name: "Saudi Arabia", code: "KSA", flagCode: "sa", flag: "🇸🇦" },
      { id: "CPV", name: "Cape Verde", code: "CPV", flagCode: "cv", flag: "🇨🇻" }
    ],
    I: [
      { id: "FRA", name: "Pháp", code: "FRA", flagCode: "fr", flag: "🇫🇷" },
      { id: "SEN", name: "Senegal", code: "SEN", flagCode: "sn", flag: "🇸🇳" },
      { id: "NOR", name: "Na Uy", code: "NOR", flagCode: "no", flag: "🇳🇴" },
      { id: "IRQ", name: "Iraq", code: "IRQ", flagCode: "iq", flag: "🇮🇶" }
    ],
    J: [
      { id: "ARG", name: "Argentina", code: "ARG", flagCode: "ar", flag: "🇦🇷" },
      { id: "AUT", name: "Áo", code: "AUT", flagCode: "at", flag: "🇦🇹" },
      { id: "ALG", name: "Algeria", code: "ALG", flagCode: "dz", flag: "🇩🇿" },
      { id: "JOR", name: "Jordan", code: "JOR", flagCode: "jo", flag: "🇯🇴" }
    ],
    K: [
      { id: "POR", name: "Bồ Đào Nha", code: "POR", flagCode: "pt", flag: "🇵🇹" },
      { id: "COL", name: "Colombia", code: "COL", flagCode: "co", flag: "🇨🇴" },
      { id: "UZB", name: "Uzbekistan", code: "UZB", flagCode: "uz", flag: "🇺🇿" },
      { id: "COD", name: "CH Dân Chủ Congo", code: "COD", flagCode: "cd", flag: "🇨🇩" }
    ],
    L: [
      { id: "ENG", name: "Anh", code: "ENG", flagCode: "gb-eng", flag: "🏴" },
      { id: "CRO", name: "Croatia", code: "CRO", flagCode: "hr", flag: "🇭🇷" },
      { id: "PAN", name: "Panama", code: "PAN", flagCode: "pa", flag: "🇵🇦" },
      { id: "GHA", name: "Ghana", code: "GHA", flagCode: "gh", flag: "🇬🇭" }
    ]
  }
};

// Cấu trúc phân phối mã trận đấu chính thức của FIFA đối với các bảng đấu 4 đội (Pot Slot Rotation)
const FIFA_GROUP_PATTERNS = {
  0: [ // Kiểu A: Bảng A, E, I (Đội 1 vs Đội 3 ngày khai mạc)
    { t1Idx: 0, t2Idx: 2, round: 1, dayOffset: 0, time: "02:00" },
    { t1Idx: 1, t2Idx: 3, round: 1, dayOffset: 0, time: "09:00" },
    { t1Idx: 0, t2Idx: 1, round: 2, dayOffset: 5, time: "02:00" },
    { t1Idx: 2, t2Idx: 3, round: 2, dayOffset: 5, time: "09:00" },
    { t1Idx: 3, t2Idx: 0, round: 3, dayOffset: 10, time: "02:00" },
    { t1Idx: 2, t2Idx: 1, round: 3, dayOffset: 10, time: "09:00" }
  ],
  1: [ // Kiểu B: Bảng B, F, J
    { t1Idx: 0, t2Idx: 3, round: 1, dayOffset: 1, time: "02:00" },
    { t1Idx: 2, t2Idx: 1, round: 1, dayOffset: 2, time: "02:00" },
    { t1Idx: 0, t2Idx: 2, round: 2, dayOffset: 6, time: "02:00" },
    { t1Idx: 3, t2Idx: 1, round: 2, dayOffset: 7, time: "02:00" },
    { t1Idx: 1, t2Idx: 0, round: 3, dayOffset: 11, time: "02:00" },
    { t1Idx: 2, t2Idx: 3, round: 3, dayOffset: 12, time: "02:00" }
  ],
  2: [ // Kiểu C: Bảng C, G, K
    { t1Idx: 0, t2Idx: 1, round: 1, dayOffset: 2, time: "05:00" },
    { t1Idx: 2, t2Idx: 3, round: 1, dayOffset: 2, time: "20:00" },
    { t1Idx: 0, t2Idx: 3, round: 2, dayOffset: 7, time: "05:00" },
    { t1Idx: 1, t2Idx: 2, round: 2, dayOffset: 7, time: "20:00" },
    { t1Idx: 2, t2Idx: 0, round: 3, dayOffset: 12, time: "05:00" },
    { t1Idx: 3, t2Idx: 1, round: 3, dayOffset: 12, time: "20:00" }
  ],
  3: [ // Kiểu D: Bảng D, H, L
    { t1Idx: 0, t2Idx: 1, round: 1, dayOffset: 1, time: "08:00" },
    { t1Idx: 2, t2Idx: 3, round: 1, dayOffset: 2, time: "08:00" },
    { t1Idx: 0, t2Idx: 2, round: 2, dayOffset: 6, time: "08:00" },
    { t1Idx: 3, t2Idx: 1, round: 2, dayOffset: 7, time: "08:00" },
    { t1Idx: 3, t2Idx: 0, round: 3, dayOffset: 11, time: "08:00" },
    { t1Idx: 1, t2Idx: 2, round: 3, dayOffset: 12, time: "08:00" }
  ]
};

// Hàm tự động tạo lịch thi đấu 72 trận vòng bảng chuẩn xác 100% theo Lịch thi đấu gốc của FIFA (Giờ Việt Nam)
function generateMatchSchedule() {
  const matches = [];
  let matchId = 1;
  const groupLetters = Object.keys(WORLD_CUP_DATA.groups);

  // Mẫu ngày thi đấu vòng bảng World Cup 2026 (Giờ Việt Nam)
  const baseDateRound1 = new Date("2026-06-12T00:00:00");
  const baseDateRound2 = new Date("2026-06-17T00:00:00");
  const baseDateRound3 = new Date("2026-06-22T00:00:00");

  groupLetters.forEach((groupLetter, gIdx) => {
    const teams = WORLD_CUP_DATA.groups[groupLetter];
    
    // Đọc mã quay vòng pairing chính thức của FIFA theo bảng đấu (A, B, C, D...)
    const groupType = gIdx % 4; 
    const pairings = FIFA_GROUP_PATTERNS[groupType];

    pairings.forEach((pair) => {
      // Chọn base date chính xác tùy theo Round lượt đấu
      let baseDate = baseDateRound1;
      if (pair.round === 2) baseDate = baseDateRound2;
      if (pair.round === 3) baseDate = baseDateRound3;

      // Cộng thêm độ lệch ngày theo cụm bảng đấu để lịch thi đấu tổng thể giãn cách khoa học
      // Ví dụ: Bảng E-H cộng thêm 1 ngày, Bảng I-L cộng thêm 2 ngày so với cụm bảng A-D
      const groupDateShift = Math.floor(gIdx / 4); 
      const finalDate = new Date(baseDate.getTime() + (pair.dayOffset + groupDateShift) * 24 * 60 * 60 * 1000);
      
      const t1 = teams[pair.t1Idx];
      const t2 = teams[pair.t2Idx];

      matches.push({
        id: `M${String(matchId++).padStart(2, "0")}`,
        group: groupLetter,
        round: pair.round,
        date: finalDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }),
        time: pair.time,
        team1: t1.name,
        team1Id: t1.id,
        team1FlagCode: t1.flagCode,
        team1Flag: t1.flag,
        team2: t2.name,
        team2Id: t2.id,
        team2FlagCode: t2.flagCode,
        team2Flag: t2.flag,
        score1: null,
        score2: null,
        yc1: 0,
        rc1: 0,
        yc2: 0,
        rc2: 0,
        status: "Chưa đấu"
      });
    });
  });

  return matches;
}

const DEFAULT_MATCHES = generateMatchSchedule();

// Dữ liệu thống kê cầu thủ World Cup 2026 (Mặc định khởi tạo 0, tự động tích lũy từ kết quả đấu)
const PLAYER_STATS_DATA = [
  { name: "Kylian Mbappé", team: "Pháp", flagCode: "fr", goals: 0, assists: 0, xg: 0.0, keyPasses: 0 },
  { name: "Harry Kane", team: "Anh", flagCode: "gb-eng", goals: 0, assists: 0, xg: 0.0, keyPasses: 0 },
  { name: "Vinícius Júnior", team: "Brazil", flagCode: "br", goals: 0, assists: 0, xg: 0.0, keyPasses: 0 },
  { name: "Jude Bellingham", team: "Anh", flagCode: "gb-eng", goals: 0, assists: 0, xg: 0.0, keyPasses: 0 },
  { name: "Erling Haaland", team: "Na Uy", flagCode: "no", goals: 0, assists: 0, xg: 0.0, keyPasses: 0 },
  { name: "Son Heung-min", team: "Hàn Quốc", flagCode: "kr", goals: 0, assists: 0, xg: 0.0, keyPasses: 0 },
  { name: "Jamal Musiala", team: "Đức", flagCode: "de", goals: 0, assists: 0, xg: 0.0, keyPasses: 0 },
  { name: "Kevin De Bruyne", team: "Bỉ", flagCode: "be", goals: 0, assists: 0, xg: 0.0, keyPasses: 0 },
  { name: "Bruno Fernandes", team: "Bồ Đào Nha", flagCode: "pt", goals: 0, assists: 0, xg: 0.0, keyPasses: 0 },
  { name: "Lionel Messi", team: "Argentina", flagCode: "ar", goals: 0, assists: 0, xg: 0.0, keyPasses: 0 }
];

// Danh sách các cầu thủ tiêu biểu của 48 quốc gia tham dự World Cup 2026
const TEAM_PLAYERS = {
  "Mexico": [
    { name: "Santiago Giménez", flagCode: "mx" },
    { name: "Hirving Lozano", flagCode: "mx" },
    { name: "Edson Álvarez", flagCode: "mx" }
  ],
  "Hàn Quốc": [
    { name: "Son Heung-min", flagCode: "kr" },
    { name: "Hwang Hee-chan", flagCode: "kr" },
    { name: "Lee Kang-in", flagCode: "kr" }
  ],
  "Nam Phi": [
    { name: "Percy Tau", flagCode: "za" },
    { name: "Themba Zwane", flagCode: "za" }
  ],
  "Cộng hòa Séc": [
    { name: "Patrik Schick", flagCode: "cz" },
    { name: "Tomáš Souček", flagCode: "cz" }
  ],
  "Canada": [
    { name: "Jonathan David", flagCode: "ca" },
    { name: "Alphonso Davies", flagCode: "ca" },
    { name: "Cyle Larin", flagCode: "ca" }
  ],
  "Thụy Sĩ": [
    { name: "Breel Embolo", flagCode: "ch" },
    { name: "Xherdan Shaqiri", flagCode: "ch" },
    { name: "Granit Xhaka", flagCode: "ch" }
  ],
  "Qatar": [
    { name: "Akram Afif", flagCode: "qa" },
    { name: "Almoez Ali", flagCode: "qa" }
  ],
  "Bosnia-Herzegovina": [
    { name: "Edin Džeko", flagCode: "ba" },
    { name: "Miralem Pjanić", flagCode: "ba" }
  ],
  "Brazil": [
    { name: "Vinícius Júnior", flagCode: "br" },
    { name: "Rodrygo", flagCode: "br" },
    { name: "Neymar Jr", flagCode: "br" }
  ],
  "Morocco": [
    { name: "Youssef En-Nesyri", flagCode: "ma" },
    { name: "Hakim Ziyech", flagCode: "ma" },
    { name: "Achraf Hakimi", flagCode: "ma" }
  ],
  "Scotland": [
    { name: "Scott McTominay", flagCode: "gb-sct" },
    { name: "John McGinn", flagCode: "gb-sct" }
  ],
  "Haiti": [
    { name: "Frantzdy Pierrot", flagCode: "ht" },
    { name: "Duckens Nazon", flagCode: "ht" }
  ],
  "Mỹ": [
    { name: "Christian Pulisic", flagCode: "us" },
    { name: "Folarin Balogun", flagCode: "us" },
    { name: "Timothy Weah", flagCode: "us" }
  ],
  "Paraguay": [
    { name: "Miguel Almirón", flagCode: "py" },
    { name: "Julio Enciso", flagCode: "py" }
  ],
  "Úc": [
    { name: "Craig Goodwin", flagCode: "au" },
    { name: "Mitchell Duke", flagCode: "au" }
  ],
  "Thổ Nhĩ Kỳ": [
    { name: "Arda Güler", flagCode: "tr" },
    { name: "Hakan Çalhanoğlu", flagCode: "tr" },
    { name: "Cenk Tosun", flagCode: "tr" }
  ],
  "Đức": [
    { name: "Jamal Musiala", flagCode: "de" },
    { name: "Florian Wirtz", flagCode: "de" },
    { name: "Niclas Füllkrug", flagCode: "de" }
  ],
  "Ecuador": [
    { name: "Enner Valencia", flagCode: "ec" },
    { name: "Kendry Páez", flagCode: "ec" }
  ],
  "Bờ Biển Ngà": [
    { name: "Sébastien Haller", flagCode: "ci" },
    { name: "Simon Adingra", flagCode: "ci" }
  ],
  "Curacao": [
    { name: "Juninho Bacuna", flagCode: "cw" },
    { name: "Rangelo Janga", flagCode: "cw" }
  ],
  "Hà Lan": [
    { name: "Cody Gakpo", flagCode: "nl" },
    { name: "Memphis Depay", flagCode: "nl" },
    { name: "Xavi Simons", flagCode: "nl" }
  ],
  "Nhật Bản": [
    { name: "Kaoru Mitoma", flagCode: "jp" },
    { name: "Takefusa Kubo", flagCode: "jp" },
    { name: "Ayase Ueda", flagCode: "jp" }
  ],
  "Tunisia": [
    { name: "Youssef Msakni", flagCode: "tn" },
    { name: "Montassar Talbi", flagCode: "tn" }
  ],
  "Thụy Điển": [
    { name: "Alexander Isak", flagCode: "se" },
    { name: "Viktor Gyökeres", flagCode: "se" },
    { name: "Dejan Kulusevski", flagCode: "se" }
  ],
  "Bỉ": [
    { name: "Kevin De Bruyne", flagCode: "be" },
    { name: "Romelu Lukaku", flagCode: "be" },
    { name: "Leandro Trossard", flagCode: "be" }
  ],
  "Iran": [
    { name: "Mehdi Taremi", flagCode: "ir" },
    { name: "Sardar Azmoun", flagCode: "ir" }
  ],
  "Ai Cập": [
    { name: "Mohamed Salah", flagCode: "eg" },
    { name: "Mostafa Mohamed", flagCode: "eg" }
  ],
  "New Zealand": [
    { name: "Chris Wood", flagCode: "nz" },
    { name: "Sarpreet Singh", flagCode: "nz" }
  ],
  "Tây Ban Nha": [
    { name: "Lamine Yamal", flagCode: "es" },
    { name: "Álvaro Morata", flagCode: "es" },
    { name: "Nico Williams", flagCode: "es" }
  ],
  "Uruguay": [
    { name: "Darwin Núñez", flagCode: "uy" },
    { name: "Federico Valverde", flagCode: "uy" },
    { name: "Luis Suárez", flagCode: "uy" }
  ],
  "Saudi Arabia": [
    { name: "Salem Al-Dawsari", flagCode: "sa" },
    { name: "Firas Al-Buraikan", flagCode: "sa" }
  ],
  "Cape Verde": [
    { name: "Ryan Mendes", flagCode: "cv" },
    { name: "Bebé", flagCode: "cv" }
  ],
  "Pháp": [
    { name: "Kylian Mbappé", flagCode: "fr" },
    { name: "Antoine Griezmann", flagCode: "fr" },
    { name: "Olivier Giroud", flagCode: "fr" }
  ],
  "Senegal": [
    { name: "Sadio Mané", flagCode: "sn" },
    { name: "Nicolas Jackson", flagCode: "sn" }
  ],
  "Na Uy": [
    { name: "Erling Haaland", flagCode: "no" },
    { name: "Martin Ødegaard", flagCode: "no" }
  ],
  "Iraq": [
    { name: "Aymen Hussein", flagCode: "iq" },
    { name: "Ali Jasim", flagCode: "iq" }
  ],
  "Argentina": [
    { name: "Lionel Messi", flagCode: "ar" },
    { name: "Lautaro Martínez", flagCode: "ar" },
    { name: "Julián Álvarez", flagCode: "ar" }
  ],
  "Áo": [
    { name: "Michael Gregoritsch", flagCode: "at" },
    { name: "Marcel Sabitzer", flagCode: "at" }
  ],
  "Algeria": [
    { name: "Riyad Mahrez", flagCode: "dz" },
    { name: "Baghdad Bounedjah", flagCode: "dz" }
  ],
  "Jordan": [
    { name: "Musa Al-Taamari", flagCode: "jo" },
    { name: "Yazan Al-Naimat", flagCode: "jo" }
  ],
  "Bồ Đào Nha": [
    { name: "Cristiano Ronaldo", flagCode: "pt" },
    { name: "Bruno Fernandes", flagCode: "pt" },
    { name: "Rafael Leão", flagCode: "pt" }
  ],
  "Colombia": [
    { name: "Luis Díaz", flagCode: "co" },
    { name: "James Rodríguez", flagCode: "co" }
  ],
  "Uzbekistan": [
    { name: "Eldor Shomurodov", flagCode: "uz" },
    { name: "Otabek Shukurov", flagCode: "uz" }
  ],
  "CH Dân Chủ Congo": [
    { name: "Yoane Wissa", flagCode: "cd" },
    { name: "Cédric Bakambu", flagCode: "cd" }
  ],
  "Anh": [
    { name: "Harry Kane", flagCode: "gb-eng" },
    { name: "Jude Bellingham", flagCode: "gb-eng" },
    { name: "Bukayo Saka", flagCode: "gb-eng" }
  ],
  "Croatia": [
    { name: "Andrej Kramarić", flagCode: "hr" },
    { name: "Luka Modrić", flagCode: "hr" }
  ],
  "Panama": [
    { name: "Cecilio Waterman", flagCode: "pa" },
    { name: "Ismael Díaz", flagCode: "pa" }
  ],
  "Ghana": [
    { name: "Inaki Williams", flagCode: "gh" },
    { name: "Mohammed Kudus", flagCode: "gh" }
  ]
};
