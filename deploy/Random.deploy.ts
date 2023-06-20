import { deployments, getNamedAccounts, w3f } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const AUTOMATE: string = "0x2A6C106ae13B558BB9E2Ec64Bd2f1f7BEFF3A5E0";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (hre.network.name !== "hardhat") {
    console.log(
      `Deploying Random to ${hre.network.name}. Hit ctrl + c to abort`
    );
  }

  const randomW3f = w3f.get("random");

  console.log("Deploying Web3Function on IPFS...");
  const cid = await randomW3f.deploy();
  console.log("Web3Function IPFS CID:", cid);

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("Random", {
    from: deployer,
    args: [AUTOMATE, cid],
    log: hre.network.name !== "hardhat",
  });
};

export default func;

func.tags = ["Random"];
