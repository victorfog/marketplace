'use strict';
const { expect } = require('chai');

//для тестов все в wei !!!!! платим в eth

const {expectRevert} = require('@openzeppelin/test-helpers');
//import {assertBigNumberEqual} from "./helpers/asserts";

const MarketPlace = artifacts.require("MarketPlace.sol");

contract('MarketPlace', function (accounts) {
    let fileList = [
        {
            Name: "Box",
            Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1",
            SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A1",
            Price: web3.utils.toWei("11", 'ether'),
            Description: "its my first model",
            Sender: {from: accounts[1]}
        },
        {
            Name: "Box2",
            Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA2",
            SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A2",
            Price: web3.utils.toWei("12", 'ether'),
            Description: "its my first model2",
            Sender: {from: accounts[1]}
        },
        {
            Name: "Box3",
            Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3",
            SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A3",
            Price: web3.utils.toWei("13", 'ether'),
            Description: "its my first model2",
            Sender: {from: accounts[1]}
        },
        {
            Name: "Box4",
            Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4",
            SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A4",
            Price: web3.utils.toWei("14", 'ether'),
            Description: "its my first model",
            Sender: {from: accounts[2]}
        },
        {
            Name: "Box5",
            Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5",
            SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A5",
            Price: web3.utils.toWei("15", 'ether'),
            Description: "its my first model1",
            Sender: {from: accounts[1]}
        },
        {
            Name: "Box6",
            Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6",
            SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A6",
            Price: web3.utils.toWei("16", 'ether'),
            Description: "its my first model1",
            Sender: {from: accounts[2]}
        },
        {
            Name: "Box7",
            Hash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7",
            SwarmHash: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00A7",
            Price: web3.utils.toWei("17", 'ether'),
            Description: "its my first model",
            Sender: {from: accounts[1]}
        },
    ];

    // web3.utils.toWei(amount, 'ether')

    async function initOrders(MarketContract) {
        let updatedFileList = fileList.slice();
        let i = 0;
        let j = 0;

        MarketContract.contract.events.NewFile()
            .on("data", (result) => {
                updatedFileList[j].FileID = Number(result.returnValues._FileID);
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

    it('Create 7 model, 2 users', async function () {
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

    it('Create Order', async function () {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        await MarketContract.createOrder(1, {from: accounts[4], value: web3.utils.toWei('12', 'ether')});
    });

    it('Create order for non-existent file', async function () {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);
        await expectRevert.assertion(MarketContract.createOrder(9, {
            from: accounts[4],
            value: Number(web3.utils.toWei('30', 'ether'))
        }));
    });

    it('Create Order. Too low price. Should fail.', async function () {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        await expectRevert(MarketContract.createOrder(1, {
            from: accounts[4],
            value: web3.utils.toWei('2', 'ether')
        }), "given money should be greater than the price");
    });

    it('Create Order. Witch wrong file. .', async function () {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        await expectRevert.assertion(MarketContract.createOrder(10, {
            from: accounts[4],
            value: web3.utils.toWei('20', 'ether')
        }));
    });

    async function getOrderID(MarketContract, fromBlock) {
        let _OrderID;
        await MarketContract.contract.getPastEvents(`EventCreateOrder`, {fromBlock: fromBlock}, function (error, result) {

            if (error != null) {
                // fixme падать
                console.log("PANIC!!!!", error);

            }
            if (Object.keys(result).length === 0) {
                console.log(`result.keys a empty`);
            }

            _OrderID = Number(result[0].returnValues._orderID);
        });
        return _OrderID;
    }

    it('approveOrder', async function () {
        console.log(`____________________________test_approveOrder_start__________________________________________`);
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        const buyerIndex = 5;
        const ownerIndex = 2;

        let balanceBuyer = Number(await web3.eth.getBalance(accounts[buyerIndex]));
        let balanceOwner = Number(await web3.eth.getBalance(accounts[ownerIndex]));
        let contractBalance = Number(await web3.eth.getBalance(MarketContract.address));

        console.log("*********", MarketContract.address);

        // Создание заказа - CreateOrder
        let currentBlock = await web3.eth.getBlock(`latest`); //get block number
        let beforeBalanceOwner = balanceOwner;
        let beforeBalanceBuyer = balanceBuyer;
        let beforeContractBalance = contractBalance;
        let depositInOrder;
        let filePriseInfo;

        const payedForOrder = Number(web3.utils.toWei('14', 'ether'));
        let receipt = await MarketContract.createOrder(3, {from: accounts[buyerIndex], value: payedForOrder});

        // todo: check for EventCreateOrder
        console.log("yyyyy TX createOrder", receipt);

        let _OrderID = await getOrderID(MarketContract, currentBlock.number);
        let OrderInfo =  await MarketContract.getOrderInFog(_OrderID); //в _orderInfo FixPrise,BayerAddress,OwnerApprove,BayerApprove и еще что-то

        depositInOrder = OrderInfo.FixPrise;

        let createOrderGasSpent = await spentGasInEther(receipt); // accounts[5] потратил gas на транзакцию, в ether


        // Проверки балансов после CreateOrder
        balanceBuyer = Number(await web3.eth.getBalance(accounts[buyerIndex]));
        balanceOwner = Number(await web3.eth.getBalance(accounts[ownerIndex]));

        let balanceBuyerWithGas = createOrderGasSpent + balanceBuyer + Number(web3.utils.toWei('14', 'ether'));
        assert.isOk(balanceBuyerWithGas == beforeBalanceBuyer, `a new balance for 5th-bayer account should be less ${balanceBuyerWithGas - beforeBalanceBuyer}. gas cost ${createOrderGasSpent}`);
        assert.isOk(balanceOwner == beforeBalanceOwner, `a new balance for 2th-owner account should be the same ${balanceOwner} ${beforeBalanceOwner}`);
        assert.isOk(beforeContractBalance == contractBalance, 'a new balance for ContractBalance account should be less' + beforeContractBalance + contractBalance);
        assert.isOk(contractBalance === 0, 'ContractBalance should be = 0: ' + contractBalance);
        assert.isOk(depositInOrder == payedForOrder, 'Deposit must be biger 0');

        // Подтверждение заказа Покупателем
        beforeBalanceOwner = balanceOwner;
        beforeBalanceBuyer = balanceBuyer;
        beforeContractBalance = contractBalance;

        receipt = await MarketContract.approveOrder(_OrderID, true, {from: accounts[buyerIndex]});
        const approveOrderGasSpent = await spentGasInEther(receipt); // accounts[5] потратил gas на транзакцию, в ether
        console.log("yyyyy TX approveOrder", approveOrderGasSpent);

        //--fixme-- нужно переписать обработку events на обработку типа ((await MarketContract.contract.getPastEvents(`EventCreateOrder`, {fromBlock: fromBlock}, function (error, result) {))
        await MarketContract.contract.getPastEvents(`eventApproveOrder`, {fromBlock: currentBlock.number},function (error, result) {
            if (error != null){
                console.log("cccc Panic!!!! approve", error);
            }
            if (result != null){
                console.log(Object.keys(result[0].returnValues), `+++---`)
            }
        })
        // await MarketContract.contract.events.eventApproveOrder()//fixme !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        //     .on("data", (result) => {
        //         console.log("cccc", result.args);
        //     })
        //     .on("error", (error) => {
        //         console.log("cccc Panic!!!! approve", error);
        //     });

        // Проверки балансов после approveOrder Покупателя
        const balanceBuyer3 = Number(await web3.eth.getBalance(accounts[buyerIndex]));
        const balanceOwner3 = Number(await web3.eth.getBalance(accounts[ownerIndex]));
//todo balance 2
        assert.isOk(balanceBuyer+approveOrderGasSpent == beforeBalanceBuyer, 'a new balance for 5th-bayer account should be less:' +` Balance5 is = `+ balanceBuyer +` beforeBalance5 is = `+ beforeBalanceBuyer + " got difference " + (beforeBalanceBuyer+approveOrderGasSpent-balanceBuyer));
        assert.isOk(balanceOwner == beforeBalanceOwner, 'a new balance for 2th-owner account should be the same:' + ` Balance2 is = ` + balanceOwner + ` BeforeBalance2 is = ` + beforeBalanceOwner);//todo
        assert.isOk(beforeContractBalance == contractBalance, 'a new balance for ContractBalance account should be less: ' + `ContractBalance is = ` + contractBalance + `, BeforeContractBalance is = ` + beforeContractBalance);

        // Подтверждение заказа Продавцом
        const beforeBalanceOwner4 = Number(await web3.eth.getBalance(accounts[buyerIndex]));
        const beforeBalanceBuyer4 = Number(await web3.eth.getBalance(accounts[ownerIndex]));
        await MarketContract.approveOrder(_OrderID, true, {from: accounts[ownerIndex]});
        await MarketContract.contract.events.eventApproveOrder()
            .on("data", (result) => {
                console.log(result.args);
            })
            .on("error", (error) => {
                console.log("Panic!!!! approve", error);
            });

        // Проверки балансов после approveOrder Продавцом
        const balanceBuyer4 = Number(await web3.eth.getBalance(accounts[buyerIndex]));
        const balanceOwner4 = Number(await web3.eth.getBalance(accounts[ownerIndex]));
        const contractBalance4 = Number(await web3.eth.getBalance(MarketContract.address));

        console.log('Type of balanceO ',typeof(beforeBalanceBuyer4),'XXXUUU1' );

        assert.isOk(balanceBuyer4 < beforeBalanceBuyer4, 'a new balance for 5th-bayer account should be less.' +` BalanceBuyer is =`+ balanceBuyer4 +`beforeBalanceBuyer is =`+ beforeBalanceBuyer4);
        assert.isOk(balanceOwner4 > beforeBalanceOwner4, 'a new balance for 2th-owner account should be the same.' + ` BalanceOwner is =` + balanceOwner4 + ` BeforeBalanceOwner is =` + beforeBalanceOwner4);
        assert.isOk(contractBalance4 == 0, 'a new balance for ContractBalance account should be less: ' + `ContractBalance is = ` + contractBalance4 + `, BeforeContractBalance is = ` + 0);

        console.log(`____________________________test_approveOrder_end__________________________________________`);
    });


    it('approveOrder test to err', async function () {
        console.log(`____________________________approveOrder_test_to_err_start__________________________________________`);
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        let _OrderID;

        MarketContract.contract.events.EventCreateOrder()
            .on("data", (result) => {
                _OrderID = Number(result.returnValues._orderID);
                console.log(_OrderID);
            })
            .on("error", (error) => {
                console.log("PANIC!!!!", error);
            });

        await sleep(1000);
        let balance5 = Number(await web3.eth.getBalance(accounts[5]));

        let balance2 = Number(await web3.eth.getBalance(accounts[2]));

        console.log("Balance before make order", "bayer", balance5, "owner", balance2);

        //
        //todo Вставить проверки балансов !!!
        //


        await MarketContract.createOrder(3, {from: accounts[5], value: web3.utils.toWei('14', 'ether')});
        await sleep(500);

        //eventContractHendler.stopWatching();

        MarketContract.contract.events.eventApproveOrder()
            .on("data", (result) => {
                console.log(result.args);
            })
            .on("error", (error) => {
                console.log("Panic!!!! approve", error);
            });

        await sleep(100);
        let beforeBalance2 = balance2;
        let beforeBalance5 = balance5;
        balance5 = Number(await web3.eth.getBalance(accounts[5]));
        balance2 = Number(await web3.eth.getBalance(accounts[2]));

        let contractBalance = Number(await web3.eth.getBalance(MarketContract.address));

        console.log("Balance after make order_", "bayer", balance5, "owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);

        await MarketContract.approveOrder(_OrderID, true, {from: accounts[5]});
        await MarketContract.approveOrder(_OrderID, false, {from: accounts[2]});
        await expectException(MarketContract.approveOrder(_OrderID, true, {from: accounts[4]}), "wrong buyer or seller address");

        await sleep(500);

        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = Number(await web3.eth.getBalance(accounts[5]));
        balance2 = Number(await web3.eth.getBalance(accounts[2]));

        contractBalance = await Number(web3.eth.getBalance(MarketContract.address));

        console.log("Balance after close order", "bayer", balance5, "owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
    });

    it('CenselOrder if all ok', async function () {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        let _OrderID;

        MarketContract.contract.events.EventCreateOrder()
            .on("data", (result) => {
                _OrderID = Number(result.returnValues._orderID);
            })
            .on("error", (error) => {
                console.log("PANIC!!!!", error);
            });

        await sleep(100);
        let balance5 = Number(await web3.eth.getBalance(accounts[5]));//bayer
        let balance2 = Number(await web3.eth.getBalance(accounts[2]));//owner

        console.log("Balance before make order", "bayer", balance5, "owner", balance2);

        await MarketContract.createOrder(3, {from: accounts[5], value: web3.utils.toWei('14', 'ether')});
        await sleep(500);
        //eventContractHendler.stopWatching();

        MarketContract.contract.events.eventApproveOrder()
            .on("data", (result) => {
                console.log(result.args);
            })
            .on("error", (error) => {
                console.log("Panic!!!! approve", error);
            });

        await sleep(100);
        let beforeBalance2 = balance2;
        let beforeBalance5 = balance5;
        balance5 = Number(await web3.eth.getBalance(accounts[5]));
        balance2 = Number(await web3.eth.getBalance(accounts[2]));
        let contractBalance = Number(await web3.eth.getBalance(MarketContract.address));

        console.log("Balance after make order_", "bayer", balance5, "owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);

        //await MarketContract.approveOrder(_OrderID, false, {from: accounts[5]});
        //await MarketContract.approveOrder(_OrderID, false, {from: accounts[2]});
        await sleep(500);

        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = Number(await web3.eth.getBalance(accounts[5]));
        balance2 = Number(await web3.eth.getBalance(accounts[2]));

        contractBalance = Number(await web3.eth.getBalance(MarketContract.address));

        console.log("Balance after close order", "bayer", balance5, "owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer",balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract",contractBalance);

        await MarketContract.canselOrder(_OrderID, {from: accounts[5]});
        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = await Number(web3.eth.getBalance(accounts[5]));
        balance2 = await Number(web3.eth.getBalance(accounts[2]));
        contractBalance = Number(await web3.eth.getBalance(MarketContract.address));

        console.log("Balance after cansel order", "bayer", balance5, "owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);


    });

    it('CenselOrder if a owner file send True', async function () {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        let _OrderID;

        MarketContract.contract.events.EventCreateOrder()
            .on("data", (result) => {
                _OrderID = Number(result.returnValues._orderID);
                console.log(_OrderID);
            })
            .on("error", (error) => {
                console.log("PANIC!!!!", error);
            });

        await sleep(100);
        let balance5 = Number(await web3.eth.getBalance(accounts[5]));
        let balance2 = Number(await web3.eth.getBalance(accounts[2]));
        console.log("Balance before make order", "bayer", balance5, "owner", balance2);

        await MarketContract.createOrder(3, {from: accounts[5], value: web3.utils.toWei('14', 'ether')});
        await sleep(500);

        // fixme прочитать и попробовать event once
        MarketContract.contract.events.eventApproveOrder()
            .on("data", (result) => {
                console.log(result.args);
            })
            .on("error", (error) => {
                // fixme надо падать тест зпт если случилась ошибка
                console.log("Panic!!!! approve", error);
            });

        await sleep(100);
        let beforeBalance2 = balance2;
        let beforeBalance5 = balance5;
        balance5 = Number(await web3.eth.getBalance(accounts[5]));
        balance2 = Number(await web3.eth.getBalance(accounts[2]));
        let contractBalance = Number(await web3.eth.getBalance(MarketContract.address));

        console.log("Balance after make order_", "bayer", balance5, "owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);

// test from 1 if owner send true! ***
        await MarketContract.approveOrder(_OrderID, false, {from: accounts[5]});
        await MarketContract.approveOrder(_OrderID, true, {from: accounts[2]});
        await sleep(500);

        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = Number(await web3.eth.getBalance(accounts[5]));
        balance2 = Number(await web3.eth.getBalance(accounts[2]));
        contractBalance = Number(await web3.eth.getBalance(MarketContract.address));

        // fixme проверить на NaN значения балансов
        console.log("Balance after close order", "bayer", balance5, "owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);

        await expectException(MarketContract.canselOrder(_OrderID, {from: accounts[5]}), "the order is approved by owner");


        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = Number(await web3.eth.getBalance(accounts[5]));
        balance2 = Number(await web3.eth.getBalance(accounts[2]));
        contractBalance = Number(await web3.eth.getBalance(MarketContract.address));

        console.log("Balance after cansel order", "bayer", balance5, "owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
// test from 1 if owner send true! ***


    });

    it('CenselOrder if close order not a bayer', async function () {
        const MarketContract = await MarketPlace.new({from: accounts[4]});
        let updatedOrdersList = await initOrders(MarketContract);

        let _OrderID;

        MarketContract.contract.events.EventCreateOrder()
            .on("data", (result) => {
                _OrderID = Number(result.returnValues._orderID);
                console.log(_OrderID);
            })
            .on("error", (error) => {
                console.log("PANIC!!!!", error);
            });

        await sleep(100);
        let balance5 = Number(await web3.eth.getBalance(accounts[5]));//bayer
        let balance2 = Number(await web3.eth.getBalance(accounts[2]));//ownet
        console.log("Balance before make order", "bayer", balance5, "owner", balance2);

        await MarketContract.createOrder(3, {from: accounts[5], value: web3.utils.toWei('14', 'ether')});
        await sleep(500);
        //eventContractHendler.stopWatching();

        MarketContract.contract.events.eventApproveOrder()
            .on("data", (result) => {
                console.log(result.args);
            })
            .on("error", (error) => {
                console.log("Panic!!!! approve", error);
            });

        await sleep(100);
        let beforeBalance2 = balance2;
        let beforeBalance5 = balance5;
        balance5 = Number(await web3.eth.getBalance(accounts[5]));
        balance2 = Number(await web3.eth.getBalance(accounts[2]));
        contractBalance = Number(await web3.eth.getBalance(MarketContract.address));
        console.log("Balance after make order_", "bayer", balance5, "owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);

        await MarketContract.approveOrder(_OrderID, false, {from: accounts[5]});
        await MarketContract.approveOrder(_OrderID, false, {from: accounts[2]});
        await sleep(500);

        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = Number(await web3.eth.getBalance(accounts[5]));
        balance2 = Number(await web3.eth.getBalance(accounts[2]));
        contractBalance = Number(await web3.eth.getBalance(MarketContract.address));

        console.log("Balance after close order", "bayer", balance5, "owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract",contractBalance);

        await expectException(MarketContract.canselOrder(_OrderID, {from: accounts[2]}), "called by not the buyer");

        beforeBalance2 = balance2;
        beforeBalance5 = balance5;
        balance5 = Number(await web3.eth.getBalance(accounts[5]));
        balance2 = Number(await web3.eth.getBalance(accounts[2]));
        let contractBalance = Number(await web3.eth.getBalance(MarketContract.address));

        console.log("Balance after cansel order", "bayer", balance5, "owner", balance2);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
        //console.log(`web3 version is `,web3.version);
        //console.log(`Type provider`,web3.currentProvider);
    });
// test rewrite to promise -------------------------------------------------------------------
//     it('approveOrder-repeat section', function () {
//         const MarketContract = await MarketPlace.new({from: accounts[4]});
//         let updatedOrdersList = await initOrders(MarketContract);
//
//         let _OrderID;
//
//         console.log("@@@", MarketContract.contract.events);
//         await MarketContract.contract.events.EventCreateOrder({}, function (error, result) {
//             if (error != null) {
//                 // fixme падать
//                 console.log("PANIC!!!!", error);
//             }
//
//             _OrderID = Number(result.returnValues._orderID);
//             console.log(_OrderID, `+++++++++2`);
//         });
//
//         console.log(_OrderID, `+++++++++1`);  // fixme не видно _OrderID заставить ожидать
//
//         let balance5 = Number(await web3.eth.getBalance(accounts[5]));
//
//         let balance2 = Number(await web3.eth.getBalance(accounts[2]));
//
//         console.log("Balance before make order", "bayer", balance5, "owner", balance2);
//
//         await MarketContract.createOrder(3, {from: accounts[5], value: web3.utils.toWei('14', 'ether')});
//
//         await MarketContract.contract.events.eventApproveOrder()
//             .on("data", (result) => {
//                 console.log(result.args);
//             })
//             .on("error", (error) => {
//                 console.log("Panic!!!! approve", error);
//             });
//
//         let beforeBalance2 = balance2;
//         let beforeBalance5 = balance5;
//         balance5 = Number(await web3.eth.getBalance(accounts[5]));
//         balance2 = Number(await web3.eth.getBalance(accounts[2]));
//
//         let contractBalance = Number(await web3.eth.getBalance(MarketContract.address));
//
//         console.log("Balance after make order_", "bayer", balance5, "owner", balance2);
//         console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
//
//         await MarketContract.approveOrder(_OrderID, true, {from: accounts[5]});
//         await MarketContract.approveOrder(_OrderID, true, {from: accounts[2]});
//
//         beforeBalance2 = balance2;
//         beforeBalance5 = balance5;
//         balance5 = Number(await web3.eth.getBalance(accounts[5]));
//         balance2 = Number(await web3.eth.getBalance(accounts[2]));
//
//
//         contractBalance = await Number(web3.eth.getBalance(MarketContract.address));
//
//         console.log("Balance after close order", "bayer", balance5, "owner", balance2);
//         console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
//         console.log("Dif balanse:", "Bayer", balance5 - beforeBalance5, "Owner", balance2 - beforeBalance2, "contract", contractBalance);
//         console.log(`________________________________________________________________________`);
//     });
//


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

async function expectException (promise, expectedError) {
    try {
        await promise;
    } catch (error) {
        if (error.message.indexOf(expectedError) === -1) {
            // When the exception was a revert, the resulting string will include only
            // the revert reason, otherwise it will be the type of exception (e.g. 'invalid opcode')
            const actualError = error.message.replace(
                /Returned error: VM Exception while processing transaction: (revert )?/,
                '',
            );
            expect(actualError).to.equal(expectedError, 'Wrong kind of exception received');
        }
        return;
    }

    expect.fail('Expected an exception but none was received');
}

async function spentGasInEther(receipt) {
    const gasUsed = receipt.receipt.gasUsed;
    const tx = await web3.eth.getTransaction(receipt.tx);
    const gasPrice = tx.gasPrice;
    console.log("==== gas price", gasPrice, Number(gasPrice) * gasUsed);
    return Number(gasPrice) * gasUsed;
}
