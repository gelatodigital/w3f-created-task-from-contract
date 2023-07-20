// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import {Module, ModuleData} from "./vendor/Types.sol";
import {AutomateTaskCreator} from "./vendor/AutomateTaskCreator.sol";
import {IOpsProxy} from "./interfaces/IOpsProxy.sol";
import {NATIVE_TOKEN} from "./constants/Tokens.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract OracleSyncFee is AutomateTaskCreator {
    address public owner;
    uint256 public number;
    bytes32 public taskId;

    modifier onlyOwner() {
        require(msg.sender == owner, "OracleSyncFee.onlyOwner");
        _;
    }

    constructor(
        address automate,
        string memory cid
    ) AutomateTaskCreator(automate, address(0)) {
        owner = msg.sender;
        taskId = _createOracleTask(cid);
    }

    // since we pay synchronously in native tokens
    // we must be able to deposit to the contract
    // solhint-disable-next-line
    receive() external payable {}

    // can only be called by contract created tasks
    function setNumber(uint256 _number) external onlyDedicatedMsgSender {
        number = _number;

        // since the contract uses sync fee payment it must:
        // fetch fee, fee token, fee collector from the end of calldata
        // transfer the appropriate fee to the fee collector
        (uint256 fee, address feeToken) = _getFeeDetails();
        _transfer(fee, feeToken);
    }

    function cancelTask() external onlyOwner {
        require(taskId != 0, "OracleSyncFee.cancelTask: task not running");
        _cancelTask(taskId);
    }

    function createTask(string memory cid) external onlyOwner {
        require(taskId == 0, "OracleSyncFee.cancelTask: task already running");
        taskId = _createOracleTask(cid);
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "OracleSyncFee.withdraw: failed to withdraw");
    }

    function _createOracleTask(string memory cid) internal returns (bytes32) {
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
        return
            _createTask(
                dedicatedMsgSender,
                execData,
                moduleData,
                // native token as fee token indicates
                // that the contract will pay the fee synchronously
                NATIVE_TOKEN
            );
    }
}
