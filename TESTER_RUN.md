# Hướng dẫn chạy dự án cho tester (không dùng Docker)

## 1) Yêu cầu máy

- Node.js 20 trở lên
- MongoDB cài local (mặc định cổng 27017)

## 2) Cấu trúc gửi cho tester

Gửi nguyên thư mục `lost-and-found` (bao gồm `backend` và `frontend`).

## 3) Chuẩn bị backend

Mở terminal 1:

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend` với nội dung mẫu:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/lostandfound
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_PASSWORD=change-this-admin-password
```

Chạy backend:

```bash
npm run dev
```

## 4) (Tùy chọn) Tạo dữ liệu mẫu

Trong terminal backend:

```bash
npm run seed
node seed-claims.js
```

## 5) Chuẩn bị frontend

Mở terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt tại:

- http://localhost:5173

## 6) Tài khoản admin mặc định

- Username: `admin`
- Password: lấy theo biến `ADMIN_PASSWORD` trong file `.env`

## 7) Nếu tester gặp lỗi thường gặp

- Lỗi không kết nối API: kiểm tra backend có chạy ở `http://localhost:3000`
- Lỗi DB: kiểm tra MongoDB service đã bật
- Lỗi cổng bận: đổi cổng trong `.env` và chạy lại
