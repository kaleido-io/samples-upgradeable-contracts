# samples-upgradeable-contracts
Demonstrating writing upgradeable contracts using the [unstructured storage proxy](https://docs.openzeppelin.com/upgrades/2.8/proxies#unstructured-storage-proxies) pattern with the openzeppelin upgrades library

## How Upgradeable Contracts Work
The main idea is that there is a proxy contract that uses another contract as a *library* or *implementation* to perform the actual transaction processing. The resulting states are saved in the proxy contract storage area, such that when the target contract gets updated, all the states from the previous version get preserved because they belong to the proxy contract which has not changed.

On top of that, the *unstructured storage* pattern utilizes EVM's [fallback function](https://solidity.readthedocs.io/en/latest/contracts.html#fallback-function) and the low-level function `delegatecall()` to avoid having to learn about the target contract's ABI. This allows the proxy contract to stay generic.

* `contracts/kaleidoproxy.sol`: the main proxy contract based on the `AdminUpgradeabilityProxy` contract from the openzeppelin SDK. This supports upgrade as well as admin ownership which can be transferred.
* `simplestorage_v1.sol`: version 1.0 of the target contract. this will be deployed first in the sample test flow. It's state will be updated with a couple of transactions before the upgrade.
  > A special consideration of this contract implementation, compared to a regular smart contract that is not upgradeable, is that it does not have a constructor, but instead has an `initialize()` method that will be called by the proxy contract to obtain the initial state.
* `simplestorage_v2.sol`: version 2.0 of the target contract. this will be deployed and set as the implementation of the proxy via the `upgradeTo()` method. it will inherit the existing states from version 1.0.

## Testing Upgrade Flow
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

## Using the Upgradeable Contracts with Kaleido Contract Management
Kaleido provides powerful [contract management](https://www.kaleido.io/blockchain-blog/smart-contract-management-solution-how-it-works-why-you-need-it) on the platform. It provides REST API Gateway support of any smart contracts. Use the following procedure to use the capability with upgradeable contracts.

### Deploy the initial version of the implementation contract
Still using the simplestorage contracts as example, you can deploy the initial version of the implementation contract (`simplestorage_v1.sol`) normally. Note that the deployed contract will not be called directly but only through the proxy, as such it is not necessary to generate a REST API gateway for it. But you can still use the contract management tool to deploy it for convenience purposes.

For detailed steps to deploy a contract using Kaleido contract management, refer to the instructions in the [blog](https://www.kaleido.io/blockchain-blog/smart-contract-management-solution-how-it-works-why-you-need-it).

You can also use regular web3 SDKs or Truffle to deploy the contract. Record the resulting contract address to be used in the later steps.

### Deploy the proxy contract
Because the proxy contract has no knowledge of the target contract's ABI, but it will be used to call the methods on the target contract, we need to manually assemble a custom ABI for it. It's done by merging the ABIs from the proxy contract and the target contract:

* ABI to specify for the proxy:
  * ABI from the proxy contract itself
    * constructor
    * upgradeTo
  * ABI from the target contract (simplestorage_v1)
    * set
    * get

The merged ABI is available in the file `resources/combined-proxy-and-implementation-abi.json`.

The bytecode can be obtained from the truffle compile:
```
truffle compile
```

Find the file `build/contracts/KaleidoProxy.json` and get the hex string for the property `bytecode`.

Create a pre-compiled contract and specify the merged ABI and the compiled bytecode for the proxy contract. After promoting it to the environment, deploy an instance using the gateway API.

![deploy proxy](/resources/deploy-proxy-instance.png)

* `_logic`: this is the address of the target contract (for `simplestorage_v1`) deployed in the previous step
* `_data`: this must be encoded function call to call the `initialize()` function on the target contract. Specifically for `simplestorage_v1`, we want to initialize the value to 10. You can use any web3 SDK to calculate the encoded string:
  ```
  const data = web3.eth.abi.encodeFunctionCall({
    "type": "function",
    "name": "initialize",
    "inputs": [
      {
        "internalType": "uint256",
        "name": "initVal",
        "type": "uint256"
      }
    ]}, [10]);
  ```

### Call implementation methods on the proxy contract
Now the REST API Gateway is fully set up on the proxy contract. It can be used to call any methods on the target contract, as if the target contract is being called directly.

### Upgrade the implementation contract
Suppose we have an updated contract implementation, `simplestorage_v2.sol`.

It can be deployed again as a normal contract, just like for version 1. Record the address of the new deployment.

Now we just need to update the proxy contract to tell it about the new version's address, by calling the `updateTo()` method:

![upgrade proxy](/resources/upgrade-impl.png)

### Verify exiting states from previous versions are inherited
After the upgradeTo call, you can query the proxy contract for states to confirm that the existing states from the previous versions are successfully inherited.

### Start calling the upgraded implementation methods on the proxy contract
Now the upgraded proxy contract is ready for use, with the new implementation doing the transaction process going forward.
