import { useState, useEffect, useCallback } from 'react';
import { useAddress, useContract } from '@thirdweb-dev/react';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';
import { EventTicketABI } from './abi';

function App() {
  const address = useAddress();
  const { contract } = useContract("0xFE986Fc37a11eEA9BB41E76E0Ea48c2048764814", EventTicketABI);
  // const { contract } = useContract("0xFE986Fc37a11eEA9BB41E76E0Ea48c2048764814"); // EventTicket contract deployed on Sepolia
  // const { contract } = useContract("0x2B66A1911EC205c88897346a0741A19C633A6240"); 
  // State management
  const [activeTab, setActiveTab] = useState('events'); // 'events', 'my-tickets', 'admin'
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [isAdmin, setIsAdmin] = useState(true); // Anyone can create events - no admin check needed
  
  // Notification & confirmation
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [confirmAction, setConfirmAction] = useState({ show: false, message: '', onConfirm: null });

  // Form states for creating event
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    location: '',
    imageUrl: '',
    ticketPrice: '',
    totalTickets: '',
    eventDate: '',
    saleEndDate: ''
  });
  
  // Helper functions
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  }, []);

  const showConfirmDialog = useCallback((message, onConfirm) => {
    setConfirmAction({ show: true, message, onConfirm });
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load all events
useEffect(() => {
  if (!contract) {
    console.error("Contract is not loaded yet");
    return;
  }

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const count = await contract.call("eventCount"); // hoặc "getEventCount" nếu có
      console.log("📊 EventCount:", count?.toString());
	  
      const eventList = [];
	  const eventCountNum = Number(count) || 0;
	  
	  for (let i = 1; i <= eventCountNum; i++) {
	    try {
	      const eventData = await contract.call("getEvent", [i]);
	      console.log(`✅ Event ${i} loaded:`, eventData[0]);
	      eventList.push({ id: i, ...eventData });
	    } catch (error) {
	      console.error(`❌ Error fetching event ${i}:`, error);
	    }
	  }
	  console.log(`✅ Total ${eventList.length} events loaded`);
	  setEvents(eventList);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchEvents();
  const interval = setInterval(fetchEvents, 30000);
  return () => clearInterval(interval);
}, [contract]);

  // Load user's tickets
  useEffect(() => {
    if (contract && address) {
      const fetchMyTickets = async () => {
        try {
          const ticketIds = await contract.call("getUserTickets", [address]);
          const ticketList = [];
          for (let ticketId of ticketIds) {
            const ticketData = await contract.call("getTicket", [ticketId]);
            const eventData = await contract.call("getEvent", [ticketData[0]]);
            ticketList.push({ 
              ticketId: Number(ticketId), 
              ...ticketData,
              eventName: eventData[0],
              eventDate: eventData[7]
            });
          }
          setMyTickets(ticketList);
        } catch (error) {
          console.error("Error fetching tickets:", error);
        }
      };
      fetchMyTickets();
    }
  }, [contract, address]);

  // Handle create event
  const handleCreateEvent = async () => {
    if (!eventForm.name || !eventForm.ticketPrice || !eventForm.totalTickets || !eventForm.eventDate) {
      showNotification('Vui lòng điền đầy đủ thông tin bắt buộc!', 'warning');
      return;
    }

    try {
      setLoading(true);
      const eventDateTimestamp = Math.floor(new Date(eventForm.eventDate).getTime() / 1000);
      const saleEndTimestamp = eventForm.saleEndDate 
        ? Math.floor(new Date(eventForm.saleEndDate).getTime() / 1000)
        : eventDateTimestamp - 3600; // 1 hour before event

      const ticketPriceWei = (parseFloat(eventForm.ticketPrice) * 1e18).toString();

      console.log("📝 Creating event with params:", {
        name: eventForm.name,
        description: eventForm.description || "Sự kiện đặc biệt",
        location: eventForm.location || "Chưa xác định",
        imageUrl: eventForm.imageUrl || "https://via.placeholder.com/400x300",
        ticketPrice: ticketPriceWei,
        totalTickets: parseInt(eventForm.totalTickets),
        eventDate: eventDateTimestamp,
        saleEndDate: saleEndTimestamp
      });

      await contract.call("createEvent", [
        eventForm.name,
        eventForm.description || "Sự kiện đặc biệt",
        eventForm.location || "Chưa xác định",
        eventForm.imageUrl || "https://via.placeholder.com/400x300",
        ticketPriceWei,
        parseInt(eventForm.totalTickets),
        eventDateTimestamp,
        saleEndTimestamp
      ]);

      showNotification('✅ Tạo sự kiện thành công!', 'success');
      setEventForm({
        name: '',
        description: '',
        location: '',
        imageUrl: '',
        ticketPrice: '',
        totalTickets: '',
        eventDate: '',
        saleEndDate: ''
      });
      setShowCreateEventForm(false);
      
      // Reload events after creating
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("❌ Error creating event:", error);
      showNotification('❌ Lỗi: ' + (error.message || 'Không xác định'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle purchase ticket
  const handlePurchaseTicket = async (eventId, ticketPrice, eventName) => {
    showConfirmDialog(
      `Bạn có chắc muốn mua vé cho "${eventName}"?\nGiá vé: ${(Number(ticketPrice) / 1e18).toFixed(4)} ETH`,
      async () => {
        try {
          setLoading(true);
          setConfirmAction({ show: false, message: '', onConfirm: null });
          
          console.log("🎫 Purchasing ticket for event:", eventId, "with price:", ticketPrice);
          
          await contract.call("purchaseTicket", [eventId], {
            value: ticketPrice
          });

          showNotification('🎉 Mua vé thành công!', 'success');
          
          // Reload after purchase
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (error) {
          console.error("❌ Error purchasing ticket:", error);
          showNotification('❌ Lỗi: ' + (error.message || 'Không xác định'), 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Handle cancel event
  const handleCancelEvent = async (eventId) => {
    showConfirmDialog(
      'Bạn có chắc muốn hủy sự kiện này? Hành động này không thể hoàn tác!',
      async () => {
        try {
          setLoading(true);
          setConfirmAction({ show: false, message: '', onConfirm: null });
          
          console.log("🚫 Cancelling event:", eventId);
          await contract.call("cancelEvent", [eventId]);
          
          showNotification('✅ Đã hủy sự kiện!', 'success');
          
          // Reload after cancel
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (error) {
          console.error("❌ Error cancelling event:", error);
          showNotification('❌ Lỗi: ' + (error.message || 'Không xác định'), 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Calculate time remaining
  const calculateTimeRemaining = (targetTime) => {
    const remaining = targetTime - currentTime;
    if (remaining <= 0) return { text: 'Đã hết hạn', seconds: 0, urgent: false };

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    let text = '';
    if (days > 0) text = `${days} ngày ${hours} giờ`;
    else if (hours > 0) text = `${hours} giờ ${minutes} phút`;
    else if (minutes > 0) text = `${minutes} phút ${seconds} giây`;
    else text = `${seconds} giây`;

    const urgent = remaining < 86400; // Less than 1 day
    return { text, seconds: remaining, urgent };
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return event[0].toLowerCase().includes(lowerSearch) || 
           event[1].toLowerCase().includes(lowerSearch) ||
           event[2].toLowerCase().includes(lowerSearch);
  });

  const activeEvents = filteredEvents.filter(e => e[9] && currentTime < e[8]);
  // eslint-disable-next-line no-unused-vars
  const pastEvents = filteredEvents.filter(e => !e[9] || currentTime >= e[7]);

  return (
    <div className="app-container">
      <Header address={address} isAdmin={isAdmin} />

      <main className="main-content">
        {!address ? (
          <div className="welcome-card">
            <div className="welcome-icon">🎫</div>
            <h2>Chào mừng đến với EventTicket DApp</h2>
            <p>Vui lòng kết nối ví MetaMask để mua vé sự kiện</p>
            <div className="features">
              <div className="feature"><span className="feature-icon">✅</span> Mua vé nhanh chóng</div>
              <div className="feature"><span className="feature-icon">🔒</span> An toàn & Bảo mật</div>
              <div className="feature"><span className="feature-icon">⚡</span> Thanh toán blockchain</div>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="main-tabs">
              <button 
                className={`main-tab ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                🎪 Sự kiện ({activeEvents.length})
              </button>
              <button 
                className={`main-tab ${activeTab === 'my-tickets' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-tickets')}
              >
                🎟️ Vé của tôi ({myTickets.length})
              </button>
              {isAdmin && (
                <button 
                  className={`main-tab ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('admin')}
                >
                  ➕ Tạo sự kiện
                </button>
              )}
            </div>

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="events-section">
                <div className="section-header">
                  <h2>🎪 Sự kiện sắp diễn ra</h2>
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="🔍 Tìm kiếm sự kiện..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {loading && events.length === 0 ? (
                  <div className="loading">⏳ Đang tải sự kiện...</div>
                ) : activeEvents.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>Hiện tại chưa có sự kiện nào đang mở bán vé</p>
                  </div>
                ) : (
                  <div className="events-grid">
                    {activeEvents.map((event) => {
                      const timeToEvent = calculateTimeRemaining(event[7]);
                      const timeToSaleEnd = calculateTimeRemaining(event[8]);
                      const ticketsLeft = Number(event[5]) - Number(event[6]);
                      const soldPercentage = (Number(event[6]) / Number(event[5])) * 100;

                      return (
                        <div key={event.id} className="event-card">
                          <div className="event-image" style={{ backgroundImage: `url(${event[3]})` }}>
                            <div className="event-badge">{ticketsLeft} vé còn lại</div>
                          </div>
                          <div className="event-content">
                            <h3 className="event-title">{event[0]}</h3>
                            <p className="event-description">{event[1]}</p>
                            
                            <div className="event-info">
                              <div className="info-row">
                                <span className="info-icon">📍</span>
                                <span>{event[2]}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-icon">📅</span>
                                <span>{new Date(Number(event[7]) * 1000).toLocaleString('vi-VN')}</span>
                              </div>
                              <div className={`info-row ${timeToSaleEnd.urgent ? 'urgent' : ''}`}>
                                <span className="info-icon">⏰</span>
                                <span>Bán vé còn: {timeToSaleEnd.text}</span>
                              </div>
                            </div>

                            <div className="ticket-progress">
                              <div className="progress-header">
                                <span>Đã bán: {Number(event[6])}/{Number(event[5])}</span>
                                <span>{soldPercentage.toFixed(0)}%</span>
                              </div>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${soldPercentage}%` }}></div>
                              </div>
                            </div>

                            <div className="event-footer">
                              <div className="event-price">
                                💰 {(Number(event[4]) / 1e18).toFixed(4)} ETH
                              </div>
                              <div className="event-actions">
                                <button 
                                  className="btn-details"
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setShowEventModal(true);
                                  }}
                                >
                                  Chi tiết
                                </button>
                                <button 
                                  className="btn-buy"
                                  onClick={() => handlePurchaseTicket(event.id, event[4], event[0])}
                                  disabled={loading || ticketsLeft === 0}
                                >
                                  {ticketsLeft === 0 ? 'Hết vé' : '🎫 Mua vé'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* My Tickets Tab */}
            {activeTab === 'my-tickets' && (
              <div className="tickets-section">
                <h2>🎟️ Vé của tôi</h2>
                {myTickets.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🎫</div>
                    <p>Bạn chưa mua vé nào</p>
                  </div>
                ) : (
                  <div className="tickets-grid">
                    {myTickets.map((ticket) => (
                      <div key={ticket.ticketId} className={`ticket-card ${ticket[4] ? 'used' : ''}`}>
                        <div className="ticket-header">
                          <h3>Vé #{ticket.ticketId}</h3>
                          <span className={`ticket-status ${ticket[4] ? 'used' : 'valid'}`}>
                            {ticket[4] ? '✓ Đã sử dụng' : '✓ Hợp lệ'}
                          </span>
                        </div>
                        <div className="ticket-body">
                          <div className="ticket-info">
                            <strong>🎪 Sự kiện:</strong> {ticket.eventName}
                          </div>
                          <div className="ticket-info">
                            <strong>📅 Ngày diễn ra:</strong> {new Date(Number(ticket.eventDate) * 1000).toLocaleString('vi-VN')}
                          </div>
                          <div className="ticket-info">
                            <strong>🛒 Ngày mua:</strong> {new Date(Number(ticket[2]) * 1000).toLocaleString('vi-VN')}
                          </div>
                          <div className="ticket-code">
                            <strong>🔖 Mã vé:</strong>
                            <code>{ticket[3]}</code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create Event Tab */}
            {activeTab === 'admin' && isAdmin && (
              <div className="admin-section">
                <div className="admin-header">
                  <h2>➕ Tạo sự kiện mới</h2>
                  <button 
                    className="btn-create-event"
                    onClick={() => setShowCreateEventForm(!showCreateEventForm)}
                  >
                    {showCreateEventForm ? '❌ Đóng' : '📝 Điền thông tin'}
                  </button>
                </div>

                {showCreateEventForm && (
                  <div className="create-event-form">
                    <h3>📝 Tạo sự kiện mới</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Tên sự kiện *</label>
                        <input
                          type="text"
                          placeholder="VD: Concert 2026"
                          value={eventForm.name}
                          onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Địa điểm</label>
                        <input
                          type="text"
                          placeholder="VD: Sân vận động Mỹ Đình"
                          value={eventForm.location}
                          onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Mô tả</label>
                        <textarea
                          placeholder="Mô tả chi tiết về sự kiện..."
                          value={eventForm.description}
                          onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                          rows="3"
                        />
                      </div>
                      <div className="form-group">
                        <label>URL hình ảnh</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={eventForm.imageUrl}
                          onChange={(e) => setEventForm({...eventForm, imageUrl: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Giá vé (ETH) *</label>
                        <input
                          type="number"
                          step="0.001"
                          placeholder="0.1"
                          value={eventForm.ticketPrice}
                          onChange={(e) => setEventForm({...eventForm, ticketPrice: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Số lượng vé *</label>
                        <input
                          type="number"
                          placeholder="1000"
                          value={eventForm.totalTickets}
                          onChange={(e) => setEventForm({...eventForm, totalTickets: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Ngày diễn ra sự kiện *</label>
                        <input
                          type="datetime-local"
                          value={eventForm.eventDate}
                          onChange={(e) => setEventForm({...eventForm, eventDate: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Ngày kết thúc bán vé</label>
                        <input
                          type="datetime-local"
                          value={eventForm.saleEndDate}
                          onChange={(e) => setEventForm({...eventForm, saleEndDate: e.target.value})}
                        />
                      </div>
                    </div>
                    <button 
                      className="btn-submit"
                      onClick={handleCreateEvent}
                      disabled={loading}
                    >
                      {loading ? '⏳ Đang xử lý...' : '🚀 Tạo sự kiện'}
                    </button>
                  </div>
                )}

                <div className="admin-events-list">
                  <h3>📋 Danh sách sự kiện</h3>
                  {events.length === 0 ? (
                    <div className="empty-state">
                      <p>Chưa có sự kiện nào</p>
                    </div>
                  ) : (
                    <div className="admin-table">
                      {events.map((event) => (
                        <div key={event.id} className="admin-event-row">
                          <div className="admin-event-info">
                            <h4>{event[0]}</h4>
                            <p>📍 {event[2]} | 📅 {new Date(Number(event[7]) * 1000).toLocaleDateString('vi-VN')}</p>
                            <p>🎫 Đã bán: {Number(event[6])}/{Number(event[5])} | 💰 {(Number(event[4]) / 1e18).toFixed(4)} ETH</p>
                          </div>
                          <div className="admin-event-actions">
                            <span className={`status-badge ${event[9] ? 'active' : 'inactive'}`}>
                              {event[9] ? '🟢 Hoạt động' : '🔴 Đã hủy'}
                            </span>
                            {event[9] && (
                              <button 
                                className="btn-cancel-event"
                                onClick={() => handleCancelEvent(event.id)}
                                disabled={loading}
                              >
                                Hủy sự kiện
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

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
              <p style={{ whiteSpace: 'pre-line' }}>{confirmAction.message}</p>
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

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎪 Chi tiết sự kiện</h3>
              <button className="modal-close" onClick={() => setShowEventModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <img src={selectedEvent[3]} alt={selectedEvent[0]} className="modal-event-image" />
              <h2>{selectedEvent[0]}</h2>
              <p className="event-description-full">{selectedEvent[1]}</p>
              
              <div className="event-details-grid">
                <div className="detail-item">
                  <strong>📍 Địa điểm:</strong>
                  <span>{selectedEvent[2]}</span>
                </div>
                <div className="detail-item">
                  <strong>📅 Ngày diễn ra:</strong>
                  <span>{new Date(Number(selectedEvent[7]) * 1000).toLocaleString('vi-VN')}</span>
                </div>
                <div className="detail-item">
                  <strong>⏰ Kết thúc bán vé:</strong>
                  <span>{new Date(Number(selectedEvent[8]) * 1000).toLocaleString('vi-VN')}</span>
                </div>
                <div className="detail-item">
                  <strong>💰 Giá vé:</strong>
                  <span>{(Number(selectedEvent[4]) / 1e18).toFixed(4)} ETH</span>
                </div>
                <div className="detail-item">
                  <strong>🎫 Tổng số vé:</strong>
                  <span>{Number(selectedEvent[5])}</span>
                </div>
                <div className="detail-item">
                  <strong>✓ Đã bán:</strong>
                  <span>{Number(selectedEvent[6])}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-close" onClick={() => setShowEventModal(false)}>
                Đóng
              </button>
              <button 
                className="btn-buy-modal"
                onClick={() => {
                  setShowEventModal(false);
                  handlePurchaseTicket(selectedEvent.id, selectedEvent[4], selectedEvent[0]);
                }}
                disabled={loading || (Number(selectedEvent[5]) - Number(selectedEvent[6])) === 0}
              >
                🎫 Mua vé
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
