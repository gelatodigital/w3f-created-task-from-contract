import { deployments, getNamedAccounts, w3f } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { AUTOMATE } from "../shared/constants";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (hre.network.name !== "hardhat") {
    console.log(
      `Deploying Oracle1Balance to ${hre.network.name}. Hit ctrl + c to abort`
    );
  }

  const oracleW3f = w3f.get("oracle");
  const cid = await oracleW3f.deploy();

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("Oracle1Balance", {
    from: deployer,
    args: [AUTOMATE, cid],
    log: hre.network.name !== "hardhat",
  });
};

func.skip = async () => {
  return false;
};

func.tags = ["Oracle1Balance"];

export default func;
