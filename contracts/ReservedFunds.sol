// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ReservedFunds is Ownable {

    using SafeERC20 for IERC20;

    uint256 public maxBalance;
    uint256 public balance;

    address immutable public token;
    IERC20 immutable public itoken;
    
    uint256 public allOwned;
    uint256 constant clif = 180 days;
    uint constant percentage = 556;
    uint constant decimal = 100000;

    mapping(address => bool) public whiteList;
    mapping(address => uint256) public ownedBFG;
    mapping(address => uint256) public lockedBFG;
    mapping(address => uint256) public lastUnlockTime;

    event TransferSent(address indexed _destAddr,uint256 _amount);

        constructor(IERC20 _itoken) {
            token = address(_itoken);
            itoken = _itoken;
       }


    function addWhiteList(address user,uint256 amount) external onlyOwner {
        uint256 amountConverted = amount;
        
        if (maxBalance == 0){
                uint256 _balance = itoken.balanceOf(address(this));
                balance = _balance;
                maxBalance = _balance;
        }

        require(balance > 0,"no BFG available");
        require(amount > 0,"Amount send must be greater than 0");
        require(maxBalance-allOwned >= amountConverted, "not enough BFG available to send.");
        require(ownedBFG[user] == 0, "Already whitelisted");

        allOwned += amountConverted;
        ownedBFG[user] += amountConverted;
        lockedBFG[user] += amountConverted;

        //starting 8.10 17:30
        lastUnlockTime[user] = 1665243000 + clif;

	    whiteList[user] = true;
    }

    function _transferUnlocked(uint256 daysPast, address _receiver) internal{
        
        //tokens for daysPast days
        uint256 calTokens = ownedBFG[_receiver] * daysPast * percentage / decimal;
        
        if(calTokens > lockedBFG[_receiver]){
            calTokens = lockedBFG[_receiver];
        }

        //effect
        balance-=calTokens;
        lockedBFG[_receiver] -= calTokens;
        
        lastUnlockTime[_receiver] = lastUnlockTime[_receiver] + (daysPast * 1 days);

        //transfer
        itoken.safeTransfer(_receiver,calTokens);
        emit TransferSent(_receiver,calTokens);
	}

    function withdraw(uint256 today ,uint256 manualLastUnlockTime) external{
        require(whiteList[msg.sender] == true, "Not WhiteListed");
        require(lockedBFG[msg.sender] > 0,"No Unlocked BFG");
        
        //6 month-cliff, linear daily vesting for 6 months (100% -> 180 days -> 0.556%)
        require(today > manualLastUnlockTime + 1 days, "Too early for unlocking tokens");
        
        //calculate days passed
		//require(block.timestamp > lastUnlockTime[msg.sender] + 1 days, "Too early for unlock"); 
        
        uint256 daysPast = (today - manualLastUnlockTime) / (1 days);
        
        require(daysPast > 0, "Too early for unlock");
        _transferUnlocked(daysPast, msg.sender);
    }

}