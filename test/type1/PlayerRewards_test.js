const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('PlayerRewards', () => {
    let contract;
    let token;

    async function getContracts(){
        let contractTemp = await ethers.getContractFactory('PlayerRewards');
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

    describe('addWhiteList', () => {
        it("Should add to Whitelist", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            let temp = await contract.allOwned();
            await contract.addWhiteList(acc1.address, 10000000000000000000n);
            
            expect(await contract.ownedBFG(acc1.address)).to.equal(10000000000000000000n)
            expect(await contract.lockedBFG(acc1.address)).to.equal(10000000000000000000n)
            expect(await contract.whiteList(acc1.address)).to.equal(true)
            expect(await contract.allOwned()).to.equal(temp + 10000000000000000000n)
            expect(await contract.lastUnlockTime(acc1.address)).to.equal(1673019000)
        })

        it("Should not add the same address twice", async function(){
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);
            await contract.addWhiteList(acc1.address, 10000000000000000000n);

            await expect(contract.addWhiteList(acc1.address, 10000000000000000000n)).to.be.revertedWith("Already whitelisted")
        })

        it("Should not give whitelist if balance is 0", async function() {
            let contractTemp = await ethers.getContractFactory('AdvisorsContract');
            
            contract = await contractTemp.deploy(token.address);

            const [owner, acc1, acc2] = await ethers.getSigners();

            await expect(contract.addWhiteList(acc1.address, 10000000000000000000n)).to.be.revertedWith("no BFG available");
        })

        it("Should not pass if amount is greater than maxBalance", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await expect(contract.addWhiteList(acc1.address, 1000000000000000000000000000n)).to.be.revertedWith("not enough BFG available to send.");
        })

        it("Should not pass if amount is greater than maxBalance", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await expect(contract.addWhiteList(acc1.address, 1000000000000000000000000000n)).to.be.revertedWith("not enough BFG available to send.");
        })

        it("Should not pass if amount is greater than allOwned", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await contract.addWhiteList(acc1.address, 90000000000000000000n)
            expect(await contract.addWhiteList(acc2.address, 20000000000000000000n)).to.be.revertedWith("not enough BFG available to send.");
        })

        it("Should pass if amount is less than allOwned", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await contract.addWhiteList(acc1.address, 90000000000000000000n)
            await contract.addWhiteList(acc2.address, 10000000000000000000n)
            expect(await contract.ownedBFG(acc2.address)).to.equal(10000000000000000000n)
        })

        it("Should pass with decimals", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await contract.addWhiteList(acc1.address, 00000000010000000000);

            expect(await contract.ownedBFG(acc1.address)).to.equal(00000000010000000000);
        })

        it("Should not add to whitelist if 0 amount passed", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);
            await expect(contract.addWhiteList(acc1.address, 00000000000000000000)).to.be.revertedWith("Amount send must be greater than 0");
        })

        it("Should add more than 90 users", async function(){
            for(i=0;i<91;i++){
                let [temp] = await ethers.getSigners();
                await contract.addWhiteList(temp.address, 1);
            }
        })
    })

    describe('withdraw', () => {
        it("Revert if user is not whitelisted", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await expect(contract.withdraw(1696347000, 1696347000)).to.be.revertedWith("Not WhiteListed")
        })

        it("Revert if not 6 months have passed", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await contract.addWhiteList(owner.address, 10000000000000000000n);
            
            await expect(contract.withdraw(1696347000, 1696347000)).to.be.revertedWith("Too early for unlocking tokens")
        })

        it("Revert if not 1 day has passed from LastUnlock", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await contract.addWhiteList(owner.address, 10000000000000000000n);
            
            await expect(contract.withdraw(1696383000, 1696347000)).to.be.revertedWith("Too early for unlocking tokens")
        })

        it("1 day have passed after 3 month cliff", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await contract.addWhiteList(owner.address, 100000000000000000000n);

            await contract.withdraw(1696469400, 1696347000)
            
            expect(await token.balanceOf(owner.address)).to.equal(69000000000000000n)
        })

        it("10 days have passed after 3 month cliff", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await contract.addWhiteList(owner.address, 100000000000000000000n);

            await contract.withdraw(1697247000, 1696347000)
            
            expect(await token.balanceOf(owner.address)).to.equal(690000000000000000n)
        })

        it("100 days have passed after 3 month cliff", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await contract.addWhiteList(owner.address, 100000000000000000000n);


            await contract.withdraw(1704900938, 1696347000)
            
            expect(await token.balanceOf(owner.address)).to.equal(6831000000000000000n)
            expect(await contract.lockedBFG(owner.address)).to.equal(93169000000000000000n)
        })

        it("Vesting has ended", async function() {
            const { contract, owner, acc1, acc2, token } = await loadFixture(getContracts);

            await contract.addWhiteList(owner.address, 100000000000000000000n);


            await contract.withdraw(1822577738, 1696347000)
            
            expect(await token.balanceOf(owner.address)).to.equal(100000000000000000000n)
            expect(await contract.ownedBFG(owner.address)).to.equal(100000000000000000000n)
            expect(await contract.lockedBFG(owner.address)).to.equal(0)
        })
    })
})