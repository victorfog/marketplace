require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      websockets: true
    },

    rinkeby: {  // testnet
      host: "localhost",
      port: 8547,
      network_id: 4,
      websockets: true
    },

    mainnet: {
      host: "localhost",
      port: 8549,
      network_id: 1,
      gasPrice: 10 * 1e9,
      websockets: true
    }
  },

  compilers: {
    solc: {
      version: '0.6.9', // A version or constraint - Ex. "^0.5.0"
      docker: true, // Use a version obtained through docker
      parser: "solcjs",  // Leverages solc-js purely for speedy parsing
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
