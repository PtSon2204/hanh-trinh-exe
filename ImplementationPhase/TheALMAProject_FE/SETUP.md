# 🚀 Setup Guide — TheALMAProject FE

## Yêu cầu bắt buộc

| Tool    | Version   |
|---------|-----------|
| Node.js | `22.x`    |
| npm     | `10.x`    |

> ⚠️ **Dùng sai version Node/npm sẽ bị lỗi** vì project đã cấu hình `engine-strict=true`

---

## Lần đầu setup (Clone về)

```bash
# 1. Vào đúng thư mục FE (QUAN TRỌNG: không chạy npm install ở thư mục cha)
cd TheALMAProject_FE

# 2. Cài dependencies từ lockfile (không tự ý update version)
npm ci

# 3. Chạy dev server
npm run dev
```

> ✅ **Luôn dùng `npm ci` thay vì `npm install`** khi kéo code về.  
> `npm ci` đảm bảo cài đúng version trong `package-lock.json`, không tự update.

---

## Khi muốn thêm package mới

```bash
# Thêm dependency (ví dụ: thêm thư viện mới)
npm install <tên-package>

# Sau đó COMMIT CẢ HAI file lên git:
git add package.json package-lock.json
git commit -m "chore: add <tên-package>"
```

> ⚠️ **Không bao giờ xóa hoặc gitignore `package-lock.json`** — đây là file giữ version cố định cho cả team.

---

## Khi kéo code về và có thay đổi package

```bash
git pull

# Nếu package.json có thay đổi, chạy:
npm ci
```

---

## Xử lý lỗi thường gặp

### ❌ Trang trắng / "Invalid hook call"
```bash
# Xóa node_modules và cài lại sạch
rmdir /s /q node_modules
del package-lock.json
npm install
```

### ❌ "engine" không đúng version
Cài Node.js đúng version tại: https://nodejs.org/  
Hoặc dùng nvm: `nvm use 22`

### ❌ Đang ở thư mục sai
Đảm bảo terminal đang ở `TheALMAProject_FE/`, **không phải** `ImplementationPhase/`
