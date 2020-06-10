
// converts amount of SMR token into token-wei (smallest token units)
function SMR(amount) {
    return web3.toWei(amount, 'ether');
}

// converts amount of SMRE token into token-wei (smallest token units)
function SMRE(amount) {
    return amount * 100;
}

module.exports.SMR=SMR;
module.exports.SMRE=SMRE;