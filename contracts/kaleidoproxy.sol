pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/upgradeability/AdminUpgradeabilityProxy.sol";
import "@openzeppelin/upgrades/contracts/upgradeability/UpgradeabilityProxy.sol";

contract KaleidoProxy is AdminUpgradeabilityProxy {
  constructor(address _logic, bytes memory _data)
    AdminUpgradeabilityProxy(_logic, msg.sender, _data)
    public
    payable
  {

  }
}