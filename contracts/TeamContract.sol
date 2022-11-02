// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TeamContract is Ownable {
    using SafeERC20 for IERC20;

    uint256 public maxBalance;
    uint256 public balance;
    uint256 public lastUnlockTime = 1665243000;

    IERC20 immutable public itoken;

    address public bfgTokenAddress;

    mapping(address => uint256) public shares;
    mapping(address => uint256) public balances;

    address[] public members;

    uint256 public vestingCycles;

    uint256 public totalShares = 0;
    uint8 public memberLength = 7;

    uint256 constant clif = 360 days;
    uint constant percentage = 104;
    uint constant decimal = 100000;

event TransferSent(address indexed _destAddr,uint _amount);


       constructor(uint256 share,IERC20 _itoken) {
            
            itoken = _itoken;
            bfgTokenAddress = address(_itoken);
            
            _addMember(owner(), share);
       }

    modifier onlyMember() {
         require(shares[msg.sender] > 0,"Only members");
        _;
    }

    function init() public onlyOwner{
        if(maxBalance==0){
            maxBalance = itoken.balanceOf(address(this));
            balance = itoken.balanceOf(address(this));
        }
    }

    function addMember(address member,uint256 share) external onlyOwner{
        
        require(vestingCycles == 0, "Changes not allowed after vesting starts");
        require(share > 0 , "Shares must be positive numbers");
        require(shares[member] == 0, "Member already added");
        require(members.length < memberLength,"All team members added");
        require(share+totalShares <= 100, "Share percentage exceeds 100%");
        
        _addMember(member, share);
    }

    //withdraw tokens 
    function claim() external onlyMember{
        uint256 temp = balances[msg.sender];

        require(temp > 0,"Not enough unlocked tokens");
        
        balances[msg.sender] = 0;

        itoken.safeTransfer(msg.sender,temp);
        emit TransferSent(msg.sender,temp);
    }

    //unlock vested tokens if ready
    function unlock(uint256 tempCliff) external onlyMember{ 
        require(totalShares == 100, "Need 100% shares added to start Unlock");
        
        if (maxBalance == 0){
            maxBalance = itoken.balanceOf(address(this));
        }

        //12 months cliff
        if (vestingCycles == 0){
            //require(block.timestamp > lastUnlockTime + clif,"Too early for unlocking tokens");
            
            require(block.timestamp > tempCliff,"Too early for unlocking tokens");
            lastUnlockTime = lastUnlockTime + clif;
            vestingCycles ++;
            return;
        }

        uint256 newBalance = itoken.balanceOf(address(this));
        balance = newBalance;

        // unlock 0,104% linear daily 32 months (100%) (960 days)
        //require(block.timestamp > lastUnlockTime + 1 days, "Too early for unlocking tokens");
        
        require(block.timestamp > tempCliff + 1 days, "Too early for unlocking tokens");

        //uint256 daysPast = (block.timestamp - lastUnlockTime) / (1 days);'

        uint256 daysPast = (block.timestamp - tempCliff) / (1 days);
        
        require(daysPast > 0, "Too early for unlock");
        
        _calculatePending(daysPast);
        
    }
    
    function _calculatePending(uint256 daysPast) public{
            require(balance > 0, "No more tokens for unlock");
            if(daysPast > 0){
                uint256 newTokens = maxBalance * daysPast * percentage / decimal;
                if(newTokens > balance){
                    newTokens = balance;
                }
                uint256 memberLen = members.length;
                for (uint8 i = 0; i < memberLen; i++) {  //for loop example dont need /100
                    uint256 memberTokens = shares[members[i]] * newTokens / 100; 
                    balances[members[i]] += memberTokens;
                }
                balance -= newTokens;
                lastUnlockTime = lastUnlockTime + (daysPast * 1 days);
                vestingCycles += daysPast;
            }
            
    }

    function _addMember(address member,uint256 share) internal{
        shares[member] = share;
        totalShares += share;
        members.push(member);
    }
    

}