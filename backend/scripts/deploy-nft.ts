import hre from "hardhat";
import { createWalletClient, createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import "dotenv/config";

async function main() {
  console.log("🚀 Deploying EventTicketNFT contract...");
  
  const privateKey = process.env.METAMASK_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("METAMASK_PRIVATE_KEY not set in .env");
  }
  
  const account = privateKeyToAccount(`0x${privateKey.replace("0x", "")}`);
  console.log("📍 Deploying with account:", account.address);

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`)
  });

  const walletClient = createWalletClient({
    chain: sepolia,
    transport: http(`https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`),
    account
  });
  
  // Get contract artifact
  const artifact = await hre.artifacts.readArtifact("EventTicketNFT");
  
  console.log("⏳ Deploying contract...");
  
  // Deploy
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
  });
  
  console.log("📝 Transaction hash:", hash);
  console.log("⏳ Waiting for confirmation...");
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  console.log("\n✅ EventTicketNFT deployed to:", receipt.contractAddress);
  console.log("\n📋 Contract Details:");
  console.log("   Network:", hre.network.name);
  console.log("   Address:", receipt.contractAddress);
  
  console.log("\n🎉 Deployment complete!");
  console.log("\n⚠️  Update frontend with new contract address:", receipt.contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
