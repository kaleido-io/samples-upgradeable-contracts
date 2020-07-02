# samples-upgradeable-contracts
Demonstrating writing upgradeable contracts using the unstructured proxy pattern with the openzeppelin upgrades library

To observe a flow of deploying an initial version of a smart contract, make state updates, then upgrade and verify that the states have been preserved:

```
$ truffle test
Using network 'development'.


Compiling your contracts...
===========================
> Compiling ./contracts/kaleidoproxy.sol
> Compiling ./contracts/simplestorage_v1.sol
> Compiling ./contracts/simplestorage_v2.sol
> Artifacts written to /var/folders/qm/1tb9578s43795w9nt_08xs240000gn/T/test-202062-25596-m49iki.jdv8
> Compiled successfully using:
   - solc: 0.5.16+commit.9c3226ce.Emscripten.clang



  Contract: Upgradeable contracts test
    Contract deploy and upgrade flow
      ✓ deploy the simplestorage v1 contract (71ms)
      ✓ deploy the proxy contract (351ms)
      ✓ check the current value by calling the proxy contract
      ✓ set a new value by calling the proxy contract (86ms)
      ✓ check the updated value by calling the proxy contract (49ms)
      ✓ deploy the simplestorage v2 contract (128ms)
      ✓ upgrade the proxy to v2 of the implementation contract (108ms)
      ✓ check past states have been preserved (39ms)


  8 passing (991ms)
```