const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('TeamContract', () => {
    let contract;
    let token;

    async function getContracts(){
        let contractTemp = await ethers.getContractFactory('TeamContract');
        let tokenTemp = await ethers.getContractFactory('Token');

        token = await tokenTemp.deploy();
        contract = await contractTemp.deploy(25, token.address);

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

        it("Deployment should assign the share of tokens to the owner", async function () {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            expect(await contract.shares(owner.address)).to.equal(25);
            expect(await contract.totalShares()).to.equal(25);
        })
    })
    
    describe('init', () => {
        it("Should init", async function () {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);
        
            await contract.init();

            expect(await contract.maxBalance()).to.equal(1000000000000000000000n);
        })
    })

    describe('addMember', () => {
        it("Should revert if share is 0", async function () {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await expect(contract.addMember(acc1.address, 0)).to.be.revertedWith("Shares must be positive numbers") 
        })

        it("Should revert if same member is added", async function () {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await expect(contract.addMember(owner.address, 10)).to.be.revertedWith("Member already added") 
        })

        it("Should revert if more than 7 member are added", async function () {
            const { contract } = await loadFixture(getContracts);

            const [owner, acc1, acc2 ,acc3, acc4, acc5, acc6, acc7, acc8] = await ethers.getSigners();
            
            await contract.addMember(acc1.address, 10)
            await contract.addMember(acc2.address, 10)
            await contract.addMember(acc3.address, 10)
            await contract.addMember(acc4.address, 10)
            await contract.addMember(acc5.address, 10)
            await contract.addMember(acc6.address, 10)
            await expect(contract.addMember(acc7.address, 10)).to.be.revertedWith("All team members added") 
        })

        it("Should revert if more than totalShare 100% is passed", async function () {

            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await contract.addMember(acc1.address, 40)
            await expect(contract.addMember(acc2.address, 70)).to.be.revertedWith("Share percentage exceeds 100%") 
        })
    })

    describe('unlock', () => {
        it("Should revert if not 100% shares are given", async function() {
            const { contract } = await loadFixture(getContracts);

            const [owner, acc1, acc2] = await ethers.getSigners();
            
            await contract.addMember(acc1.address, 70)
            await expect(contract.unlock(1665243000)).to.be.revertedWith("Need 100% shares added to start Unlock")
        })
        it("Should revert if clif is not passed", async function() {
            const { contract } = await loadFixture(getContracts);

            const [owner, acc1, acc2] = await ethers.getSigners();
            
            await contract.addMember(acc1.address, 70)
            await contract.addMember(acc2.address, 5)
            await expect(contract.unlock(1759437462)).to.be.revertedWith("Too early for unlocking tokens")
        })

        it("For 1 day unlock", async function() {
            const { contract } = await loadFixture(getContracts);
            await contract.init();
            const [owner, acc1, acc2] = await ethers.getSigners();
            
            await contract.addMember(acc1.address, 70)
            await contract.addMember(acc2.address, 5)

            await contract._calculatePending(1);

            expect(await contract.balances(owner.address)).to.equal(260000000000000000n)
            expect(await contract.balances(acc1.address)).to.equal(728000000000000000n)
            expect(await contract.balances(acc2.address)).to.equal(52000000000000000n)
            expect(await contract.vestingCycles()).to.equal(1)
            expect(await contract.lastUnlockTime()).to.equal(1665329400)
        })

        it("For 1 day + 9 days unlock", async function() {
            const { contract } = await loadFixture(getContracts);
            await contract.init();
            const [owner, acc1, acc2] = await ethers.getSigners();
            
            await contract.addMember(acc1.address, 70)
            await contract.addMember(acc2.address, 5)

            await contract._calculatePending(1);
            await contract._calculatePending(9);

            expect(await contract.balances(owner.address)).to.equal(2600000000000000000n)
            expect(await contract.balances(acc1.address)).to.equal(7280000000000000000n)
            expect(await contract.balances(acc2.address)).to.equal(520000000000000000n)
            expect(await contract.vestingCycles()).to.equal(10)
            expect(await contract.lastUnlockTime()).to.equal(1666107000)
        })

        it("For 959 days unlock", async function() {
            const { contract } = await loadFixture(getContracts);
            await contract.init();
            const [owner, acc1, acc2] = await ethers.getSigners();
            
            await contract.addMember(acc1.address, 70)
            await contract.addMember(acc2.address, 5)

            await contract._calculatePending(959);

            expect(await contract.balances(owner.address)).to.equal(249340000000000000000n)
            expect(await contract.balances(acc1.address)).to.equal(698152000000000000000n)
            expect(await contract.balances(acc2.address)).to.equal(49868000000000000000n)
            expect(await contract.vestingCycles()).to.equal(959)
            expect(await contract.lastUnlockTime()).to.equal(1748100600)
        })
    })

    describe('claim', () => {
        it('Should fail if 0 balance', async function() {
            const { contract } = await loadFixture(getContracts);

            const [owner, acc1, acc2] = await ethers.getSigners();

            expect(contract.claim()).to.be.revertedWith('Not enough unlocked tokens');
        })

        it('Should claim if all unlocked', async function(){
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);
            
            await contract.init();
            
            await contract.addMember(acc1.address, 70)
            await contract.addMember(acc2.address, 5)

            await contract._calculatePending(962);

            await contract.claim();

            expect(await token.balanceOf(owner.address)).to.equal(250000000000000000000n)
            expect(await contract.balances(acc1.address)).to.equal(700000000000000000000n)
            expect(await contract.balances(acc2.address)).to.equal(50000000000000000000n)
        })
    })
})