/*
 * Copyright 2020 Kaleido
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let Proxy = artifacts.require('KaleidoProxy');
let SimpleStorage_v1 = artifacts.require('SimpleStorage_v1');
let SimpleStorage_v2 = artifacts.require('SimpleStorage_v2');

const truffleAssert = require('truffle-assertions');
const expect = require('chai').expect;

const abi_get = {
  "type": "function",
  "name": "get",
  "inputs": [],
  "outputs": [
    {
      "internalType": "uint256",
      "name": "retVal",
      "type": "uint256"
    }
  ]
};
const abi_set = {
  "type": "function",
  "name": "set",
  "inputs": [
    {
      "internalType": "uint256",
      "name": "x",
      "type": "uint256"
    }
  ],
  "outputs": [
    {
      "internalType": "uint256",
      "name": "value",
      "type": "uint256"
    }
  ]
};

contract("Upgradeable contracts test", async (accounts) => {
  let proxy, ss_v1, ss_v2;
  const admin = accounts[0];
  const user1 = accounts[1];
  before(() => {
  });

  describe("Contract deploy and upgrade flow", async () => {
    it("deploy the simplestorage v1 contract", async () => {
      ss_v1 = await SimpleStorage_v1.new();
    });

    it("deploy the proxy contract", async() => {
      // based on the encoding rules:
      // https://solidity.readthedocs.io/en/v0.4.24/abi-spec.html#function-selector-and-argument-encoding
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
      console.log(`Encoded invocation data: ${data}`);

      proxy = await Proxy.new(ss_v1.address, data);
    });

    it("check the current value by calling the proxy contract", async () => {
      const data = web3.eth.abi.encodeFunctionCall(abi_get, []);
      let result = await web3.eth.call({
        from: user1,
        to: proxy.address,
        data
      });
      expect(web3.eth.abi.decodeParameter('uint256', result)).to.equal('10');
    });

    it("set a new value by calling the proxy contract", async () => {
      const data = web3.eth.abi.encodeFunctionCall(abi_set, [20]);
      let result = await web3.eth.sendTransaction({
        from: user1,
        to: proxy.address,
        data
      });
    });

    it("check the updated value by calling the proxy contract", async () => {
      const data = web3.eth.abi.encodeFunctionCall(abi_get, []);
      let result = await web3.eth.call({
        from: user1,
        to: proxy.address,
        data
      });
      expect(web3.eth.abi.decodeParameter('uint256', result)).to.equal('20');
    });

    it("deploy the simplestorage v2 contract", async () => {
      ss_v2 = await SimpleStorage_v2.new();
    });

    it("upgrade the proxy to v2 of the implementation contract", async () => {
      await proxy.upgradeTo(ss_v2.address);
    });

    it("check past states have been preserved", async () => {
      const data = web3.eth.abi.encodeFunctionCall(abi_get, []);
      let result = await web3.eth.call({
        from: user1,
        to: proxy.address,
        data
      });
      expect(web3.eth.abi.decodeParameter('uint256', result)).to.equal('20');
    })
  });
});
