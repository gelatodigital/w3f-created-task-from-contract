import { Web3FunctionUserArgs, Web3FunctionResultV2 } from "@gelatonetwork/web3-functions-sdk";
import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import { impersonateAccount } from "@nomicfoundation/hardhat-network-helpers";
import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { deployments, ethers, w3f } from "hardhat";
import { expect, assert } from "chai";
import { Random } from "../typechain";

describe("Briber", () => {
  let randomContract: Random;
  let randomW3f: Web3FunctionHardhat;
  let userArgs: Web3FunctionUserArgs;

  before(async function () {
    await deployments.fixture();

    randomContract = await ethers.getContract("Random");
    randomW3f = w3f.get("random");

    userArgs = {
      randomAddress: randomContract.address
    };
  });

  it("Number should be 0", async () => {
    const number = await randomContract.number();
    expect(number).to.equal(0);
  });

  it("Number should be different", async () => {
    const exec = await randomW3f.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec)
      assert.fail(res.message);

    // impersonate dedicatedMessageSender (proxy)
    const proxyAddress = await randomContract.dedicatedMsgSender();
    await impersonateAccount(proxyAddress);
    const proxy = await ethers.getSigner(proxyAddress);

    // give the proxy an eth balance so it can transact
    await setBalance(proxyAddress, 100n ** 18n);

    await proxy.sendTransaction(res.callData[0]);
    const number = await randomContract.number();

    // the random number is between 1-9 (inclusive)
    // it cannot equal 0
    expect(number).to.not.equal(0)
  })
});