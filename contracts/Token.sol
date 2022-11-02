// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20{
    address public owner;
    
    constructor() ERC20("BattleForGiostone", "BFG") {
        owner = msg.sender;
    }

    function initialAllocation(address _to) external{
        _mint(_to, 1000000000000000000000);
    }

}