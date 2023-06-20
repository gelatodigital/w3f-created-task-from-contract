import { abi as randomAbi } from "../../artifacts/contracts/Random.sol/Random.json";
import { Random } from "../../typechain";
import { RANDOM_API } from "./constants";
import { ethers } from "ethers";
import ky from "ky";

import {
  Web3Function,
  Web3FunctionContext
} from "@gelatonetwork/web3-functions-sdk";

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, multiChainProvider } = context;
  const provider = multiChainProvider.default();

  const randomAddress = userArgs.randomAddress as string;
  const random = new ethers.Contract(randomAddress, randomAbi, provider) as Random;

  const number = parseInt(await ky.get(RANDOM_API).text());
  const tx = await random.populateTransaction.setNumber(number);

  if (!tx.to || !tx.data)
    return { canExec: false, message: "Invalid transaction" };

  return {
    canExec: true,
    callData: [{ to: tx.to, data: tx.data }]
  };
});
