// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { Module, ModuleData } from "./vendor/Types.sol";
import { AutomateTaskCreator } from "./vendor/AutomateTaskCreator.sol";
import { IOpsProxy } from "./interfaces/IOpsProxy.sol";
import { NATIVE_TOKEN } from "./constants/Tokens.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

contract OracleSyncFee is AutomateTaskCreator {
    address public owner;
    uint256 public number;
    bytes32 public taskId;

    modifier onlyOwner {
        require(msg.sender == owner, "OracleSyncFee.onlyOwner");
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
            NATIVE_TOKEN
        );
    }

    // solhint-disable-next-line
    receive() external payable { }

    function setNumber(uint256 _number) external onlyDedicatedMsgSender {
        number = _number;

        (uint256 fee, address feeToken) = _getFeeDetails();
        _transfer(fee, feeToken);
    }

    function cancelTask() external onlyOwner {
        require(taskId != 0, "OracleSyncFee.cancelTask: task not running");
        _cancelTask(taskId);
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        (bool sent,) = to.call{value: amount}("");
        require(sent, "OracleSyncFee.withdraw: failed to withdraw");
    }
}
