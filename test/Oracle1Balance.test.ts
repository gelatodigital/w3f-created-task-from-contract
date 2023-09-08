import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import { deployments, ethers, w3f, getNamedAccounts } from "hardhat";
import { Oracle1Balance, IAutomate, IOpsProxy } from "../typechain";
import { GELATO_ADDRESSES } from "@gelatonetwork/automate-sdk";
import { ZERO } from "../shared/constants";
import { expect, assert } from "chai";
import {
  Web3FunctionUserArgs,
  Web3FunctionResultV2,
} from "@gelatonetwork/web3-functions-sdk";

import {
  Gelato1BalanceParamStruct,
  ModuleDataStruct,
} from "../typechain/contracts/vendor/Types.sol/IAutomate";

describe("Oracle1Balance", () => {
  let automate: IAutomate;
  let oracle: Oracle1Balance;
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

    const { address: oracleAddress } = await deployments.get("Oracle1Balance");
    oracle = await ethers.getContractAt("Oracle1Balance", oracleAddress);

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

    const oneBalanceParam: Gelato1BalanceParamStruct = {
      sponsor: ZERO,
      feeToken: ZERO,
      oneBalanceChainId: 0,
      nativeToFeeTokenXRateNumerator: 0,
      nativeToFeeTokenXRateDenominator: 0,
      correlationId: "0x" + "0".repeat(64),
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

    await automate.exec1Balance(
      oracle.address,
      batchExecuteCall.to,
      batchExecuteCall.data,
      moduleData,
      oneBalanceParam,
      true
    );

    const number = await oracle.number();
    expect(number).to.not.equal(0);
  });
});
