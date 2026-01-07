import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EventTicketModule = buildModule("EventTicketModule", (m) => {
  const eventTicket = m.contract("EventTicket");
  return { eventTicket };
});

export default EventTicketModule;
