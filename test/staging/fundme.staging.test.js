const { ethers, getNamedAccounts, network } = require('hardhat');
const { developmentChains } = require('../../helper.hardhat.config');
const { assert } = require('chai');

developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', () => {
      let fundMe, deployer;
      const sendValue = ethers.utils.parseEther('0.1');
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract('FundMe', deployer);
      });

      it('allows people to fund and withdraw', async () => {
        const fundResponse = await fundMe.fund({ value: sendValue });
        await fundResponse.wait(1);
        const withdrawResponse = await fundMe.withdraw();
        await withdrawResponse.wait(1);

        const endingBalance = await fundMe.provider.getBalance(fundMe.address);
        console.log(endingBalance.toString() + ' should equal 0, running assert equal...');
        assert.equal(endingBalance.toString, '0');
      });
    });
