import { useState, useEffect, useCallback } from 'react';
import { useAddress, useContract, useContractWrite, useContractRead, ConnectWallet } from '@thirdweb-dev/react';
import './App.css';

function App() {
  const address = useAddress();
  const { contract } = useContract("0x1f5A419D1eb892365d5aa0a2A0D109FA2613ff68");
  
  const [pollName, setPollName] = useState('');
  const [options, setOptions] = useState('');
  const [duration, setDuration] = useState(0);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' hoặc 'ended'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showPollDetails, setShowPollDetails] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [confirmAction, setConfirmAction] = useState({ show: false, message: '', onConfirm: null });
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  const { data: pollCount } = useContractRead(contract, "getPollCount");
  const { mutateAsync: createPoll } = useContractWrite(contract, "createPoll");
  const { mutateAsync: vote } = useContractWrite(contract, "vote");
  const { mutateAsync: endPoll } = useContractWrite(contract, "endPoll");

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Notification system
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  }, []);

  // Confirmation dialog
  const showConfirmDialog = useCallback((message, onConfirm) => {
    setConfirmAction({ show: true, message, onConfirm });
  }, []);

  // Load all polls
  useEffect(() => {
    if (contract && pollCount) {
      const fetchPolls = async () => {
        setLoading(true);
        const pollList = [];
        for (let i = 1; i <= pollCount; i++) {
          try {
            const results = await contract.call("getPollResults", [i]);
            const hasVoted = address ? await contract.call("hasUserVoted", [i, address]) : false;
            pollList.push({ id: i, ...results, hasVoted });
          } catch (error) {
            console.error(`Error fetching poll ${i}:`, error);
          }
        }
        setPolls(pollList);
        setLoading(false);
      };
      fetchPolls();
    }
  }, [contract, pollCount, address]);

  const handleCreatePoll = async () => {
    if (!pollName || !options || duration <= 0) {
      showNotification('Vui lòng điền đầy đủ thông tin!', 'warning');
      return;
    }
    try {
      setLoading(true);
      await createPoll({ args: [pollName, options.split(',').map(o => o.trim()), duration] });
      showNotification('✅ Tạo Poll thành công!', 'success');
      setPollName('');
      setOptions('');
      setDuration(0);
      setShowCreateForm(false);
    } catch (error) {
      console.error(error);
      showNotification('❌ Lỗi: ' + (error.message || 'Không xác định'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionIdx, optionName) => {
    showConfirmDialog(
      `Bạn có chắc muốn bỏ phiếu cho "${optionName}"?`,
      async () => {
        try {
          setLoading(true);
          setConfirmAction({ show: false, message: '', onConfirm: null });
          await vote({ args: [pollId, optionIdx] });
          showNotification('✅ Bỏ phiếu thành công!', 'success');
        } catch (error) {
          console.error(error);
          showNotification('❌ Lỗi: ' + (error.message || 'Không xác định'), 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleEndPoll = async (id) => {
    showConfirmDialog(
      'Bạn có chắc muốn kết thúc poll này? Hành động này không thể hoàn tác!',
      async () => {
        try {
          setLoading(true);
          setConfirmAction({ show: false, message: '', onConfirm: null });
          await endPoll({ args: [id] });
          showNotification('✅ Kết thúc Poll thành công!', 'success');
        } catch (error) {
          console.error(error);
          showNotification('❌ Lỗi: ' + (error.message || 'Không xác định'), 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const calculateTimeRemaining = (endTime) => {
    if (endTime === 0) return { text: 'Không giới hạn', seconds: Infinity, urgent: false };
    const remaining = endTime - currentTime;
    if (remaining <= 0) return { text: 'Đã hết hạn', seconds: 0, urgent: false };

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    let text = '';
    if (days > 0) text = `${days} ngày ${hours} giờ ${minutes} phút`;
    else if (hours > 0) text = `${hours} giờ ${minutes} phút ${seconds} giây`;
    else if (minutes > 0) text = `${minutes} phút ${seconds} giây`;
    else text = `${seconds} giây`;

    const urgent = remaining < 3600; // Less than 1 hour
    return { text, seconds: remaining, urgent };
  };

  const getTotalVotes = (poll) => {
    return poll[2].reduce((sum, votes) => sum + Number(votes), 0);
  };

  const getPercentage = (votes, total) => {
    if (total === 0) return 0;
    return ((Number(votes) / total) * 100).toFixed(1);
  };

  // Lọc poll theo tab và tìm kiếm
  const filteredPolls = polls
    .filter(poll => {
      const isActive = poll[5] && (poll[4] === 0 || poll[4] * 1000 > Date.now());
      if (activeTab === 'active') return isActive;
      if (activeTab === 'ended') return !isActive;
      return true;
    })
    .filter(poll => {
      if (!searchTerm) return true;
      const lowerSearch = searchTerm.toLowerCase();
      const pollNameMatch = poll[0].toLowerCase().includes(lowerSearch);
      const optionsMatch = poll[1].some(opt => opt.toLowerCase().includes(lowerSearch));
      return pollNameMatch || optionsMatch;
    });

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>🗳️ Decentralized Voting System</h1>
            <p className="subtitle">Hệ thống bỏ phiếu phi tập trung trên Blockchain</p>
          </div>
          <div className="wallet-section">
            <ConnectWallet theme="dark" />
            {address && (
              <div className="wallet-info">
                <span className="wallet-label">Địa chỉ:</span>
                <span className="wallet-address">{address.slice(0, 6)}...{address.slice(-4)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">
        {!address ? (
          <div className="welcome-card">
            <div className="welcome-icon">🔐</div>
            <h2>Chào mừng đến với Voting DApp</h2>
            <p>Vui lòng kết nối ví MetaMask để bắt đầu</p>
            <div className="features">
              <div className="feature"><span className="feature-icon">✅</span> Bỏ phiếu minh bạch</div>
              <div className="feature"><span className="feature-icon">🔒</span> An toàn & Bảo mật</div>
              <div className="feature"><span className="feature-icon">⚡</span> Nhanh chóng & Đơn giản</div>
            </div>
          </div>
        ) : (
          <>
            {/* Create Poll Section */}
            <div className="create-section">
              <button className="toggle-create-btn" onClick={() => setShowCreateForm(!showCreateForm)}>
                {showCreateForm ? '❌ Đóng' : '➕ Tạo Poll Mới'}
              </button>
              {showCreateForm && (
                <div className="create-form">
                  <h2>📝 Tạo Poll Mới (Chỉ Owner)</h2>
                  <div className="form-group">
                    <label>Tên Poll</label>
                    <input type="text" placeholder="Ví dụ: Bầu chọn công nghệ yêu thích" value={pollName} onChange={(e) => setPollName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Các lựa chọn (phân cách bằng dấu phẩy)</label>
                    <input type="text" placeholder="Ví dụ: React, Vue, Angular" value={options} onChange={(e) => setOptions(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Thời hạn (giây)</label>
                    <input type="number" placeholder="Ví dụ: 86400 (1 ngày)" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                    <small>1 giờ = 3600s, 1 ngày = 86400s, 1 tuần = 604800s</small>
                  </div>
                  <button className="create-btn" onClick={handleCreatePoll} disabled={loading}>
                    {loading ? '⏳ Đang xử lý...' : '🚀 Tạo Poll'}
                  </button>
                </div>
              )}
            </div>

            {/* Tabs & Search */}
            <div className="polls-section">
              <div className="tabs-header">
                <div className="tabs">
                  <button
                    className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                  >
                    🟢 Đang diễn ra ({polls.filter(p => p[5] && (p[4] === 0 || p[4] * 1000 > Date.now())).length})
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'ended' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ended')}
                  >
                    🔴 Đã kết thúc ({polls.filter(p => !p[5] || (p[4] !== 0 && p[4] * 1000 <= Date.now())).length})
                  </button>
                </div>
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="🔍 Tìm kiếm poll..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <h2>📊 Danh Sách Polls</h2>

              {loading && polls.length === 0 ? (
                <div className="loading">⏳ Đang tải polls...</div>
              ) : filteredPolls.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>
                    {searchTerm 
                      ? 'Không tìm thấy poll nào phù hợp với từ khóa tìm kiếm.' 
                      : activeTab === 'active' 
                        ? 'Hiện tại chưa có poll nào đang diễn ra.' 
                        : 'Chưa có poll nào đã kết thúc.'
                    }
                  </p>
                </div>
              ) : (
                <div className="polls-grid">
                  {filteredPolls.map((poll) => {
                    const totalVotes = getTotalVotes(poll);
                    const isActive = poll[5] && (poll[4] === 0 || poll[4] * 1000 > Date.now());
                    const timeRemaining = calculateTimeRemaining(poll[4]);
                    const winningOption = poll[2].reduce((max, votes, idx, arr) => 
                      Number(votes) > Number(arr[max]) ? idx : max, 0);

                    return (
                      <div key={poll.id} className={`poll-card ${!isActive ? 'inactive' : ''}`}>
                        <div className="poll-header">
                          <h3>
                            <span className="poll-number">#{poll.id}</span> {poll[0]}
                          </h3>
                          <span className={`status-badge ${isActive ? 'active' : 'ended'}`}>
                            {isActive ? '🟢 Đang diễn ra' : '🔴 Đã kết thúc'}
                          </span>
                        </div>
                        <div className="poll-meta">
                          <div className={`meta-item ${timeRemaining.urgent ? 'urgent' : ''}`}>
                            ⏰ Thời gian còn lại: <span className={timeRemaining.urgent ? 'time-urgent' : ''}>{timeRemaining.text}</span>
                          </div>
                          <div className="meta-item">📊 Tổng số phiếu: <span>{totalVotes}</span></div>
                          <div className="meta-item">🗓️ Bắt đầu: <span>{new Date(poll[3] * 1000).toLocaleDateString('vi-VN')}</span></div>
                          {poll[4] !== 0 && <div className="meta-item">🏁 Kết thúc: <span>{new Date(poll[4] * 1000).toLocaleString('vi-VN')}</span></div>}
                        </div>
                        <div className="options-list">
                          {poll[1].map((opt, i) => {
                            const votes = Number(poll[2][i]);
                            const percentage = getPercentage(votes, totalVotes);
                            const isWinning = i === winningOption && totalVotes > 0;
                            return (
                              <div key={i} className={`option-item ${isWinning ? 'winning-option' : ''}`}>
                                <div className="option-header">
                                  <span className="option-name">
                                    {isWinning && '🏆 '}{opt}
                                  </span>
                                  <span className="option-stats">{votes} phiếu ({percentage}%)</span>
                                </div>
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                                </div>
                                {isActive && !poll.hasVoted && (
                                  <button className="vote-btn" onClick={() => handleVote(poll.id, i, opt)} disabled={loading}>
                                    ✓ Bỏ phiếu
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="poll-footer">
                          <button 
                            className="view-details-btn" 
                            onClick={() => {
                              setSelectedPoll(poll);
                              setShowPollDetails(true);
                            }}
                          >
                            👁️ Xem chi tiết
                          </button>
                          {poll.hasVoted && <div className="voted-badge">✅ Bạn đã bỏ phiếu</div>}
                          {isActive && (
                            <button className="end-poll-btn" onClick={() => handleEndPoll(poll.id)} disabled={loading}>
                              🛑 Kết thúc Poll
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by Ethereum Smart Contracts • Built with React & ThirdWeb</p>
      </footer>

      {/* Notification Toast */}
      {notification.show && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' && '✅'}
              {notification.type === 'error' && '❌'}
              {notification.type === 'warning' && '⚠️'}
              {notification.type === 'info' && 'ℹ️'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
          <button className="notification-close" onClick={() => setNotification({ show: false, message: '', type: '' })}>
            ✕
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction.show && (
        <div className="modal-overlay" onClick={() => setConfirmAction({ show: false, message: '', onConfirm: null })}>
          <div className="modal-content confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Xác nhận</h3>
              <button className="modal-close" onClick={() => setConfirmAction({ show: false, message: '', onConfirm: null })}>✕</button>
            </div>
            <div className="modal-body">
              <p>{confirmAction.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setConfirmAction({ show: false, message: '', onConfirm: null })}>
                Hủy
              </button>
              <button className="btn-confirm" onClick={confirmAction.onConfirm}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Poll Details Modal */}
      {showPollDetails && selectedPoll && (
        <div className="modal-overlay" onClick={() => setShowPollDetails(false)}>
          <div className="modal-content poll-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 Chi tiết Poll #{selectedPoll.id}</h3>
              <button className="modal-close" onClick={() => setShowPollDetails(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>📝 Tên Poll</h4>
                <p className="poll-title-large">{selectedPoll[0]}</p>
              </div>
              
              <div className="detail-section">
                <h4>⏰ Thông tin thời gian</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Bắt đầu:</span>
                    <span className="info-value">{new Date(selectedPoll[3] * 1000).toLocaleString('vi-VN')}</span>
                  </div>
                  {selectedPoll[4] !== 0 && (
                    <div className="info-item">
                      <span className="info-label">Kết thúc:</span>
                      <span className="info-value">{new Date(selectedPoll[4] * 1000).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Còn lại:</span>
                    <span className={`info-value ${calculateTimeRemaining(selectedPoll[4]).urgent ? 'time-urgent' : ''}`}>
                      {calculateTimeRemaining(selectedPoll[4]).text}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Trạng thái:</span>
                    <span className="info-value">
                      {selectedPoll[5] && (selectedPoll[4] === 0 || selectedPoll[4] * 1000 > Date.now()) 
                        ? '🟢 Đang diễn ra' 
                        : '🔴 Đã kết thúc'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>📊 Kết quả bỏ phiếu</h4>
                <div className="results-chart">
                  {selectedPoll[1].map((opt, i) => {
                    const votes = Number(selectedPoll[2][i]);
                    const total = getTotalVotes(selectedPoll);
                    const percentage = getPercentage(votes, total);
                    const winningIdx = selectedPoll[2].reduce((max, v, idx, arr) => 
                      Number(v) > Number(arr[max]) ? idx : max, 0);
                    const isWinning = i === winningIdx && total > 0;
                    
                    return (
                      <div key={i} className={`result-bar ${isWinning ? 'winning' : ''}`}>
                        <div className="result-info">
                          <span className="result-name">{isWinning && '🏆 '}{opt}</span>
                          <span className="result-stats">{votes} phiếu ({percentage}%)</span>
                        </div>
                        <div className="result-progress">
                          <div className="result-fill" style={{ width: `${percentage}%` }}>
                            <span className="result-percentage">{percentage}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="total-votes-display">
                  <strong>Tổng số phiếu bầu:</strong> {getTotalVotes(selectedPoll)}
                </div>
              </div>

              {selectedPoll.hasVoted && (
                <div className="detail-section voted-section">
                  <div className="voted-indicator">✅ Bạn đã bỏ phiếu trong poll này</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-close" onClick={() => setShowPollDetails(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;