import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

describe("EventTicket", function () {
  async function deployEventTicketFixture() {
    const [owner, admin, buyer1, buyer2] = await hre.viem.getWalletClients();
    const eventTicket = await hre.viem.deployContract("EventTicket");
    const publicClient = await hre.viem.getPublicClient();

    return {
      eventTicket,
      owner,
      admin,
      buyer1,
      buyer2,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { eventTicket, owner } = await loadFixture(deployEventTicketFixture);
      expect(await eventTicket.read.owner()).to.equal(owner.account.address);
    });

    it("Should set owner as admin", async function () {
      const { eventTicket, owner } = await loadFixture(deployEventTicketFixture);
      expect(await eventTicket.read.isAdmin([owner.account.address])).to.be.true;
    });
  });

  describe("Admin Management", function () {
    it("Should allow owner to add admin", async function () {
      const { eventTicket, owner, admin } = await loadFixture(deployEventTicketFixture);
      await eventTicket.write.addAdmin([admin.account.address]);
      expect(await eventTicket.read.isAdmin([admin.account.address])).to.be.true;
    });

    it("Should not allow non-owner to add admin", async function () {
      const { eventTicket, admin, buyer1 } = await loadFixture(deployEventTicketFixture);
      await expect(
        eventTicket.write.addAdmin([buyer1.account.address], { account: admin.account })
      ).to.be.rejected;
    });
  });

  describe("Event Creation", function () {
    it("Should allow admin to create event", async function () {
      const { eventTicket, owner } = await loadFixture(deployEventTicketFixture);
      
      const futureDate = BigInt(Math.floor(Date.now() / 1000) + 86400 * 30); // 30 days
      const saleEndDate = BigInt(Math.floor(Date.now() / 1000) + 86400 * 20); // 20 days
      
      await eventTicket.write.createEvent([
        "Concert 2026",
        "Amazing music event",
        "Hanoi Stadium",
        "https://example.com/image.jpg",
        BigInt(100000000000000000), // 0.1 ETH
        BigInt(1000),
        futureDate,
        saleEndDate,
      ]);

      const eventCount = await eventTicket.read.getEventCount();
      expect(eventCount).to.equal(BigInt(1));
    });

    it("Should not allow non-admin to create event", async function () {
      const { eventTicket, buyer1 } = await loadFixture(deployEventTicketFixture);
      
      const futureDate = BigInt(Math.floor(Date.now() / 1000) + 86400 * 30);
      const saleEndDate = BigInt(Math.floor(Date.now() / 1000) + 86400 * 20);
      
      await expect(
        eventTicket.write.createEvent(
          [
            "Concert",
            "Description",
            "Location",
            "image.jpg",
            BigInt(100000000000000000),
            BigInt(100),
            futureDate,
            saleEndDate,
          ],
          { account: buyer1.account }
        )
      ).to.be.rejected;
    });
  });

  describe("Ticket Purchase", function () {
    it("Should allow anyone to purchase ticket", async function () {
      const { eventTicket, owner, buyer1 } = await loadFixture(deployEventTicketFixture);
      
      const futureDate = BigInt(Math.floor(Date.now() / 1000) + 86400 * 30);
      const saleEndDate = BigInt(Math.floor(Date.now() / 1000) + 86400 * 20);
      const ticketPrice = BigInt(100000000000000000); // 0.1 ETH
      
      await eventTicket.write.createEvent([
        "Concert 2026",
        "Amazing music event",
        "Hanoi Stadium",
        "https://example.com/image.jpg",
        ticketPrice,
        BigInt(1000),
        futureDate,
        saleEndDate,
      ]);

      await eventTicket.write.purchaseTicket([BigInt(1)], {
        account: buyer1.account,
        value: ticketPrice,
      });

      const ticketCount = await eventTicket.read.getTicketCount();
      expect(ticketCount).to.equal(BigInt(1));
    });

    it("Should reject purchase with insufficient payment", async function () {
      const { eventTicket, buyer1 } = await loadFixture(deployEventTicketFixture);
      
      const futureDate = BigInt(Math.floor(Date.now() / 1000) + 86400 * 30);
      const saleEndDate = BigInt(Math.floor(Date.now() / 1000) + 86400 * 20);
      const ticketPrice = BigInt(100000000000000000);
      
      await eventTicket.write.createEvent([
        "Concert 2026",
        "Description",
        "Location",
        "image.jpg",
        ticketPrice,
        BigInt(100),
        futureDate,
        saleEndDate,
      ]);

      await expect(
        eventTicket.write.purchaseTicket([BigInt(1)], {
          account: buyer1.account,
          value: BigInt(50000000000000000), // Half price
        })
      ).to.be.rejected;
    });
  });
});
