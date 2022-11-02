// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract EcosystemFundContract is Ownable {

    using SafeERC20 for IERC20;

    uint256 public maxBalance;
    uint256 public balance;
    uint256 public lastUnlockTime = 1665243000 + 90 days;
    
    IERC20 immutable public itoken;


    event TransferSent(address _destAddr,uint _amount);

        constructor(IERC20 _itoken) {
            itoken = _itoken;
       }

    function init() external onlyOwner(){
        if(maxBalance == 0){
            maxBalance = itoken.balanceOf(address(this));
            balance = itoken.balanceOf(address(this));
        }
    }

    function withdraw(address _address, uint256 amount, uint256 timeTemp) external onlyOwner {
        //require(block.timestamp > lastUnlockTime, "Too early for unlocking tokens");
        require(block.timestamp > timeTemp, "Too early for unlocking tokens");
        require(amount > 0 , "Need to request more than 0 BFG");

        balance = itoken.balanceOf(address(this));
        require(balance > 0 , "No more BFG to collect");
    
        if(amount > balance){
            amount = balance;
        }

        balance -= amount;
        
        emit TransferSent(_address,amount);
        itoken.safeTransfer(_address, amount);
    
    }

}