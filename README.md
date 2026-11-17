# Tri Ân 20/11 · Cô Ngô Thị Linh

Trang web thiệp chúc mừng ngày Nhà giáo Việt Nam 20/11 gửi tặng cô **Ngô Thị Linh** cùng tập thể **45 học sinh**.

## Cách thêm nhạc MP3 trước khi đưa lên GitHub
Đặt 2 file nhạc vào thư mục `public/`:
- `public/bai1.mp3`
- `public/bai2.mp3`

## Đẩy lên GitHub & tự động build lên GitHub Pages
1. Đẩy toàn bộ mã nguồn lên nhánh `main` của repository GitHub.
2. Vào **Settings -> Pages -> Build and deployment**, chọn **Source: GitHub Actions**.
3. Workflow `.github/workflows/deploy.yml` sẽ tự động chạy `npm run build` và xuất bản trang web.
