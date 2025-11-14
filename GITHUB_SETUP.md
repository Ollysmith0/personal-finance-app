# 🔐 HƯỚNG DẪN SETUP GITHUB AUTHENTICATION

## Bước 1: Tạo Personal Access Token (Classic)

1. Đăng nhập GitHub bằng account **Tuht1**
2. Vào: https://github.com/settings/tokens
3. Click **"Generate new token"** → Chọn **"Generate new token (classic)"**
4. Điền thông tin:
   - **Note:** `personal-finance-app` (tên để nhớ)
   - **Expiration:** 90 days (hoặc No expiration)
   - **Select scopes:** Tick **repo** (full control of private repositories)
5. Scroll xuống, click **"Generate token"**
6. **QUAN TRỌNG:** Copy token ngay (chỉ hiện 1 lần!)
   - Token có dạng: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Lưu vào note hoặc file an toàn

---

## Bước 2: Xóa credential cũ trên macOS

Mở Terminal, chạy:

```bash
git credential-osxkeychain erase
```

Sau đó nhập (từng dòng):
```
host=github.com
protocol=https
```

Nhấn **Enter** 2 lần để xác nhận.

---

## Bước 3: Push code với Token

```bash
cd /Users/tuht1/Documents/personal-finance-app
git push -u origin main
```

Khi được hỏi:
- **Username:** `Tuht1`
- **Password:** Paste **Personal Access Token** vừa tạo (không phải password GitHub)

---

## Bước 4: Verify push thành công

Sau khi push xong, kiểm tra:
- Vào: https://github.com/Ollysmith0/personal-finance-app
- Xem có code mới không

---

## Bước 5: Enable GitHub Pages cho Privacy Policy

1. Vào: https://github.com/Ollysmith0/personal-finance-app/settings/pages
2. **Source:** Deploy from a branch
3. **Branch:** main → / (root) → Save
4. Đợi 1-2 phút
5. Privacy Policy URL sẽ là:
   ```
   https://ollysmith0.github.io/personal-finance-app/privacy-policy.html
   ```

---

## 🚨 LƯU Ý QUAN TRỌNG:

### Nếu bạn là owner của cả 2 accounts (Ollysmith0 + Tuht1):
- Cách dễ nhất: **Đăng nhập bằng Ollysmith0** để push code
- Tạo token từ account **Ollysmith0** thay vì Tuht1
- Khi push, dùng username: `Ollysmith0` + token của Ollysmith0

### Nếu Tuht1 là collaborator:
- Đảm bảo Tuht1 đã được invite với quyền **Write**
- Vào email Tuht1, accept invitation
- Tạo token từ account **Tuht1**
- Push với username: `Tuht1` + token của Tuht1

---

## ❓ Cần giúp gì thêm?

Nếu vẫn bị lỗi, gửi cho mình:
- Screenshot lỗi
- Username bạn đang dùng (Ollysmith0 hay Tuht1?)
- Repo có phải của bạn 100% không?
