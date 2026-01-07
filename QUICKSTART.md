<<<<<<< HEAD
# 🚀 Quick Start Guide - EventTicket NFT DApp

## ⚡ Cài đặt nhanh (10 phút)

### 📋 Yêu cầu
- Node.js >= 18
- MetaMask với Sepolia ETH
- Infura API Key

---

## 🔧 Bước 1: Clone & Install

=======
# 🚀 Quick Start Guide - EventTicket DApp

## ⚡ Cài đặt nhanh (5 phút)

### Bước 1: Clone và Install
>>>>>>> 421385c (xxxx)
```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install --legacy-peer-deps
```

<<<<<<< HEAD
---

## 🔑 Bước 2: Cấu hình Environment

```bash
# Tạo file .env trong thư mục backend
cd backend
```

Tạo file `.env` với nội dung:
```env
INFURA_API_KEY=your_infura_api_key
METAMASK_PRIVATE_KEY=your_wallet_private_key
```

📌 **Lấy keys:**
- Infura: https://app.infura.io
- MetaMask: Account → Export Private Key (⚠️ Chỉ dùng ví testnet!)

---

## 📦 Bước 3: Compile & Deploy

```bash
cd backend

# Clean build cũ
npx hardhat clean
rm -rf ./ignition/deployments/chain-11155111

# Compile
npx hardhat compile
rm -rf cache artifacts && npx hardhat compile
rm -rf cache artifacts && npx hardhat compile

# Deploy lên Sepolia
npx hardhat ignition deploy ignition/modules/EventTicketNFT.ts --network sepolia
rm -rf ignition/deployments && npx hardhat ignition deploy ignition/modules/EventTicketNFT.ts --network sepolia
```
npx hardhat compile contracts/EventTicketNFT_flattened.sol 2>&1 | head -20
npx hardhat run scripts/deploy-nft.ts --network sepolia

📌 **LƯU LẠI ĐỊA CHỈ CONTRACT!**

---

## ✏️ Bước 4: Cập nhật Frontend

Mở `frontend/src/App.js`, sửa dòng 8:

```javascript
const CONTRACT_ADDRESS = "YOUR_NEW_CONTRACT_ADDRESS";
```

---

## ▶️ Bước 5: Chạy

=======
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
>>>>>>> 421385c (xxxx)
```bash
cd frontend
npm start
```

<<<<<<< HEAD
🌐 Mở http://localhost:3000

---

## 🎯 Demo nhanh

### Tạo sự kiện
1. Kết nối ví MetaMask (Sepolia)
2. Tab **"➕ Tạo sự kiện"** → **"📝 Điền thông tin"**
3. Điền:
   - Tên: "Concert ABC 2026"
   - Ngày sự kiện: Chọn ngày tương lai
   - Ngày kết thúc bán vé: Trước ngày sự kiện
   - **Economy**: Giá 0.01 ETH, SL: 100
   - **Standard**: Giá 0.05 ETH, SL: 50
   - **VIP**: Giá 0.1 ETH, SL: 20
4. Click **"🚀 Tạo sự kiện"**

### Mua vé NFT
1. Tab **"🎪 Sự kiện"**
2. Chọn sự kiện → **"Chi tiết"**
3. Chọn loại vé (Economy/Standard/VIP)
4. Click **"🎫 Mua vé"**
5. Confirm MetaMask

### Xem vé & QR
1. Tab **"🎟️ Vé NFT của tôi"**
2. Click vào QR để phóng to

### Chuyển nhượng vé
1. Trên vé, click **"🔄 Chuyển nhượng"**
2. Nhập địa chỉ người nhận
3. Confirm

### Hoàn vé
1. Trên vé, click **"💰 Hoàn vé"**
2. Xem số tiền hoàn (95% hoặc 100%)
3. Confirm để nhận ETH

---

## 🔑 Commands Cheatsheet

```bash
# Compile contract
npx hardhat compile

# Run tests
npx hardhat test test/EventTicketNFT.ts

# Deploy to Sepolia
npx hardhat ignition deploy ignition/modules/EventTicketNFT.ts --network sepolia

# Clean build
npx hardhat clean

# Run frontend
cd frontend && npm start
```

---

## 💰 Lấy Test ETH (Sepolia)

- https://sepoliafaucet.com/
- https://www.infura.io/faucet/sepolia
- https://www.alchemy.com/faucets/ethereum-sepolia

---

## ❗ Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| Thiếu ETH | Lấy từ faucet |
| Contract not found | Kiểm tra địa chỉ trong App.js |
| MetaMask reject | Đổi sang Sepolia network |
| npm install lỗi | Thêm `--legacy-peer-deps` |

---

## 📚 Tài liệu đầy đủ

Xem **README.md** để biết chi tiết!

---

**🎉 Happy Building!**
=======
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
>>>>>>> 421385c (xxxx)
