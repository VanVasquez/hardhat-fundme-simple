const { network } = require('hardhat');
const { networkConfig, developmentChains } = require('../helper.hardhat.config');
const verify = require('../utils/verify');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { log, deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let ethUsdPriceFeedAddress;
  if (chainId === 31337) {
    const mockV3Aggregator = await get('MockV3Aggregator');
    ethUsdPriceFeedAddress = mockV3Aggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed'];
  }
  log('-----------------------------------------------------------------------------------');
  log('Deploying Fundme and waiting for confirmations');
  const fundMe = await deploy('FundMe', {
    from: deployer,
    args: [ethUsdPriceFeedAddress],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`FundMe deployed at: ${fundMe.address}`);
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(fundMe.address, [ethUsdPriceFeedAddress]);
  }
  log('-----------------------------------------------------------------------------------');
};

module.exports.tags = ['all', 'fundme'];
