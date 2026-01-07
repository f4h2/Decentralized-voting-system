// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title EventTicketNFT
 * @dev Smart contract cho hệ thống vé sự kiện NFT với đầy đủ tính năng:
 * - NFT Tickets (ERC721)
 * - Nhiều loại vé (VIP, Standard, Economy)
 * - Chuyển nhượng vé
 * - Hoàn vé
 * - Xác thực vé bằng QR Code
 */
contract EventTicketNFT is ERC721, ERC721URIStorage, ERC721Enumerable, ReentrancyGuard, Ownable {
  using Strings for uint256;
  uint256 private _tokenIdCounter;
  uint256 private _eventIdCounter;


    // ============ ENUMS ============
    enum TicketType { ECONOMY, STANDARD, VIP }
    enum TicketStatus { VALID, USED, REFUNDED, CANCELLED }

    // ============ STRUCTS ============
    struct TicketTypeInfo {
        string name;
        uint256 price;
        uint256 totalSupply;
        uint256 sold;
        string benefits;
        bool isActive;
    }

    struct Event {
        string name;
        string description;
        string location;
        string imageUrl;
        uint256 eventDate;
        uint256 saleStartDate;
        uint256 saleEndDate;
        uint256 refundDeadline;     // Hạn cuối hoàn vé
        address organizer;
        bool isActive;
        bool isCancelled;
        uint256 totalRevenue;
        mapping(TicketType => TicketTypeInfo) ticketTypes;
    }

    struct Ticket {
        uint256 eventId;
        TicketType ticketType;
        address originalBuyer;
        uint256 purchaseDate;
        uint256 purchasePrice;
        string qrCodeHash;          // Hash để xác thực QR
        TicketStatus status;
        string seatInfo;            // Thông tin ghế (nếu có)
    }

    struct TransferHistory {
        address from;
        address to;
        uint256 timestamp;
        uint256 price;              // Giá bán lại (0 nếu tặng)
    }

    // ============ MAPPINGS ============
    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => TransferHistory[]) public ticketTransferHistory;
    mapping(address => uint256[]) public userTickets;
    mapping(uint256 => uint256[]) public eventTickets;
    mapping(string => uint256) public qrCodeToTicket;    // QR hash => ticketId
    mapping(uint256 => mapping(address => bool)) public eventRefunded; // eventId => user => refunded

    // ============ CONSTANTS ============
    uint256 public constant PLATFORM_FEE_PERCENT = 2;    // 2% phí nền tảng
    uint256 public constant MAX_RESALE_MARKUP = 150;     // Giá bán lại tối đa 150% giá gốc
    
    // ============ EVENTS ============
    event EventCreated(uint256 indexed eventId, string name, address organizer);
    event EventUpdated(uint256 indexed eventId);
    event EventCancelled(uint256 indexed eventId);
    event TicketPurchased(uint256 indexed tokenId, uint256 indexed eventId, address buyer, TicketType ticketType);
    event TicketTransferred(uint256 indexed tokenId, address from, address to, uint256 price);
    event TicketRefunded(uint256 indexed tokenId, address owner, uint256 amount);
    event TicketUsed(uint256 indexed tokenId, uint256 indexed eventId, address verifier);
    event TicketVerified(uint256 indexed tokenId, bool isValid, string message);

    // ============ CONSTRUCTOR ============
    constructor() ERC721("EventTicketNFT", "ETKT") Ownable(msg.sender) {}

    // ============ MODIFIERS ============
    modifier eventExists(uint256 _eventId) {
        require(_eventId > 0 && _eventId <= _eventIdCounter, "Event does not exist");
        _;
    }

    modifier onlyEventOrganizer(uint256 _eventId) {
        require(events[_eventId].organizer == msg.sender || owner() == msg.sender, "Not authorized");
        _;
    }

    modifier ticketExists(uint256 _tokenId) {
        require(_tokenId > 0 && _tokenId <= _tokenIdCounter, "Ticket does not exist");
        _;
    }

    // ============ STRUCTS FOR PARAMETERS ============
    
    struct EventParams {
        string name;
        string description;
        string location;
        string imageUrl;
    }
    
    struct EventDates {
        uint256 eventDate;
        uint256 saleStartDate;
        uint256 saleEndDate;
        uint256 refundDeadline;
    }
    
    struct TicketConfig {
        uint256 price;
        uint256 supply;
        string benefits;
    }

    // ============ EVENT MANAGEMENT ============
    
    /**
     * @dev Tạo sự kiện mới với nhiều loại vé (refactored để giảm stack depth)
     */
    function createEvent(
        EventParams calldata _params,
        EventDates calldata _dates,
        TicketConfig[3] calldata _tickets
    ) external returns (uint256) {
        require(bytes(_params.name).length > 0, "Name required");
        require(_dates.eventDate > block.timestamp, "Event date must be in future");
        require(_dates.saleEndDate > _dates.saleStartDate, "Invalid sale period");
        require(_dates.saleEndDate < _dates.eventDate, "Sale must end before event");
        require(_dates.refundDeadline <= _dates.saleEndDate, "Invalid refund deadline");

        _eventIdCounter += 1;
        uint256 eventId = _eventIdCounter;

        _initEventBasicInfo(eventId, _params);
        _initEventDates(eventId, _dates);
        _initEventTickets(eventId, _tickets);

        emit EventCreated(eventId, _params.name, msg.sender);
        return eventId;
    }
    
    function _initEventBasicInfo(uint256 eventId, EventParams calldata _params) internal {
        Event storage newEvent = events[eventId];
        newEvent.name = _params.name;
        newEvent.description = _params.description;
        newEvent.location = _params.location;
        newEvent.imageUrl = _params.imageUrl;
        newEvent.organizer = msg.sender;
        newEvent.isActive = true;
        newEvent.isCancelled = false;
    }
    
    function _initEventDates(uint256 eventId, EventDates calldata _dates) internal {
        Event storage newEvent = events[eventId];
        newEvent.eventDate = _dates.eventDate;
        newEvent.saleStartDate = _dates.saleStartDate;
        newEvent.saleEndDate = _dates.saleEndDate;
        newEvent.refundDeadline = _dates.refundDeadline;
    }
    
    function _initEventTickets(uint256 eventId, TicketConfig[3] calldata _tickets) internal {
        _setupTicketType(eventId, TicketType.ECONOMY, "Economy", _tickets[0].price, _tickets[0].supply, _tickets[0].benefits);
        _setupTicketType(eventId, TicketType.STANDARD, "Standard", _tickets[1].price, _tickets[1].supply, _tickets[1].benefits);
        _setupTicketType(eventId, TicketType.VIP, "VIP", _tickets[2].price, _tickets[2].supply, _tickets[2].benefits);
    }

    function _setupTicketType(
        uint256 _eventId,
        TicketType _type,
        string memory _name,
        uint256 _price,
        uint256 _supply,
        string memory _benefits
    ) internal {
        events[_eventId].ticketTypes[_type] = TicketTypeInfo({
            name: _name,
            price: _price,
            totalSupply: _supply,
            sold: 0,
            benefits: _benefits,
            isActive: _supply > 0
        });
    }

    /**
     * @dev Hủy sự kiện - Tự động cho phép hoàn vé
     */
    function cancelEvent(uint256 _eventId) 
        external 
        eventExists(_eventId) 
        onlyEventOrganizer(_eventId) 
    {
        Event storage evt = events[_eventId];
        require(!evt.isCancelled, "Already cancelled");
        
        evt.isCancelled = true;
        evt.isActive = false;
        
        emit EventCancelled(_eventId);
    }

    // ============ TICKET PURCHASE ============

    /**
     * @dev Mua vé - Mint NFT ticket (refactored)
     */
    function purchaseTicket(
        uint256 _eventId, 
        TicketType _ticketType,
        string calldata _seatInfo
    ) external payable nonReentrant eventExists(_eventId) returns (uint256) {
        Event storage evt = events[_eventId];
        
        require(evt.isActive && !evt.isCancelled, "Event not available");
        require(block.timestamp >= evt.saleStartDate, "Sale not started");
        require(block.timestamp <= evt.saleEndDate, "Sale ended");
        
        TicketTypeInfo storage ticketInfo = evt.ticketTypes[_ticketType];
        require(ticketInfo.isActive, "Ticket type not available");
        require(ticketInfo.sold < ticketInfo.totalSupply, "Sold out");
        require(msg.value >= ticketInfo.price, "Insufficient payment");

        // Mint NFT
        _tokenIdCounter += 1;
        uint256 tokenId = _tokenIdCounter;
        
        // Tạo ticket data
        _createTicketData(tokenId, _eventId, _ticketType, ticketInfo.price, _seatInfo);
        
        // Update counts
        ticketInfo.sold++;
        evt.totalRevenue += ticketInfo.price;
        
        userTickets[msg.sender].push(tokenId);
        eventTickets[_eventId].push(tokenId);

        // Mint NFT với metadata
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _generateTokenURI(tokenId));

        // Handle payments
        _handlePayments(_eventId, ticketInfo.price);

        emit TicketPurchased(tokenId, _eventId, msg.sender, _ticketType);
        return tokenId;
    }
    
    function _createTicketData(
        uint256 tokenId,
        uint256 _eventId,
        TicketType _ticketType,
        uint256 _price,
        string calldata _seatInfo
    ) internal {
        string memory qrHash = _generateQRHash(tokenId, _eventId, msg.sender);
        
        tickets[tokenId] = Ticket({
            eventId: _eventId,
            ticketType: _ticketType,
            originalBuyer: msg.sender,
            purchaseDate: block.timestamp,
            purchasePrice: _price,
            qrCodeHash: qrHash,
            status: TicketStatus.VALID,
            seatInfo: _seatInfo
        });

        qrCodeToTicket[qrHash] = tokenId;
    }
    
    function _handlePayments(uint256 _eventId, uint256 _ticketPrice) internal {
        Event storage evt = events[_eventId];
        
        // Chuyển tiền cho organizer (trừ phí nền tảng)
        uint256 platformFee = (_ticketPrice * PLATFORM_FEE_PERCENT) / 100;
        uint256 organizerAmount = _ticketPrice - platformFee;
        
        payable(evt.organizer).transfer(organizerAmount);
        
        // Hoàn tiền thừa
        if (msg.value > _ticketPrice) {
            payable(msg.sender).transfer(msg.value - _ticketPrice);
        }
    }

    // ============ TICKET TRANSFER ============

    /**
     * @dev Chuyển nhượng vé (tặng miễn phí)
     */
    function transferTicket(uint256 _tokenId, address _to) 
        external 
        ticketExists(_tokenId) 
    {
        require(ownerOf(_tokenId) == msg.sender, "Not ticket owner");
        require(_to != address(0), "Invalid address");
        require(tickets[_tokenId].status == TicketStatus.VALID, "Ticket not valid");
        
        Event storage evt = events[tickets[_tokenId].eventId];
        require(!evt.isCancelled, "Event cancelled");
        require(block.timestamp < evt.eventDate, "Event already passed");

        // Cập nhật lịch sử
        ticketTransferHistory[_tokenId].push(TransferHistory({
            from: msg.sender,
            to: _to,
            timestamp: block.timestamp,
            price: 0
        }));

        // Cập nhật userTickets
        _removeFromUserTickets(msg.sender, _tokenId);
        userTickets[_to].push(_tokenId);

        // Tạo QR hash mới cho owner mới
        string memory newQrHash = _generateQRHash(_tokenId, tickets[_tokenId].eventId, _to);
        delete qrCodeToTicket[tickets[_tokenId].qrCodeHash];
        tickets[_tokenId].qrCodeHash = newQrHash;
        qrCodeToTicket[newQrHash] = _tokenId;

        // Transfer NFT
        _transfer(msg.sender, _to, _tokenId);
        
        emit TicketTransferred(_tokenId, msg.sender, _to, 0);
    }

    /**
     * @dev Bán lại vé với giá (marketplace đơn giản)
     */
    function resellTicket(uint256 _tokenId, address _buyer) 
        external 
        payable 
        nonReentrant
        ticketExists(_tokenId) 
    {
        require(ownerOf(_tokenId) == msg.sender || _buyer == msg.sender, "Not authorized");
        require(tickets[_tokenId].status == TicketStatus.VALID, "Ticket not valid");
        
        Ticket storage ticket = tickets[_tokenId];
        Event storage evt = events[ticket.eventId];
        
        require(!evt.isCancelled, "Event cancelled");
        require(block.timestamp < evt.eventDate, "Event passed");
        
        // Kiểm tra giá bán lại không quá cao
        uint256 maxPrice = (ticket.purchasePrice * MAX_RESALE_MARKUP) / 100;
        require(msg.value <= maxPrice, "Price too high");
        require(msg.value > 0, "Price required");

        address seller = ownerOf(_tokenId);
        
        // Cập nhật lịch sử
        ticketTransferHistory[_tokenId].push(TransferHistory({
            from: seller,
            to: _buyer,
            timestamp: block.timestamp,
            price: msg.value
        }));

        // Cập nhật userTickets
        _removeFromUserTickets(seller, _tokenId);
        userTickets[_buyer].push(_tokenId);

        // Cập nhật QR
        string memory newQrHash = _generateQRHash(_tokenId, ticket.eventId, _buyer);
        delete qrCodeToTicket[ticket.qrCodeHash];
        ticket.qrCodeHash = newQrHash;
        qrCodeToTicket[newQrHash] = _tokenId;

        // Transfer NFT
        _transfer(seller, _buyer, _tokenId);
        
        // Chuyển tiền cho seller (trừ phí)
        uint256 fee = (msg.value * PLATFORM_FEE_PERCENT) / 100;
        payable(seller).transfer(msg.value - fee);

        emit TicketTransferred(_tokenId, seller, _buyer, msg.value);
    }

    // ============ REFUND ============

    /**
     * @dev Hoàn vé - Chỉ trong thời gian cho phép hoặc khi sự kiện bị hủy
     */
    function refundTicket(uint256 _tokenId) 
        external 
        nonReentrant 
        ticketExists(_tokenId) 
    {
        require(ownerOf(_tokenId) == msg.sender, "Not ticket owner");
        
        Ticket storage ticket = tickets[_tokenId];
        require(ticket.status == TicketStatus.VALID, "Ticket not refundable");
        
        Event storage evt = events[ticket.eventId];
        
        // Kiểm tra điều kiện hoàn vé
        bool canRefund = evt.isCancelled || 
                         block.timestamp <= evt.refundDeadline ||
                         (evt.isCancelled && !eventRefunded[ticket.eventId][msg.sender]);
        
        require(canRefund, "Refund period ended");

        ticket.status = TicketStatus.REFUNDED;
        eventRefunded[ticket.eventId][msg.sender] = true;

        // Tính số tiền hoàn
        uint256 refundAmount = ticket.purchasePrice;
        
        // Nếu không phải do hủy sự kiện, trừ phí xử lý 5%
        if (!evt.isCancelled) {
            refundAmount = (refundAmount * 95) / 100;
        }

        // Burn NFT
        _burn(_tokenId);
        
        // Xóa khỏi userTickets
        _removeFromUserTickets(msg.sender, _tokenId);
        
        // Hoàn tiền
        payable(msg.sender).transfer(refundAmount);

        emit TicketRefunded(_tokenId, msg.sender, refundAmount);
    }

    // ============ QR CODE VERIFICATION ============

    /**
     * @dev Struct để trả về kết quả xác thực QR
     */
    struct QRVerifyResult {
        bool isValid;
        uint256 tokenId;
        uint256 eventId;
        string eventName;
        string ticketTypeName;
        address currentOwner;
        string message;
    }

    /**
     * @dev Xác thực vé bằng QR code hash
     */
    function verifyTicketByQR(string memory _qrHash) 
        external 
        view 
        returns (QRVerifyResult memory result) 
    {
        result.tokenId = qrCodeToTicket[_qrHash];
        
        if (result.tokenId == 0) {
            result.message = "QR code not found";
            return result;
        }

        Ticket storage ticket = tickets[result.tokenId];
        Event storage evt = events[ticket.eventId];
        
        result.currentOwner = ownerOf(result.tokenId);
        result.eventId = ticket.eventId;
        result.eventName = evt.name;
        result.ticketTypeName = evt.ticketTypes[ticket.ticketType].name;

        if (ticket.status == TicketStatus.USED) {
            result.message = "Ticket already used";
            return result;
        }
        
        if (ticket.status == TicketStatus.REFUNDED) {
            result.message = "Ticket was refunded";
            return result;
        }
        
        if (evt.isCancelled) {
            result.message = "Event cancelled";
            return result;
        }

        result.isValid = true;
        result.message = "Ticket is valid";
        return result;
    }

    /**
     * @dev Đánh dấu vé đã sử dụng (check-in tại sự kiện)
     */
    function useTicket(uint256 _tokenId) 
        external 
        ticketExists(_tokenId) 
    {
        Ticket storage ticket = tickets[_tokenId];
        Event storage evt = events[ticket.eventId];
        
        require(
            evt.organizer == msg.sender || owner() == msg.sender,
            "Not authorized to verify"
        );
        require(ticket.status == TicketStatus.VALID, "Ticket not valid");
        require(!evt.isCancelled, "Event cancelled");

        ticket.status = TicketStatus.USED;
        
        emit TicketUsed(_tokenId, ticket.eventId, msg.sender);
    }

    /**
     * @dev Xác thực và sử dụng vé bằng QR (một bước)
     */
    function verifyAndUseTicket(string memory _qrHash) 
        external 
        returns (bool success, string memory message) 
    {
        uint256 tokenId = qrCodeToTicket[_qrHash];
        
        if (tokenId == 0) {
            emit TicketVerified(0, false, "QR code not found");
            return (false, "QR code not found");
        }

        Ticket storage ticket = tickets[tokenId];
        Event storage evt = events[ticket.eventId];

        require(
            evt.organizer == msg.sender || owner() == msg.sender,
            "Not authorized"
        );

        if (ticket.status == TicketStatus.USED) {
            emit TicketVerified(tokenId, false, "Already used");
            return (false, "Ticket already used");
        }

        if (ticket.status != TicketStatus.VALID) {
            emit TicketVerified(tokenId, false, "Ticket not valid");
            return (false, "Ticket not valid");
        }

        if (evt.isCancelled) {
            emit TicketVerified(tokenId, false, "Event cancelled");
            return (false, "Event cancelled");
        }

        ticket.status = TicketStatus.USED;
        
        emit TicketUsed(tokenId, ticket.eventId, msg.sender);
        emit TicketVerified(tokenId, true, "Check-in successful");
        
        return (true, "Check-in successful");
    }

    // ============ VIEW FUNCTIONS ============

    function getEventBasicInfo(uint256 _eventId) 
        external 
        view 
        eventExists(_eventId) 
        returns (
            string memory name,
            string memory description,
            string memory location,
            string memory imageUrl,
            uint256 eventDate,
            address organizer
        ) 
    {
        Event storage evt = events[_eventId];
        return (
            evt.name,
            evt.description,
            evt.location,
            evt.imageUrl,
            evt.eventDate,
            evt.organizer
        );
    }

    function getEventSaleInfo(uint256 _eventId) 
        external 
        view 
        eventExists(_eventId) 
        returns (
            uint256 saleStartDate,
            uint256 saleEndDate,
            uint256 refundDeadline,
            bool isActive,
            bool isCancelled,
            uint256 totalRevenue
        ) 
    {
        Event storage evt = events[_eventId];
        return (
            evt.saleStartDate,
            evt.saleEndDate,
            evt.refundDeadline,
            evt.isActive,
            evt.isCancelled,
            evt.totalRevenue
        );
    }

    function getTicketTypeInfo(uint256 _eventId, TicketType _type) 
        external 
        view 
        eventExists(_eventId) 
        returns (
            string memory name,
            uint256 price,
            uint256 totalSupply,
            uint256 sold,
            string memory benefits,
            bool isActive
        ) 
    {
        TicketTypeInfo storage info = events[_eventId].ticketTypes[_type];
        return (info.name, info.price, info.totalSupply, info.sold, info.benefits, info.isActive);
    }

    function getTicketBasicInfo(uint256 _tokenId) 
        external 
        view 
        ticketExists(_tokenId) 
        returns (
            uint256 eventId,
            uint8 ticketType,
            address originalBuyer,
            uint256 purchaseDate
        ) 
    {
        Ticket storage ticket = tickets[_tokenId];
        return (
            ticket.eventId,
            uint8(ticket.ticketType),
            ticket.originalBuyer,
            ticket.purchaseDate
        );
    }

    function getTicketDetails(uint256 _tokenId) 
        external 
        view 
        ticketExists(_tokenId) 
        returns (
            uint256 purchasePrice,
            string memory qrCodeHash,
            uint8 status,
            string memory seatInfo
        ) 
    {
        Ticket storage ticket = tickets[_tokenId];
        return (
            ticket.purchasePrice,
            ticket.qrCodeHash,
            uint8(ticket.status),
            ticket.seatInfo
        );
    }

    function getUserTickets(address _user) external view returns (uint256[] memory) {
        return userTickets[_user];
    }

    function getEventTickets(uint256 _eventId) external view returns (uint256[] memory) {
        return eventTickets[_eventId];
    }

    function getTransferHistory(uint256 _tokenId) external view returns (TransferHistory[] memory) {
        return ticketTransferHistory[_tokenId];
    }

    function getEventCount() external view returns (uint256) {
        return _eventIdCounter;
    }

    function getTicketCount() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ============ INTERNAL FUNCTIONS ============

    function _generateQRHash(uint256 _tokenId, uint256 _eventId, address _owner) 
        internal 
        view 
        returns (string memory) 
    {
        bytes32 hash = keccak256(
            abi.encodePacked(_tokenId, _eventId, _owner, block.timestamp, block.prevrandao)
        );
        return _toHexString(hash);
    }

    function _toHexString(bytes32 _data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            str[i*2] = alphabet[uint8(_data[i] >> 4)];
            str[i*2+1] = alphabet[uint8(_data[i] & 0x0f)];
        }
        return string(str);
    }

    function _generateTokenURI(uint256 _tokenId) internal view returns (string memory) {
        Ticket storage ticket = tickets[_tokenId];
        Event storage evt = events[ticket.eventId];
        TicketTypeInfo storage ticketInfo = evt.ticketTypes[ticket.ticketType];

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(bytes(_buildTokenJSON(_tokenId, evt, ticketInfo, ticket)))
            )
        );
    }
    
    function _buildTokenJSON(
        uint256 _tokenId,
        Event storage evt,
        TicketTypeInfo storage ticketInfo,
        Ticket storage ticket
    ) internal view returns (string memory) {
        return string(
            abi.encodePacked(
                '{"name": "', evt.name, ' - ', ticketInfo.name, ' Ticket #', Strings.toString(_tokenId), '",',
                '"description": "', evt.description, '",',
                '"image": "', evt.imageUrl, '",',
                _buildAttributes(evt, ticketInfo, ticket),
                '}'
            )
        );
    }
    
    function _buildAttributes(
        Event storage evt,
        TicketTypeInfo storage ticketInfo,
        Ticket storage ticket
    ) internal view returns (string memory) {
        return string(
            abi.encodePacked(
                '"attributes": [',
                '{"trait_type": "Event", "value": "', evt.name, '"},',
                '{"trait_type": "Ticket Type", "value": "', ticketInfo.name, '"},',
                '{"trait_type": "Location", "value": "', evt.location, '"},',
                '{"trait_type": "Seat", "value": "', ticket.seatInfo, '"},',
                '{"trait_type": "Benefits", "value": "', ticketInfo.benefits, '"}',
                ']'
            )
        );
    }

    function _removeFromUserTickets(address _user, uint256 _tokenId) internal {
        uint256[] storage tickets_ = userTickets[_user];
        for (uint256 i = 0; i < tickets_.length; i++) {
            if (tickets_[i] == _tokenId) {
                tickets_[i] = tickets_[tickets_.length - 1];
                tickets_.pop();
                break;
            }
        }
    }

    // ============ OWNER FUNCTIONS ============

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        payable(owner()).transfer(balance);
    }

    function withdrawAmount(uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(_amount);
    }

    // ============ REQUIRED OVERRIDES ============

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

