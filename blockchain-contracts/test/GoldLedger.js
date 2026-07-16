import { expect } from "chai";
import hre from "hardhat";

describe("GoldLedger", function () {
  let GoldLedger;
  let goldLedger;
  let owner;
  let user;

  beforeEach(async function () {
    [owner, user] = await hre.ethers.getSigners();
    GoldLedger = await hre.ethers.getContractFactory("GoldLedger");
    goldLedger = await GoldLedger.deploy(owner.address);
  });

  it("Should set the right owner", async function () {
    expect(await goldLedger.owner()).to.equal(owner.address);
  });

  it("Should mint a Gold Token and record proof", async function () {
    const orderId = "ORD-12345";
    const pdfHash = "ab12hashhash";
    const goldAmount = 10;
    const uri = "ipfs://QmSomeMetadata";

    // Mint token
    const tx = await goldLedger.mintGold(user.address, orderId, pdfHash, goldAmount, uri);
    await tx.wait();

    // Check balance
    expect(await goldLedger.balanceOf(user.address)).to.equal(1n);

    // Get Proof
    const proof = await goldLedger.getProofByOrderId(orderId);
    expect(proof.orderId).to.equal(orderId);
    expect(proof.pdfHash).to.equal(pdfHash);
    expect(proof.goldAmount).to.equal(10n);

    // Verify Hash
    expect(await goldLedger.verifyHash(orderId, pdfHash)).to.equal(true);
    expect(await goldLedger.verifyHash(orderId, "wronghash")).to.equal(false);
  });

  it("Should revert if order ID already has a token", async function () {
    const orderId = "ORD-12345";
    await goldLedger.mintGold(user.address, orderId, "hash", 1, "");
    
    // Should revert when attempting to mint with the same orderId
    await expect(
      goldLedger.mintGold(user.address, orderId, "hash", 1, "")
    ).to.be.revertedWith("Order already has a token");
  });
});
