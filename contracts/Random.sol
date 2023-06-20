// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { Module, ModuleData } from "./Types.sol";
import { AutomateTaskCreator } from "./AutomateTaskCreator.sol";

contract Random is AutomateTaskCreator {
    address public owner;
    uint256 public number;
    bytes32 public taskId;

    modifier onlyOwner {
        require(msg.sender == owner, "Random.onlyOwner");
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

        moduleData.modules[0] = Module.PROXY;
        moduleData.modules[1] = Module.WEB3_FUNCTION;

        moduleData.args[0] = _proxyModuleArg();
        moduleData.args[1] = _web3FunctionModuleArg(
            cid,
            abi.encode(address(this))
        );

        bytes memory execData = abi.encodeWithSelector(
            Random.setNumber.selector
        );

        taskId = _createTask(
            address(this),
            execData,
            moduleData,
            address(0)
        );
    }

    function setNumber(uint256 _number) external onlyDedicatedMsgSender {
        number = _number;
    }

    function cancelTask() external onlyOwner {
        require(taskId != 0, "Random.cancelTask: task not running");
        _cancelTask(taskId);
    }

    // 1Balance does NOT yet support withdrawals - this feature will be added soon
    function depositFunds1Balance(address token, uint256 amount) external payable {
        _depositFunds1Balance(amount, token, address(this));
    }
}