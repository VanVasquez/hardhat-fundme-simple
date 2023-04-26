const { network } = require('hardhat');

const args = {
  decimal: 8,
  initial: 200000000000,
};

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { log, deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  if (chainId === 31337) {
    log('Local network detected...');
    log('Deploying mocks');
    await deploy('MockV3Aggregator', {
      contract: 'MockV3Aggregator',
      from: deployer,
      args: Object.values(args),
      log: true,
    });
    log('Mocks Deployed!');
    log('------------------------------------------------');
    log("You are deploying to a local network, you'll need a local network running to interact");
    log('Please run `npx hardhat console` to interact with the deployed smart contracts!');
    log('------------------------------------------------');
  }
};

module.exports.tags = ['all', 'mocks'];
