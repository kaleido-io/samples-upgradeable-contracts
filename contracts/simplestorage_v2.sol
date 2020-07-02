pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";

contract SimpleStorage_v2 is Initializable {
   uint public storedData;

   event DataStored (
      uint data
   );

   function initialize(uint initVal) public initializer {
      storedData = initVal;
   }

   function set(uint x) public returns (uint value) {
      require(x < 100, "Value can not be over 100");
      storedData = x;

      emit DataStored(x);

      return storedData;
   }

   function get() public view returns (uint retVal) {
      return storedData;
   }

   function query() public view returns (uint retVal) {
      return storedData;
   }
}
