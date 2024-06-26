# Web3 Function Task created from Smart Contract

There are three ways to [create Web3 Function Tasks](https://docs.gelato.network/developer-services/web3-functions/creating-web3-function-tasks):
1. Using the UI
2. Using the Automate-SDK
3. Using a smart contract

This project demonstrates creating a Web3 Function task directly from a Smart Contract (3rd option).  
This behaviour is ideal for factory contracts as everything takes place on-chain.

There are three ways to handle fee payment:
1. Using [1Balance](https://docs.gelato.network/developer-services/1balance)
     - This will fund all tasks you create on any network
2. Sync fee payment with native tokens in the target contract
     - This will only fund tasks interacting with that one contract
3. Sync fee payment with native tokens in the dedicated message sender
     - This will fund all your tasks on that network
  
## Contracts and tests
- ``Oracle1Balance``  
  fee payment using 1Balance
- ``OracleSyncFee``  
  fee payment using native tokens in the contract

## Implementation
Implementation is as simple as inheriting from ``AutomateTaskCreator`` and calling ``_createTask`` with the appropriate arguments.
If you'd like to use sync fee payment, ensure the contract is funded and then, in your automated function, [transfer the fee](https://github.com/gelatodigital/w3f-task-from-contract/blob/main/contracts/OracleSyncFee.sol#L57-L58) using ``_getFeeDetails`` and ``_transfer``.

> [!WARNING]
> Ensure this function is using the ``onlyDedicatedMsgSender`` modifier, otherwise anyone will be able to call it and maliciously transfer a fee to themselves.

## Get Beta access
Web3 Function are currently in private beta.  
In order to get access, please reach out to us [here](https://form.typeform.com/to/RrEiARiI)

> [!NOTE]
> Ensure the contract itself is whitelisted and not the deployer (EOA)
  
## Quick Start
1. Install dependencies
   ```
   yarn install
   ```
3. Compile smart contracts
   ```
   yarn run hardhat compile
   ```
5. Edit ``.env``
   ```
   cp .env.example .env
   ```
7. Run unit tests
   ```
   yarn run hardhat test
   ```
