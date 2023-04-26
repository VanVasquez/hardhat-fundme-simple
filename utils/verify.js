const { run } = require('hardhat');

module.exports = async (address, args) => {
  console.log('Verifying contract...');
  try {
    await run('verify:verify', {
      address: address,
      constructorArguments: args,
    });
  } catch (error) {
    if (error.message.toLowerCase().includes('already verified')) {
      console.log('Already Verified');
    } else {
      console.error(error);
    }
  }
};
