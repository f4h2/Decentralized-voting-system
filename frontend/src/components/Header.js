import React from 'react';
import { ConnectWallet } from '@thirdweb-dev/react';
import './Header.css';

const Header = ({ address, isAdmin }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo-icon">🎫</div>
          <div className="logo-text">
            <h1>EventTicket NFT DApp</h1>
            <p className="subtitle">Hệ thống vé sự kiện NFT trên Blockchain</p>
          </div>
          <span className="nft-tag">NFT</span>
        </div>
        
        <nav className="header-nav">
          <a href="#events" className="nav-link">🎪 Sự kiện</a>
          <a href="#my-tickets" className="nav-link">🎟️ Vé NFT</a>
          <a href="#verify" className="nav-link">📱 Xác thực QR</a>
          <a href="#create" className="nav-link">➕ Tạo sự kiện</a>
        </nav>

        <div className="wallet-section">
          <ConnectWallet theme="dark" btnTitle="Kết nối ví" />
          {address && (
            <div className="wallet-info">
              <span className="wallet-label">Địa chỉ:</span>
              <span className="wallet-address">{address.slice(0, 6)}...{address.slice(-4)}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
