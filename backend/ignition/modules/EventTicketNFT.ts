import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EventTicketNFTModule = buildModule("EventTicketNFTModule", (m) => {
  const eventTicketNFT = m.contract("EventTicketNFT");
  return { eventTicketNFT };
});

export default EventTicketNFTModule;

