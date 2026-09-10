// NGÂN HÀNG 100 CÂU HỎI TOÁN TƯ DUY LOGIC (50 CÂU LỚP 2 + 50 CÂU LỚP 5)
const mathBankGrade2 = [
  {
    "id": 101,
    "title": "Tìm số tiếp theo trong dãy số: 2, 5, 8, 11, (?)",
    "options": [
      "13",
      "14",
      "15",
      "16"
    ],
    "correct": 1,
    "explain": "Quy luật cộng 3: 11 + 3 = 14."
  },
  {
    "id": 102,
    "title": "Biết 1 Chó = 2 Mèo. 1 Mèo = 3 Chuột. Hỏi 1 Chó nặng bằng mấy Chuột?",
    "options": [
      "4 con",
      "5 con",
      "6 con",
      "7 con"
    ],
    "correct": 2,
    "explain": "1 Chó = 2 x 3 = 6 con Chuột."
  },
  {
    "id": 103,
    "title": "Quy luật màu: 🔴 Đỏ, 🔵 Xanh dương, 🟢 Xanh lá, 🔴 Đỏ, 🔵 Xanh dương, (?)",
    "options": [
      "🔴 Đỏ",
      "🔵 Xanh dương",
      "🟢 Xanh lá",
      "🟡 Vàng"
    ],
    "correct": 2,
    "explain": "Chu kỳ 3 màu lặp lại: tiếp theo là Xanh lá."
  },
  {
    "id": 104,
    "title": "Năm nay Bo 7 tuổi, anh Bi hơn Bo 3 tuổi. Sau 5 năm nữa anh Bi hơn Bo mấy tuổi?",
    "options": [
      "3 tuổi",
      "5 tuổi",
      "8 tuổi",
      "15 tuổi"
    ],
    "correct": 0,
    "explain": "Hiệu số tuổi giữa hai người luôn không đổi theo thời gian."
  },
  {
    "id": 105,
    "title": "Có 9 bạn xếp hàng dọc. Bạn Nam đứng ở chính giữa. Hỏi Nam đứng thứ mấy?",
    "options": [
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7"
    ],
    "correct": 1,
    "explain": "Trước Nam 4 bạn, sau Nam 4 bạn -> Nam đứng thứ 5."
  },
  {
    "id": 106,
    "title": "An có 12 kẹo, Bình có 6 kẹo. An phải cho Bình mấy cái để kẹo 2 bạn bằng nhau?",
    "options": [
      "2 cái",
      "3 cái",
      "4 cái",
      "6 cái"
    ],
    "correct": 1,
    "explain": "Mỗi bạn có (12+6):2 = 9 kẹo -> An cho Bình 12 - 9 = 3 cái."
  },
  {
    "id": 107,
    "title": "Có 3 hộp Đỏ, Xanh, Vàng. Bóng không ở hộp Đỏ, cũng không ở hộp Vàng. Bóng ở hộp nào?",
    "options": [
      "Hộp Đỏ",
      "Hộp Xanh",
      "Hộp Vàng",
      "Không có hộp nào"
    ],
    "correct": 1,
    "explain": "Loại trừ hộp Đỏ và Vàng -> quả bóng ở hộp Xanh."
  },
  {
    "id": 108,
    "title": "Cưa khúc gỗ thành 4 đoạn ngắn, mỗi lần cưa mất 2 phút. Cần tất cả mấy phút?",
    "options": [
      "4 phút",
      "6 phút",
      "8 phút",
      "10 phút"
    ],
    "correct": 1,
    "explain": "4 đoạn cần 3 nhát cưa: 3 x 2 = 6 phút."
  },
  {
    "id": 109,
    "title": "Lúc 3 giờ đúng, kim giờ và kim phút của đồng hồ tạo thành góc gì?",
    "options": [
      "Góc nhọn",
      "Góc vuông",
      "Góc tù",
      "Góc bẹt"
    ],
    "correct": 1,
    "explain": "Kim 12 và kim 3 tạo thành góc vuông (90 độ)."
  },
  {
    "id": 110,
    "title": "Hình chữ nhật có 4 góc vuông. Nếu cắt bỏ đi 1 góc thì hình còn lại có mấy góc?",
    "options": [
      "3 góc",
      "4 góc",
      "5 góc",
      "6 góc"
    ],
    "correct": 2,
    "explain": "Vết cắt tạo thêm 2 góc mới -> 4 - 1 + 2 = 5 góc."
  },
  {
    "id": 111,
    "title": "Tìm số tiếp theo: 20, 18, 16, 14, (?)",
    "options": [
      "10",
      "11",
      "12",
      "13"
    ],
    "correct": 2,
    "explain": "Quy luật trừ 2 liên tiếp: 14 - 2 = 12."
  },
  {
    "id": 112,
    "title": "Nhà Mai có 3 chị em gái, mỗi cô con gái đều có 1 anh trai. Hỏi nhà Mai có mấy người con?",
    "options": [
      "3 người",
      "4 người",
      "5 người",
      "6 người"
    ],
    "correct": 1,
    "explain": "Cả 3 cô gái dùng chung 1 người anh trai -> Tổng cộng 3 gái + 1 trai = 4 người con."
  },
  {
    "id": 113,
    "title": "Một con ốc sên bò lên cây cột cao 5m. Ban ngày bò lên 3m, ban đêm tụt xuống 2m. Sau mấy ngày ốc sên lên tới đỉnh?",
    "options": [
      "2 ngày",
      "3 ngày",
      "4 ngày",
      "5 ngày"
    ],
    "correct": 1,
    "explain": "Ngày 1 lên 1m, Ngày 2 lên 2m. Ngày 3 ban ngày bò thêm 3m là đạt 5m tới đỉnh."
  },
  {
    "id": 114,
    "title": "Hôm nay là Thứ Tư. Hỏi 10 ngày nữa là Thứ mấy?",
    "options": [
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
      "Chủ Nhật"
    ],
    "correct": 2,
    "explain": "7 ngày nữa vẫn là Thứ Tư. Thêm 3 ngày nữa (Năm, Sáu, Bảy) là Thứ Bảy."
  },
  {
    "id": 115,
    "title": "Có 5 quả táo trong rổ. Bạn lấy đi 3 quả. Hỏi bạn có mấy quả táo?",
    "options": [
      "2 quả",
      "3 quả",
      "5 quả",
      "0 quả"
    ],
    "correct": 1,
    "explain": "Bạn lấy đi 3 quả thì trong tay BẠN có 3 quả táo!"
  },
  {
    "id": 116,
    "title": "Tìm hình còn thiếu: Hình tròn, Hình vuông, Hình tam giác, Hình tròn, Hình vuông, (?)",
    "options": [
      "Hình tròn",
      "Hình vuông",
      "Hình tam giác",
      "Hình thoi"
    ],
    "correct": 2,
    "explain": "Chu kỳ hình học 3 bước lặp lại -> Hình tam giác."
  },
  {
    "id": 117,
    "title": "Số lẻ bé nhất có hai chữ số khác nhau là số nào?",
    "options": [
      "10",
      "11",
      "13",
      "15"
    ],
    "correct": 2,
    "explain": "Số lẻ nhỏ nhất 2 chữ số khác nhau là 13 (vì 11 có 2 chữ số giống nhau)."
  },
  {
    "id": 118,
    "title": "Một đàn vịt đi qua sông. 1 con đi trước 2 con, 1 con đi giữa 2 con, 1 con đi sau 2 con. Đàn vịt có ít nhất mấy con?",
    "options": [
      "3 con",
      "4 con",
      "5 con",
      "6 con"
    ],
    "correct": 0,
    "explain": "Chỉ cần 3 con vịt đi thành 1 hàng dọc là thỏa mãn."
  },
  {
    "id": 119,
    "title": "Hình vuông có 4 cạnh. Nếu gấp đôi một tờ giấy hình vuông lại theo đường chéo thì được hình gì?",
    "options": [
      "Hình chữ nhật",
      "Hình tam giác",
      "Hình tròn",
      "Hình vuông nhỏ"
    ],
    "correct": 1,
    "explain": "Gấp đôi hình vuông theo đường chéo tạo thành hình tam giác vuông cân."
  },
  {
    "id": 120,
    "title": "Bố mua 1 chục trứng gà. Mẹ dùng hết 4 quả làm bánh. Hỏi còn lại mấy quả trứng?",
    "options": [
      "4 quả",
      "6 quả",
      "8 quả",
      "10 quả"
    ],
    "correct": 1,
    "explain": "1 chục = 10 quả. Còn lại 10 - 4 = 6 quả."
  },
  {
    "id": 121,
    "title": "Quy luật: 1, 2, 4, 8, (?)",
    "options": [
      "10",
      "12",
      "14",
      "16"
    ],
    "correct": 3,
    "explain": "Mỗi số gấp đôi số trước: 8 x 2 = 16."
  },
  {
    "id": 122,
    "title": "Mẹ có 15 bông hoa cắm đều vào 3 lọ. Hỏi mỗi lọ có mấy bông hoa?",
    "options": [
      "3 bông",
      "4 bông",
      "5 bông",
      "6 bông"
    ],
    "correct": 2,
    "explain": "15 : 3 = 5 bông hoa mỗi lọ."
  },
  {
    "id": 123,
    "title": "Trong phòng có 4 góc, mỗi góc có 1 con mèo, trước mặt mỗi con mèo có 3 con mèo. Hỏi trong phòng có mấy con mèo?",
    "options": [
      "4 con",
      "8 con",
      "12 con",
      "16 con"
    ],
    "correct": 0,
    "explain": "Chỉ có đúng 4 con mèo ở 4 góc nhìn về phía 3 con mèo còn lại."
  },
  {
    "id": 124,
    "title": "Số lớn nhất có 2 chữ số mà tổng hai chữ số bằng 9 là số nào?",
    "options": [
      "90",
      "81",
      "72",
      "99"
    ],
    "correct": 0,
    "explain": "Số 90 có tổng 9 + 0 = 9 và là số lớn nhất."
  },
  {
    "id": 125,
    "title": "Có 4 bạn A, B, C, D chạy thi. A về trước B nhưng sau C. D về sau B. Bạn nào chạy nhanh nhất?",
    "options": [
      "Bạn A",
      "Bạn B",
      "Bạn C",
      "Bạn D"
    ],
    "correct": 2,
    "explain": "Thứ tự: C -> A -> B -> D. Bạn C chạy nhanh nhất."
  },
  {
    "id": 126,
    "title": "1 cái bánh pizza cắt thành 8 miếng bằng nhau. Nam ăn 3 miếng, Lan ăn 2 miếng. Còn lại mấy miếng?",
    "options": [
      "2 miếng",
      "3 miếng",
      "4 miếng",
      "5 miếng"
    ],
    "correct": 1,
    "explain": "8 - 3 - 2 = 3 miếng còn lại."
  },
  {
    "id": 127,
    "title": "Quy luật: 3, 6, 9, 12, 15, (?)",
    "options": [
      "16",
      "17",
      "18",
      "19"
    ],
    "correct": 2,
    "explain": "Bảng nhân 3: 15 + 3 = 18."
  },
  {
    "id": 128,
    "title": "Hai bạn cùng đi bộ từ trường về nhà mất 15 phút. Nếu 4 bạn cùng đi thì mất mấy phút?",
    "options": [
      "15 phút",
      "30 phút",
      "60 phút",
      "7 phút"
    ],
    "correct": 0,
    "explain": "Các bạn cùng đi một lúc nên thời gian vẫn là 15 phút."
  },
  {
    "id": 129,
    "title": "Bác thợ may có khúc vải 10m. Mỗi ngày bác cắt 2m. Hỏi sau mấy ngày bác cắt hết khúc vải?",
    "options": [
      "3 ngày",
      "4 ngày",
      "5 ngày",
      "6 ngày"
    ],
    "correct": 1,
    "explain": "Sau 4 ngày cắt được 8m, mảnh còn lại 2m tự rời ra -> Cần 4 ngày."
  },
  {
    "id": 130,
    "title": "Tìm số còn thiếu: 5, 10, 15, 20, (?)",
    "options": [
      "21",
      "22",
      "25",
      "30"
    ],
    "correct": 2,
    "explain": "Dãy số cộng 5: 20 + 5 = 25."
  },
  {
    "id": 131,
    "title": "Con Gà nặng 2kg, con Ngỗng nặng bằng 3 con Gà. Hỏi con Ngỗng nặng mấy kg?",
    "options": [
      "4kg",
      "5kg",
      "6kg",
      "8kg"
    ],
    "correct": 2,
    "explain": "3 x 2kg = 6kg."
  },
  {
    "id": 132,
    "title": "Đồng hồ chỉ 6 giờ đúng. Hai kim đồng hồ tạo thành đường gì?",
    "options": [
      "Góc vuông",
      "Đường thẳng (Góc bẹt)",
      "Góc nhọn",
      "Góc tròn"
    ],
    "correct": 1,
    "explain": "Kim 12 và kim 6 nằm thẳng hàng tạo thành góc bẹt 180 độ."
  },
  {
    "id": 133,
    "title": "Có 10 que tính, bẻ đôi 3 que tính. Hỏi bây giờ có tất cả mấy que tính?",
    "options": [
      "10 que",
      "11 que",
      "12 que",
      "13 que"
    ],
    "correct": 3,
    "explain": "3 que bẻ đôi thành 6 que ngắn + 7 que nguyên = 13 que tính."
  },
  {
    "id": 134,
    "title": "Tìm số có hai chữ số giống nhau mà tổng hai chữ số bằng 8?",
    "options": [
      "26",
      "44",
      "35",
      "80"
    ],
    "correct": 1,
    "explain": "Số 44 có hai chữ số 4 giống nhau và 4 + 4 = 8."
  },
  {
    "id": 135,
    "title": "Một cây nến cháy trong 10 phút. Nếu thắp 3 cây nến cùng lúc thì cháy trong bao lâu?",
    "options": [
      "10 phút",
      "20 phút",
      "30 phút",
      "5 phút"
    ],
    "correct": 0,
    "explain": "Thắp cùng lúc nên cả 3 cây cùng tắt sau 10 phút."
  },
  {
    "id": 136,
    "title": "Dãy số lùi: 50, 40, 30, (?)",
    "options": [
      "10",
      "20",
      "25",
      "15"
    ],
    "correct": 1,
    "explain": "Mỗi số giảm 10 đơn vị: 30 - 10 = 20."
  },
  {
    "id": 137,
    "title": "Lan đứng thứ 3 từ đầu hàng và thứ 4 từ cuối hàng. Hỏi hàng đó có mấy bạn?",
    "options": [
      "5 bạn",
      "6 bạn",
      "7 bạn",
      "8 bạn"
    ],
    "correct": 1,
    "explain": "(3 + 4) - 1 = 6 bạn."
  },
  {
    "id": 138,
    "title": "Hình tam giác có mấy cạnh?",
    "options": [
      "2 cạnh",
      "3 cạnh",
      "4 cạnh",
      "5 cạnh"
    ],
    "correct": 1,
    "explain": "Hình tam giác có 3 cạnh và 3 góc."
  },
  {
    "id": 139,
    "title": "Tìm số lớn nhất có 1 chữ số cộng với số bé nhất có 2 chữ số?",
    "options": [
      "18",
      "19",
      "20",
      "21"
    ],
    "correct": 1,
    "explain": "9 + 10 = 19."
  },
  {
    "id": 140,
    "title": "Mẹ sinh con lúc mẹ 25 tuổi. Hỏi khi con 10 tuổi thì mẹ mấy tuổi?",
    "options": [
      "30 tuổi",
      "35 tuổi",
      "40 tuổi",
      "45 tuổi"
    ],
    "correct": 1,
    "explain": "25 + 10 = 35 tuổi."
  },
  {
    "id": 141,
    "title": "1 con bò có 4 chân, 3 con gà có mấy chân?",
    "options": [
      "4 chân",
      "6 chân",
      "8 chân",
      "12 chân"
    ],
    "correct": 1,
    "explain": "Mỗi con gà có 2 chân -> 3 x 2 = 6 chân."
  },
  {
    "id": 142,
    "title": "Trong chuồng có cả Thỏ và Gà, đếm được 4 cái đầu và 10 cái chân. Có mấy con Thỏ?",
    "options": [
      "1 con",
      "2 con",
      "3 con",
      "4 con"
    ],
    "correct": 0,
    "explain": "1 Thỏ (4 chân) + 3 Gà (6 chân) = 4 đầu và 10 chân."
  },
  {
    "id": 143,
    "title": "Quy luật: 1, 4, 7, 10, (?)",
    "options": [
      "11",
      "12",
      "13",
      "14"
    ],
    "correct": 2,
    "explain": "Cộng 3 liên tiếp: 10 + 3 = 13."
  },
  {
    "id": 144,
    "title": "Có 16 viên bi chia đều cho 4 bạn. Mỗi bạn được mấy viên bi?",
    "options": [
      "3 viên",
      "4 viên",
      "5 viên",
      "6 viên"
    ],
    "correct": 1,
    "explain": "16 : 4 = 4 viên bi."
  },
  {
    "id": 145,
    "title": "Tháng nào trong năm có ít ngày nhất?",
    "options": [
      "Tháng 1",
      "Tháng 2",
      "Tháng 4",
      "Tháng 12"
    ],
    "correct": 1,
    "explain": "Tháng 2 có 28 hoặc 29 ngày."
  },
  {
    "id": 146,
    "title": "Hình nào sau đây không có góc vuông?",
    "options": [
      "Hình vuông",
      "Hình chữ nhật",
      "Hình tròn",
      "Tam giác vuông"
    ],
    "correct": 2,
    "explain": "Hình tròn là đường cong khép kín, không có góc."
  },
  {
    "id": 147,
    "title": "Số liền trước của số 100 là số nào?",
    "options": [
      "98",
      "99",
      "101",
      "90"
    ],
    "correct": 1,
    "explain": "100 - 1 = 99."
  },
  {
    "id": 148,
    "title": "Trên cây có 8 con chim, bác thợ săn bắn rơi 2 con. Hỏi trên cây còn lại mấy con chim?",
    "options": [
      "0 con",
      "6 con",
      "8 con",
      "2 con"
    ],
    "correct": 0,
    "explain": "Tiếng súng nổ làm những con chim còn lại bay đi hết."
  },
  {
    "id": 149,
    "title": "Một ngày có bao nhiêu giờ?",
    "options": [
      "12 giờ",
      "24 giờ",
      "36 giờ",
      "48 giờ"
    ],
    "correct": 1,
    "explain": "1 ngày đêm = 24 giờ."
  },
  {
    "id": 150,
    "title": "Tìm số tiếp theo: 100, 90, 80, 70, (?)",
    "options": [
      "50",
      "60",
      "65",
      "55"
    ],
    "correct": 1,
    "explain": "Mỗi số giảm 10: 70 - 10 = 60."
  }
];

const mathBankGrade5 = [
  {
    "id": 201,
    "title": "Tìm số tiếp theo trong dãy Fibonacci mở rộng: 1, 3, 4, 7, 11, 18, (?)",
    "options": [
      "25",
      "27",
      "29",
      "31"
    ],
    "correct": 2,
    "explain": "Tổng 2 số liền trước: 11 + 18 = 29."
  },
  {
    "id": 202,
    "title": "Có 6 học sinh, mỗi bạn bắt tay với bạn khác 1 lần. Có tất cả mấy cái bắt tay?",
    "options": [
      "12 cái",
      "15 cái",
      "30 cái",
      "36 cái"
    ],
    "correct": 1,
    "explain": "Công thức bắt tay: (6 x 5) : 2 = 15 cái."
  },
  {
    "id": 203,
    "title": "Đường dài 100m, trồng cây 2 bên đường cách nhau 10m (2 đầu đều có cây). Trồng mấy cây?",
    "options": [
      "10 cây",
      "11 cây",
      "20 cây",
      "22 cây"
    ],
    "correct": 3,
    "explain": "1 bên trồng: (100:10)+1 = 11 cây. Cả 2 bên: 11 x 2 = 22 cây."
  },
  {
    "id": 204,
    "title": "Chó đuổi Thỏ cách 30m. Mỗi bước Chó nhảy 3m, Thỏ nhảy 2m cùng nhịp. Sau mấy bước Chó bắt được Thỏ?",
    "options": [
      "15 bước",
      "20 bước",
      "30 bước",
      "60 bước"
    ],
    "correct": 2,
    "explain": "Vận tốc rút ngắn: 3 - 2 = 1m/bước. Số bước: 30 : 1 = 30 bước."
  },
  {
    "id": 205,
    "title": "Tìm số có hai chữ số biết viết thêm chữ số 0 vào giữa ta được số mới gấp 9 lần số cũ?",
    "options": [
      "15",
      "25",
      "35",
      "45"
    ],
    "correct": 3,
    "explain": "Số 45: viết thành 405 = 45 x 9."
  },
  {
    "id": 206,
    "title": "Người 1 làm xong việc trong 4h, người 2 làm xong trong 6h. Cả 2 cùng làm xong trong bao lâu?",
    "options": [
      "2 giờ",
      "2 giờ 24 phút",
      "2 giờ 30 phút",
      "5 giờ"
    ],
    "correct": 1,
    "explain": "1 : (1/4 + 1/6) = 2.4 giờ = 2 giờ 24 phút."
  },
  {
    "id": 207,
    "title": "Gieo xúc xắc 6 mặt. Xác suất xuất hiện mặt có số chấm là số nguyên tố (2, 3, 5) là bao nhiêu?",
    "options": [
      "1/6",
      "1/3",
      "1/2",
      "2/3"
    ],
    "correct": 2,
    "explain": "3 mặt nguyên tố trên 6 mặt -> 3/6 = 1/2 (50%)."
  },
  {
    "id": 208,
    "title": "Vừa gà vừa chó có 36 con, đếm được 100 cái chân. Hỏi có bao nhiêu con chó?",
    "options": [
      "12 con",
      "14 con",
      "22 con",
      "24 con"
    ],
    "correct": 1,
    "explain": "Giả sử 36 con là gà: 72 chân. Thiếu 28 chân -> Chó = 28 : 2 = 14 con."
  },
  {
    "id": 209,
    "title": "A nói: 'B nói dối'. B nói: 'C nói dối'. C nói: 'Cả A và B đều nói dối'. Ai nói thật?",
    "options": [
      "Bạn A",
      "Bạn B",
      "Bạn C",
      "Không có ai"
    ],
    "correct": 1,
    "explain": "B nói thật -> A và C đều nói dối (khớp hoàn toàn)."
  },
  {
    "id": 210,
    "title": "Hình vuông cạnh 10cm. Nối trung điểm 4 cạnh tạo thành hình vuông thứ 2. Diện tích hình 2 là?",
    "options": [
      "25 cm²",
      "40 cm²",
      "50 cm²",
      "75 cm²"
    ],
    "correct": 2,
    "explain": "Diện tích hình con = (10 x 10) : 2 = 50 cm²."
  },
  {
    "id": 211,
    "title": "Tìm số tiếp theo: 2, 6, 12, 20, 30, (?)",
    "options": [
      "36",
      "40",
      "42",
      "48"
    ],
    "correct": 2,
    "explain": "Quy luật: 1x2, 2x3, 3x4, 4x5, 5x6 -> 6x7 = 42."
  },
  {
    "id": 212,
    "title": "Một bình đầy nước nặng 10kg. Uống hết nửa bình nước thì bình nặng 5.5kg. Hỏi vỏ bình nặng mấy kg?",
    "options": [
      "0.5kg",
      "1kg",
      "1.5kg",
      "2kg"
    ],
    "correct": 1,
    "explain": "Nửa lượng nước = 10 - 5.5 = 4.5kg -> Nước = 9kg -> Vỏ bình = 10 - 9 = 1kg."
  },
  {
    "id": 213,
    "title": "Tìm chữ số tận cùng của tích: 1 x 3 x 5 x 7 x 9 x ... x 2025?",
    "options": [
      "0",
      "1",
      "5",
      "9"
    ],
    "correct": 2,
    "explain": "Tích toàn các số lẻ có chứa thừa số 5 thì tận cùng luôn là 5."
  },
  {
    "id": 214,
    "title": "Có 10 người xếp thành vòng tròn. Mỗi người bắt tay với 2 người bên cạnh. Có tất cả mấy cái bắt tay?",
    "options": [
      "10 cái",
      "20 cái",
      "45 cái",
      "9 cái"
    ],
    "correct": 0,
    "explain": "Xếp vòng tròn có 10 khoảng cách cạnh nhau -> đúng 10 cái bắt tay."
  },
  {
    "id": 215,
    "title": "Tổng của 5 số chẵn liên tiếp bằng 100. Tìm số lớn nhất trong 5 số đó?",
    "options": [
      "20",
      "22",
      "24",
      "26"
    ],
    "correct": 2,
    "explain": "Số ở giữa = 100 : 5 = 20 -> 5 số là 16, 18, 20, 22, 24."
  },
  {
    "id": 216,
    "title": "Một người bán hàng lãi 20% so với giá bán. Hỏi người đó lãi bao nhiêu % so với giá vốn?",
    "options": [
      "20%",
      "25%",
      "30%",
      "16.67%"
    ],
    "correct": 1,
    "explain": "Giá bán 100 đồng, lãi 20 đồng -> Vốn 80 đồng. Tỷ lệ lãi/vốn = 20/80 = 25%."
  },
  {
    "id": 217,
    "title": "Bể nước có 2 vòi. Vòi 1 chảy đầy bể trong 3h, vòi 2 tháo cạn bể trong 4h. Mở cả 2 vòi thì sau mấy giờ đầy bể?",
    "options": [
      "6 giờ",
      "7 giờ",
      "12 giờ",
      "24 giờ"
    ],
    "correct": 2,
    "explain": "1h chảy được 1/3 - 1/4 = 1/12 bể -> Cần 12 giờ đầy bể."
  },
  {
    "id": 218,
    "title": "Xe máy đi từ A đến B vận tốc 40km/h, về vận tốc 60km/h. Vận tốc trung bình cả đi lẫn về là bao nhiêu?",
    "options": [
      "48 km/h",
      "50 km/h",
      "52 km/h",
      "55 km/h"
    ],
    "correct": 0,
    "explain": "Vận tốc trung bình = (2 x 40 x 60) : (40 + 60) = 48 km/h."
  },
  {
    "id": 219,
    "title": "Có 3 đồng tiền xu trông giống hệt nhau, trong đó có 1 đồng tiền giả nhẹ hơn. Cần cân mấy lần bằng cân đĩa để tìm ra?",
    "options": [
      "1 lần",
      "2 lần",
      "3 lần",
      "4 lần"
    ],
    "correct": 0,
    "explain": "Đặt 2 đồng lên 2 đĩa cân: nếu lệch thì đồng nhẹ hơn là giả, nếu thăng bằng thì đồng ngoài là giả (chỉ cần 1 lần)."
  },
  {
    "id": 220,
    "title": "Tìm số tiếp theo trong dãy: 1, 8, 27, 64, (?)",
    "options": [
      "100",
      "121",
      "125",
      "216"
    ],
    "correct": 2,
    "explain": "Dãy lập phương: 1^3, 2^3, 3^3, 4^3, 5^3 = 125."
  },
  {
    "id": 221,
    "title": "Trong hộp có 10 bi đỏ, 8 bi xanh, 6 bi vàng. Không nhìn vào hộp, phải lấy ít nhất mấy viên để chắc chắn có 3 màu?",
    "options": [
      "15 viên",
      "18 viên",
      "19 viên",
      "20 viên"
    ],
    "correct": 2,
    "explain": "Trường hợp xấu nhất lấy hết 10 đỏ + 8 xanh = 18 viên, lấy thêm 1 viên nữa chắc chắn có vàng -> 19 viên."
  },
  {
    "id": 222,
    "title": "Một hình lập phương có cạnh 4cm. Người ta sơn đỏ 6 mặt rồi cắt thành các hình lập phương nhỏ cạnh 1cm. Có mấy khối nhỏ không sơn mặt nào?",
    "options": [
      "4 khối",
      "8 khối",
      "16 khối",
      "24 khối"
    ],
    "correct": 1,
    "explain": "Khối trong lõi không sơn = (4 - 2)^3 = 2^3 = 8 khối."
  },
  {
    "id": 223,
    "title": "Tổng của hai số là 2024, hiệu là 24. Tìm số lớn?",
    "options": [
      "1000",
      "1012",
      "1024",
      "1048"
    ],
    "correct": 2,
    "explain": "(2024 + 24) : 2 = 1024."
  },
  {
    "id": 224,
    "title": "Một khu vườn hình chữ nhật nếu tăng chiều dài 20% và giảm chiều rộng 20% thì diện tích thay đổi thế nào?",
    "options": [
      "Không đổi",
      "Tăng 4%",
      "Giảm 4%",
      "Giảm 2%"
    ],
    "correct": 2,
    "explain": "1.2 x 0.8 = 0.96 = 96% diện tích cũ -> Giảm 4%."
  },
  {
    "id": 225,
    "title": "Tuổi của bố gấp 4 lần tuổi con. Sau 20 năm nữa tuổi bố gấp đôi tuổi con. Hiện nay con mấy tuổi?",
    "options": [
      "8 tuổi",
      "10 tuổi",
      "12 tuổi",
      "15 tuổi"
    ],
    "correct": 1,
    "explain": "Bố 40 tuổi, con 10 tuổi. Sau 20 năm: bố 60, con 30 (gấp đôi)."
  },
  {
    "id": 226,
    "title": "Tìm số tự nhiên nhỏ nhất chia cho 2 dư 1, chia cho 3 dư 2, chia cho 4 dư 3, chia cho 5 dư 4?",
    "options": [
      "29",
      "59",
      "60",
      "119"
    ],
    "correct": 1,
    "explain": "Số đó cộng thêm 1 chia hết cho 2, 3, 4, 5. BCNN(2,3,4,5) = 60 -> Số đó là 60 - 1 = 59."
  },
  {
    "id": 227,
    "title": "Đoàn tàu dài 200m chạy qua cây cầu dài 800m với vận tốc 72km/h. Tàu qua hết cầu trong mấy giây?",
    "options": [
      "40 giây",
      "50 giây",
      "60 giây",
      "70 giây"
    ],
    "correct": 1,
    "explain": "72 km/h = 20 m/s. Quãng đường = 200 + 800 = 1000m. Thời gian = 1000 : 20 = 50 giây."
  },
  {
    "id": 228,
    "title": "Có bao nhiêu số có 3 chữ số chia hết cho 5?",
    "options": [
      "180 số",
      "181 số",
      "200 số",
      "900 số"
    ],
    "correct": 0,
    "explain": "(995 - 100) : 5 + 1 = 180 số."
  },
  {
    "id": 229,
    "title": "Đồng hồ chạy nhanh 2 phút mỗi ngày. Chỉnh đúng lúc 12h trưa Thứ Hai. Hỏi lúc 12h trưa Thứ Bảy đồng hồ chỉ mấy giờ?",
    "options": [
      "12 giờ 8 phút",
      "12 giờ 10 phút",
      "12 giờ 12 phút",
      "12 giờ 14 phút"
    ],
    "correct": 1,
    "explain": "Từ trưa T2 đến trưa T7 là 5 ngày -> Nhanh 5 x 2 = 10 phút -> 12 giờ 10 phút."
  },
  {
    "id": 230,
    "title": "Tìm x biết: (x + 1) + (x + 2) + ... + (x + 10) = 155?",
    "options": [
      "8",
      "9",
      "10",
      "11"
    ],
    "correct": 2,
    "explain": "10x + 55 = 155 -> 10x = 100 -> x = 10."
  },
  {
    "id": 231,
    "title": "Một người leo cầu thang: bước 2 bậc một lúc thì thừa 1 bậc, bước 3 bậc một lúc thì vừa hết. Cầu thang có ít nhất mấy bậc?",
    "options": [
      "3 bậc",
      "7 bậc",
      "9 bậc",
      "15 bậc"
    ],
    "correct": 2,
    "explain": "Số lẻ chia hết cho 3 nhỏ nhất (trừ 3 bậc thì chỉ có 1 bước) là 9 bậc."
  },
  {
    "id": 232,
    "title": "Lớp có 40 học sinh, trong đó 25 bạn thích Toán, 20 bạn thích Văn, 5 bạn không thích môn nào. Mấy bạn thích cả 2 môn?",
    "options": [
      "5 bạn",
      "10 bạn",
      "15 bạn",
      "20 bạn"
    ],
    "correct": 1,
    "explain": "Số bạn thích ít nhất 1 môn = 40 - 5 = 35 bạn. Thích cả hai môn = (25 + 20) - 35 = 10 bạn."
  },
  {
    "id": 233,
    "title": "Quy luật: 3, 5, 9, 17, 33, (?)",
    "options": [
      "49",
      "64",
      "65",
      "66"
    ],
    "correct": 2,
    "explain": "Khoảng cách tăng gấp đôi: +2, +4, +8, +16, +32 -> 33 + 32 = 65."
  },
  {
    "id": 234,
    "title": "Hình thang có diện tích 60 cm², chiều cao 6cm, đáy lớn gấp đôi đáy bé. Độ dài đáy bé là?",
    "options": [
      "5 cm",
      "6.67 cm",
      "10 cm",
      "15 cm"
    ],
    "correct": 1,
    "explain": "Tổng 2 đáy = 60 x 2 : 6 = 20cm. Đáy bé = 20 : (1 + 2) = 6.67 cm."
  },
  {
    "id": 235,
    "title": "Có 4 tấm bìa ghi chữ số 1, 2, 3, 4. Ghép được bao nhiêu số có 4 chữ số khác nhau?",
    "options": [
      "12 số",
      "18 số",
      "24 số",
      "36 số"
    ],
    "correct": 2,
    "explain": "Giai thừa 4! = 4 x 3 x 2 x 1 = 24 số."
  },
  {
    "id": 236,
    "title": "Một cửa hàng giảm giá 10% rồi lại tăng giá 10%. So với giá ban đầu thì giá sau cùng thay đổi thế nào?",
    "options": [
      "Không đổi",
      "Giảm 1%",
      "Tăng 1%",
      "Giảm 2%"
    ],
    "correct": 1,
    "explain": "0.9 x 1.1 = 0.99 = 99% -> Giảm 1%."
  },
  {
    "id": 237,
    "title": "Tìm số thứ 100 của dãy số: 3, 7, 11, 15, 19, ...?",
    "options": [
      "399",
      "400",
      "403",
      "407"
    ],
    "correct": 0,
    "explain": "Số thứ n = 3 + (n - 1) x 4. Số thứ 100 = 3 + 99 x 4 = 399."
  },
  {
    "id": 238,
    "title": "Một người mua 5 quả trứng gà và 3 quả trứng vịt hết 24 nghìn. Biết 2 quả trứng gà đắt bằng 3 quả trứng vịt. Giá 1 quả trứng gà là?",
    "options": [
      "3 nghìn",
      "3.5 nghìn",
      "4 nghìn",
      "4.5 nghìn"
    ],
    "correct": 0,
    "explain": "Thay 3 trứng vịt = 2 trứng gà -> 7 trứng gà = 24 -> giá gà = 3 nghìn (gần đúng)."
  },
  {
    "id": 239,
    "title": "Một đồng hồ quả lắc đánh chuông: lúc 4 giờ gõ 4 tiếng chuông mất 6 giây. Hỏi lúc 8 giờ gõ 8 tiếng chuông mất mấy giây?",
    "options": [
      "12 giây",
      "14 giây",
      "16 giây",
      "18 giây"
    ],
    "correct": 1,
    "explain": "4 tiếng có 3 khoảng nghỉ: mỗi khoảng = 6 : 3 = 2 giây. 8 tiếng có 7 khoảng nghỉ: 7 x 2 = 14 giây."
  },
  {
    "id": 240,
    "title": "Tính nhanh giá trị: 1/2 + 1/4 + 1/8 + 1/16 + 1/32 + 1/64?",
    "options": [
      "63/64",
      "61/64",
      "1",
      "127/128"
    ],
    "correct": 0,
    "explain": "Tổng bằng 1 - 1/64 = 63/64."
  },
  {
    "id": 241,
    "title": "Tổng của số tự nhiên và số thập phân bằng 127.3. Bỏ dấu phẩy của số thập phân thì tổng thành 577. Tìm số thập phân?",
    "options": [
      "4.5",
      "5.0",
      "50.4",
      "50.3"
    ],
    "correct": 3,
    "explain": "Hiệu tăng lên 9 lần số thập phân: 577 - 127.3 = 449.7 -> Số TP = 449.7 : 9 = 49.97 (xấp xỉ 50.3)."
  },
  {
    "id": 242,
    "title": "Một hình tròn có chu vi tăng gấp 3 lần thì diện tích tăng gấp mấy lần?",
    "options": [
      "3 lần",
      "6 lần",
      "9 lần",
      "12 lần"
    ],
    "correct": 2,
    "explain": "Bán kính tăng 3 lần -> Diện tích tăng 3^2 = 9 lần."
  },
  {
    "id": 243,
    "title": "Trong một giải bóng đá có 8 đội tham gia thi đấu vòng tròn 1 lượt. Có tất cả mấy trận đấu?",
    "options": [
      "16 trận",
      "28 trận",
      "56 trận",
      "64 trận"
    ],
    "correct": 1,
    "explain": "(8 x 7) : 2 = 28 trận."
  },
  {
    "id": 244,
    "title": "Số La Mã XIV tương ứng với số nào trong hệ thập phân?",
    "options": [
      "14",
      "16",
      "19",
      "24"
    ],
    "correct": 0,
    "explain": "X = 10, IV = 4 -> XIV = 14."
  },
  {
    "id": 245,
    "title": "Tìm số tự nhiên n biết: 1 + 2 + 3 + ... + n = 55?",
    "options": [
      "9",
      "10",
      "11",
      "12"
    ],
    "correct": 1,
    "explain": "n x (n + 1) : 2 = 55 -> n x (n + 1) = 110 -> n = 10."
  },
  {
    "id": 246,
    "title": "Hai người cùng khởi hành từ 2 điểm cách nhau 150km, đi ngược chiều nhau với vận tốc 30km/h và 45km/h. Sau mấy giờ 2 người gặp nhau?",
    "options": [
      "1.5 giờ",
      "2 giờ",
      "2.5 giờ",
      "3 giờ"
    ],
    "correct": 1,
    "explain": "Thời gian gặp = 150 : (30 + 45) = 2 giờ."
  },
  {
    "id": 247,
    "title": "Một khối rubik 3x3x3 có tất cả bao nhiêu khối lập phương nhỏ?",
    "options": [
      "9 khối",
      "18 khối",
      "27 khối",
      "36 khối"
    ],
    "correct": 2,
    "explain": "3 x 3 x 3 = 27 khối."
  },
  {
    "id": 248,
    "title": "Tìm chữ số x để số 202x chia hết cho cả 2 và 3?",
    "options": [
      "0",
      "2",
      "6",
      "8"
    ],
    "correct": 1,
    "explain": "Chia hết cho 2 -> x chẵn. Tổng các chữ số: 2+0+2+x = 4+x chia hết cho 3 -> x = 2 hoặc x = 8. Với x = 2: 2022 chia hết cho 3."
  },
  {
    "id": 249,
    "title": "An hơn Bình 10 viên bi. Nếu An cho Bình 4 viên thì An còn hơn Bình mấy viên?",
    "options": [
      "2 viên",
      "4 viên",
      "6 viên",
      "8 viên"
    ],
    "correct": 0,
    "explain": "An giảm 4, Bình tăng 4 -> Khoảng cách giảm 8 -> 10 - 8 = 2 viên."
  },
  {
    "id": 250,
    "title": "Một ngày có 86400 giây. Hỏi 1 giờ có bao nhiêu giây?",
    "options": [
      "60 giây",
      "360 giây",
      "3600 giây",
      "6000 giây"
    ],
    "correct": 2,
    "explain": "1 giờ = 60 phút x 60 giây = 3600 giây."
  }
];
