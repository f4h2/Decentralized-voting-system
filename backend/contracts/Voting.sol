// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Poll {
        string name;
        string[] options;
        mapping(uint => uint) votes; // optionIndex => voteCount
        mapping(address => bool) hasVoted; // user => voted?
        uint startTime;
        uint endTime; // 0 nếu không có hạn
        bool isActive;
    }

    mapping(uint => Poll) public polls;
    uint public pollCount;
    address public owner;

    constructor() {
        owner = msg.sender;         // địa chỉ ví đã deploy contract
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    // Tạo poll với thời hạn (endTime là timestamp Unix)
    function createPoll(string memory _name, string[] memory _options, uint _durationInSeconds) public onlyOwner {
        pollCount++;
        Poll storage newPoll = polls[pollCount];
        newPoll.name = _name;
        newPoll.options = _options;
        newPoll.startTime = block.timestamp;
        newPoll.endTime = block.timestamp + _durationInSeconds;
        newPoll.isActive = true;
    }

    // Bỏ phiếu (kiểm tra active và thời hạn)
    function vote(uint _pollId, uint _optionIndex) public {
        require(_pollId > 0 && _pollId <= pollCount, "Invalid poll ID");
        Poll storage poll = polls[_pollId];
        require(poll.isActive && (poll.endTime == 0 || block.timestamp < poll.endTime), "Poll is not active");
        require(!poll.hasVoted[msg.sender], "Already voted");
        require(_optionIndex < poll.options.length, "Invalid option");

        poll.votes[_optionIndex]++;
        poll.hasVoted[msg.sender] = true;
    }

    // Kết thúc poll (only owner)
    function endPoll(uint _pollId) public onlyOwner {
        require(_pollId > 0 && _pollId <= pollCount, "Invalid poll ID");
        Poll storage poll = polls[_pollId];
        poll.isActive = false;
    }

    // Lấy kết quả poll 
    function getPollResults(uint _pollId) public view returns (string memory name, string[] memory options, uint[] memory voteCounts, uint startTime, uint endTime, bool isActive) {
        require(_pollId > 0 && _pollId <= pollCount, "Invalid poll ID");
        Poll storage poll = polls[_pollId];                         //storage là dữ liêu on-chain lưu vĩnh viến trên blockchain, memory là dữ liệu tạm thời tồn tại trong lúc chạy hàm
        uint[] memory counts = new uint[](poll.options.length);
        for (uint i = 0; i < poll.options.length; i++) {
            counts[i] = poll.votes[i];
        }
        return (poll.name, poll.options, counts, poll.startTime, poll.endTime, poll.isActive);
    }

    // Kiểm tra nếu user đã vote
    function hasUserVoted(uint _pollId, address _user) public view returns (bool) {
        require(_pollId > 0 && _pollId <= pollCount, "Invalid poll ID");
        return polls[_pollId].hasVoted[_user];
    }

    // Lấy poll count
    function getPollCount() public view returns (uint) {
        return pollCount;
    }
}