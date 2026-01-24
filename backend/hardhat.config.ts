// import type { HardhatUserConfig } from "hardhat/config";
// import { configVariable, defineConfig } from "hardhat/config";


// import hardhatIgnition from "@nomicfoundation/hardhat-ignition";
// import hardhatIgnitionViem from "@nomicfoundation/hardhat-ignition-viem";
// import toolboxViem from "@nomicfoundation/hardhat-toolbox-viem";

// import "dotenv/config";


// const config: HardhatUserConfig = defineConfig({
//    plugins: [
//     toolboxViem,
//     hardhatIgnition,
//     hardhatIgnitionViem,
//   ],

//   solidity: {
//     version: "0.8.28",
//     settings: {
//       optimizer: {
//         enabled: true,
//         runs: 200,
//       },
//     },
//   },

//   networks: {
//     sepolia: {
//       type: "http",
//       url: `https://sepolia.infura.io/v3/${configVariable("INFURA_API_KEY")}`,
//       accounts: [configVariable("METAMASK_PRIVATE_KEY")],
//     },
//   },
// });

// export default config;


import { defineConfig } from "hardhat/config";

import toolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatIgnition from "@nomicfoundation/hardhat-ignition";
import hardhatIgnitionViem from "@nomicfoundation/hardhat-ignition-viem";

import "dotenv/config";

export default defineConfig({
  plugins: [
    toolboxViem,
    hardhatIgnition,
    hardhatIgnitionViem,
  ],

  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    sepolia: {
      type: "http",
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.METAMASK_PRIVATE_KEY
        ? [process.env.METAMASK_PRIVATE_KEY]
        : [],
    },
  },
});
