import { RANDOM_API } from "./constants";
import { ethers } from "ethers";
import ky from "ky";

import {
  Web3Function,
  Web3FunctionContext
} from "@gelatonetwork/web3-functions-sdk";

const abi = [
  "function setNumber(uint256 _number)"
];

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, multiChainProvider } = context;
  const provider = multiChainProvider.default();

  const contractAddress = userArgs.contractAddress as string;
  const contract = new ethers.Contract(contractAddress, abi, provider);

  const number = parseInt(await ky.get(RANDOM_API).text());
  const tx = await contract.populateTransaction.setNumber(number);

  if (!tx.to || !tx.data)
    return { canExec: false, message: "Invalid transaction" };

  return {
    canExec: true,
    callData: [{ to: tx.to, data: tx.data }]
  };
});
