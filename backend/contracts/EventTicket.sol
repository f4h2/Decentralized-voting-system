// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EventTicket {
    struct Event {
        string name;
        string description;
        string location;
        string imageUrl;
        uint ticketPrice;
        uint totalTickets;
        uint ticketsSold;
        uint eventDate;
        uint saleEndDate;
        bool isActive;
        address organizer;
    }

    struct Ticket {
        uint eventId;
        address buyer;
        uint purchaseDate;
        string ticketCode;
        bool isUsed;
    }

    mapping(uint => Event) public events;
    mapping(uint => Ticket) public tickets;
    mapping(address => uint[]) public userTickets; // user address => ticket IDs
    mapping(uint => uint[]) public eventTickets; // event ID => ticket IDs
    
    uint public eventCount;
    uint public ticketCount;
    address public owner;

    event EventCreated(uint indexed eventId, string name, address organizer);
    event TicketPurchased(uint indexed ticketId, uint indexed eventId, address buyer);
    event TicketUsed(uint indexed ticketId, uint indexed eventId);
    event EventCancelled(uint indexed eventId);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    // Event management (Public - anyone can create events)
    function createEvent(
        string memory _name,
        string memory _description,
        string memory _location,
        string memory _imageUrl,
        uint _ticketPrice,
        uint _totalTickets,
        uint _eventDate,
        uint _saleEndDate
    ) public {
        require(_totalTickets > 0, "Total tickets must be greater than 0");
        require(_eventDate > block.timestamp, "Event date must be in the future");
        require(_saleEndDate > block.timestamp && _saleEndDate < _eventDate, "Invalid sale end date");

        eventCount++;
        Event storage newEvent = events[eventCount];
        newEvent.name = _name;
        newEvent.description = _description;
        newEvent.location = _location;
        newEvent.imageUrl = _imageUrl;
        newEvent.ticketPrice = _ticketPrice;
        newEvent.totalTickets = _totalTickets;
        newEvent.ticketsSold = 0;
        newEvent.eventDate = _eventDate;
        newEvent.saleEndDate = _saleEndDate;
        newEvent.isActive = true;
        newEvent.organizer = msg.sender;

        emit EventCreated(eventCount, _name, msg.sender);
    }

    function updateEvent(
        uint _eventId,
        string memory _name,
        string memory _description,
        string memory _location,
        string memory _imageUrl,
        uint _ticketPrice
    ) public onlyOwner {
        require(_eventId > 0 && _eventId <= eventCount, "Invalid event ID");
        Event storage evt = events[_eventId];
        require(evt.isActive, "Event is not active");

        evt.name = _name;
        evt.description = _description;
        evt.location = _location;
        evt.imageUrl = _imageUrl;
        evt.ticketPrice = _ticketPrice;
    }

    function cancelEvent(uint _eventId) public onlyOwner {
        require(_eventId > 0 && _eventId <= eventCount, "Invalid event ID");
        Event storage evt = events[_eventId];
        evt.isActive = false;
        emit EventCancelled(_eventId);
    }

    // Ticket purchase (Anyone can buy)
    function purchaseTicket(uint _eventId) public payable {
        require(_eventId > 0 && _eventId <= eventCount, "Invalid event ID");
        Event storage evt = events[_eventId];
        
        require(evt.isActive, "Event is not active");
        require(block.timestamp < evt.saleEndDate, "Ticket sale has ended");
        require(evt.ticketsSold < evt.totalTickets, "All tickets sold out");
        require(msg.value >= evt.ticketPrice, "Insufficient payment");

        ticketCount++;
        evt.ticketsSold++;

        // Generate ticket code (simple version)
        string memory ticketCode = string(abi.encodePacked("TICKET-", toString(_eventId), "-", toString(ticketCount)));

        Ticket storage newTicket = tickets[ticketCount];
        newTicket.eventId = _eventId;
        newTicket.buyer = msg.sender;
        newTicket.purchaseDate = block.timestamp;
        newTicket.ticketCode = ticketCode;
        newTicket.isUsed = false;

        userTickets[msg.sender].push(ticketCount);
        eventTickets[_eventId].push(ticketCount);

        // Refund excess payment
        if (msg.value > evt.ticketPrice) {
            payable(msg.sender).transfer(msg.value - evt.ticketPrice);
        }

        emit TicketPurchased(ticketCount, _eventId, msg.sender);
    }

    // Use ticket (Owner only - scan at event entrance)
    function useTicket(uint _ticketId) public onlyOwner {
        require(_ticketId > 0 && _ticketId <= ticketCount, "Invalid ticket ID");
        Ticket storage ticket = tickets[_ticketId];
        require(!ticket.isUsed, "Ticket already used");

        Event storage evt = events[ticket.eventId];
        require(evt.isActive, "Event is cancelled");

        ticket.isUsed = true;
        emit TicketUsed(_ticketId, ticket.eventId);
    }

    // Withdraw funds (Owner only)
    function withdraw() public onlyOwner {
        uint balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner).transfer(balance);
    }

    function withdrawAmount(uint _amount) public onlyOwner {
        require(_amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(_amount);
    }

    // View functions
    function getEvent(uint _eventId) public view returns (
        string memory name,
        string memory description,
        string memory location,
        string memory imageUrl,
        uint ticketPrice,
        uint totalTickets,
        uint ticketsSold,
        uint eventDate,
        uint saleEndDate,
        bool isActive,
        address organizer
    ) {
        require(_eventId > 0 && _eventId <= eventCount, "Invalid event ID");
        Event storage evt = events[_eventId];
        return (
            evt.name,
            evt.description,
            evt.location,
            evt.imageUrl,
            evt.ticketPrice,
            evt.totalTickets,
            evt.ticketsSold,
            evt.eventDate,
            evt.saleEndDate,
            evt.isActive,
            evt.organizer
        );
    }

    function getTicket(uint _ticketId) public view returns (
        uint eventId,
        address buyer,
        uint purchaseDate,
        string memory ticketCode,
        bool isUsed
    ) {
        require(_ticketId > 0 && _ticketId <= ticketCount, "Invalid ticket ID");
        Ticket storage ticket = tickets[_ticketId];
        return (
            ticket.eventId,
            ticket.buyer,
            ticket.purchaseDate,
            ticket.ticketCode,
            ticket.isUsed
        );
    }

    function getUserTickets(address _user) public view returns (uint[] memory) {
        return userTickets[_user];
    }

    function getEventTickets(uint _eventId) public view returns (uint[] memory) {
        require(_eventId > 0 && _eventId <= eventCount, "Invalid event ID");
        return eventTickets[_eventId];
    }

    function getEventCount() public view returns (uint) {
        return eventCount;
    }

    function getTicketCount() public view returns (uint) {
        return ticketCount;
    }

    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }

    // Helper function to convert uint to string
    function toString(uint _value) internal pure returns (string memory) {
        if (_value == 0) {
            return "0";
        }
        uint temp = _value;
        uint digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint(_value % 10)));
            _value /= 10;
        }
        return string(buffer);
    }
}
