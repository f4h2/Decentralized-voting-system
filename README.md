# Project Issues & Fixes Summary

## ✅ Fixed Issues

### Backend Configuration
1. **Hardhat Network URL** - Fixed template variable injection in Sepolia RPC URL
   - Before: `configVariable("INFURA_API_KEY", "https://sepolia.infura.io/v3/${INFURA_API_KEY}")`
   - After: `` `https://sepolia.infura.io/v3/${configVariable("INFURA_API_KEY")}` ``

2. **Git Security** - Added `.env` to `.gitignore`
   - Prevents accidental commit of sensitive keys

3. **Environment Template** - Created `.env.example`
   - Users can copy and fill with their own API keys

### Frontend Webpack Issues
1. **Stream Polyfills** - Configured webpack fallbacks via `config-overrides.js`
   - Added polyfills for: `stream`, `http`, `https`, `zlib`
   - Installed: `stream-browserify`, `stream-http`, `https-browserify`, `browserify-zlib`

2. **React Version Compatibility** - Downgraded React 19 → 18
   - Reason: CRA 5 and @thirdweb-dev/react expect React 18
   - React 19 breaks many Web3 libraries

3. **Build Script** - Updated to use `react-app-rewired`
   - Allows webpack config customization without ejecting CRA

## 🏗️ Project Structure

```
decentralized-voting-system/
├── backend/                          # Hardhat + Smart Contracts
│   ├── contracts/
│   │   ├── Counter.sol              # Example counter contract
│   │   ├── Voting.sol               # Voting system contract ⭐
│   │   └── Counter.t.sol            # Tests
│   ├── hardhat.config.ts            # Network & RPC config
│   ├── .env                         # API keys (GITIGNORED)
│   ├── .env.example                 # Template for users
│   └── scripts/send-op-tx.ts        # OP chain example
│
├── frontend/                         # React Web3 App
│   ├── src/
│   │   ├── App.js                   # Main voting interface
│   │   ├── index.js                 # ThirdWeb + Sepolia setup
│   │   └── ...
│   ├── config-overrides.js          # Webpack polyfills (NEW)
│   ├── package.json                 # React 18 + ThirdWeb deps
│   └── ...
│
└── THIRD_PARTY_INTEGRATION.md       # This guide (NEW)
```

## 📋 Third-Party Dependencies

| Service | Purpose | Setup |
|---------|---------|-------|
| **Infura** | RPC Provider for Sepolia | Get API key from app.infura.io |
| **MetaMask** | Wallet & Signer | Browser extension + test ETH |
| **ThirdWeb SDK** | Web3 library for React | Auto-configured in index.js |
| **Ethereum Sepolia** | Testnet | Free test ETH from faucet |

## 🚀 Quick Start

### Backend:
```bash
cd backend
npm install
cp .env.example .env          # Edit with your Infura key & private key
npx hardhat test              # Run Solidity tests
npx hardhat ignition deploy --network sepolia ignition/modules/Voting.ts
```

### Frontend:
```bash
cd frontend
npm install
# Edit src/App.js: replace YOUR_CONTRACT_ADDRESS with deployed address
npm start                     # Runs on http://localhost:3000
```

## ⚠️ Current Limitations

1. **Solidity Pragma** - Voting.sol uses `^0.8.0`, Counter uses `0.8.28` (version mismatch)
2. **Contract Tests** - No tests written for Voting.sol yet
3. **UI Styling** - Minimal CSS, basic React components
4. **Error Handling** - Limited user feedback in voting interface

## 📚 Documentation Files

- **THIRD_PARTY_INTEGRATION.md** ← Read this first for step-by-step setup
- **.env.example** ← Template for environment variables
- **backend/README.md** ← Hardhat 3 documentation
- **frontend/README.md** ← Create React App documentation

---

**Status**: ✅ All critical issues fixed. Project ready for testnet deployment.
# Decentralized-voting-system
# 🚀 Hướng Dẫn Triển Khai Decentralized Voting System

## 📋 Mục Lục
1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt Backend](#cài-đặt-backend)
3. [Deploy Smart Contract](#deploy-smart-contract)
4. [Cài Đặt Frontend](#cài-đặt-frontend)
5. [Kết Nối Third-Party Services](#kết-nối-third-party-services)
6. [Troubleshooting](#troubleshooting)

---

## 🛠️ Yêu Cầu Hệ Thống

### Phần Mềm Cần Thiết
- **Node.js**: >= 18.x (khuyến nghị 20.x)
- **npm** hoặc **yarn** hoặc **pnpm**
- **MetaMask**: Browser extension
- **Git**: Để clone repository

### Kiểm Tra Phiên Bản
```bash
node --version  # Should be >= 18.x
npm --version   # Should be >= 9.x
```

---

## 📦 Cài Đặt Backend

### Bước 1: Di chuyển vào thư mục backend
```bash
cd backend
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình biến môi trường
Tạo file `.env` từ template:
```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:
```env
# Lấy API key từ https://app.infura.io/
INFURA_API_KEY=your_infura_project_id_here

# Private key của ví MetaMask 
# Lấy từ MetaMask: Settings > Security & Privacy > Show Private Key
METAMASK_PRIVATE_KEY=your_private_key_without_0x_prefix
```

⚠️ **LƯU Ý BẢO MẬT**:
- KHÔNG commit file `.env` lên Git
- KHÔNG chia sẻ private key với bất kỳ ai
- Sử dụng ví test riêng cho development

### Bước 4: Compile Smart Contracts
```bash
npx hardhat compile
```

Kết quả mong đợi:
```
Compiled 3 Solidity files successfully (evm target: paris).
```

### Bước 5: Chạy Tests (Optional)
```bash
npx hardhat test
```

---

## 🚀 Deploy Smart Contract

### Chuẩn Bị
1. **Tạo ví test trên MetaMask**
2. **Lấy Sepolia ETH** từ faucet:
   - https://sepoliafaucet.com/
   - https://www.infura.io/faucet/sepolia
   - https://faucets.chain.link/sepolia

### Deploy lên Sepolia Testnet

#### Tạo Ignition Module cho Voting Contract
Tạo file `backend/ignition/modules/Voting.ts`:
```typescript
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VotingModule", (m) => {
  const voting = m.contract("Voting");
  return { voting };
});
```

#### Deploy Contract
```bash
npx hardhat ignition deploy ignition/modules/Voting.ts --network sepolia
```

#### Lưu Contract Address
Sau khi deploy thành công, bạn sẽ thấy:
```
✅ Deployed VotingModule#Voting to: 0x1234567890abcdef...
```

**LƯU LẠI ĐỊA CHỈ NÀY** - Bạn sẽ cần nó cho frontend!

#### Verify Contract trên Etherscan (Optional)
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

---

## 🎨 Cài Đặt Frontend

### Bước 1: Di chuyển vào thư mục frontend
```bash
cd frontend
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình Contract Address
Mở file `src/App.js` và thay thế địa chỉ contract:
```javascript
const { contract } = useContract("YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE");
```

Thay `YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE` bằng địa chỉ bạn nhận được sau khi deploy.

### Bước 4: Chạy Development Server
```bash
npm start
```

Frontend sẽ chạy tại: http://localhost:3000

### Bước 5: Kết Nối MetaMask
1. Click nút "Connect Wallet"
2. Chọn ví MetaMask
3. Approve connection
4. **Đảm bảo bạn đang ở Sepolia Testnet**

---

## 🔗 Kết Nối Third-Party Services

### 1. Infura Setup
**Mục đích**: RPC provider để giao tiếp với Ethereum network

**Các bước**:
1. Đăng ký tại: https://app.infura.io/
2. Tạo Project mới
3. Chọn network: **Ethereum** > **Sepolia**
4. Copy **Project ID** (API Key)
5. Dán vào file `backend/.env`:
   ```env
   INFURA_API_KEY=abc123def456...
   ```

**Endpoints có sẵn**:
- Sepolia: `https://sepolia.infura.io/v3/YOUR_API_KEY`
- Mainnet: `https://mainnet.infura.io/v3/YOUR_API_KEY`

**Free Tier Limits**:
- 100,000 requests/day
- 3 projects

---

### 2. Alchemy Setup (Alternative to Infura)
**Mục đích**: RPC provider với nhiều tính năng hơn

**Các bước**:
1. Đăng ký tại: https://www.alchemy.com/
2. Tạo App mới > Chọn **Ethereum** > **Sepolia**
3. Copy **API Key**
4. Thay đổi trong `backend/hardhat.config.ts`:
   ```typescript
   networks: {
     sepolia: {
       url: `https://eth-sepolia.g.alchemy.com/v2/${configVariable("ALCHEMY_API_KEY")}`,
       accounts: [configVariable("METAMASK_PRIVATE_KEY")],
     },
   }
   ```

**Ưu điểm**:
- Enhanced APIs (NFT API, Token API)
- Better analytics dashboard
- Webhook support
- 300M compute units/month (free tier)

---

### 3. ThirdWeb Setup
**Mục đích**: Simplified Web3 development framework

**Đã tích hợp sẵn trong frontend**:
```javascript
import { ThirdwebProvider } from '@thirdweb-dev/react';
```

**Client ID (Optional - for production)**:
1. Đăng ký tại: https://thirdweb.com/
2. Tạo project mới
3. Lấy **Client ID**
4. Thêm vào ThirdwebProvider:
   ```javascript
   <ThirdwebProvider 
     activeChain={Sepolia}
     clientId="your_client_id_here"
   >
     <App />
   </ThirdwebProvider>
   ```

**Tính năng**:
- ConnectWallet component
- Contract hooks (useContract, useContractRead, etc.)
- Multi-chain support
- IPFS storage

---

### 4. Etherscan API (for Contract Verification)
**Mục đích**: Verify & publish contract source code

**Các bước**:
1. Đăng ký tại: https://etherscan.io/
2. Tạo API key tại: https://etherscan.io/myapikey
3. Thêm vào `backend/hardhat.config.ts`:
   ```typescript
   import { defineConfig } from "hardhat/config";
   
   export default defineConfig({
     // ... existing config
     etherscan: {
       apiKey: configVariable("ETHERSCAN_API_KEY"),
     },
   });
   ```
4. Thêm vào `.env`:
   ```env
   ETHERSCAN_API_KEY=your_api_key_here
   ```
5. Verify contract:
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

---

### 5. IPFS/Pinata (Optional - for decentralized storage)
**Mục đích**: Store poll metadata off-chain

**Các bước**:
1. Đăng ký tại: https://www.pinata.cloud/
2. Tạo API key
3. Install SDK:
   ```bash
   npm install @pinata/sdk
   ```
4. Upload data:
   ```javascript
   const pinataSDK = require('@pinata/sdk');
   const pinata = new pinataSDK(apiKey, secretApiKey);
   
   const result = await pinata.pinJSONToIPFS({
     pollName: "My Poll",
     description: "Poll description"
   });
   ```

---

### 6. The Graph (Optional - for indexing)
**Mục đích**: Query blockchain data efficiently

**Các bước**:
1. Tạo Subgraph tại: https://thegraph.com/
2. Define schema trong `schema.graphql`
3. Map events trong `mapping.ts`
4. Deploy subgraph
5. Query data:
   ```graphql
   query {
     polls(first: 10) {
       id
       name
       votes
     }
   }
   ```

---

### 7. WalletConnect (Optional - mobile wallet support)
**Mục đích**: Kết nối mobile wallets

ThirdWeb đã hỗ trợ sẵn. Để custom:
```javascript
import { WalletConnect } from "@thirdweb-dev/wallets";

const walletConnect = new WalletConnect({
  projectId: "your_walletconnect_project_id",
});
```

Đăng ký tại: https://cloud.walletconnect.com/

---

## 📊 Testing & Verification

### Test Smart Contract
```bash
cd backend
npx hardhat test
npx hardhat coverage  # Check test coverage
```

### Test Frontend
```bash
cd frontend
npm test
npm run build  # Test production build
```

### Manual Testing Checklist
- [ ] Connect wallet successfully
- [ ] Create a poll (owner only)
- [ ] Vote on a poll
- [ ] View poll results
- [ ] End a poll (owner only)
- [ ] Check "already voted" status
- [ ] Test poll expiration

---

## 🐛 Troubleshooting

### Backend Issues

#### Error: "Cannot find module '@nomicfoundation/hardhat-toolbox-viem'"
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### Error: "Invalid private key"
- Đảm bảo private key KHÔNG có prefix `0x`
- Kiểm tra file `.env` có đúng format
- Private key phải có 64 ký tự hex

#### Error: "Insufficient funds"
- Lấy Sepolia ETH từ faucet
- Kiểm tra balance: https://sepolia.etherscan.io/

---

### Frontend Issues

#### Error: "Module not found: Can't resolve 'stream'"
```bash
cd frontend
npm install react-app-rewired stream-browserify stream-http https-browserify browserify-zlib --save-dev
```

#### Error: "No QueryClient set"
Đảm bảo `src/index.js` có:
```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();

<QueryClientProvider client={queryClient}>
  <ThirdwebProvider>
    <App />
  </ThirdwebProvider>
</QueryClientProvider>
```

#### MetaMask không connect
- Kiểm tra đã cài MetaMask chưa
- Chuyển sang Sepolia network
- Refresh trang và thử lại
- Clear browser cache

#### Contract calls fail
- Kiểm tra contract address trong `App.js`
- Verify contract đã deploy thành công
- Kiểm tra network (phải là Sepolia)
- Check console logs để xem error details

---

## 🌐 Production Deployment

### Frontend Deployment (Vercel/Netlify)

#### Vercel
```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

#### Netlify
```bash
cd frontend
npm run build
# Drag & drop 'build' folder to netlify.com
```

### Environment Variables
Thêm vào Vercel/Netlify dashboard:
- `REACT_APP_CONTRACT_ADDRESS`
- `REACT_APP_CHAIN_ID=11155111` (Sepolia)

---

## 📚 Tài Liệu Tham Khảo

- **Hardhat**: https://hardhat.org/docs
- **ThirdWeb**: https://portal.thirdweb.com/
- **Infura**: https://docs.infura.io/
- **Ethers.js**: https://docs.ethers.org/v5/
- **Solidity**: https://docs.soliditylang.org/

---

## 🆘 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra console logs (F12)
2. Đọc error messages cẩn thận
3. Google error message
4. Kiểm tra network trên MetaMask
5. Verify contract address

---

## 🎉 Chúc Mừng!

Bạn đã setup thành công Decentralized Voting System! 🚀

**Next Steps**:
- Customize UI theo ý thích
- Thêm features mới (delegate voting, weighted votes, etc.)
- Deploy lên mainnet khi production-ready
- Implement advanced features (IPFS, The Graph, etc.)
