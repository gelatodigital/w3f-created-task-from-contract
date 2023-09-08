import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { deployments, ethers, w3f, getNamedAccounts } from "hardhat";
import { IAutomate, IOpsProxy, OracleSyncFee } from "../typechain";
import { GELATO_ADDRESSES } from "@gelatonetwork/automate-sdk";
import { ModuleDataStruct } from "../typechain/contracts/vendor/Types.sol/IAutomate";
import { NATIVE } from "../shared/constants";
import { expect, assert } from "chai";
import {
  Web3FunctionUserArgs,
  Web3FunctionResultV2,
} from "@gelatonetwork/web3-functions-sdk";

describe("OracleSyncFee", () => {
  let automate: IAutomate;
  let oracle: OracleSyncFee;
  let oracleW3f: Web3FunctionHardhat;
  let userArgs: Web3FunctionUserArgs;
  let cid: string;

  before(async () => {
    await deployments.fixture();

    const { gelato: gelatoAddress } = await getNamedAccounts();
    const gelato = await ethers.getSigner(gelatoAddress);

    automate = (await ethers.getContractAt(
      "IAutomate",
      GELATO_ADDRESSES[1].automate,
      gelato
    )) as IAutomate;

    const { address: oracleAddress } = await deployments.get("OracleSyncFee");
    oracle = await ethers.getContractAt("OracleSyncFee", oracleAddress);

    oracleW3f = w3f.get("oracle");
    cid = await oracleW3f.deploy();

    userArgs = {
      contractAddress: oracleAddress,
    };
  });

  it("Number should be 0", async () => {
    const number = await oracle.number();
    expect(number).to.equal(0);
  });

  it("Number should be different", async () => {
    const exec = await oracleW3f.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);

    const callData = res.callData[0];

    const web3FunctionArgsHex = ethers.utils.defaultAbiCoder.encode(
      ["string"],
      [oracle.address.toLowerCase()]
    );

    const moduleData: ModuleDataStruct = {
      modules: [2, 4],
      args: [
        "0x",
        ethers.utils.defaultAbiCoder.encode(
          ["string", "bytes"],
          [cid, web3FunctionArgsHex]
        ),
      ],
    };

    const proxyAddress = await oracle.dedicatedMsgSender();
    const proxy = (await ethers.getContractAt(
      "IOpsProxy",
      proxyAddress
    )) as IOpsProxy;

    const batchExecuteCall = await proxy.populateTransaction.batchExecuteCall(
      [callData.to],
      [callData.data],
      [callData.value || 0]
    );

    if (!batchExecuteCall.to || !batchExecuteCall.data)
      assert.fail("Invalid transaction");

    await setBalance(oracle.address, ethers.utils.parseEther("1"));

    await automate.exec(
      oracle.address,
      batchExecuteCall.to,
      batchExecuteCall.data,
      moduleData,
      ethers.utils.parseEther("0.01"),
      NATIVE,
      false,
      true
    );

    const number = await oracle.number();
    expect(number).to.not.equal(0);
  });
});
