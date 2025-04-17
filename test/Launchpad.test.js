// tests/Launchpad.test.js
const { expect } = require("chai");
const hre = require("hardhat");

describe("Launchpad", function () {
  let launchpad, owner, user1, user2;

  async function deployLaunchpadFixture() {
    [owner, user1, user2] = await hre.ethers.getSigners();

    const LaunchpadFactory = await hre.ethers.getContractFactory("Launchpad");
    const launchpadInstance = await LaunchpadFactory.deploy();
    await launchpadInstance.waitForDeployment();
    console.log("Launchpad address:", await launchpadInstance.getAddress()); 

    return { launchpadInstance, owner, user1, user2 };
  }


  //Test if a new token is created successfully
  it("should create a new token with liquidity", async function () {
    const { launchpadInstance, user1 } = await deployLaunchpadFixture();

    const name = "ShikharCoin";
    const symbol = "SHC";
    const supply = 1000;
    const price = hre.ethers.parseEther("0.01");
    const ethLiquidity = hre.ethers.parseEther("1");

    const tx = await launchpadInstance
      .connect(user1)
      .createToken(name, symbol, supply, price, { value: ethLiquidity });
    await tx.wait();

    console.log("Token created successfully");

    const events = await launchpadInstance.queryFilter("TokenCreated");
    const createdToken = events[0].args.token;
    const tokenInfo = await launchpadInstance.getTokenInfo(createdToken);
    console.log("Token info:", tokenInfo);
    console.log("Token Address", tokenInfo[0]);
    console.log("Token Name", tokenInfo[1]);
    console.log("Token Price", tokenInfo[2]);
    console.log("Liquidity", tokenInfo[3]);


    expect(tokenInfo.creator).to.equal(user1.address);
    expect(tokenInfo.pricePerTokenInWei).to.equal(price);
    expect(tokenInfo.ethPool).to.equal(ethLiquidity);

    console.log("Token created with the correct parameters");    
  });


  //Test if a user can buy tokens
  it("should allow a user to buy tokens", async function () {
    const { launchpadInstance, owner, user1 } = await deployLaunchpadFixture();

    const price = hre.ethers.parseEther("0.01");
    const supply = 1000;
    const liquidity = hre.ethers.parseEther("1");

    console.log("Liquidity:", liquidity.toString());

    await launchpadInstance
      .connect(owner)
      .createToken("ShikharCoin", "SHC", supply, price, { value: liquidity });

    console.log("Token created");

    const createdToken = (await launchpadInstance.queryFilter("TokenCreated"))[0].args.token;
    const MyTokenFactory = await ethers.getContractFactory("MyToken");
    const token = MyTokenFactory.attach(createdToken);

    console.log("Token address:", createdToken);

    await token.connect(owner).approve(launchpadInstance.getAddress(), ethers.MaxUint256);

    const buyAmount = hre.ethers.parseEther("0.05");
    await expect(
      () => launchpadInstance.connect(user1).buyToken(createdToken, { value: buyAmount })
    ).to.changeEtherBalance(user1, -buyAmount);

    console.log("Token bought");

    const userBalance = await token.balanceOf(user1.getAddress());
    expect(userBalance).to.equal(buyAmount/(price));

    console.log("User balance after purchase:", userBalance.toString());
  });


  //Test: Revert if trying to buy unapproved tokens
  it("should revert if trying to buy unapproved tokens", async function () {
    const { launchpadInstance, owner, user1 } = await deployLaunchpadFixture();

    await launchpadInstance
      .connect(owner)
      .createToken("ShikharCoin", "SHC", 1000, hre.ethers.parseEther("0.01"), { value: hre.ethers.parseEther("1") });

    const createdToken = (await launchpadInstance.queryFilter("TokenCreated"))[0].args.token;

    // Intentionally not approving tokens for Launchpad

    await expect(
      launchpadInstance.connect(user1).buyToken(createdToken, { value: hre.ethers.parseEther("0.05") })
    ).to.be.revertedWith("Creator hasn't approved tokens");
  });

  //Test: Refund if trying to buy tokens with insufficient ETH
  it("should refund excess ETH if not enough tokens available", async function () {
    const { launchpadInstance, owner, user1 } = await deployLaunchpadFixture();

    const price = hre.ethers.parseEther("0.01");
    const supply = 3;
    const ethLiquidity = hre.ethers.parseEther("1");

    await launchpadInstance
      .connect(owner)
      .createToken("ShikharCoin", "SHC", supply, price, { value: ethLiquidity });

    const createdToken = (await launchpadInstance.queryFilter("TokenCreated"))[0].args.token;
    const MyTokenFactory = await hre.ethers.getContractFactory("MyToken");
    const token = MyTokenFactory.attach(createdToken);

    await token.connect(owner).approve(await launchpadInstance.getAddress(), hre.ethers.MaxUint256);

    const excessiveBuyAmount = hre.ethers.parseEther("1"); // wants to buy 100 tokens, but only 3 exist
    console.log("Excessive buy amount:", excessiveBuyAmount.toString());

    const userBalanceBefore = await hre.ethers.provider.getBalance(user1.address);
    
    const tx = await launchpadInstance.connect(user1).buyToken(createdToken, { value: excessiveBuyAmount });
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;

    const userBalanceAfter = await hre.ethers.provider.getBalance(user1.address);
    const spent = userBalanceBefore - userBalanceAfter - gasCost;
    const expectedSpend = price * BigInt(supply); // 3 tokens * 0.01 ETH
    console.log("Spent amount:", spent.toString());
    console.log("Expected spend:", expectedSpend.toString());

    expect(spent).to.be.closeTo(expectedSpend, hre.ethers.parseEther("0.001"));
  });


  //Test: Allow a user to sell tokens
  it("should allow a user to sell tokens", async function () {
    const { launchpadInstance, owner, user1 } = await deployLaunchpadFixture();

    const price = hre.ethers.parseEther("0.01");
    const supply = 1000;
    const liquidity = hre.ethers.parseEther("1");

    await launchpadInstance
      .connect(owner)
      .createToken("ShikharCoin", "SHC", supply, price, { value: liquidity });

    const events = (await launchpadInstance.queryFilter("TokenCreated"));
    const createdToken = events[0].args.token;
    console.log(createdToken)
//     console.log("Events:", events);
  // console.log("First event:", events[0]);
  // console.log("First event args:", events[0].args);
  // console.log("Token address:", events[0].args.token);
    const MyTokenFactory = await ethers.getContractFactory("MyToken");
    // console.log(MyTokenFactory)
    const token = MyTokenFactory.attach(createdToken);
    // console.log(token)
    console.log(launchpadInstance.getAddress());
    await token.connect(owner).approve(launchpadInstance.getAddress(), ethers.MaxUint256);
    console.log("Token approved");

    await launchpadInstance.connect(user1).buyToken(createdToken, {
      value: hre.ethers.parseEther("0.05"),
    });

    console.log("Token bought");

    const balance = await token.balanceOf(user1.getAddress());
    await token.connect(user1).approve(launchpadInstance.getAddress(), balance);

    console.log("Token approved for selling");
    console.log("User1 address:", user1.address);

    await expect(
      () => launchpadInstance.connect(user1).sellToken(createdToken, balance)
    ).to.changeEtherBalance(user1, balance*price);
    console.log("Token sold at price:", balance*price);
  });


  //Test: Allow a creator to withdraw ETH
  it("should allow creator to withdraw ETH", async function () {
    const { launchpadInstance, owner } = await deployLaunchpadFixture();

    const price = hre.ethers.parseEther("0.01");
    const supply = 1000;
    const liquidity = hre.ethers.parseEther("2");

    console.log("Liquidity:", liquidity.toString());

    await launchpadInstance
      .connect(owner)
      .createToken("ShikharCoin", "SHC", supply, price, { value: liquidity });

    console.log("Token created");

    const createdToken = (await launchpadInstance.queryFilter("TokenCreated"))[0].args.token;

    console.log("Created token address:", createdToken);

    await expect(
      () => launchpadInstance.connect(owner).withdrawETH(createdToken, hre.ethers.parseEther("1"))
    ).to.changeEtherBalance(owner, hre.ethers.parseEther("1"));

    console.log("ETH withdrawn successfully");
  });


  //Test: Revert if non-creator tries to withdraw ETH
  it("should revert if non-creator tries to withdraw ETH", async function () {
    const { launchpadInstance, owner, user1 } = await deployLaunchpadFixture();

    await launchpadInstance
      .connect(owner)
      .createToken("Shikhar", "SHC", 1000, hre.ethers.parseEther("0.01"), { value: hre.ethers.parseEther("1") });

    const createdToken = (await launchpadInstance.queryFilter("TokenCreated"))[0].args.token;

    await expect(
      launchpadInstance.connect(user1).withdrawETH(createdToken, hre.ethers.parseEther("0.1"))
    ).to.be.revertedWith("Not token creator");
  });
});
