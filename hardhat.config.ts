import { HardhatUserConfig } from "hardhat/config";
import "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";

const config: HardhatUserConfig = {
  w3f: {
    rootDir: "./web3-functions",
    debug: false,
    networks: ["ethereum"],
  },
  solidity: {
    compilers: [
      {
        version: "0.8.21",
        settings: {
          optimizer: { enabled: true, runs: 999999 },
          evmVersion: "paris",
        },
      },
    ],
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    gelato: {
      default: "0x3CACa7b48D0573D793d3b0279b5F0029180E83b6",
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://gateway.tenderly.co/public/mainnet",
      },
      chainId: 1,
    },
    ethereum: {
      url: "https://gateway.tenderly.co/public/mainnet",
      chainId: 1,
    },
  },
};

export default config;
