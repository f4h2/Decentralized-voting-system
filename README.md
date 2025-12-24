✅ Bước 1: Vào thư mục backend
cd /home/loc/Downloads/VNPT/decentralized-voting-system/backend

✅ Bước 2: Cài dependency
npm install

✅ Bước 3: Tạo file .env
cp .env.example .env


Mở file .env và điền:

INFURA_API_KEY=your_infura_api_key
METAMASK_PRIVATE_KEY=your_wallet_private_key


📌 Lưu ý

INFURA_API_KEY: lấy tại https://app.infura.io

METAMASK_PRIVATE_KEY: private key ví testnet Sepolia (có ETH test)

✅ Bước 4: Compile Smart Contract
npx hardhat clean
npx hardhat compile

✅ Bước 5 (tuỳ chọn): Chạy test
npx hardhat test

✅ Bước 6: Deploy contract lên Sepolia
npx hardhat ignition deploy ignition/modules/Voting.ts --network sepolia


Sau khi deploy thành công, terminal sẽ in ra dạng:

Contract deployed to: 0x1234...


👉 Copy địa chỉ contract này (rất quan trọng)

🎨 PHẦN 2: Frontend (React App)
✅ Bước 1: Vào thư mục frontend
cd ../frontend

✅ Bước 2: Cài dependency
npm install

✅ Bước 3: Gán địa chỉ contract

Mở file App.js (hoặc App.jsx)
Thay địa chỉ contract vừa deploy:

const { contract } = useContract("0x1234...");


📌 Lưu ý:

Địa chỉ này phải là contract vừa deploy

Wallet MetaMask phải đang ở Sepolia network

✅ Bước 4: Chạy frontend
npm start


Tạo nhiều gmail , để đăng kí meta mask lấy eth cho từng metamask để thực hiện vote
