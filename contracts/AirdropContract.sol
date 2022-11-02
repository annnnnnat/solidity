// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AirdropFundContract is Ownable {

    using SafeERC20 for IERC20;

    uint256 public maxBalance;
    uint256 public balance;
    
    IERC20 immutable public itoken;

event TransferSent(address indexed _destAddr,uint _amount);

    constructor(IERC20 _itoken) {
            itoken = _itoken;
    }

    function init() external onlyOwner{
        _initMaxBalance();
    }

    function _initMaxBalance() internal{
        if(maxBalance==0){
            maxBalance = itoken.balanceOf(address(this));
            balance = itoken.balanceOf(address(this));
        }
    }

    function allocate(address to, uint256 amount) external onlyOwner{
        require(amount > 0 , "Need to request more than 0 BFG");
        
        _initMaxBalance();
        
        uint256 newBalance = itoken.balanceOf(address(this));
        balance = newBalance;

        require(balance > 0 , "No more BFG to collect");

        uint256 amountConverted = amount;

        if(amountConverted > balance){
            amountConverted = balance;
        }

        balance -= amountConverted;

        itoken.safeTransfer(to,amountConverted);
        emit TransferSent(to,amountConverted);
    }

}