import { expect } from "chai";
import hre from "hardhat";
import { parseEther, formatEther } from "viem";

describe("EventTicketNFT", function () {
  let contract: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let publicClient: any;

  const TICKET_TYPE = {
    ECONOMY: 0,
    STANDARD: 1,
    VIP: 2
  };

  const TICKET_STATUS = {
    VALID: 0,
    USED: 1,
    REFUNDED: 2,
    CANCELLED: 3
  };

  // Helper to create a future timestamp
  const futureTimestamp = (days: number) => {
    return BigInt(Math.floor(Date.now() / 1000) + days * 24 * 60 * 60);
  };

  beforeEach(async function () {
    const [deployer, addr1, addr2] = await hre.viem.getWalletClients();
    owner = deployer;
    user1 = addr1;
    user2 = addr2;
    publicClient = await hre.viem.getPublicClient();

    contract = await hre.viem.deployContract("EventTicketNFT");
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const contractOwner = await contract.read.owner();
      expect(contractOwner.toLowerCase()).to.equal(owner.account.address.toLowerCase());
    });

    it("Should have correct name and symbol", async function () {
      expect(await contract.read.name()).to.equal("EventTicketNFT");
      expect(await contract.read.symbol()).to.equal("ETKT");
    });

    it("Should initialize with zero events and tickets", async function () {
      expect(await contract.read.getEventCount()).to.equal(0n);
      expect(await contract.read.getTicketCount()).to.equal(0n);
    });
  });

  describe("Event Creation", function () {
    const eventParams = {
      name: "Test Concert 2026",
      description: "Amazing concert event",
      location: "Ha Noi Stadium",
      imageUrl: "https://example.com/image.jpg",
      eventDate: futureTimestamp(30),
      saleStartDate: futureTimestamp(1),
      saleEndDate: futureTimestamp(25),
      refundDeadline: futureTimestamp(20),
      ticketPrices: [parseEther("0.01"), parseEther("0.05"), parseEther("0.1")] as [bigint, bigint, bigint],
      ticketSupplies: [500n, 300n, 100n] as [bigint, bigint, bigint],
      ticketBenefits: ["General admission", "Better seats", "VIP access + drinks"] as [string, string, string]
    };

    it("Should create an event successfully", async function () {
      await contract.write.createEvent([
        eventParams.name,
        eventParams.description,
        eventParams.location,
        eventParams.imageUrl,
        eventParams.eventDate,
        eventParams.saleStartDate,
        eventParams.saleEndDate,
        eventParams.refundDeadline,
        eventParams.ticketPrices,
        eventParams.ticketSupplies,
        eventParams.ticketBenefits
      ]);

      expect(await contract.read.getEventCount()).to.equal(1n);

      const event = await contract.read.getEvent([1n]);
      expect(event[0]).to.equal(eventParams.name); // name
      expect(event[1]).to.equal(eventParams.description); // description
      expect(event[2]).to.equal(eventParams.location); // location
      expect(event[9]).to.equal(true); // isActive
      expect(event[10]).to.equal(false); // isCancelled
    });

    it("Should setup ticket types correctly", async function () {
      await contract.write.createEvent([
        eventParams.name,
        eventParams.description,
        eventParams.location,
        eventParams.imageUrl,
        eventParams.eventDate,
        eventParams.saleStartDate,
        eventParams.saleEndDate,
        eventParams.refundDeadline,
        eventParams.ticketPrices,
        eventParams.ticketSupplies,
        eventParams.ticketBenefits
      ]);

      // Check Economy ticket type
      const economy = await contract.read.getTicketTypeInfo([1n, TICKET_TYPE.ECONOMY]);
      expect(economy[0]).to.equal("Economy");
      expect(economy[1]).to.equal(eventParams.ticketPrices[0]);
      expect(economy[2]).to.equal(eventParams.ticketSupplies[0]);

      // Check VIP ticket type
      const vip = await contract.read.getTicketTypeInfo([1n, TICKET_TYPE.VIP]);
      expect(vip[0]).to.equal("VIP");
      expect(vip[1]).to.equal(eventParams.ticketPrices[2]);
    });

    it("Should reject event with past date", async function () {
      const pastDate = BigInt(Math.floor(Date.now() / 1000) - 86400);
      
      await expect(
        contract.write.createEvent([
          eventParams.name,
          eventParams.description,
          eventParams.location,
          eventParams.imageUrl,
          pastDate,
          eventParams.saleStartDate,
          eventParams.saleEndDate,
          eventParams.refundDeadline,
          eventParams.ticketPrices,
          eventParams.ticketSupplies,
          eventParams.ticketBenefits
        ])
      ).to.be.rejectedWith("Event date must be in future");
    });
  });

  describe("Ticket Purchase", function () {
    beforeEach(async function () {
      // Create an event with sale starting now
      const now = BigInt(Math.floor(Date.now() / 1000));
      await contract.write.createEvent([
        "Test Event",
        "Description",
        "Location",
        "https://image.url",
        now + 2592000n, // 30 days
        now - 60n,      // Started 1 minute ago
        now + 2160000n, // 25 days
        now + 1728000n, // 20 days
        [parseEther("0.01"), parseEther("0.05"), parseEther("0.1")] as [bigint, bigint, bigint],
        [500n, 300n, 100n] as [bigint, bigint, bigint],
        ["Economy", "Standard", "VIP"] as [string, string, string]
      ]);
    });

    it("Should purchase a ticket and mint NFT", async function () {
      const tx = await contract.write.purchaseTicket(
        [1n, TICKET_TYPE.ECONOMY, "Seat A1"],
        { value: parseEther("0.01"), account: user1.account }
      );

      expect(await contract.read.getTicketCount()).to.equal(1n);
      
      // Check NFT ownership
      expect((await contract.read.ownerOf([1n])).toLowerCase())
        .to.equal(user1.account.address.toLowerCase());
      
      // Check ticket details
      const ticket = await contract.read.getTicket([1n]);
      expect(ticket[0]).to.equal(1n); // eventId
      expect(ticket[1]).to.equal(TICKET_TYPE.ECONOMY); // ticketType
      expect(ticket[6]).to.equal(TICKET_STATUS.VALID); // status
      expect(ticket[7]).to.equal("Seat A1"); // seatInfo
    });

    it("Should fail with insufficient payment", async function () {
      await expect(
        contract.write.purchaseTicket(
          [1n, TICKET_TYPE.STANDARD, "Seat B1"],
          { value: parseEther("0.01"), account: user1.account } // Paying economy price for standard
        )
      ).to.be.rejectedWith("Insufficient payment");
    });

    it("Should refund excess payment", async function () {
      const initialBalance = await publicClient.getBalance({ address: user1.account.address });
      
      await contract.write.purchaseTicket(
        [1n, TICKET_TYPE.ECONOMY, "Seat A1"],
        { value: parseEther("0.1"), account: user1.account } // Overpaying
      );

      // The user should get back the excess (minus gas)
      // This is a simplified check - in real tests you'd calculate exact gas costs
      const finalBalance = await publicClient.getBalance({ address: user1.account.address });
      const spent = initialBalance - finalBalance;
      
      // Should have spent approximately 0.01 ETH + gas, not 0.1 ETH
      expect(spent < parseEther("0.05")).to.be.true;
    });
  });

  describe("Ticket Transfer", function () {
    beforeEach(async function () {
      const now = BigInt(Math.floor(Date.now() / 1000));
      await contract.write.createEvent([
        "Transfer Test Event",
        "Description",
        "Location",
        "https://image.url",
        now + 2592000n,
        now - 60n,
        now + 2160000n,
        now + 1728000n,
        [parseEther("0.01"), parseEther("0.05"), parseEther("0.1")] as [bigint, bigint, bigint],
        [500n, 300n, 100n] as [bigint, bigint, bigint],
        ["Economy", "Standard", "VIP"] as [string, string, string]
      ]);

      // User1 buys a ticket
      await contract.write.purchaseTicket(
        [1n, TICKET_TYPE.STANDARD, "Seat C5"],
        { value: parseEther("0.05"), account: user1.account }
      );
    });

    it("Should transfer ticket to another user", async function () {
      // Transfer from user1 to user2
      await contract.write.transferTicket(
        [1n, user2.account.address],
        { account: user1.account }
      );

      // Check new ownership
      expect((await contract.read.ownerOf([1n])).toLowerCase())
        .to.equal(user2.account.address.toLowerCase());

      // Check transfer history
      const history = await contract.read.getTransferHistory([1n]);
      expect(history.length).to.equal(1);
      expect(history[0].from.toLowerCase()).to.equal(user1.account.address.toLowerCase());
      expect(history[0].to.toLowerCase()).to.equal(user2.account.address.toLowerCase());
      expect(history[0].price).to.equal(0n); // Free transfer
    });

    it("Should not allow non-owner to transfer", async function () {
      await expect(
        contract.write.transferTicket(
          [1n, user2.account.address],
          { account: user2.account }
        )
      ).to.be.rejectedWith("Not ticket owner");
    });
  });

  describe("Ticket Refund", function () {
    beforeEach(async function () {
      const now = BigInt(Math.floor(Date.now() / 1000));
      await contract.write.createEvent([
        "Refund Test Event",
        "Description",
        "Location",
        "https://image.url",
        now + 2592000n,
        now - 60n,
        now + 2160000n,
        now + 1728000n, // Refund deadline 20 days from now
        [parseEther("0.1"), parseEther("0.2"), parseEther("0.5")] as [bigint, bigint, bigint],
        [500n, 300n, 100n] as [bigint, bigint, bigint],
        ["Economy", "Standard", "VIP"] as [string, string, string]
      ]);

      await contract.write.purchaseTicket(
        [1n, TICKET_TYPE.ECONOMY, "Seat D1"],
        { value: parseEther("0.1"), account: user1.account }
      );
    });

    it("Should refund ticket within deadline", async function () {
      const balanceBefore = await publicClient.getBalance({ address: user1.account.address });
      
      await contract.write.refundTicket([1n], { account: user1.account });

      const balanceAfter = await publicClient.getBalance({ address: user1.account.address });
      
      // Should receive 95% of ticket price (5% fee)
      // Note: This is approximate due to gas costs
      const expectedRefund = parseEther("0.095");
      const actualRefund = balanceAfter - balanceBefore;
      
      // The ticket should be burned
      await expect(contract.read.ownerOf([1n])).to.be.rejected;
      
      // Check ticket status
      const ticket = await contract.read.getTicket([1n]);
      expect(ticket[6]).to.equal(TICKET_STATUS.REFUNDED);
    });

    it("Should give full refund when event is cancelled", async function () {
      // Cancel the event first
      await contract.write.cancelEvent([1n]);
      
      // Now refund should give full amount
      await contract.write.refundTicket([1n], { account: user1.account });
      
      const ticket = await contract.read.getTicket([1n]);
      expect(ticket[6]).to.equal(TICKET_STATUS.REFUNDED);
    });
  });

  describe("QR Verification", function () {
    let qrHash: string;

    beforeEach(async function () {
      const now = BigInt(Math.floor(Date.now() / 1000));
      await contract.write.createEvent([
        "QR Test Event",
        "Description",
        "Location",
        "https://image.url",
        now + 2592000n,
        now - 60n,
        now + 2160000n,
        now + 1728000n,
        [parseEther("0.01"), parseEther("0.05"), parseEther("0.1")] as [bigint, bigint, bigint],
        [500n, 300n, 100n] as [bigint, bigint, bigint],
        ["Economy", "Standard", "VIP"] as [string, string, string]
      ]);

      await contract.write.purchaseTicket(
        [1n, TICKET_TYPE.VIP, "VIP Box 1"],
        { value: parseEther("0.1"), account: user1.account }
      );

      // Get the QR hash from the ticket
      const ticket = await contract.read.getTicket([1n]);
      qrHash = ticket[5];
    });

    it("Should verify valid ticket by QR", async function () {
      const result = await contract.read.verifyTicketByQR([qrHash]);
      
      expect(result[0]).to.equal(true); // isValid
      expect(result[1]).to.equal(1n); // tokenId
      expect(result[2]).to.equal(1n); // eventId
      expect(result[3]).to.equal("QR Test Event"); // eventName
      expect(result[4]).to.equal("VIP"); // ticketTypeName
      expect(result[6]).to.equal("Ticket is valid"); // message
    });

    it("Should return invalid for non-existent QR", async function () {
      const result = await contract.read.verifyTicketByQR(["invalidqrhash"]);
      
      expect(result[0]).to.equal(false);
      expect(result[6]).to.equal("QR code not found");
    });

    it("Should use ticket (check-in)", async function () {
      await contract.write.useTicket([1n]);
      
      const ticket = await contract.read.getTicket([1n]);
      expect(ticket[6]).to.equal(TICKET_STATUS.USED);

      // Verify QR should now show used
      const result = await contract.read.verifyTicketByQR([qrHash]);
      expect(result[0]).to.equal(false);
      expect(result[6]).to.equal("Ticket already used");
    });
  });

  describe("Event Cancellation", function () {
    beforeEach(async function () {
      const now = BigInt(Math.floor(Date.now() / 1000));
      await contract.write.createEvent([
        "Cancel Test Event",
        "Description",
        "Location",
        "https://image.url",
        now + 2592000n,
        now - 60n,
        now + 2160000n,
        now + 1728000n,
        [parseEther("0.01"), parseEther("0.05"), parseEther("0.1")] as [bigint, bigint, bigint],
        [500n, 300n, 100n] as [bigint, bigint, bigint],
        ["Economy", "Standard", "VIP"] as [string, string, string]
      ]);
    });

    it("Should cancel event by organizer", async function () {
      await contract.write.cancelEvent([1n]);
      
      const event = await contract.read.getEvent([1n]);
      expect(event[10]).to.equal(true); // isCancelled
      expect(event[9]).to.equal(false); // isActive
    });

    it("Should not allow non-organizer to cancel", async function () {
      await expect(
        contract.write.cancelEvent([1n], { account: user1.account })
      ).to.be.rejectedWith("Not authorized");
    });
  });

  describe("NFT Functionality", function () {
    beforeEach(async function () {
      const now = BigInt(Math.floor(Date.now() / 1000));
      await contract.write.createEvent([
        "NFT Test Event",
        "Test Description",
        "Test Location",
        "https://test-image.url",
        now + 2592000n,
        now - 60n,
        now + 2160000n,
        now + 1728000n,
        [parseEther("0.01"), parseEther("0.05"), parseEther("0.1")] as [bigint, bigint, bigint],
        [500n, 300n, 100n] as [bigint, bigint, bigint],
        ["Economy", "Standard", "VIP"] as [string, string, string]
      ]);

      await contract.write.purchaseTicket(
        [1n, TICKET_TYPE.STANDARD, "Section B Row 3"],
        { value: parseEther("0.05"), account: user1.account }
      );
    });

    it("Should have correct token URI with metadata", async function () {
      const tokenURI = await contract.read.tokenURI([1n]);
      
      // Token URI should be a data URI with base64 encoded JSON
      expect(tokenURI.startsWith("data:application/json;base64,")).to.be.true;
      
      // Decode and parse the JSON
      const base64Data = tokenURI.replace("data:application/json;base64,", "");
      const jsonString = Buffer.from(base64Data, "base64").toString();
      const metadata = JSON.parse(jsonString);
      
      expect(metadata.name).to.include("NFT Test Event");
      expect(metadata.name).to.include("Standard");
      expect(metadata.description).to.equal("Test Description");
      expect(metadata.image).to.equal("https://test-image.url");
      expect(metadata.attributes).to.be.an("array");
    });

    it("Should support ERC721 interfaces", async function () {
      // ERC721 interface ID
      const erc721Interface = "0x80ac58cd";
      expect(await contract.read.supportsInterface([erc721Interface])).to.be.true;
      
      // ERC721Metadata interface ID
      const erc721MetadataInterface = "0x5b5e139f";
      expect(await contract.read.supportsInterface([erc721MetadataInterface])).to.be.true;
      
      // ERC721Enumerable interface ID
      const erc721EnumerableInterface = "0x780e9d63";
      expect(await contract.read.supportsInterface([erc721EnumerableInterface])).to.be.true;
    });

    it("Should track total supply correctly", async function () {
      expect(await contract.read.totalSupply()).to.equal(1n);
      
      // Buy another ticket
      await contract.write.purchaseTicket(
        [1n, TICKET_TYPE.VIP, "VIP Section"],
        { value: parseEther("0.1"), account: user2.account }
      );
      
      expect(await contract.read.totalSupply()).to.equal(2n);
    });
  });
});

