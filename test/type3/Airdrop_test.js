const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('AirdropFundContract', () => {
    let contract;
    let token;

    async function getContracts(){
        let contractTemp = await ethers.getContractFactory('AirdropFundContract');
        let tokenTemp = await ethers.getContractFactory('Token');

        token = await tokenTemp.deploy();
        contract = await contractTemp.deploy(token.address);

        const [owner, acc1, acc2] = await ethers.getSigners();
        await token.initialAllocation(contract.address);

        return { contract, owner, acc1, acc2, token };
    }

    describe('Deployed', () => {
        it("Should set the right owner", async function () {
            const { contract, owner } = await loadFixture(getContracts);
      
            expect(await contract.owner()).to.equal(owner.address);
        });

        it("Deployment should assign the total supply of tokens to the owner", async function () {
            const [owner] = await ethers.getSigners();
        
            const Token = await ethers.getContractFactory("Token");
        
            const hardhatToken = await Token.deploy();
        
            const ownerBalance = await hardhatToken.balanceOf(owner.address);
            expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
          });
    })

    describe('init', () => {
        it("Should init", async function () {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);
        
            await contract.init();

            expect(await contract.maxBalance()).to.equal(1000000000000000000000n);
        })
    })

    describe('allocate', () => {
        it("Amount is 0", async function () {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);
            
            await expect(contract.allocate(acc1.address, 0)).to.be.revertedWith("Need to request more than 0 BFG") 
        })
        it("Amount is less than balance", async function () {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);
            await contract.allocate(acc1.address, 10000000000000000000n)
            
            expect(await token.balanceOf(acc1.address)).to.equal(10000000000000000000n) 
        })
        it("Amount is more than balance", async function () {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);
            await contract.allocate(acc1.address, 1001000000000000000000n)
            
            expect(await token.balanceOf(acc1.address)).to.equal(1000000000000000000000n) 
        })
    })
})