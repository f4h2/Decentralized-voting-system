import { useState, useEffect, useCallback, useRef } from 'react';
import { CONTRACT_ADDRESSES, useAddress, useContract } from '@thirdweb-dev/react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';
import { EventTicketNFTABI, TicketType, TicketStatus, getTicketTypeName, getTicketStatusName } from './abi';

function App() {
  const address = useAddress();

  // Contract address - CẬP NHẬT SAU KHI DEPLOY CONTRACT MỚI
  // const CONTRACT_ADDRESS = "0x9a4219024594fEdACFBdFEb009321E3a2341f52F"; // Thay bằng địa chỉ contract EventTicketNFT mới
  const CONTRACT_ADDRESS = "0xeFB649042d97E2F56B5DfBc569b24e4132602c55";
  const { contract } = useContract(CONTRACT_ADDRESS, EventTicketNFTABI);
  // const { contract } = useContract(CONTRACT_ADDRESS);

  // State management
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [isAdmin, setIsAdmin] = useState(true);
  
  // Selected ticket type for purchase
  const [selectedTicketType, setSelectedTicketType] = useState(TicketType.STANDARD);
  const [seatInfo, setSeatInfo] = useState('');
  
  // Transfer form
  const [transferAddress, setTransferAddress] = useState('');
  
  // QR Verification
  const [qrInput, setQrInput] = useState('');
  const [qrVerificationResult, setQrVerificationResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerMode, setScannerMode] = useState('camera'); // 'camera' or 'manual'
  const scannerRef = useRef(null);

  // Notification & confirmation
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [confirmAction, setConfirmAction] = useState({ show: false, message: '', onConfirm: null });

  // Form states for creating event
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    location: '',
    imageUrl: '',
    eventDate: '',
    saleStartDate: '',
    saleEndDate: '',
    refundDeadline: '',
    economyPrice: '',
    economySupply: '',
    economyBenefits: 'Vé thường, vào cửa chính',
    standardPrice: '',
    standardSupply: '',
    standardBenefits: 'Vé tiêu chuẩn, ghế ngồi tốt',
    vipPrice: '',
    vipSupply: '',
    vipBenefits: 'Vé VIP, ghế hàng đầu, đồ uống miễn phí'
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
        const count = await contract.call("getEventCount");
        console.log("📊 EventCount:", count?.toString());
        
        const eventList = [];
        const eventCountNum = Number(count) || 0;
        
        for (let i = 1; i <= eventCountNum; i++) {
          try {
            // Gọi 2 hàm riêng để lấy thông tin event
            const basicInfo = await contract.call("getEventBasicInfo", [i]);
            const saleInfo = await contract.call("getEventSaleInfo", [i]);
            
            // Load ticket type info for each type
            const ticketTypes = [];
            for (let t = 0; t <= 2; t++) {
              try {
                const typeInfo = await contract.call("getTicketTypeInfo", [i, t]);
                ticketTypes.push({
                  name: typeInfo[0],
                  price: typeInfo[1],
                  totalSupply: typeInfo[2],
                  sold: typeInfo[3],
                  benefits: typeInfo[4],
                  isActive: typeInfo[5]
                });
              } catch (e) {
                console.log(`Ticket type ${t} not available for event ${i}`);
              }
            }
            
            eventList.push({ 
              id: i, 
              // Basic info
              name: basicInfo[0],
              description: basicInfo[1],
              location: basicInfo[2],
              imageUrl: basicInfo[3],
              eventDate: basicInfo[4],
              organizer: basicInfo[5],
              // Sale info
              saleStartDate: saleInfo[0],
              saleEndDate: saleInfo[1],
              refundDeadline: saleInfo[2],
              isActive: saleInfo[3],
              isCancelled: saleInfo[4],
              totalRevenue: saleInfo[5],
              ticketTypes
            });
            console.log(`✅ Event ${i} loaded:`, basicInfo[0]);
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
            try {
              // Gọi 2 hàm riêng để lấy thông tin ticket
              const ticketBasic = await contract.call("getTicketBasicInfo", [ticketId]);
              const ticketDetails = await contract.call("getTicketDetails", [ticketId]);
              
              // Gọi 2 hàm riêng để lấy thông tin event
              const eventBasic = await contract.call("getEventBasicInfo", [ticketBasic[0]]);
              const eventSale = await contract.call("getEventSaleInfo", [ticketBasic[0]]);
              
              // Get transfer history
              let transferHistory = [];
              try {
                transferHistory = await contract.call("getTransferHistory", [ticketId]);
              } catch (e) {
                console.log("No transfer history");
              }
              
              ticketList.push({ 
                tokenId: Number(ticketId),
                // Ticket basic info
                eventId: Number(ticketBasic[0]),
                ticketType: Number(ticketBasic[1]),
                originalBuyer: ticketBasic[2],
                purchaseDate: ticketBasic[3],
                // Ticket details
                purchasePrice: ticketDetails[0],
                qrCodeHash: ticketDetails[1],
                status: Number(ticketDetails[2]),
                seatInfo: ticketDetails[3],
                // Event info
                eventName: eventBasic[0],
                eventDate: eventBasic[4],
                eventLocation: eventBasic[2],
                eventImageUrl: eventBasic[3],
                isCancelled: eventSale[4],
                refundDeadline: eventSale[2],
                transferHistory
              });
            } catch (e) {
              console.error(`Error fetching ticket ${ticketId}:`, e);
            }
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
    if (!eventForm.name || !eventForm.eventDate || !eventForm.saleEndDate) {
      showNotification('Vui lòng điền đầy đủ thông tin bắt buộc!', 'warning');
      return;
    }

    // Validate at least one ticket type has supply
    if (!eventForm.economySupply && !eventForm.standardSupply && !eventForm.vipSupply) {
      showNotification('Vui lòng nhập số lượng vé cho ít nhất một loại!', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      const eventDateTimestamp = Math.floor(new Date(eventForm.eventDate).getTime() / 1000);
      const saleStartTimestamp = eventForm.saleStartDate 
        ? Math.floor(new Date(eventForm.saleStartDate).getTime() / 1000)
        : Math.floor(Date.now() / 1000) + 60; // Start 1 minute from now
      const saleEndTimestamp = Math.floor(new Date(eventForm.saleEndDate).getTime() / 1000);
      const refundDeadlineTimestamp = eventForm.refundDeadline 
        ? Math.floor(new Date(eventForm.refundDeadline).getTime() / 1000)
        : saleEndTimestamp - 86400; // 1 day before sale ends

      const ticketPrices = [
        eventForm.economyPrice ? (parseFloat(eventForm.economyPrice) * 1e18).toString() : "0",
        eventForm.standardPrice ? (parseFloat(eventForm.standardPrice) * 1e18).toString() : "0",
        eventForm.vipPrice ? (parseFloat(eventForm.vipPrice) * 1e18).toString() : "0"
      ];

      const ticketSupplies = [
        parseInt(eventForm.economySupply) || 0,
        parseInt(eventForm.standardSupply) || 0,
        parseInt(eventForm.vipSupply) || 0
      ];

      const ticketBenefits = [
        eventForm.economyBenefits,
        eventForm.standardBenefits,
        eventForm.vipBenefits
      ];

      console.log("📝 Creating event with params:", {
        name: eventForm.name,
        ticketPrices,
        ticketSupplies
      });

      // New contract signature uses structs
      const params = {
        name: eventForm.name,
        description: eventForm.description || "Sự kiện đặc biệt",
        location: eventForm.location || "Chưa xác định",
        imageUrl: eventForm.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"
      };

      const dates = {
        eventDate: eventDateTimestamp,
        saleStartDate: saleStartTimestamp,
        saleEndDate: saleEndTimestamp,
        refundDeadline: refundDeadlineTimestamp
      };

      const tickets = [
        { price: ticketPrices[0], supply: ticketSupplies[0], benefits: ticketBenefits[0] },
        { price: ticketPrices[1], supply: ticketSupplies[1], benefits: ticketBenefits[1] },
        { price: ticketPrices[2], supply: ticketSupplies[2], benefits: ticketBenefits[2] }
      ];

      await contract.call("createEvent", [params, dates, tickets]);

      showNotification('✅ Tạo sự kiện thành công!', 'success');
      setEventForm({
        name: '', description: '', location: '', imageUrl: '',
        eventDate: '', saleStartDate: '', saleEndDate: '', refundDeadline: '',
        economyPrice: '', economySupply: '', economyBenefits: 'Vé thường, vào cửa chính',
        standardPrice: '', standardSupply: '', standardBenefits: 'Vé tiêu chuẩn, ghế ngồi tốt',
        vipPrice: '', vipSupply: '', vipBenefits: 'Vé VIP, ghế hàng đầu, đồ uống miễn phí'
      });
      setShowCreateEventForm(false);
      
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error("❌ Error creating event:", error);
      showNotification('❌ Lỗi: ' + (error.message || 'Không xác định'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle purchase ticket
  const handlePurchaseTicket = async (event, ticketType) => {
    const ticketInfo = event.ticketTypes[ticketType];
    if (!ticketInfo || !ticketInfo.isActive) {
      showNotification('Loại vé này không khả dụng!', 'error');
      return;
    }

    const ticketsLeft = Number(ticketInfo.totalSupply) - Number(ticketInfo.sold);
    if (ticketsLeft <= 0) {
      showNotification('Loại vé này đã hết!', 'error');
      return;
    }

    showConfirmDialog(
      `Bạn có chắc muốn mua vé ${getTicketTypeName(ticketType)} cho "${event.name}"?\n\nGiá vé: ${(Number(ticketInfo.price) / 1e18).toFixed(4)} ETH\nQuyền lợi: ${ticketInfo.benefits}`,
      async () => {
        try {
          setLoading(true);
          setConfirmAction({ show: false, message: '', onConfirm: null });
          
          console.log("🎫 Purchasing ticket:", { eventId: event.id, ticketType, price: ticketInfo.price.toString() });
          
          await contract.call("purchaseTicket", [event.id, ticketType, seatInfo || "General Admission"], {
            value: ticketInfo.price
          });

          showNotification('🎉 Mua vé thành công! Vé NFT đã được mint vào ví của bạn.', 'success');
          setSeatInfo('');
          setShowEventModal(false);
          
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          console.error("❌ Error purchasing ticket:", error);
          showNotification('❌ Lỗi: ' + (error.message || 'Không xác định'), 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Handle transfer ticket
  const handleTransferTicket = async () => {
    if (!transferAddress || !selectedTicket) {
      showNotification('Vui lòng nhập địa chỉ người nhận!', 'warning');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(transferAddress)) {
      showNotification('Địa chỉ ví không hợp lệ!', 'error');
      return;
    }

    showConfirmDialog(
      `Bạn có chắc muốn chuyển vé #${selectedTicket.tokenId} cho địa chỉ ${transferAddress.slice(0, 6)}...${transferAddress.slice(-4)}?\n\nHành động này không thể hoàn tác!`,
      async () => {
        try {
          setLoading(true);
          setConfirmAction({ show: false, message: '', onConfirm: null });
          
          await contract.call("transferTicket", [selectedTicket.tokenId, transferAddress]);
          
          showNotification('✅ Chuyển vé thành công!', 'success');
          setShowTransferModal(false);
          setTransferAddress('');
          setSelectedTicket(null);
          
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          console.error("❌ Error transferring ticket:", error);
          showNotification('❌ Lỗi: ' + (error.message || 'Không xác định'), 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Handle refund ticket
  const handleRefundTicket = async () => {
    if (!selectedTicket) return;

    const canRefund = selectedTicket.isCancelled || currentTime <= Number(selectedTicket.refundDeadline);
    
    if (!canRefund) {
      showNotification('Đã hết thời hạn hoàn vé!', 'error');
      return;
    }

    const refundAmount = selectedTicket.isCancelled 
      ? Number(selectedTicket.purchasePrice) 
      : (Number(selectedTicket.purchasePrice) * 95) / 100;

    showConfirmDialog(
      `Bạn có chắc muốn hoàn vé #${selectedTicket.tokenId}?\n\nSố tiền hoàn lại: ${(refundAmount / 1e18).toFixed(4)} ETH${!selectedTicket.isCancelled ? '\n(Đã trừ 5% phí xử lý)' : ''}\n\nVé NFT sẽ bị burn và không thể khôi phục!`,
      async () => {
        try {
          setLoading(true);
          setConfirmAction({ show: false, message: '', onConfirm: null });
          
          await contract.call("refundTicket", [selectedTicket.tokenId]);
          
          showNotification('✅ Hoàn vé thành công! Tiền đã được chuyển về ví của bạn.', 'success');
          setShowRefundModal(false);
          setSelectedTicket(null);
          
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          console.error("❌ Error refunding ticket:", error);
          showNotification('❌ Lỗi: ' + (error.message || 'Không xác định'), 'error');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Handle verify QR
  const handleVerifyQR = async (qrCode = null) => {
    const codeToVerify = qrCode || qrInput;
    
    if (!codeToVerify) {
      showNotification('Vui lòng quét hoặc nhập mã QR!', 'warning');
      return;
    }

    try {
      setLoading(true);
      const result = await contract.call("verifyTicketByQR", [codeToVerify]);
      
      setQrVerificationResult({
        isValid: result[0],
        tokenId: Number(result[1]),
        eventId: Number(result[2]),
        eventName: result[3],
        ticketTypeName: result[4],
        currentOwner: result[5],
        message: result[6]
      });
      
      // Stop scanner after successful scan
      if (qrCode && scannerRef.current) {
        stopScanner();
      }
    } catch (error) {
      console.error("❌ Error verifying QR:", error);
      setQrVerificationResult({
        isValid: false,
        message: 'Lỗi xác thực: ' + (error.message || 'Không xác định')
      });
    } finally {
      setLoading(false);
    }
  };

  // Start QR Scanner
  const startScanner = () => {
    setIsScanning(true);
    setQrVerificationResult(null);
    
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        false
      );
      
      scanner.render(
        (decodedText) => {
          console.log("📱 QR Scanned:", decodedText);
          setQrInput(decodedText);
          handleVerifyQR(decodedText);
          scanner.clear();
          setIsScanning(false);
        },
        (error) => {
          // Ignore scan errors (happens frequently during scanning)
        }
      );
      
      scannerRef.current = scanner;
    }, 100);
  };

  // Stop QR Scanner
  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (e) {
        console.log("Scanner already cleared");
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Cleanup scanner on unmount or tab change
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {}
      }
    };
  }, []);

  // Stop scanner when switching tabs
  useEffect(() => {
    if (activeTab !== 'verify') {
      stopScanner();
    }
  }, [activeTab]);

  // Handle use ticket (check-in)
  const handleUseTicket = async (tokenId) => {
    showConfirmDialog(
      `Xác nhận check-in vé #${tokenId}?\n\nSau khi check-in, vé sẽ không còn sử dụng được nữa.`,
      async () => {
        try {
          setLoading(true);
          setConfirmAction({ show: false, message: '', onConfirm: null });
          
          await contract.call("useTicket", [tokenId]);
          
          showNotification('✅ Check-in thành công!', 'success');
          setQrVerificationResult(null);
          setQrInput('');
          
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          console.error("❌ Error using ticket:", error);
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
      'Bạn có chắc muốn hủy sự kiện này?\n\nTất cả người mua vé sẽ được hoàn tiền đầy đủ!\nHành động này không thể hoàn tác!',
      async () => {
        try {
          setLoading(true);
          setConfirmAction({ show: false, message: '', onConfirm: null });
          
          await contract.call("cancelEvent", [eventId]);
          
          showNotification('✅ Đã hủy sự kiện!', 'success');
          
          setTimeout(() => window.location.reload(), 2000);
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
    const remaining = Number(targetTime) - currentTime;
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

    const urgent = remaining < 86400;
    return { text, seconds: remaining, urgent };
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return event.name.toLowerCase().includes(lowerSearch) || 
           event.description.toLowerCase().includes(lowerSearch) ||
           event.location.toLowerCase().includes(lowerSearch);
  });

  const activeEvents = filteredEvents.filter(e => e.isActive && !e.isCancelled && currentTime < Number(e.saleEndDate));

  // Get total tickets for an event
  const getTotalTickets = (event) => {
    return event.ticketTypes.reduce((sum, t) => sum + Number(t.totalSupply || 0), 0);
  };

  const getSoldTickets = (event) => {
    return event.ticketTypes.reduce((sum, t) => sum + Number(t.sold || 0), 0);
  };

  const getLowestPrice = (event) => {
    const prices = event.ticketTypes
      .filter(t => t.isActive && Number(t.totalSupply) > Number(t.sold))
      .map(t => Number(t.price));
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  return (
    <div className="app-container">
      <Header address={address} isAdmin={isAdmin} />

      <main className="main-content">
        {!address ? (
          <div className="welcome-card">
            <div className="welcome-icon">🎫</div>
            <h2>Chào mừng đến với EventTicket NFT DApp</h2>
            <p>Hệ thống vé sự kiện NFT trên Blockchain</p>
            <div className="features">
              <div className="feature"><span className="feature-icon">🎨</span> Vé NFT độc quyền</div>
              <div className="feature"><span className="feature-icon">🔄</span> Chuyển nhượng dễ dàng</div>
              <div className="feature"><span className="feature-icon">💰</span> Hoàn vé tự động</div>
              <div className="feature"><span className="feature-icon">📱</span> Xác thực QR Code</div>
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
                🎟️ Vé NFT của tôi ({myTickets.length})
              </button>
              <button 
                className={`main-tab ${activeTab === 'verify' ? 'active' : ''}`}
                onClick={() => setActiveTab('verify')}
              >
                📱 Xác thực QR
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
                      const timeToSaleEnd = calculateTimeRemaining(event.saleEndDate);
                      const totalTickets = getTotalTickets(event);
                      const soldTickets = getSoldTickets(event);
                      const ticketsLeft = totalTickets - soldTickets;
                      const soldPercentage = totalTickets > 0 ? (soldTickets / totalTickets) * 100 : 0;
                      const lowestPrice = getLowestPrice(event);

                      return (
                        <div key={event.id} className="event-card">
                          <div className="event-image" style={{ backgroundImage: `url(${event.imageUrl})` }}>
                            <div className="event-badges">
                              <span className="event-badge nft">🎨 NFT</span>
                              <span className="event-badge tickets">{ticketsLeft} vé còn lại</span>
                            </div>
                          </div>
                          <div className="event-content">
                            <h3 className="event-title">{event.name}</h3>
                            <p className="event-description">{event.description}</p>
                            
                            <div className="event-info">
                              <div className="info-row">
                                <span className="info-icon">📍</span>
                                <span>{event.location}</span>
                              </div>
                              <div className="info-row">
                                <span className="info-icon">📅</span>
                                <span>{new Date(Number(event.eventDate) * 1000).toLocaleString('vi-VN')}</span>
                              </div>
                              <div className={`info-row ${timeToSaleEnd.urgent ? 'urgent' : ''}`}>
                                <span className="info-icon">⏰</span>
                                <span>Bán vé còn: {timeToSaleEnd.text}</span>
                              </div>
                            </div>

                            {/* Ticket Types Preview */}
                            <div className="ticket-types-preview">
                              {event.ticketTypes.map((type, idx) => (
                                type.isActive && Number(type.totalSupply) > 0 && (
                                  <span key={idx} className={`type-badge type-${idx}`}>
                                    {type.name}: {(Number(type.price) / 1e18).toFixed(3)} ETH
                                  </span>
                                )
                              ))}
                            </div>

                            <div className="ticket-progress">
                              <div className="progress-header">
                                <span>Đã bán: {soldTickets}/{totalTickets}</span>
                                <span>{soldPercentage.toFixed(0)}%</span>
                              </div>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${soldPercentage}%` }}></div>
                              </div>
                            </div>

                            <div className="event-footer">
                              <div className="event-price">
                                💰 Từ {(lowestPrice / 1e18).toFixed(4)} ETH
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
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setShowEventModal(true);
                                  }}
                                  disabled={loading || ticketsLeft === 0}
                                >
                                  {ticketsLeft === 0 ? 'Hết vé' : '🎫 Mua vé NFT'}
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
                <h2>🎟️ Vé NFT của tôi</h2>
                {myTickets.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🎫</div>
                    <p>Bạn chưa có vé NFT nào</p>
                  </div>
                ) : (
                  <div className="tickets-grid">
                    {myTickets.map((ticket) => {
                      const canRefund = ticket.status === TicketStatus.VALID && 
                        (ticket.isCancelled || currentTime <= Number(ticket.refundDeadline));
                      const canTransfer = ticket.status === TicketStatus.VALID && !ticket.isCancelled;

                      return (
                        <div key={ticket.tokenId} className={`ticket-card nft-ticket status-${ticket.status}`}>
                          <div className="ticket-header">
                            <div className="ticket-id">
                              <span className="nft-badge">NFT</span>
                              <h3>Vé #{ticket.tokenId}</h3>
                            </div>
                            <span className={`ticket-status status-${ticket.status}`}>
                              {getTicketStatusName(ticket.status)}
                            </span>
                          </div>
                          
                          <div className="ticket-image" style={{ backgroundImage: `url(${ticket.eventImageUrl})` }}>
                            <div className="ticket-type-badge type-${ticket.ticketType}">
                              {getTicketTypeName(ticket.ticketType)}
                            </div>
                          </div>
                          
                          <div className="ticket-body">
                            <div className="ticket-info">
                              <strong>🎪 Sự kiện:</strong> {ticket.eventName}
                            </div>
                            <div className="ticket-info">
                              <strong>📅 Ngày diễn ra:</strong> {new Date(Number(ticket.eventDate) * 1000).toLocaleString('vi-VN')}
                            </div>
                            <div className="ticket-info">
                              <strong>📍 Địa điểm:</strong> {ticket.eventLocation}
                            </div>
                            <div className="ticket-info">
                              <strong>💺 Chỗ ngồi:</strong> {ticket.seatInfo}
                            </div>
                            <div className="ticket-info">
                              <strong>💰 Giá mua:</strong> {(Number(ticket.purchasePrice) / 1e18).toFixed(4)} ETH
                            </div>
                            
                            {/* QR Code */}
                            <div className="ticket-qr" onClick={() => {
                              setSelectedTicket(ticket);
                              setShowQRModal(true);
                            }}>
                              <QRCodeSVG 
                                value={ticket.qrCodeHash}
                                size={120}
                                level="H"
                                includeMargin={true}
                              />
                              <p className="qr-hint">Nhấn để phóng to</p>
                            </div>
                          </div>

                          {ticket.status === TicketStatus.VALID && (
                            <div className="ticket-actions">
                              {canTransfer && (
                                <button 
                                  className="btn-transfer"
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setShowTransferModal(true);
                                  }}
                                >
                                  🔄 Chuyển nhượng
                                </button>
                              )}
                              {canRefund && (
                                <button 
                                  className="btn-refund"
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setShowRefundModal(true);
                                  }}
                                >
                                  💰 Hoàn vé
                                </button>
                              )}
                            </div>
                          )}

                          {ticket.transferHistory && ticket.transferHistory.length > 0 && (
                            <div className="transfer-history">
                              <h4>📜 Lịch sử chuyển nhượng</h4>
                              {ticket.transferHistory.map((h, idx) => (
                                <div key={idx} className="history-item">
                                  <span>{h.from.slice(0,6)}...{h.from.slice(-4)}</span>
                                  <span>→</span>
                                  <span>{h.to.slice(0,6)}...{h.to.slice(-4)}</span>
                                  <span className="history-price">
                                    {Number(h.price) > 0 ? `${(Number(h.price) / 1e18).toFixed(4)} ETH` : 'Miễn phí'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* QR Verification Tab */}
            {activeTab === 'verify' && (
              <div className="verify-section">
                <h2>📱 Xác thực vé bằng QR Code</h2>
                
                {/* Mode Toggle */}
                <div className="scanner-mode-toggle">
                  <button 
                    className={`mode-btn ${scannerMode === 'camera' ? 'active' : ''}`}
                    onClick={() => { setScannerMode('camera'); stopScanner(); }}
                  >
                    📷 Quét Camera
                  </button>
                  <button 
                    className={`mode-btn ${scannerMode === 'manual' ? 'active' : ''}`}
                    onClick={() => { setScannerMode('manual'); stopScanner(); }}
                  >
                    ⌨️ Nhập thủ công
                  </button>
                </div>

                <div className="verify-card">
                  {/* Camera Scanner Mode */}
                  {scannerMode === 'camera' && (
                    <div className="scanner-section">
                      {!isScanning ? (
                        <div className="scanner-placeholder">
                          <div className="scanner-icon">📷</div>
                          <p>Nhấn nút bên dưới để bật camera quét mã QR</p>
                          <button 
                            className="btn-start-scan"
                            onClick={startScanner}
                            disabled={loading}
                          >
                            🎥 Bật Camera Quét QR
                          </button>
                        </div>
                      ) : (
                        <div className="scanner-active">
                          <div id="qr-reader" className="qr-reader-container"></div>
                          <button 
                            className="btn-stop-scan"
                            onClick={stopScanner}
                          >
                            ⏹️ Dừng quét
                          </button>
                          <p className="scan-hint">Đưa mã QR vào khung hình để quét</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Input Mode */}
                  {scannerMode === 'manual' && (
                    <div className="verify-input-group">
                      <label>Nhập mã QR hash:</label>
                      <input
                        type="text"
                        placeholder="Nhập mã QR hash..."
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        className="qr-input"
                      />
                      <button 
                        className="btn-verify"
                        onClick={() => handleVerifyQR()}
                        disabled={loading || !qrInput}
                      >
                        {loading ? '⏳ Đang xác thực...' : '🔍 Xác thực'}
                      </button>
                    </div>
                  )}

                  {qrVerificationResult && (
                    <div className={`verification-result ${qrVerificationResult.isValid ? 'valid' : 'invalid'}`}>
                      <div className="result-icon">
                        {qrVerificationResult.isValid ? '✅' : '❌'}
                      </div>
                      <h3>{qrVerificationResult.isValid ? 'Vé hợp lệ!' : 'Vé không hợp lệ!'}</h3>
                      <p className="result-message">{qrVerificationResult.message}</p>
                      
                      {qrVerificationResult.isValid && (
                        <>
                          <div className="result-details">
                            <div className="detail-row">
                              <span>Mã vé:</span>
                              <strong>#{qrVerificationResult.tokenId}</strong>
                            </div>
                            <div className="detail-row">
                              <span>Sự kiện:</span>
                              <strong>{qrVerificationResult.eventName}</strong>
                            </div>
                            <div className="detail-row">
                              <span>Loại vé:</span>
                              <strong>{qrVerificationResult.ticketTypeName}</strong>
                            </div>
                            <div className="detail-row">
                              <span>Chủ sở hữu:</span>
                              <strong>{qrVerificationResult.currentOwner.slice(0,6)}...{qrVerificationResult.currentOwner.slice(-4)}</strong>
                            </div>
                          </div>
                          <button 
                            className="btn-checkin"
                            onClick={() => handleUseTicket(qrVerificationResult.tokenId)}
                            disabled={loading}
                          >
                            ✓ Check-in ngay
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
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
                    <h3>📝 Thông tin sự kiện</h3>
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
                      <div className="form-group full-width">
                        <label>URL hình ảnh</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={eventForm.imageUrl}
                          onChange={(e) => setEventForm({...eventForm, imageUrl: e.target.value})}
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
                        <label>Ngày bắt đầu bán vé</label>
                        <input
                          type="datetime-local"
                          value={eventForm.saleStartDate}
                          onChange={(e) => setEventForm({...eventForm, saleStartDate: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Ngày kết thúc bán vé *</label>
                        <input
                          type="datetime-local"
                          value={eventForm.saleEndDate}
                          onChange={(e) => setEventForm({...eventForm, saleEndDate: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Hạn hoàn vé</label>
                        <input
                          type="datetime-local"
                          value={eventForm.refundDeadline}
                          onChange={(e) => setEventForm({...eventForm, refundDeadline: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Ticket Types */}
                    <h3 className="ticket-types-title">🎫 Cấu hình loại vé</h3>
                    <div className="ticket-types-config">
                      {/* Economy */}
                      <div className="ticket-type-form economy">
                        <h4>🎫 Vé Economy</h4>
                        <div className="type-fields">
                          <div className="form-group">
                            <label>Giá (ETH)</label>
                            <input
                              type="number"
                              step="0.001"
                              placeholder="0.01"
                              value={eventForm.economyPrice}
                              onChange={(e) => setEventForm({...eventForm, economyPrice: e.target.value})}
                            />
                          </div>
                          <div className="form-group">
                            <label>Số lượng</label>
                            <input
                              type="number"
                              placeholder="500"
                              value={eventForm.economySupply}
                              onChange={(e) => setEventForm({...eventForm, economySupply: e.target.value})}
                            />
                          </div>
                          <div className="form-group full-width">
                            <label>Quyền lợi</label>
                            <input
                              type="text"
                              value={eventForm.economyBenefits}
                              onChange={(e) => setEventForm({...eventForm, economyBenefits: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Standard */}
                      <div className="ticket-type-form standard">
                        <h4>⭐ Vé Standard</h4>
                        <div className="type-fields">
                          <div className="form-group">
                            <label>Giá (ETH)</label>
                            <input
                              type="number"
                              step="0.001"
                              placeholder="0.05"
                              value={eventForm.standardPrice}
                              onChange={(e) => setEventForm({...eventForm, standardPrice: e.target.value})}
                            />
                          </div>
                          <div className="form-group">
                            <label>Số lượng</label>
                            <input
                              type="number"
                              placeholder="300"
                              value={eventForm.standardSupply}
                              onChange={(e) => setEventForm({...eventForm, standardSupply: e.target.value})}
                            />
                          </div>
                          <div className="form-group full-width">
                            <label>Quyền lợi</label>
                            <input
                              type="text"
                              value={eventForm.standardBenefits}
                              onChange={(e) => setEventForm({...eventForm, standardBenefits: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      {/* VIP */}
                      <div className="ticket-type-form vip">
                        <h4>👑 Vé VIP</h4>
                        <div className="type-fields">
                          <div className="form-group">
                            <label>Giá (ETH)</label>
                            <input
                              type="number"
                              step="0.001"
                              placeholder="0.1"
                              value={eventForm.vipPrice}
                              onChange={(e) => setEventForm({...eventForm, vipPrice: e.target.value})}
                            />
                          </div>
                          <div className="form-group">
                            <label>Số lượng</label>
                            <input
                              type="number"
                              placeholder="100"
                              value={eventForm.vipSupply}
                              onChange={(e) => setEventForm({...eventForm, vipSupply: e.target.value})}
                            />
                          </div>
                          <div className="form-group full-width">
                            <label>Quyền lợi</label>
                            <input
                              type="text"
                              value={eventForm.vipBenefits}
                              onChange={(e) => setEventForm({...eventForm, vipBenefits: e.target.value})}
                            />
                          </div>
                        </div>
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
                        <div key={event.id} className={`admin-event-row ${event.isCancelled ? 'cancelled' : ''}`}>
                          <div className="admin-event-info">
                            <h4>{event.name}</h4>
                            <p>📍 {event.location} | 📅 {new Date(Number(event.eventDate) * 1000).toLocaleDateString('vi-VN')}</p>
                            <p>
                              🎫 Đã bán: {getSoldTickets(event)}/{getTotalTickets(event)} | 
                              💰 Doanh thu: {(Number(event.totalRevenue) / 1e18).toFixed(4)} ETH
                            </p>
                            <div className="ticket-type-stats">
                              {event.ticketTypes.map((type, idx) => (
                                type.isActive && Number(type.totalSupply) > 0 && (
                                  <span key={idx} className={`type-stat type-${idx}`}>
                                    {type.name}: {Number(type.sold)}/{Number(type.totalSupply)}
                                  </span>
                                )
                              ))}
                            </div>
                          </div>
                          <div className="admin-event-actions">
                            <span className={`status-badge ${event.isCancelled ? 'cancelled' : event.isActive ? 'active' : 'inactive'}`}>
                              {event.isCancelled ? '🔴 Đã hủy' : event.isActive ? '🟢 Hoạt động' : '🟡 Tạm dừng'}
                            </span>
                            {!event.isCancelled && (
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

      {/* Event Details Modal with Ticket Type Selection */}
      {showEventModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content event-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎪 Chi tiết sự kiện</h3>
              <button className="modal-close" onClick={() => setShowEventModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <img src={selectedEvent.imageUrl} alt={selectedEvent.name} className="modal-event-image" />
              <h2>{selectedEvent.name}</h2>
              <p className="event-description-full">{selectedEvent.description}</p>
              
              <div className="event-details-grid">
                <div className="detail-item">
                  <strong>📍 Địa điểm:</strong>
                  <span>{selectedEvent.location}</span>
                </div>
                <div className="detail-item">
                  <strong>📅 Ngày diễn ra:</strong>
                  <span>{new Date(Number(selectedEvent.eventDate) * 1000).toLocaleString('vi-VN')}</span>
                </div>
                <div className="detail-item">
                  <strong>⏰ Kết thúc bán vé:</strong>
                  <span>{new Date(Number(selectedEvent.saleEndDate) * 1000).toLocaleString('vi-VN')}</span>
                </div>
                <div className="detail-item">
                  <strong>💰 Hạn hoàn vé:</strong>
                  <span>{new Date(Number(selectedEvent.refundDeadline) * 1000).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              {/* Ticket Type Selection */}
              <div className="ticket-type-selection">
                <h3>🎫 Chọn loại vé</h3>
                <div className="ticket-types-list">
                  {selectedEvent.ticketTypes.map((type, idx) => {
                    const available = Number(type.totalSupply) - Number(type.sold);
                    const isSelected = selectedTicketType === idx;
                    
                    return type.isActive && Number(type.totalSupply) > 0 && (
                      <div 
                        key={idx} 
                        className={`ticket-type-option type-${idx} ${isSelected ? 'selected' : ''} ${available === 0 ? 'sold-out' : ''}`}
                        onClick={() => available > 0 && setSelectedTicketType(idx)}
                      >
                        <div className="type-header">
                          <span className="type-name">
                            {idx === 0 && '🎫'} 
                            {idx === 1 && '⭐'} 
                            {idx === 2 && '👑'} 
                            {type.name}
                          </span>
                          <span className="type-price">{(Number(type.price) / 1e18).toFixed(4)} ETH</span>
                        </div>
                        <p className="type-benefits">{type.benefits}</p>
                        <div className="type-availability">
                          <span>Còn lại: {available}/{Number(type.totalSupply)}</span>
                          {available === 0 && <span className="sold-out-badge">Hết vé</span>}
                        </div>
                        {isSelected && <div className="selected-check">✓</div>}
                      </div>
                    );
                  })}
                </div>

                <div className="seat-input">
                  <label>💺 Thông tin chỗ ngồi (tùy chọn):</label>
                  <input
                    type="text"
                    placeholder="VD: Khu A, Hàng 5, Ghế 12"
                    value={seatInfo}
                    onChange={(e) => setSeatInfo(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-close" onClick={() => setShowEventModal(false)}>
                Đóng
              </button>
              <button 
                className="btn-buy-modal"
                onClick={() => handlePurchaseTicket(selectedEvent, selectedTicketType)}
                disabled={loading || !selectedEvent.ticketTypes[selectedTicketType]?.isActive ||
                  (Number(selectedEvent.ticketTypes[selectedTicketType]?.totalSupply) - 
                   Number(selectedEvent.ticketTypes[selectedTicketType]?.sold)) === 0}
              >
                {loading ? '⏳ Đang xử lý...' : `🎫 Mua vé ${getTicketTypeName(selectedTicketType)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content transfer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔄 Chuyển nhượng vé #{selectedTicket.tokenId}</h3>
              <button className="modal-close" onClick={() => setShowTransferModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="transfer-ticket-info">
                <p><strong>Sự kiện:</strong> {selectedTicket.eventName}</p>
                <p><strong>Loại vé:</strong> {getTicketTypeName(selectedTicket.ticketType)}</p>
                <p><strong>Giá gốc:</strong> {(Number(selectedTicket.purchasePrice) / 1e18).toFixed(4)} ETH</p>
              </div>
              
              <div className="form-group">
                <label>Địa chỉ ví người nhận:</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  className="transfer-input"
                />
              </div>
              
              <div className="transfer-warning">
                ⚠️ Lưu ý: Sau khi chuyển, bạn sẽ không còn sở hữu vé này. QR Code sẽ được tạo mới cho người nhận.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowTransferModal(false)}>
                Hủy
              </button>
              <button 
                className="btn-transfer-confirm"
                onClick={handleTransferTicket}
                disabled={loading || !transferAddress}
              >
                {loading ? '⏳ Đang xử lý...' : '🔄 Xác nhận chuyển'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal-content refund-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 Hoàn vé #{selectedTicket.tokenId}</h3>
              <button className="modal-close" onClick={() => setShowRefundModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="refund-ticket-info">
                <p><strong>Sự kiện:</strong> {selectedTicket.eventName}</p>
                <p><strong>Loại vé:</strong> {getTicketTypeName(selectedTicket.ticketType)}</p>
                <p><strong>Giá mua:</strong> {(Number(selectedTicket.purchasePrice) / 1e18).toFixed(4)} ETH</p>
              </div>
              
              <div className="refund-calculation">
                <h4>💵 Số tiền hoàn lại:</h4>
                {selectedTicket.isCancelled ? (
                  <div className="refund-amount full">
                    <span>{(Number(selectedTicket.purchasePrice) / 1e18).toFixed(4)} ETH</span>
                    <span className="refund-note">Hoàn 100% do sự kiện bị hủy</span>
                  </div>
                ) : (
                  <div className="refund-amount partial">
                    <span>{((Number(selectedTicket.purchasePrice) * 95 / 100) / 1e18).toFixed(4)} ETH</span>
                    <span className="refund-note">Đã trừ 5% phí xử lý</span>
                  </div>
                )}
              </div>
              
              <div className="refund-warning">
                ⚠️ Cảnh báo: Vé NFT sẽ bị burn (xóa vĩnh viễn) sau khi hoàn. Hành động này không thể hoàn tác!
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowRefundModal(false)}>
                Hủy
              </button>
              <button 
                className="btn-refund-confirm"
                onClick={handleRefundTicket}
                disabled={loading}
              >
                {loading ? '⏳ Đang xử lý...' : '💰 Xác nhận hoàn vé'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Full Screen Modal */}
      {showQRModal && selectedTicket && (
        <div className="modal-overlay qr-overlay" onClick={() => setShowQRModal(false)}>
          <div className="modal-content qr-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowQRModal(false)}>✕</button>
            <div className="qr-full">
              <QRCodeSVG 
                value={selectedTicket.qrCodeHash}
                size={280}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="qr-details">
              <h3>Vé #{selectedTicket.tokenId}</h3>
              <p><strong>{selectedTicket.eventName}</strong></p>
              <p>{getTicketTypeName(selectedTicket.ticketType)} - {selectedTicket.seatInfo}</p>
              <p className="qr-hash">{selectedTicket.qrCodeHash}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
