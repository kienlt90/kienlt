# Garmin Swim Analytics - Personal Dashboard

Một ứng dụng Dashboard phân tích dữ liệu bơi lội cá nhân từ đồng hồ Garmin, thiết kế với phong cách tối giản, hiện đại (Galactic Dark & Glassmorphism) và hiển thị trực quan các chỉ số kỹ thuật như SWOLF, Pace, Nhịp tim, phân loại bể bơi/nước ngoài trời.

Ứng dụng chạy hoàn toàn ở phía client (trình duyệt của bạn), **không cần cài đặt backend, không lưu trữ dữ liệu của bạn trên bất kỳ máy chủ nào**, đảm bảo tính bảo mật và riêng tư tuyệt đối.

## 🚀 Cách Khởi Chạy Dashboard

Bạn có hai cách để mở và sử dụng Dashboard:

### Cách 1: Mở trực tiếp (Không cần cài đặt)
Chỉ cần kích hoạt tệp `index.html` bằng cách double-click (nhấp đúp chuột) để mở trực tiếp trong trình duyệt web của bạn.
*   *Lưu ý:* Khi mở trực tiếp qua giao thức `file://`, nút **"Load Demo Data"** sẽ tự động chuyển sang dữ liệu giả lập có sẵn trong code để tránh lỗi bảo mật CORS của trình duyệt. Việc kéo thả file của chính bạn vẫn hoạt động hoàn hảo 100%.

### Cách 2: Chạy qua Local Web Server (Khuyên dùng cho nhà phát triển)
Nếu bạn có Python cài đặt trên máy, hãy mở Terminal trong thư mục này và chạy:
```bash
python -m http.server 8000
```
Sau đó mở trình duyệt và truy cập: `http://localhost:8000`

---

## 📥 Cách Xuất File Dữ Liệu CSV Từ Garmin Connect

Để tải dữ liệu lịch sử bơi lội của chính bạn từ Garmin, hãy làm theo các bước đơn giản sau:

1.  Truy cập vào trang web [Garmin Connect](https://connect.garmin.com/) trên máy tính và đăng nhập tài khoản của bạn.
2.  Ở thanh menu bên trái, chọn **Activities** -> **All Activities** (Hoạt động -> Tất cả hoạt động).
3.  Ở trên cùng danh sách hoạt động, chọn bộ lọc loại hoạt động là **Swimming** (Bơi lội) (hoặc bơi bể bơi/bơi nước mở) để lọc riêng các buổi bơi.
4.  **Quan trọng:** Garmin sử dụng cuộn trang vô hạn. Hãy cuộn chuột xuống cuối danh sách để tải thêm các hoạt động bơi lội cũ. Cuộn đến khi hiển thị hết khoảng thời gian bạn muốn phân tích (ví dụ: bơi trong vòng 1 năm qua).
5.  Nhấp vào nút **Export CSV** (Xuất dưới dạng CSV) nằm ở phía trên góc phải của danh sách hoạt động (ngay bên cạnh các nút lọc).
6.  Một tệp tin có tên như `Activities.csv` hoặc `danh_sach_hoat_dong.csv` sẽ được tải về máy của bạn.
7.  Kéo thả tệp tin vừa tải về vào ô uploader trên Dashboard của chúng ta!

---

## 📈 Các Chỉ Số Phân Tích Chính

*   **Quãng đường tích lũy**: Xem tổng số mét bơi lội qua các tuần/tháng.
*   **Pace (Tốc độ / 100m)**: Biểu đồ xu hướng tốc độ bơi trung bình, được thiết kế trục ngược đặc biệt dành cho bơi lội (tốc độ nhanh hơn sẽ hiển thị cao hơn).
*   **Chỉ số SWOLF**: Đo lường hiệu quả kỹ thuật bơi của bạn (SWOLF = Thời gian bơi 1 chiều bể + Số lần quạt tay). SWOLF càng thấp nghĩa là kỹ thuật của bạn càng tối ưu.
*   **Biến thiên Nhịp tim (Avg & Max HR)**: Theo dõi cường độ tim mạch để tối ưu hóa bài tập sức bền.
*   **AI Technical Coach**: Đưa ra nhận xét tự động về hiệu quả quạt tay và lời khuyên kỹ thuật dựa trên chỉ số SWOLF trung bình của bạn.
*   **Bảng nhật ký thông minh**: Cho phép lọc tìm kiếm theo tên buổi bơi, sắp xếp tăng/giảm theo mọi cột chỉ số (Ngày bơi, Quãng đường, SWOLF, Nhịp tim...).
