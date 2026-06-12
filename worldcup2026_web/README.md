# 🏆 World Cup 2026 Standings & Match Center

Chào mừng bạn đến với **Trung tâm Bảng xếp hạng & Mô phỏng World Cup 2026**! Đây là một ứng dụng web Single Page (SPA) độc lập, hiện đại và tương tác thời gian thực được thiết kế đặc biệt để giúp bạn theo dõi bảng đấu, nhập tỉ số/thẻ phạt và xem thứ hạng thay đổi động.

---

## ✨ Các tính năng nổi bật
*   **Giao diện Dark Mode & Glassmorphism cực kỳ sang trọng**: Thiết kế giao diện bóng bẩy mang phong cách tương lai, tối ưu hiển thị mượt mà.
*   **Xếp hạng thời gian thực động (Dynamic Leaderboard)**: Tự động tính toán điểm, hiệu số (GD), số bàn thắng (GF), thẻ phạt (YC, RC). Khi nhập tỉ số hoặc nhấn nút +/- điểm số, các đội bóng sẽ tự động dịch chuyển lên/xuống kèm hiệu ứng.
*   **Đầy đủ 12 Bảng đấu (48 đội tuyển)**: Tái hiện chân thực cấu trúc bảng đấu lịch sử của World Cup 2026.
*   **Mô phỏng 8 đội xếp thứ 3 tốt nhất**: Thuật toán tự động tổng hợp kết quả của 12 bảng đấu để lọc ra 8 đội đứng thứ 3 xuất sắc nhất giành vé vớt đi tiếp.
*   **Mô phỏng 1 chạm (Simulate Random)**: Nhấn nút để mô phỏng ngẫu nhiên kết quả tất cả các trận đấu với tỉ số bóng đá vô cùng thực tế.
*   **Bộ lọc mạnh mẽ (Match Center)**: Dễ dàng xem lịch thi đấu và nhập kết quả lọc theo Bảng đấu, Lượt đấu hoặc Trạng thái.
*   **Lưu trữ tự động (Auto-Save)**: Tích hợp `localStorage` tự động lưu lại toàn bộ lịch sử trận đấu của bạn ngay khi có thay đổi.

---

## 🛠️ Công nghệ sử dụng
*   **HTML5 & Vanilla CSS3**: Flexbox, CSS Grid, Glassmorphism, Custom Variables, Keyframe Animations.
*   **ES6+ Javascript (Pure Vanilla)**: Hoạt động độc lập hoàn hảo mà không cần cài đặt các thư viện `node_modules` nặng nề.

---

## 🚀 Hướng dẫn khởi chạy nhanh (Local Run)

Bạn có thể chạy ứng dụng web này bằng 2 cách cực kỳ đơn giản sau trên Windows:

### Cách 1: Chạy trực tiếp (Đơn giản nhất, không cần cài đặt gì)
1.  Truy cập vào thư mục dự án: `C:\Users\kienlt.bdg\.gemini\antigravity\scratch\worldcup2026_web`
2.  Nhấp đúp chuột trái vào file **`index.html`** để mở nó trực tiếp trên Chrome, Edge, Firefox hoặc trình duyệt mặc định của bạn.
3.  *Ứng dụng sẽ hoạt động mượt mà ngay lập tức!*

### Cách 2: Chạy qua Local Server nhẹ (Khuyên dùng để tối ưu hóa hiệu năng)
Nếu máy tính của bạn đã cài đặt **Python** hoặc **Node.js**:

*   **Dùng Python**: 
    1.  Mở PowerShell hoặc Command Prompt tại thư mục dự án.
    2.  Chạy lệnh: `python -m http.server 8000`
    3.  Mở trình duyệt truy cập: `http://localhost:8000`
*   **Dùng Node.js / npx**:
    1.  Mở PowerShell tại thư mục dự án.
    2.  Chạy lệnh: `npx http-server`
    3.  Mở trình duyệt theo địa chỉ cổng hiển thị trên màn hình (thường là `http://localhost:8080`).

---

## 📐 Luật xếp hạng vòng bảng được cài đặt (Theo chuẩn FIFA)
1.  **Tổng điểm** (Thắng +3đ, Hòa +1đ, Bại 0đ).
2.  **Hiệu số bàn thắng bại** trong tất cả các trận đấu bảng.
3.  **Số bàn thắng ghi được** trong tất cả các trận đấu bảng.
4.  **Điểm kỷ luật (Fair Play)**: Thẻ vàng trừ 1 điểm, Thẻ đỏ trừ 3 điểm. Đội nào có điểm Fair Play cao hơn (bị trừ ít điểm hơn) sẽ xếp trên.
5.  Thứ tự mặc định / ID gốc làm tie-breaker cuối cùng.
