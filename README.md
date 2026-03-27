# 🍜 Food Tour API — Backend

Backend API cho ứng dụng **Food Tour** — hệ thống quản lý nhà hàng, thực đơn, quét mã QR check-in và phát audio giới thiệu.

## 📋 Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---------|-------------------|
| Node.js | 18.x trở lên |
| PostgreSQL | 12 trở lên |
| npm | 8.x trở lên |

---
## 🎨 Giao diện dự án

![Chọn ngôn ngữ](/assets/anh_chon_ngon_ngu.jpg)
*Ảnh giao diện chọn ngôn ngữ*

![Đăng ký](/assets/anh_dang_ky.jpg)
*Ảnh giao diện đăng ký*

![Đăng nhập](/assets/anh_dang_nhap.jpg)
*Ảnh giao diện đăng nhập*

![Trang chủ](/assets/anh_trang_chu.jpg)
*Ảnh giao diện trang chủ*

---

## 🚀 Hướng dẫn cài đặt & chạy project

### Bước 1 — Cài đặt dependencies

```bash
cd backend
npm install
```

### Bước 2 — Tạo file `.env`

Tạo file `.env` trong thư mục `backend/` với nội dung sau:

```env
# ===== Cấu hình Database PostgreSQL =====
DB_USER=postgres
DB_HOST=localhost
DB_NAME=Seminar
DB_PASSWORD=your_password_here
DB_PORT=5432

# ===== Cấu hình Server =====
PORT=3000
```

> ⚠️ Thay `postgres` và `your_password_here` bằng thông tin PostgreSQL thực tế của bạn.
> ⚠️ **Không commit file `.env` lên Git.**

---

### Bước 3 — Tạo database PostgreSQL

#### Cách 1: Dùng terminal / psql

```bash
# Tạo database mới
psql -U postgres -c "CREATE DATABASE Seminar;"

# Chạy file SQL để tạo toàn bộ bảng, index và foreign key
psql -U postgres -d Seminar -f db_seminar.sql
```

#### Cách 2: Dùng pgAdmin (GUI)

1. Mở **pgAdmin** → kết nối PostgreSQL server
2. Chuột phải vào **Databases** → **Create** → **Database...**
3. Đặt tên database: `Seminar` → nhấn **Save**
4. Click chuột phải vào `Seminar` → **Query Tool**
5. Nhấn **Open File** → chọn file `db_seminar.sql` → nhấn **F5** để chạy

> ✅ Script SQL tự động tạo extension `pgcrypto`, tất cả các bảng, constraint, index và foreign key.

---

### Bước 4 — Chạy server

```bash
# Development mode (tự động reload khi sửa code — dùng nodemon)
npm start

# Production mode
node src/app.js
```

Server khởi động tại: **`http://localhost:3000`**

---

## 📚 Tài liệu API (Swagger UI)

Sau khi server chạy, truy cập:

```
http://localhost:3000/api-docs
```

Toàn bộ API đều được document đầy đủ tại đây với khả năng test trực tiếp trên trình duyệt.

---

## 📁 Cấu trúc Project

```
backend/
├── src/
│   ├── app.js                      # Entry point — khởi tạo Express & mount routes
│   ├── config/
│   │   ├── db.js                   # Kết nối PostgreSQL (Pool)
│   │   ├── multer.js               # Cấu hình upload file ảnh
│   │   └── swagger.js              # Cấu hình Swagger docs
│   ├── controllers/                # Xử lý logic nghiệp vụ
│   ├── models/                     # Truy vấn database (SQL thuần qua pg)
│   └── routes/                     # Định nghĩa API endpoints + JSDoc Swagger
├── uploads/
│   ├── avatars/                    # Ảnh avatar người dùng
│   ├── restaurants/                # Ảnh nhà hàng
│   └── items/                      # Ảnh món ăn
├── qrcodes/                        # QR code PNG của từng nhà hàng
├── db_seminar.sql                  # Schema database (chạy 1 lần khi setup)
├── package.json
└── .env                            # Biến môi trường (tự tạo, không commit)
```

---

## 🗄️ Database

| Bảng | Mô tả |
|------|-------|
| `accounts` | Tài khoản đăng nhập (email, password_hash, role) |
| `users` | Thông tin profile người dùng |
| `restaurants` | Nhà hàng (tên, địa chỉ, toạ độ, QR code) |
| `menu_items` | Món ăn trong menu nhà hàng |
| `scripts` | Nội dung script giới thiệu nhà hàng |
| `restaurant_script_map` | Liên kết nhà hàng ↔ script (có `is_active`) |
| `restaurant_owners` | Liên kết user ↔ nhà hàng (chủ sở hữu) |
| `scan_history` | Lịch sử quét QR của user |

**Role tài khoản:** `user` \| `owner` \| `admin`
**Status user:** `active` \| `inactive` \| `banned`
**Status nhà hàng:** `approved` \| `pending` \| `rejected` \| `deleted`
**Status món ăn:** `available` \| `unavailable`

---

## 🔗 API Endpoints

> Base URL: `http://localhost:3000`
> `*` = bắt buộc

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Mô tả | Body |
|--------|----------|-------|------|
| POST | `/api/auth/register` | Đăng ký tài khoản | `multipart/form-data`: `email`\*, `password`\*, `name`\*, `language`\*, `avatar` (ảnh, tùy chọn) |
| POST | `/api/auth/login` | Đăng nhập | `JSON`: `identifier`\* (email hoặc username), `password`\* |

### 👤 Account — `/api/accounts`

| Method | Endpoint | Mô tả | Body |
|--------|----------|-------|------|
| GET | `/api/accounts` | Lấy danh sách tài khoản | — |
| POST | `/api/accounts` | Tạo tài khoản thủ công | `JSON`: `email`\*, `password`\* |

### 🙍 User — `/api/user`

| Method | Endpoint | Mô tả | Body / Params |
|--------|----------|-------|---------------|
| GET | `/api/user/profile/:id_account` | Lấy profile | Params: `id_account` (UUID) |
| PUT | `/api/user/profile` | Cập nhật profile | `multipart/form-data`: `id_account`\*, `name`, `language`, `avatar` |
| DELETE | `/api/user/:id_account` | Xóa mềm user (status → `inactive`) | Params: `id_account` |

### 🏠 Restaurant — `/api/restaurant`

| Method | Endpoint | Mô tả | Body / Params |
|--------|----------|-------|---------------|
| POST | `/api/restaurant/create` | Tạo nhà hàng + sinh QR code | `multipart/form-data`: `name`\*, `id_user`\*, `description`, `address`, `latitude`, `longitude`, `image` |
| GET | `/api/restaurant` | Lấy danh sách tất cả nhà hàng | — |
| GET | `/api/restaurant/:id_restaurant` | Lấy chi tiết nhà hàng | — |
| PUT | `/api/restaurant/:id_restaurant` | Cập nhật thông tin + ảnh | `multipart/form-data`: `name`, `description`, `address`, `latitude`, `longitude`, `image` |
| PUT | `/api/restaurant/:id_restaurant/soft-delete` | Xóa mềm (status → `deleted`) | — |

> 💡 Khi tạo nhà hàng thành công: QR code PNG được sinh và lưu tại `qrcodes/<id_restaurant>.png`, đồng thời role của `id_user` tự động được nâng lên `owner`.

### 🍜 Menu Item — `/api/menu-items`

| Method | Endpoint | Mô tả | Body / Query |
|--------|----------|-------|--------------|
| POST | `/api/menu-items` | Tạo món ăn mới | `multipart/form-data`: `id_restaurant`\*, `name`\*, `description`, `price`, `image` |
| GET | `/api/menu-items` | Lấy danh sách món ăn | Query: `?id_restaurant=<uuid>` (lọc theo nhà hàng) |
| GET | `/api/menu-items/:id_menu_item` | Lấy chi tiết món ăn | — |
| PUT | `/api/menu-items/:id_menu_item` | Cập nhật món ăn | `multipart/form-data`: `name`, `description`, `price`, `image`, `status` |
| PUT | `/api/menu-items/:id_menu_item/soft-delete` | Xóa mềm món ăn | — |


### 📝 Script — `/api/scripts`

| Method | Endpoint | Mô tả | Body |
|--------|----------|-------|------|
| POST | `/api/scripts` | Tạo script + liên kết nhà hàng | `JSON`: `content`\*, `id_restaurant`\* |
| GET | `/api/scripts` | Lấy danh sách tất cả script | — |
| GET | `/api/scripts/:id_script` | Lấy chi tiết script | — |
| PUT | `/api/scripts/:id_script` | Cập nhật nội dung script | `JSON`: `content`\* |
| PUT | `/api/scripts/:id_script/soft-delete` | Xóa mềm script (status → `deleted`) | — |

### 🔗 Restaurant Script Map — `/api/restaurant-script-map`

| Method | Endpoint | Mô tả | Body |
|--------|----------|-------|------|
| GET | `/api/restaurant-script-map/:id_restaurant` | Lấy tất cả script của một nhà hàng | — |
| GET | `/api/restaurant-script-map/:id_restaurant/:id_script` | Lấy chi tiết mapping | — |
| PUT | `/api/restaurant-script-map/:id_restaurant/:id_script/is-active` | Bật/tắt script cho nhà hàng | `JSON`: `is_active` (boolean) |

### 🏠👤 Restaurant Owner — `/api/restaurant-owner`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/restaurant-owner` | Lấy danh sách tất cả quan hệ chủ - nhà hàng |
| GET | `/api/restaurant-owner/:id_user/:id_restaurant` | Lấy chi tiết một quan hệ |

### 🎵 Restaurant Audio Map — `/api/restaurant-audio-map`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/restaurant-audio-map` | Lấy danh sách tất cả mapping audio |
| GET | `/api/restaurant-audio-map/:id_restaurant/:id_audio` | Lấy chi tiết mapping |

### 📋 Scan History — `/api/scan-history`

| Method | Endpoint | Mô tả | Params / Query |
|--------|----------|-------|----------------|
| GET | `/api/scan-history` | Lấy toàn bộ lịch sử quét (admin) | — |
| GET | `/api/scan-history/:id_user/:id_restaurant` | Kiểm tra user đã quét nhà hàng chưa | Params: `id_user`, `id_restaurant` |
| GET | `/api/scan-history/user/:id_user` | Lịch sử quét của một user | Query: `?limit=50` (mặc định 50) |

---

## 🖼️ Static Files

Sau khi upload, file có thể truy cập trực tiếp qua URL:

| Loại | URL truy cập |
|------|-------------|
| Avatar người dùng | `http://localhost:3000/uploads/avatars/<filename>` |
| Ảnh nhà hàng | `http://localhost:3000/uploads/restaurants/<filename>` |
| Ảnh món ăn | `http://localhost:3000/uploads/items/<filename>` |
| QR code | `http://localhost:3000/qrcodes/<id_restaurant>.png` |

**Giới hạn upload:** Tối đa **5MB**, chỉ chấp nhận định dạng `jpeg`, `jpg`, `png`.

---

## 🛠️ Troubleshooting

### ❌ Lỗi kết nối database

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Giải pháp:**
- Đảm bảo PostgreSQL đang chạy (kiểm tra trong Services hoặc chạy `pg_ctl status`)
- Kiểm tra thông tin `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` trong `.env`
- Đảm bảo database `Seminar` đã được tạo

---

### ❌ Lỗi port bị chiếm

```
Error: listen EADDRINUSE :::3000
```

**Giải pháp:**

```bash
# Windows — Tìm PID đang dùng port 3000
netstat -ano | findstr :3000

# Kill process theo PID tìm được
taskkill /PID <PID> /F
```

Hoặc đổi `PORT=3001` trong file `.env`.

---

### ❌ Lỗi thiếu extension `pgcrypto`

```
ERROR: function gen_random_uuid() does not exist
```

**Giải pháp:** Chạy lệnh sau trong psql hoặc pgAdmin:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

### ❌ Lỗi upload file

```
Chỉ chấp nhận file ảnh jpeg/jpg/png
```

**Giải pháp:**
- Chỉ upload file ảnh định dạng `.jpg`, `.jpeg` hoặc `.png`
- Kích thước file phải nhỏ hơn **5MB**

---

## 📦 Dependencies

| Package | Phiên bản | Mục đích |
|---------|-----------|---------|
| `express` | ^5.2.1 | Web framework |
| `pg` | ^8.20.0 | Driver kết nối PostgreSQL |
| `dotenv` | ^17.3.1 | Đọc biến môi trường từ `.env` |
| `multer` | ^2.1.1 | Upload file ảnh |
| `qrcode` | ^1.5.4 | Tạo QR code PNG |
| `express-validator` | ^7.3.1 | Validate dữ liệu đầu vào |
| `swagger-jsdoc` | ^6.2.8 | Sinh tài liệu API từ JSDoc comment |
| `swagger-ui-express` | ^5.0.1 | Giao diện Swagger UI trên trình duyệt |

---

**Happy coding! 🎉**
