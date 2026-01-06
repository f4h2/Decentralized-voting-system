import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>🎫 EventTicket DApp</h3>
          <p>Nền tảng mua vé sự kiện phi tập trung</p>
          <p className="footer-tagline">An toàn • Minh bạch • Nhanh chóng</p>
        </div>

        <div className="footer-section">
          <h4>Liên kết</h4>
          <ul className="footer-links">
            <li><a href="#events">Sự kiện</a></li>
            <li><a href="#my-tickets">Vé của tôi</a></li>
            <li><a href="#about">Về chúng tôi</a></li>
            <li><a href="#support">Hỗ trợ</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Hỗ trợ</h4>
          <ul className="footer-links">
            <li><a href="#faq">Câu hỏi thường gặp</a></li>
            <li><a href="#contact">Liên hệ</a></li>
            <li><a href="#terms">Điều khoản</a></li>
            <li><a href="#privacy">Bảo mật</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Mạng xã hội</h4>
          <div className="social-links">
            <a href="#facebook" className="social-link" title="Facebook">📘</a>
            <a href="#twitter" className="social-link" title="Twitter">🐦</a>
            <a href="#telegram" className="social-link" title="Telegram">✈️</a>
            <a href="#discord" className="social-link" title="Discord">💬</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} EventTicket DApp. Powered by Ethereum Smart Contracts</p>
        <p className="tech-stack">
          Built with React, ThirdWeb, Hardhat & Solidity ⚡
        </p>
      </div>
    </footer>
  );
};

export default Footer;
