# 🎫 EventTicket NFT DApp

> **Hệ thống mua vé sự kiện NFT phi tập trung trên Blockchain Ethereum**

![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Hardhat](https://img.shields.io/badge/Hardhat-3.1-yellow)
![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.0-4e5ee4)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cài đặt](#-cài-đặt)
- [Deployment](#-deployment)
- [Chạy ứng dụng](#-chạy-ứng-dụng)
- [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [Smart Contract](#-smart-contract)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Giới thiệu

**EventTicket NFT DApp** là một ứng dụng phi tập trung (DApp) cho phép:
- 🎫 **Mua vé sự kiện** dưới dạng NFT (ERC-721)
- 🔄 **Chuyển nhượng vé** cho người khác
- 💰 **Hoàn vé** và nhận lại ETH
- 📱 **Xác thực vé** bằng QR Code
- 🎨 **Nhiều loại vé**: Economy, Standard, VIP

---

## ✨ Tính năng

### 🎟️ NFT Tickets
- Mỗi vé là một NFT độc nhất (ERC-721)
- Metadata on-chain với thông tin sự kiện
- Có thể trade trên các NFT marketplace

### 🎫 Nhiều loại vé
| Loại | Mô tả |
|------|-------|
| 🎫 **Economy** | Vé thường, giá rẻ nhất |
| ⭐ **Standard** | Vé tiêu chuẩn, vị trí tốt hơn |
| 👑 **VIP** | Vé cao cấp, nhiều quyền lợi |

### 🔄 Chuyển nhượng vé
- Tặng vé miễn phí cho người khác
- Bán lại vé với giá tùy chọn (tối đa 150% giá gốc)
- QR Code tự động cập nhật cho chủ sở hữu mới

### 💰 Hoàn vé
- Hoàn 95% giá vé trong thời hạn cho phép
- Hoàn 100% nếu sự kiện bị hủy
- Vé NFT sẽ bị burn khi hoàn

### 📱 Xác thực QR Code
- Mỗi vé có mã QR hash duy nhất
- Xác thực tại cổng vào sự kiện
- Check-in một chạm

---

## 🛠 Công nghệ sử dụng

### Backend (Smart Contract)
- **Solidity** ^0.8.20
- **Hardhat** 3.1
- **OpenZeppelin** 5.0 (ERC721, ReentrancyGuard, Ownable)
- **Viem** - Ethereum interaction

### Frontend
- **React** 18
- **ThirdWeb SDK** - Web3 connection
- **QRCode.react** - QR Code generation
- **TanStack Query** - Data fetching

### Blockchain
- **Ethereum Sepolia Testnet**
- **Infura** - RPC Provider
- **MetaMask** - Wallet

---

## 📁 Cấu trúc dự án

```
📦 Decentralized-voting-system/
├── 📂 backend/
│   ├── 📂 contracts/
│   │   ├── EventTicketNFT.sol    # Smart contract chính (NFT)
│   │   ├── EventTicket.sol       # Contract cũ (backup)
│   │   └── Voting.sol            # Contract cũ (backup)
│   ├── 📂 ignition/modules/
│   │   └── EventTicketNFT.ts     # Deployment script
│   ├── 📂 test/
│   │   └── EventTicketNFT.ts     # Unit tests
│   ├── hardhat.config.ts
│   └── package.json
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── App.js                # Main component
│   │   ├── App.css               # Styles
│   │   ├── abi.js                # Contract ABI
│   │   └── 📂 components/
│   │       ├── Header.js
│   │       ├── Header.css
│   │       ├── Footer.js
│   │       └── Footer.css
│   └── package.json
│
├── README.md                     # File này
└── QUICKSTART.md
```

---

## 🚀 Cài đặt

### Yêu cầu hệ thống
- **Node.js** >= 18.x
- **npm** >= 9.x
- **MetaMask** browser extension
- **Git**

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd Decentralized-voting-system
```

### Bước 2: Cài đặt Backend

```bash
cd backend
npm install
```

### Bước 3: Cài đặt Frontend

```bash
cd ../frontend
npm install --legacy-peer-deps
```

### Bước 4: Tạo file môi trường

Tạo file `.env` trong thư mục `backend/`:

```env
INFURA_API_KEY=your_infura_api_key
METAMASK_PRIVATE_KEY=your_wallet_private_key
```

#### 📌 Lấy API Keys:
- **Infura API Key**: Đăng ký tại [infura.io](https://app.infura.io)
- **MetaMask Private Key**: 
  1. Mở MetaMask → Account Details → Export Private Key
  2. ⚠️ **CHỈ SỬ DỤNG VÍ TESTNET, KHÔNG DÙNG VÍ MAINNET!**

### Bước 5: Lấy Sepolia ETH (Test ETH)

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)
- [Alchemy Faucet](https://sepoliafaucet.com/)

---

## 📦 Deployment

### Compile Smart Contract

```bash
cd backend
npx hardhat clean
npx hardhat compile
```

### Chạy Tests (Tùy chọn)

```bash
npx hardhat test test/EventTicketNFT.ts
```

### Deploy lên Sepolia Testnet

```bash
npx hardhat ignition deploy ignition/modules/EventTicketNFT.ts --network sepolia
```

**Output mẫu:**
```
Deploying EventTicketNFT...
EventTicketNFT deployed to: 0x1234567890abcdef...
```

📌 **LƯU LẠI ĐỊA CHỈ CONTRACT NÀY!**

### Cập nhật địa chỉ Contract trong Frontend

Mở file `frontend/src/App.js`, tìm dòng:

```javascript
const CONTRACT_ADDRESS = "0x9a4219024594fEdACFBdFEb009321E3a2341f52F";
```

Thay bằng địa chỉ contract mới:

```javascript
const CONTRACT_ADDRESS = "0xYOUR_NEW_CONTRACT_ADDRESS";
```

---

## ▶️ Chạy ứng dụng

### Chạy Frontend

```bash
cd frontend
npm start
```

Ứng dụng sẽ mở tại: **http://localhost:3000**

### Kết nối MetaMask

1. Đảm bảo MetaMask đang ở **Sepolia Testnet**
2. Click **"Kết nối ví"** trên giao diện
3. Approve kết nối trong MetaMask

---

## 📖 Hướng dẫn sử dụng

### 1️⃣ Tạo sự kiện mới

1. Kết nối ví MetaMask
2. Vào tab **"➕ Tạo sự kiện"**
3. Click **"📝 Điền thông tin"**
4. Điền form:
   - Tên sự kiện
   - Mô tả, địa điểm, hình ảnh
   - Ngày diễn ra, ngày bán vé
   - Cấu hình 3 loại vé (giá, số lượng, quyền lợi)
5. Click **"🚀 Tạo sự kiện"**
6. Confirm transaction trong MetaMask

### 2️⃣ Mua vé

1. Vào tab **"🎪 Sự kiện"**
2. Chọn sự kiện muốn mua
3. Click **"Chi tiết"** hoặc **"🎫 Mua vé NFT"**
4. Chọn loại vé (Economy/Standard/VIP)
5. Nhập thông tin chỗ ngồi (tùy chọn)
6. Click **"🎫 Mua vé"**
7. Confirm transaction + trả ETH

### 3️⃣ Xem vé của tôi

1. Vào tab **"🎟️ Vé NFT của tôi"**
2. Xem danh sách vé đã mua
3. Mỗi vé hiển thị:
   - Thông tin sự kiện
   - QR Code (click để phóng to)
   - Trạng thái vé
   - Nút chuyển nhượng/hoàn vé

### 4️⃣ Chuyển nhượng vé

1. Trong tab **"🎟️ Vé NFT của tôi"**
2. Click **"🔄 Chuyển nhượng"** trên vé cần chuyển
3. Nhập địa chỉ ví người nhận
4. Confirm transaction

### 5️⃣ Hoàn vé

1. Trong tab **"🎟️ Vé NFT của tôi"**
2. Click **"💰 Hoàn vé"** (chỉ hiện khi còn trong thời hạn)
3. Xem số tiền được hoàn (95% hoặc 100%)
4. Confirm để nhận ETH về ví

### 6️⃣ Xác thực vé (Cho organizer)

1. Vào tab **"📱 Xác thực QR"**
2. Nhập mã QR hash của vé
3. Click **"🔍 Xác thực"**
4. Nếu hợp lệ, click **"✓ Check-in ngay"**

---

## 📜 Smart Contract

### Các function chính

| Function | Mô tả | Quyền |
|----------|-------|-------|
| `createEvent()` | Tạo sự kiện mới | Public |
| `purchaseTicket()` | Mua vé NFT | Public (payable) |
| `transferTicket()` | Chuyển nhượng vé | Ticket owner |
| `refundTicket()` | Hoàn vé | Ticket owner |
| `verifyTicketByQR()` | Xác thực QR | View |
| `useTicket()` | Check-in vé | Organizer/Owner |
| `cancelEvent()` | Hủy sự kiện | Organizer/Owner |

### Events (Blockchain Events)

```solidity
event EventCreated(uint256 eventId, string name, address organizer);
event TicketPurchased(uint256 tokenId, uint256 eventId, address buyer, TicketType ticketType);
event TicketTransferred(uint256 tokenId, address from, address to, uint256 price);
event TicketRefunded(uint256 tokenId, address owner, uint256 amount);
event TicketUsed(uint256 tokenId, uint256 eventId, address verifier);
event EventCancelled(uint256 eventId);
```

### Structs

```solidity
// Loại vé
enum TicketType { ECONOMY, STANDARD, VIP }

// Trạng thái vé
enum TicketStatus { VALID, USED, REFUNDED, CANCELLED }

// Thông tin sự kiện
struct Event {
    string name;
    string description;
    string location;
    string imageUrl;
    uint256 eventDate;
    uint256 saleStartDate;
    uint256 saleEndDate;
    uint256 refundDeadline;
    address organizer;
    bool isActive;
    bool isCancelled;
    uint256 totalRevenue;
}

// Thông tin vé NFT
struct Ticket {
    uint256 eventId;
    TicketType ticketType;
    address originalBuyer;
    uint256 purchaseDate;
    uint256 purchasePrice;
    string qrCodeHash;
    TicketStatus status;
    string seatInfo;
}
```

---

## 🧪 Testing

### Chạy tất cả tests

```bash
cd backend
npx hardhat test
```

### Chạy test cụ thể

```bash
npx hardhat test test/EventTicketNFT.ts
```

### Test coverage

```bash
npx hardhat coverage
```

### Các test cases

- ✅ Deployment & ownership
- ✅ Event creation với nhiều loại vé
- ✅ Ticket purchase & NFT minting
- ✅ Ticket transfer
- ✅ Ticket refund (normal & cancelled event)
- ✅ QR verification
- ✅ Check-in functionality
- ✅ Event cancellation
- ✅ NFT metadata & interfaces

---

## ❗ Troubleshooting

### Lỗi "Insufficient funds"
- Kiểm tra ví có đủ Sepolia ETH không
- Lấy thêm từ faucet

### Lỗi "Transaction failed"
- Kiểm tra MetaMask đang ở Sepolia network
- Tăng gas limit trong MetaMask

### Lỗi "Contract not found"
- Kiểm tra địa chỉ contract trong `App.js` đúng chưa
- Đảm bảo contract đã được deploy thành công

### Frontend không load events
- Kiểm tra console browser (F12)
- Đảm bảo MetaMask đã kết nối
- Refresh trang

### QR Code không hiển thị
- Kiểm tra đã cài `qrcode.react` chưa
- Chạy `npm install --legacy-peer-deps`

---

## 🔐 Security

- ✅ ReentrancyGuard cho các function payable
- ✅ Access control với Ownable
- ✅ Input validation
- ✅ Safe transfer với checks
- ✅ Excess payment refund

---

## 📄 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 👥 Tác giả

Dự án được phát triển cho môn học **Công nghệ và nền tảng chuỗi khối**

---

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) - Smart contract libraries
- [Hardhat](https://hardhat.org/) - Development environment
- [ThirdWeb](https://thirdweb.com/) - Web3 SDK
- [Ethereum](https://ethereum.org/) - Blockchain platform

---

**⭐ Nếu dự án hữu ích, hãy star repo này!**
