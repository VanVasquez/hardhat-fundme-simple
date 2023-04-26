const { assert, expect } = require('chai');
const { ethers, deployments, getNamedAccounts } = require('hardhat');
const { developmentChains } = require('../../helper.hardhat.config');

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('FundMe', function () {
      let fundMe, mockV3Aggregator, deployer;
      const sendValue = ethers.utils.parseEther('1');
      beforeEach(async () => {
        await deployments.fixture(['all']);
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract('FundMe');
        mockV3Aggregator = await ethers.getContract('MockV3Aggregator');
      });

      describe('constructor', () => {
        it('sets the aggregator addresses correctly', async () => {
          const response = await fundMe.getPriceFeed();
          assert(response, mockV3Aggregator.address);
        });
      });

      describe('fund', () => {
        it("Fails if you don't send enough ETH", async () => {
          await expect(fundMe.fund()).to.be.revertedWith('FundMe__NotEnoughEth');
        });
        it('Updates the amount funded data structure', async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });
        it('Adds funder to array of funders', async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getFunder(0);
          assert.equal(response, deployer);
        });
      });
      describe('withdraw', () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });
        it('withdraws ETH from a single funder', async () => {
          const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
          const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait();
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
          const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });
        it('is allows us to withdraw with multiple funders', async () => {
          const accounts = await ethers.getSigners();
          for (i = 0; i < 6; i++) {
            await fundMe.connect(accounts[i]);
            await fundMe.fund({ value: sendValue });
          }

          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait();
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          console.log(`GasCost: ${gasCost}`);
          console.log(`GasUsed: ${gasUsed}`);
          console.log(`GasPrice: ${effectiveGasPrice}`);

          await expect(fundMe.getFunder(0)).to.be.reverted;
          for (i = 0; i < 6; i++) {
            assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0);
          }
        });
        it('Only allows the owner to withdraw', async () => {
          const accounts = await ethers.getSigners();
          const fundMeConnectedContract = await fundMe.connect(accounts[1]);
          await expect(fundMeConnectedContract.withdraw()).to.be.revertedWith('FundMe__NotOwner');
        });
      });
    });
