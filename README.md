# 🎓 Hệ Sinh Thái Đồng Phục Mở

<p align="center">
  <img src="https://img.shields.io/badge/.NET-8-512BD4?logo=.net" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/Three.js-000000?logo=three.js" />
  <img src="https://img.shields.io/badge/Azure-SQL-blue" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

> **Biến đồng phục trường học từ "đồ bắt buộc" thành những sản phẩm sinh viên thật sự muốn mặc và sử dụng hằng ngày.**

---

# 📖 Mục lục

* [Giới thiệu](#-giới-thiệu)
* [Demo](#-demo)
* [Chức năng nổi bật](#-chức-năng-nổi-bật)
* [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
* [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
* [Cấu trúc dự án](#-cấu-trúc-dự-án)
* [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
* [Triển khai](#-triển-khai)
* [Hình ảnh hệ thống](#-hình-ảnh-hệ-thống)
* [Đội ngũ](#-đội-ngũ)
* [Liên hệ](#-liên-hệ)

---

# 🌐 Demo

**Website**

https://thealmastore.vercel.app/

---

# 📖 Giới thiệu

Hệ Sinh Thái Đồng Phục Mở là nền tảng thương mại điện tử cho phép sinh viên tự thiết kế và đặt mua các sản phẩm mang nhận diện trường học.

Khác với mô hình bán đồng phục truyền thống, dự án hướng đến việc kết hợp giữa **bản sắc thương hiệu của trường** và **cá tính của sinh viên**, giúp mỗi sản phẩm vừa đảm bảo tính đồng bộ vừa thể hiện dấu ấn cá nhân.

Website đóng vai trò là nền tảng hỗ trợ người dùng lựa chọn sản phẩm, tùy chỉnh thiết kế, đặt hàng và theo dõi đơn hàng trên cùng một hệ thống.

---

# ✨ Chức năng nổi bật

## 🎨 Thiết kế sản phẩm 3D

* Hiển thị mô hình sản phẩm 3D
* Xoay, thu phóng và quan sát sản phẩm
* Thêm hình ảnh
* Thêm logo
* Thêm tên cá nhân
* Thay đổi màu sắc theo quy định của trường
* Xem trước sản phẩm theo thời gian thực

---

## 🛒 Hệ thống mua sắm

* Danh sách sản phẩm
* Tìm kiếm
* Lọc sản phẩm
* Giỏ hàng
* Thanh toán
* Theo dõi đơn hàng

---

## 👤 Quản lý người dùng

* Đăng ký
* Đăng nhập
* Đăng nhập bằng Google
* Quản lý thông tin cá nhân
* Lưu thiết kế
* Lịch sử mua hàng

---

## ⭐ Tương tác

* Đánh giá sản phẩm
* Bình luận
* Hỗ trợ khách hàng qua Zalo

---

## 🔐 Bảo mật

* JWT Authentication
* Google OAuth2
* Role-based Authorization
* Rate Limiting
* IP Blocking
* Security Headers

---

# 🏗️ Kiến trúc hệ thống

```
                 React + TypeScript
                        │
             ASP.NET Core Web API
                        │
     ┌──────────────────┼──────────────────┐
     │                  │                  │
Azure SQL          Cloudinary         SendGrid
```

---

# 🚀 Công nghệ sử dụng

## Frontend

* React
* TypeScript
* Vite
* Three.js
* React Three Fiber
* Fabric.js
* Bootstrap

## Backend

* ASP.NET Core Web API
* .NET 8
* Entity Framework Core
* Clean Architecture

## Database

* SQL Server
* Azure SQL Database

## Cloud Services

* Azure SQL Database
* Cloudinary

## Authentication

* JWT
* Google OAuth2

## DevOps

* Docker
* Vercel
* Render
* Git
* GitHub

---

# 📂 Cấu trúc dự án

```
Open-Uniform-System
│
├── Frontend
│   ├── Components
│   ├── Pages
│   ├── Services
│   ├── Assets
│   └── ThreeJS Editor
│
└── Backend
    ├── API
    ├── Application
    ├── Domain
    ├── Infrastructure
    └── Persistence
```

---

# ⚙️ Hướng dẫn cài đặt

## Yêu cầu

* Node.js 22+
* .NET 8 SDK
* SQL Server hoặc Azure SQL Database

---

## 1. Clone Repository

```bash
git clone https://github.com/PtSon2204/hanh-trinh-exe.git

cd hanh-trinh-exe
```

---

## 2. Cài đặt Backend

Di chuyển đến thư mục API

```bash
cd TheALMAProject/TheALMAProject.API
```

Tạo file `.env`

```env
ConnectionStrings__DefaultConnection=

JwtSettings__SecretKey=

JwtSettings__Issuer=

JwtSettings__Audience=

Cloudinary__CloudName=

Cloudinary__ApiKey=

Cloudinary__ApiSecret=

SendGrid__ApiKey=
```

Khôi phục package

```bash
dotnet restore
```

Cập nhật Database

```bash
dotnet ef database update
```

Chạy Backend

```bash
dotnet run
```

API

```
https://localhost:7000
```

---

## 3. Cài đặt Frontend

```bash
cd TheALMAProject_FE

npm install
```

Tạo file `.env`

```env
VITE_API_BASE_URL=https://localhost:7000/api

VITE_GOOGLE_CLIENT_ID=
```

Chạy Frontend

```bash
npm run dev
```

Website

```
http://localhost:5173
```

---

# 🌍 Triển khai

| Thành phần       | Nền tảng           |
| ---------------- | ------------------ |
| Frontend         | Vercel             |
| Backend          | Render             |
| Database         | Azure SQL Database |
| Lưu trữ hình ảnh | Cloudinary         |

---

# 📸 Hình ảnh hệ thống

> Có thể bổ sung hình ảnh sau khi hoàn thiện giao diện.

* Trang chủ
* Danh sách sản phẩm
* Trình thiết kế 3D
* Giỏ hàng
* Dashboard người dùng
* Dashboard quản trị

---

## 👥 Đội ngũ

| Name | Role |
|------|------|
| Nguyễn Thị Hải Yến | CEO |
| Phạm Thế Sơn | CPO |
| Tăng Lan Anh | CMO |
| Bùi Thị Thuỳ Dương | CFO |
| Nguyễn Phúc Lâm | CTO |
| Nguyễn Bá Sơn | CDO |

## 💻 Development Team

| Name | Role |
|------|------------------|
| Phạm Thế Sơn | Fullstack Developer |  https://github.com/PtSon2204
| Nguyễn Bá Sơn | Fullstack Developer | https://github.com/sonnguyenn10
| Nguyễn Phúc Lâm | Fullstack Developer | https://github.com/lamnguyen231

# 📬 Liên hệ

**Demo**

https://thealmastore.vercel.app/

**Repository**

https://github.com/PtSon2204/hanh-trinh-exe

**GitHub**

https://github.com/PtSon2204

**Email**

[thesonpham28@gmail.com](mailto:thesonpham28@gmail.com)

---

# ⭐ Nếu bạn thấy dự án hữu ích, hãy để lại một Star cho repository!
