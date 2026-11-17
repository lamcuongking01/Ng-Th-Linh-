# Tri Ân 20/11 · Cô Ngô Thị Linh

Trang web thiệp chúc mừng ngày Nhà giáo Việt Nam 20/11 gửi tặng cô **Ngô Thị Linh** cùng tập thể **45 học sinh**.

## Cách 1 · Dán / upload trực tiếp `index.html`, `style.css`, `script.js` lên GitHub Pages (không cần build)
Nếu bạn copy-paste hoặc upload thẳng lên GitHub:
1. Chỉ copy các file trong thư mục **`github-static/`** (`index.html`, `style.css`, `script.js`, thư mục `images/`, và tùy chọn `bai1.mp3`, `bai2.mp3`) vào thư mục gốc của repository mới.
2. Vào **Settings -> Pages -> Source: Deploy from a branch -> Branch: `main` / `(root)`**.
3. **Lưu ý tránh màn hình trắng**: Không copy `index.html` ở thư mục gốc của dự án Vite (vì file này trỏ tới `/src/main.tsx` cần bước build).

## Cách 2 · Đẩy toàn bộ mã nguồn React/Vite & tự động build bằng GitHub Actions
1. Đặt 2 file nhạc (tùy chọn) vào `public/bai1.mp3` và `public/bai2.mp3`.
2. Đẩy toàn bộ mã nguồn lên nhánh `main` của repository GitHub.
3. Vào **Settings -> Pages -> Build and deployment**, chọn **Source: GitHub Actions** (không chọn Deploy from a branch).
4. Workflow `.github/workflows/deploy.yml` sẽ tự động chạy `npm run build` và xuất bản trang web.
