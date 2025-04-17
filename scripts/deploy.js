// scripts/deploy.js

async function main() {
    const [deployer] = await hre.ethers.getSigners();
  
    console.log("🚀 Deploying contracts with account:", deployer.address);
  
    const LaunchpadFactory = await hre.ethers.getContractFactory("Launchpad");
    const launchpad = await LaunchpadFactory.deploy();
  
    await launchpad.waitForDeployment(); // NEW in Hardhat v2.17+
  
    console.log("✅ Launchpad deployed to:", await launchpad.getAddress());
  }
  
  main().catch((error) => {
    console.error("❌ Error:", error);
    process.exitCode = 1;
  });
  