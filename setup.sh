#!/bin/bash

# Decentralized Voting System - Setup Script
# This script automates the initial setup process

set -e

echo "🚀 Decentralized Voting System - Setup"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) detected${NC}"

# Setup Backend
echo -e "\n${YELLOW}1. Setting up Backend...${NC}"
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Edit backend/.env with your API keys:${NC}"
    echo "   - INFURA_API_KEY: Get from https://app.infura.io/"
    echo "   - METAMASK_PRIVATE_KEY: Export from your MetaMask wallet"
    read -p "Press Enter after updating .env..."
fi

echo "Installing backend dependencies..."
npm install

echo "Compiling Solidity contracts..."
npx hardhat compile

echo -e "${GREEN}✅ Backend setup complete${NC}"

# Setup Frontend
echo -e "\n${YELLOW}2. Setting up Frontend...${NC}"
cd ../frontend

echo "Installing frontend dependencies..."
npm install

echo -e "${YELLOW}⚠️  After deployment, update src/App.js:${NC}"
echo "   Replace 'YOUR_CONTRACT_ADDRESS' with the deployed Voting.sol address"
echo ""

echo -e "${GREEN}✅ Frontend setup complete${NC}"

# Summary
echo -e "\n${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Backend tests:    cd backend && npx hardhat test"
echo "2. Deploy to Sepolia: npx hardhat ignition deploy --network sepolia ignition/modules/Voting.ts"
echo "3. Update contract address in frontend/src/App.js"
echo "4. Start frontend:   cd frontend && npm start"
echo ""
echo "📖 Read THIRD_PARTY_INTEGRATION.md for detailed setup guide"
