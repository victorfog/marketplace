'use strict';

const { expectRevert } = require('@openzeppelin/test-helpers');
//import {assertBigNumberEqual} from "./helpers/asserts";

const MarketPlace = artifacts.require("MarketPlace.sol");

contract('MarketPlace', function(accounts) {
    let fileList = [
        {Name: "Box", Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1", SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A1", Price: web3.utils.toWei("11", 'ether'), Description: "its my first model",  Sender: {from: accounts[1]}},
        {Name: "Box2", Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA2", SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A2", Price: web3.utils.toWei("12", 'ether'), Description: "its my first model2",  Sender: {from: accounts[1]}},
        {Name: "Box3", Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3", SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A3", Price: web3.utils.toWei("13", 'ether'), Description: "its my first model2",  Sender: {from: accounts[1]}},
        {Name: "Box4", Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4", SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A4", Price: web3.utils.toWei("14", 'ether'), Description: "its my first model",  Sender: {from: accounts[2]}},
        {Name: "Box5", Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5", SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A5", Price: web3.utils.toWei("15", 'ether'), Description: "its my first model1",  Sender: {from: accounts[1]}},
        {Name: "Box6", Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6", SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A6", Price: web3.utils.toWei("16", 'ether'), Description: "its my first model1",  Sender: {from: accounts[2]}},
        {Name: "Box7", Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7", SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A7", Price: web3.utils.toWei("17", 'ether'), Description: "its my first model",  Sender: {from: accounts[1]}},
    ];
    // web3.utils.toWei(amount, 'ether')

    async function initOrders(MarketContract) {
        let updatedFileList = fileList.slice();
        let i = 0;
        let j = 0;

        MarketContract.contract.events.NewFile()
            .on("data", (result) => {
                updatedFileList[j].FileID = result.args._FileID.toNumber();
                j++;
            })
            .on("error", (error) => {
                console.log("PANIC!!!!", error);
            });

        for (let file of fileList) {
            await MarketContract.addFile(file.Name, file.Hash, file.SwarmHash, file.Price, file.Description, file.Sender);
            i++;
        }

        return updatedFileList;
    }

    it('Create 7 model, 2 users', async function() {
        const MarketContract = await MarketPlace.new({from: accounts[0]});
        let updatedOrdersList = await initOrders(MarketContract);

    });

    // it('Create order from user1 ', async function() {
    //     const MarketContract = await MarketPlace.new({from: accounts[0]});
    //     let updatedOrdersList = initOrders(MarketContract);
    //
    //     console.log(updatedOrdersList);
    //
    //     //await sleep(2000);
    //     let myFile = updatedOrdersList[1];
    //     await MarketContract.createOrder(myFile.FileID,  {from: accounts[1], value: myFile.Price});
    //     //console.log(_FileID);
    //     Assert.equal()
    //
    // });

    it('Create Order', async function() {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        await MarketContract.createOrder(1,  {from: accounts[4], value: web3.utils.toWei('12', 'ether')});
    });

    it('Create order for non-existent file', async function() {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);
        await expectRevert.assertion(MarketContract.createOrder(9,  {from: accounts[4], value: web3.utils.toWei('30', 'ether')}));
    });

    it('Create Order. Too low price. Should fail.', async function() {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        await expectRevert(MarketContract.createOrder(1,  {from: accounts[4], value: web3.utils.toWei('2', 'ether')}), "given money should be greater than the price");
    });

    it('Create Order. Witch wrong file. .', async function() {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        await expectRevert.assertion(MarketContract.createOrder(10,  {from: accounts[4], value: web3.utils.toWei('20', 'ether')}));
    });

    it('approveOrder', async function() {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        var _OrderID;
        MarketContract.contract.events.EventCreateOrder()
            .on("data", (result) => {
                _OrderID = result.args._orderID.toNumber();
                console.log(_OrderID);
            })
            .on("error", (error) => {
                console.log("PANIC!!!!", error);
            });
        let balance5;

        web3.eth.getBalance(accounts[5], function (error, wei) {
            if (!error) {
                balance5 = web3.utils.fromWei(wei, 'ether');
            }
        });
        let balance2;
        web3.eth.getBalance(accounts[2], function (error, wei) {
            if (!error) {
                balance2 = web3.utils.fromWei(wei, 'ether');
            }
        });       // let balance2 = await web3.eth.getBalance(accounts[2]).toNumber();

        console.log("Balance before make order", "bayer", balance5,"owner", balance2);

        await MarketContract.createOrder(3, {from: accounts[5], value: web3.utils.toWei('14', 'ether')});

        MarketContract.contract.events.eventApproveOrder()
            .on("data", (result) => {
                console.log(result.args);
            })
            .on("error", (error) => {
                console.log("Panic!!!! approve", error);
            });

        let beforeBalance2 = balance2;
        let beforeBalance5 = balance5;
        web3.eth.getBalance(accounts[5]), function(error, wei){
            if (!error) {
                balance5 = web3.utils.fromWei(wei, 'ether');
            }
        };
        web3.eth.getBalance(accounts[2], function (error, wei) {
            if (!error) {
                balance2 = web3.utils.fromWei(wei, 'ether');
            }
        });//        balance2 = await web3.eth.getBalance(accounts[2]).toNumber();

        var contractBalance = undefined;

        web3.eth.getBalance(MarketContract.address,function(error, wei){
            contractBalance = web3.utils.fromWei(wei, 'ether');
        });//let contractBalance = await web3.eth.getBalance(MarketContract.address).toNumber();


        console.log("Balance after make order_", "bayer", balance5,"owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);

        await MarketContract.approveOrder(_OrderID, true, {from: accounts[5]});
        await MarketContract.approveOrder(_OrderID, true, {from: accounts[2]});

        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        web3.eth.getBalance(accounts[5]), function(error, wei){
            if (!error) {
                balance5 = web3.utils.fromWei(wei, 'ether');
            }
        };
        web3.eth.getBalance(accounts[2], function (error, wei) {
            if (!error) {
                balance2 = web3.utils.fromWei(wei, 'ether');
            }
        });//        balance2 = await web3.eth.getBalance(accounts[2]).toNumber();

        contractBalance = await web3.eth.getBalance(MarketContract.address).toNumber();

        console.log("Balance after close order", "bayer", balance5,"owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", web3.fromWei(balance5 - beforeBalance5, 'ether'),
            "Owner", web3.fromWei(balance2 - beforeBalance2, 'ether'), "contract", web3.fromWei(contractBalance, 'ether'));
    });

    it('approveOrder test to err', async function() {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        var _OrderID;

        let eventContractHendler = MarketContract.EventCreateOrder();
        eventContractHendler.watch(function(error, result) {
            if (!error) {
                _OrderID = result.args._orderID.toNumber();
            } else {
                console.log("PANIC!!!!", error);

            }
        });
        await sleep(100);
        let balance5 = await web3.eth.getBalance(accounts[5]).toNumber();
        let balance2 = await web3.eth.getBalance(accounts[2]).toNumber();
        console.log("Balance before make order", "bayer", balance5,"owner", balance2);

        await MarketContract.createOrder(3, {from: accounts[5], value: web3.utils.toWei('14', 'ether')});
        await sleep(500);
        eventContractHendler.stopWatching();

        let _eventApproveOrder = MarketContract.eventApproveOrder();
        _eventApproveOrder.watch(function(error, result) {
            if (!error){
                console.log(result.args);
            } else {
                console.log("Panic!!!! approve", error);
            }

        });
        await sleep(100);
        let beforeBalance2 = balance2;
        let beforeBalance5 = balance5;
        balance5 = await web3.eth.getBalance(accounts[5]).toNumber();
        balance2 = await web3.eth.getBalance(accounts[2]).toNumber();
        let contractBalance = await web3.eth.getBalance(MarketContract.address).toNumber();
        console.log("Balance after make order_", "bayer", balance5,"owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);

        await MarketContract.approveOrder(_OrderID, true, {from: accounts[5]});
        await MarketContract.approveOrder(_OrderID, false, {from: accounts[2]});
        await expectRevert.assertion( MarketContract.approveOrder(_OrderID, true, {from: accounts[4]}));
        await sleep(500);

        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = await web3.eth.getBalance(accounts[5]).toNumber();
        balance2 = await web3.eth.getBalance(accounts[2]).toNumber();
        contractBalance = await web3.eth.getBalance(MarketContract.address).toNumber();

        console.log("Balance after close order", "bayer", balance5,"owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", web3.fromWei(balance5 - beforeBalance5, 'ether'),
            "Owner", web3.fromWei(balance2 - beforeBalance2, 'ether'), "contract", web3.fromWei(contractBalance, 'ether'));
    });

    it('CenselOrder if all ok', async function() {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        var _OrderID;

        let eventContractHendler = MarketContract.EventCreateOrder();
        eventContractHendler.watch(function(error, result) {
            if (!error) {
                _OrderID = result.args._orderID.toNumber();
            } else {
                console.log("PANIC!!!!", error);

            }
        });
        await sleep(100);
        let balance5 = await web3.eth.getBalance(accounts[5]).toNumber();//bayer
        let balance2 = await web3.eth.getBalance(accounts[2]).toNumber();//owner
        console.log("Balance before make order", "bayer", balance5,"owner", balance2);

        await MarketContract.createOrder(3, {from: accounts[5], value: web3.utils.toWei('14', 'ether')});
        await sleep(500);
        eventContractHendler.stopWatching();

        let _eventApproveOrder = MarketContract.eventApproveOrder();
        _eventApproveOrder.watch(function(error, result) {
            if (!error){
                console.log(result.args);
            } else {
                console.log("Panic!!!! approve", error);
            }

        });
        await sleep(100);
        let beforeBalance2 = balance2;
        let beforeBalance5 = balance5;
        balance5 = await web3.eth.getBalance(accounts[5]).toNumber();
        balance2 = await web3.eth.getBalance(accounts[2]).toNumber();
        let contractBalance = await web3.eth.getBalance(MarketContract.address).toNumber();
        console.log("Balance after make order_", "bayer", balance5,"owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);

        //await MarketContract.approveOrder(_OrderID, false, {from: accounts[5]});
        //await MarketContract.approveOrder(_OrderID, false, {from: accounts[2]});
        await sleep(500);

        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = await web3.eth.getBalance(accounts[5]).toNumber();
        balance2 = await web3.eth.getBalance(accounts[2]).toNumber();
        contractBalance = await web3.eth.getBalance(MarketContract.address).toNumber();

        console.log("Balance after close order", "bayer", balance5,"owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", web3.fromWei(balance5 - beforeBalance5, 'ether'),
            "Owner", web3.fromWei(balance2 - beforeBalance2, 'ether'), "contract", web3.fromWei(contractBalance, 'ether'));

        await MarketContract.canselOrder(_OrderID, {from:accounts[5]});
        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = await web3.eth.getBalance(accounts[5]).toNumber();
        balance2 = await web3.eth.getBalance(accounts[2]).toNumber();
        contractBalance = await web3.eth.getBalance(MarketContract.address).toNumber();

        console.log("Balance after cansel order", "bayer", balance5,"owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", web3.fromWei(balance5 - beforeBalance5, 'ether'),
            "Owner", web3.fromWei(balance2 - beforeBalance2, 'ether'), "contract", web3.fromWei(contractBalance, 'ether'));


    });

    it('CenselOrder if a owner file send True', async function() {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        var _OrderID;

        let eventContractHendler = MarketContract.EventCreateOrder();
        eventContractHendler.watch(function(error, result) {
            if (!error) {
                _OrderID = result.args._orderID.toNumber();
            } else {
                console.log("PANIC!!!!", error);

            }
        });
        await sleep(100);
        let balance5 = await web3.eth.getBalance(accounts[5]).toNumber();//bayer
        let balance2 = await web3.eth.getBalance(accounts[2]).toNumber();//owner
        console.log("Balance before make order", "bayer", balance5,"owner", balance2);

        await MarketContract.createOrder(3, {from: accounts[5], value: web3.utils.toWei('14', 'ether')});
        await sleep(500);
        eventContractHendler.stopWatching();

        let _eventApproveOrder = MarketContract.eventApproveOrder();
        _eventApproveOrder.watch(function(error, result) {
            if (!error){
                console.log(result.args);
            } else {
                console.log("Panic!!!! approve", error);
            }

        });
        await sleep(100);
        let beforeBalance2 = balance2;
        let beforeBalance5 = balance5;
        balance5 = await web3.eth.getBalance(accounts[5]).toNumber();
        balance2 = await web3.eth.getBalance(accounts[2]).toNumber();
        let contractBalance = await web3.eth.getBalance(MarketContract.address).toNumber();
        console.log("Balance after make order_", "bayer", balance5,"owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);

// test from 1 if owner send true! ***
        await MarketContract.approveOrder(_OrderID, false, {from: accounts[5]});
        await MarketContract.approveOrder(_OrderID, true, {from: accounts[2]});
        await sleep(500);

        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = await web3.eth.getBalance(accounts[5]).toNumber();
        balance2 = await web3.eth.getBalance(accounts[2]).toNumber();
        contractBalance = await web3.eth.getBalance(MarketContract.address).toNumber();

        console.log("Balance after close order", "bayer", balance5,"owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", web3.fromWei(balance5 - beforeBalance5, 'ether'),
            "Owner", web3.fromWei(balance2 - beforeBalance2, 'ether'), "contract", web3.fromWei(contractBalance, 'ether'));

        await expectRevert.assertion(MarketContract.canselOrder(_OrderID, {from:accounts[5]}));

        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = await web3.eth.getBalance(accounts[5]).toNumber();
        balance2 = await web3.eth.getBalance(accounts[2]).toNumber();

        contractBalance = await web3.eth.getBalance(MarketContract.address).toNumber();

        console.log("Balance after cansel order", "bayer", balance5,"owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", web3.fromWei(balance5 - beforeBalance5, 'ether'),
            "Owner", web3.fromWei(balance2 - beforeBalance2, 'ether'), "contract", web3.fromWei(contractBalance, 'ether'));
// test from 1 if owner send true! ***


    });

    it('CenselOrder if close order not a bayer', async function() {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        var _OrderID;

        let eventContractHendler = MarketContract.EventCreateOrder();
        eventContractHendler.watch(function(error, result) {
            if (!error) {
                _OrderID = result.args._orderID.toNumber();
            } else {
                console.log("PANIC!!!!", error);

            }
        });
        await sleep(100);
        let balance5 = await web3.eth.getBalance(accounts[5]).toNumber();//bayer
        let balance2 = await web3.eth.getBalance(accounts[2]).toNumber();//owner
        console.log("Balance before make order", "bayer", balance5,"owner", balance2);

        await MarketContract.createOrder(3, {from: accounts[5], value: web3.utils.toWei('14', 'ether')});
        await sleep(500);
        eventContractHendler.stopWatching();

        let _eventApproveOrder = MarketContract.eventApproveOrder();
        _eventApproveOrder.watch(function(error, result) {
            if (!error){
                console.log(result.args);
            } else {
                console.log("Panic!!!! approve", error);
            }

        });
        await sleep(100);
        let beforeBalance2 = balance2;
        let beforeBalance5 = balance5;
        balance5 = await web3.eth.getBalance(accounts[5]).toNumber();
        balance2 = await web3.eth.getBalance(accounts[2]).toNumber();
        let contractBalance = await web3.eth.getBalance(MarketContract.address).toNumber();
        console.log("Balance after make order_", "bayer", balance5,"owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);

        await MarketContract.approveOrder(_OrderID, false, {from: accounts[5]});
        await MarketContract.approveOrder(_OrderID, false, {from: accounts[2]});
        await sleep(500);

        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = await web3.eth.getBalance(accounts[5]).toNumber();
        balance2 = await web3.eth.getBalance(accounts[2]).toNumber();
        contractBalance = await web3.eth.getBalance(MarketContract.address).toNumber();

        console.log("Balance after close order", "bayer", balance5,"owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", web3.fromWei(balance5 - beforeBalance5, 'ether'),
            "Owner", web3.fromWei(balance2 - beforeBalance2, 'ether'), "contract", web3.fromWei(contractBalance, 'ether'));

        await expectRevert.assertion(MarketContract.canselOrder(_OrderID, {from:accounts[2]}));

        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = await web3.eth.getBalance(accounts[5]).toNumber();
        balance2 = await web3.eth.getBalance(accounts[2]).toNumber();

        contractBalance = await web3.eth.getBalance(MarketContract.address).toNumber();

        console.log("Balance after cansel order", "bayer", balance5,"owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", web3.fromWei(balance5 - beforeBalance5, 'ether'),
            "Owner", web3.fromWei(balance2 - beforeBalance2, 'ether'), "contract", web3.fromWei(contractBalance, 'ether'));


    });

// added after 03.02.2020

   // it('getProducts (userAddress)', async function(){
   //      const MarketContract = await MarketPlace.new({from: accounts[0]});
   //      let updatedOrdersList = await initOrders(MarketContract);
   //      //MarketContract.getProducts(0)
   //
   //      await sleep(100);
   //      //console.log("!!!!!!!!!!! MarketPlace.dbFiles = ",MarketContract.getProducts(0));
   //      console.log("sellerFileIDs", MarketContract.getProducts(value: accounts[1], {from: accounts[0]}));
   //  });

});

const sleep = require('util').promisify(setTimeout);
