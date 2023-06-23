// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { Module, ModuleData } from "./vendor/Types.sol";
import { AutomateTaskCreator } from "./vendor/AutomateTaskCreator.sol";
import { IOpsProxy } from "./interfaces/IOpsProxy.sol";
import { NATIVE_TOKEN } from "./constants/Tokens.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

contract Oracle1Balance is AutomateTaskCreator {
    address public owner;
    uint256 public number;
    bytes32 public taskId;

    modifier onlyOwner {
        require(msg.sender == owner, "Oracle1Balance.onlyOwner");
        _;
    }

    constructor(address automate, string memory cid)
        AutomateTaskCreator(automate, address(0))
    {
        owner = msg.sender;

        ModuleData memory moduleData = ModuleData({
            modules: new Module[](2),
            args: new bytes[](2)
        });

        // Proxy module creates a dedicated proxy for this contract
        // ensures that only contract created tasks can call certain fuctions
        // restrict functions by using the onlyDedicatedMsgSender modifier
        moduleData.modules[0] = Module.PROXY;
        moduleData.modules[1] = Module.WEB3_FUNCTION;

        moduleData.args[0] = _proxyModuleArg();
        moduleData.args[1] = _web3FunctionModuleArg(
            // the CID is the hash of the W3f deployed on IPFS
            cid,
            // the arguments to the W3f are this contracts address
            // currently W3fs accept string, number, bool as arguments
            // thus we must convert the address to a string
            abi.encode(Strings.toHexString(address(this)))
        );

        // execData passed to the proxy by the Automate contract
        // "batchExecuteCall" forwards calls from the proxy to this contract
        bytes memory execData = abi.encodeWithSelector(
            IOpsProxy.batchExecuteCall.selector
        );

        // target address is this contracts dedicatedMsgSender proxy
        taskId = _createTask(
            dedicatedMsgSender,
            execData,
            moduleData,
            // zero address as fee token indicates
            // that the contract will use 1Balance for fee payment
            address(0)
        );
    }

    // can only be called by contract created tasks
    // fee is deducted from 1Balance after execution
    function setNumber(uint256 _number) external onlyDedicatedMsgSender {
        number = _number;
    }

    function cancelTask() external onlyOwner {
        require(taskId != 0, "Oracle1Balance.cancelTask: task not running");
        _cancelTask(taskId);
    }

    // fund executions by depositing to 1Balance
    function depositFunds1Balance(address token, uint256 amount) external payable {
        _depositFunds1Balance(amount, token, address(this));
    }
}
