HUONG DAN DANG LEN GITHUB PAGES (KHONG BI MAN HINH TRANG):

=== CACH 1: DAN / UPLOAD TRUC TIEP 3 FILE (KHUYEN DUNG) ===
1. Tao repository moi tren GitHub.
2. Chi upload hoac copy-paste DUNG cac file tu thu muc github-static/ nay vao thu muc goc cua repo:
   - index.html
   - style.css
   - script.js
   - thu muc images/ (khong bat buoc - neu thieu he thong van tu hien minh hoa hoa hong)
   - bai1.mp3, bai2.mp3 (tuy chon - neu chua co trang van tu phat nhac dan)
3. Vao GitHub -> Settings -> Pages -> Build and deployment:
   - Source: Deploy from a branch
   - Branch: main / (root) -> Save.
4. LUU Y QUAN TRONG: KHONG copy file index.html o thu muc goc (chua /src/main.tsx) len nhanh main theo cach nay, vi se bi man hinh trang!

=== CACH 2: DAY TOAN BO CODE REACT/VITE LEN GITHUB ===
1. Day toan bo project len nhanh main.
2. Vao Settings -> Pages -> Source: chon "GitHub Actions" (khong chon "Deploy from a branch").
3. GitHub Actions (.github/workflows/deploy.yml) se tu dong build va publish trang web.
