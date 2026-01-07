# 🚀 Quick Start Guide - EventTicket DApp

## ⚡ Cài đặt nhanh (5 phút)

### Bước 1: Clone và Install
```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install --legacy-peer-deps
```

### Bước 2: Cấu hình
```bash
# Tạo file .env trong backend
cd backend
echo "INFURA_API_KEY=your_key" > .env
echo "METAMASK_PRIVATE_KEY=your_private_key" >> .env
```

### Bước 3: Deploy Contract
```bash
cd backend
npx hardhat clean
rm -rf ignition/deployments/chain-11155111
npx hardhat compile
npx hardhat ignition deploy ignition/modules/EventTicket.ts --network sepolia
# Lưu lại contract address!
```

### Bước 4: Cập nhật Frontend
```javascript
// Sửa frontend/src/App.js dòng 9
const { contract } = useContract("YOUR_CONTRACT_ADDRESS");
```

### Bước 5: Chạy
```bash
cd frontend
npm start
```

## 🎯 Demo nhanh

### Tạo sự kiện (Ai cũng được)
1. Kết nối ví bất kỳ
2. Tab "➕ Tạo sự kiện" → "📝 Điền thông tin"
3. Điền form:
   - Tên: "Concert 2026"
   - Giá vé: 0.001 ETH
   - Số vé: 100
   - Ngày: Chọn ngày tương lai
4. Click "🚀 Tạo sự kiện"

### Mua vé (Ai cũng được)
1. Kết nối ví bất kỳ
2. Tab "🎪 Sự kiện"
3. Chọn sự kiện → "🎫 Mua vé"
4. Xác nhận MetaMask

### Xem vé
Tab "🎟️ Vé của tôi" → Xem mã vé

## 📱 Test Account

Để test nhanh, bạn cần:
- Ít nhất 1 ví MetaMask
- Kết nối ví → Tạo event → Mua vé

## 🔑 Commands cheatsheet

```bash
# Compile
npx hardhat compile

# Test
npx hardhat test

# Deploy
npx hardhat ignition deploy ignition/modules/EventTicket.ts --network sepolia

# Run frontend
cd frontend && npm start

# Clean build
npx hardhat clean
```

## 💰 Lấy test ETH
- https://sepoliafaucet.com/
- https://www.infura.io/faucet/sepolia

---
**Có vấn đề?** Đọc EVENTTICKET_README.md để biết chi tiết!
