# 💰 Personal Finance App - Ứng dụng Quản lý Tài chính Cá nhân

Ứng dụng quản lý tài chính cá nhân được xây dựng bằng React Native (Expo) và TypeScript.

## ✨ Tính năng

- ✅ **Theo dõi Thu Chi**: Ghi chép thu nhập và chi tiêu hàng ngày
  - Thêm giao dịch nhanh từ màn hình chính
  - Form nhập liệu đầy đủ với danh mục, số tiền, mô tả
  - Xem danh sách tất cả giao dịch với bộ lọc
  - Xóa giao dịch bằng cách giữ lâu (long press)
- ✅ **Quản lý Ngân sách**: Đặt và theo dõi ngân sách cho từng danh mục
- ✅ **Báo cáo & Biểu đồ**: Xem báo cáo chi tiết với biểu đồ trực quan
- ✅ **Phân loại Giao dịch**: Tổ chức giao dịch theo nhiều danh mục
- ✅ **Nhắc nhở Thanh toán**: Nhận thông báo cho các khoản thanh toán sắp tới

## 🎯 Hướng dẫn Sử dụng

### Thêm Giao dịch

1. **Từ màn hình chính (Home)**:
   - Nhấn nút "Thu nhập" (màu xanh) hoặc "Chi tiêu" (màu đỏ)
   - Điền thông tin: số tiền, chọn danh mục, nhập mô tả
   - Nhấn "Lưu giao dịch"

2. **Từ màn hình Giao dịch**:
   - Chuyển sang tab "Giao dịch" 💰
   - Nhấn nút "+" ở góc dưới bên phải
   - Điền thông tin và lưu

### Xem Giao dịch

- Tab "Giao dịch" hiển thị tất cả giao dịch trong tháng
- Lọc theo loại: Tất cả / Thu nhập / Chi tiêu
- Kéo xuống để làm mới dữ liệu
- Giữ lâu vào một giao dịch để xóa

### Tổng quan Tài chính

- Màn hình chính hiển thị:
  - Số dư tháng hiện tại
  - Tổng thu nhập
  - Tổng chi tiêu
  - 5 giao dịch gần nhất

## 🚀 Bắt đầu

### Cài đặt

```bash
cd personal-finance-app
npm install
```

### Chạy ứng dụng

```bash
# Chạy trên iOS
npm run ios

# Chạy trên Android  
npm run android

# Chạy trên Web
npm run web
```

## 📁 Cấu trúc Dự án

```
personal-finance-app/
├── src/
│   ├── components/        # Các component tái sử dụng
│   ├── navigation/        # Cấu hình navigation
│   ├── screens/          # Các màn hình
│   │   ├── HomeScreen.tsx
│   │   ├── TransactionsScreen.tsx
│   │   ├── BudgetScreen.tsx
│   │   ├── ReportsScreen.tsx
│   │   └── RemindersScreen.tsx
│   ├── services/         # Services (Storage, Notifications)
│   │   ├── storage.ts
│   │   └── notifications.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── utils/            # Utilities & constants
│       └── constants.ts
├── App.tsx
└── package.json
```

## �� Công nghệ Sử dụng

- **React Native** - Framework mobile
- **Expo** - Toolchain và platform
- **TypeScript** - Type safety
- **React Navigation** - Navigation
- **AsyncStorage** - Local data storage
- **Expo Notifications** - Push notifications
- **date-fns** - Date manipulation
- **react-native-chart-kit** - Charts và graphs

## 📊 Danh mục Giao dịch

### Thu nhập
- 💰 Lương
- 🎁 Thưởng
- 📈 Đầu tư
- 💵 Thu nhập khác

### Chi tiêu
- 🍔 Ăn uống
- 🚗 Di chuyển
- 🛍️ Mua sắm
- 🎬 Giải trí
- 📄 Hóa đơn
- 🏥 Y tế
- 📚 Giáo dục
- 💸 Chi tiêu khác

## 🔔 Thông báo

Ứng dụng sử dụng Expo Notifications để gửi nhắc nhở thanh toán. Người dùng cần cấp quyền thông báo khi sử dụng tính năng này.

## 💾 Lưu trữ Dữ liệu

Tất cả dữ liệu được lưu trữ local trên thiết bị sử dụng AsyncStorage:
- Giao dịch (Transactions)
- Ngân sách (Budgets)
- Nhắc nhở (Reminders)

## 🎨 Màu sắc Chủ đạo

- Primary: `#6200EE` (Purple)
- Secondary: `#03DAC6` (Teal)
- Income: `#4CAF50` (Green)
- Expense: `#F44336` (Red)

## 📱 Screenshots

_Thêm screenshots của ứng dụng tại đây_

## 🔄 Cập nhật Tiếp theo

- [ ] Xuất báo cáo PDF
- [ ] Đồng bộ cloud
- [ ] Multi-currency support
- [ ] Dark mode
- [ ] Biometric authentication
- [ ] Backup/Restore dữ liệu

## 📝 License

MIT

## 👨‍💻 Tác giả

Phát triển bởi [Tên của bạn]

---

Happy coding! 💻✨
