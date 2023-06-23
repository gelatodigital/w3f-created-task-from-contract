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

        moduleData.modules[0] = Module.PROXY;
        moduleData.modules[1] = Module.WEB3_FUNCTION;

        moduleData.args[0] = _proxyModuleArg();
        moduleData.args[1] = _web3FunctionModuleArg(
            cid,
            abi.encode(Strings.toHexString(address(this)))
        );

        bytes memory execData = abi.encodeWithSelector(
            IOpsProxy.batchExecuteCall.selector
        );

        taskId = _createTask(
            dedicatedMsgSender,
            execData,
            moduleData,
            address(0)
        );
    }

    function setNumber(uint256 _number) external onlyDedicatedMsgSender {
        number = _number;
    }

    function cancelTask() external onlyOwner {
        require(taskId != 0, "Oracle1Balance.cancelTask: task not running");
        _cancelTask(taskId);
    }

    function depositFunds1Balance(address token, uint256 amount) external payable {
        _depositFunds1Balance(amount, token, address(this));
    }
}
