// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import './PriceConverter.sol';

error FundMe__NotOwner();
error FundMe__NotEnoughEth();

contract FundMe {
  using PriceConverter for uint256;

  uint256 public constant MINIMUM_USD = 50 * 1e18;
  address private immutable i_owner;
  address[] private s_funders;
  mapping(address => uint256) private s_addressToAmountFunded;
  AggregatorV3Interface private s_priceFeed;

  constructor(address _priceFeedAddress) {
    i_owner = msg.sender;
    s_priceFeed = AggregatorV3Interface(_priceFeedAddress);
  }

  modifier onlyOwner() {
    if (msg.sender != i_owner) revert FundMe__NotOwner();
    _;
  }

  function fund() public payable {
    //This shit uses more gas, like 2000+
    // require(
    //   msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
    //   'Not enough eth'
    // );
    if (!(msg.value.getConversionRate(getPriceFeed()) >= MINIMUM_USD)) {
      revert FundMe__NotEnoughEth();
    }
    s_addressToAmountFunded[msg.sender] += msg.value;
    s_funders.push(msg.sender);
  }

  function withdraw() public onlyOwner {
    for (uint256 i = 0; i < s_funders.length; i++) {
      address funder = s_funders[i];
      s_addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);

    (bool success, ) = i_owner.call{value: address(this).balance}('');
    require(success);
  }

  function cheaperWithdraw() public onlyOwner {
    address[] memory funders = s_funders;
    for (uint256 i = 0; i < funders.length; i++) {
      address funder = funders[i];
      s_addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);
    (bool success, ) = i_owner.call{value: address(this).balance}('');
    require(success);
  }

  function getVersion() public view returns (uint256) {
    return s_priceFeed.version();
  }

  function getOwnder() public view returns (address) {
    return i_owner;
  }

  function getFunder(uint256 index) public view returns (address) {
    return s_funders[index];
  }

  function getAddressToAmountFunded(
    address funder
  ) public view returns (uint256) {
    return s_addressToAmountFunded[funder];
  }

  function getPriceFeed() public view returns (AggregatorV3Interface) {
    return s_priceFeed;
  }
}
