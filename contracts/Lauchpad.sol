// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/token/ERC20/ERC20.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/token/ERC20/utils/SafeERC20.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/security/ReentrancyGuard.sol";

contract Launchpad is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct TokenInfo {
        address creator;
        address tokenAddress;
        uint256 pricePerTokenInWei;
        uint256 ethPool;
    }

    mapping(address => TokenInfo) public tokenList;
    mapping(address => bool) public isTokenCreated;

    event TokenCreated(address indexed creator, address token, string name, string symbol, uint256 supply);
    event TokenFunded(address indexed creator, address token, uint256 ethAmount);
    event TokenBought(address indexed buyer, address token, uint256 amount, uint256 ethSpent);
    event TokenSold(address indexed seller, address token, uint256 amount, uint256 ethReceived);
    event CreatorWithdraw(address indexed creator, address token, uint256 amount);

    function createToken(string memory name,string memory symbol,uint256 supply,uint256 pricePerTokenInWei) external payable{

        require(msg.value > 0.5 ether, "Minimum ETH liquidity required"); //Optional
        require(supply > 0, "Supply must be greater than 0");
        require(pricePerTokenInWei > 0, "Price must be positive");

        MyToken newToken = new MyToken(name, symbol, supply, msg.sender);
        address tokenAddress = address(newToken);

        tokenList[tokenAddress] = TokenInfo({
            creator: msg.sender,
            tokenAddress: tokenAddress,
            pricePerTokenInWei: pricePerTokenInWei,
            ethPool: msg.value
        });

        isTokenCreated[tokenAddress] = true;

        emit TokenCreated(msg.sender, tokenAddress, name, symbol, supply);
        emit TokenFunded(msg.sender, tokenAddress, msg.value);
    }

    function buyToken(address token) external payable nonReentrant {
        require(isTokenCreated[token], "Token not created");
        require(msg.value > 0, "Send ETH to buy tokens");

        TokenInfo storage info = tokenList[token];
        IERC20 tkn = IERC20(token);

        uint256 tokensToBuy = msg.value / info.pricePerTokenInWei;
        require(tokensToBuy > 0, "Insufficient ETH for token");

        uint256 totalCost = tokensToBuy * info.pricePerTokenInWei;
        uint256 refund = msg.value - totalCost;

        require(tkn.allowance(info.creator, address(this)) >= tokensToBuy, "Creator hasn't approved tokens");
        require(tkn.balanceOf(info.creator) >= tokensToBuy, "Creator lacks token balance");

        tkn.safeTransferFrom(info.creator, msg.sender, tokensToBuy);

        info.ethPool += totalCost;

        if (refund > 0) {
            (bool refunded, ) = payable(msg.sender).call{value: refund}("");
            require(refunded, "Refund failed");
        }

        emit TokenBought(msg.sender, token, tokensToBuy, totalCost);
    }

    function sellToken(address token, uint256 amount) external nonReentrant {
        require(isTokenCreated[token], "Token not created");
        require(amount > 0, "Amount must be > 0");

        TokenInfo storage info = tokenList[token];
        uint256 ethToReturn = amount * info.pricePerTokenInWei;

        require(info.ethPool >= ethToReturn, "Not enough ETH in pool");

        IERC20 tkn = IERC20(token);
        require(tkn.allowance(msg.sender, address(this)) >= amount, "Approve tokens first");

        tkn.safeTransferFrom(msg.sender, info.creator, amount);
        info.ethPool -= ethToReturn;

        (bool sent, ) = payable(msg.sender).call{value: ethToReturn}("");
        require(sent, "ETH transfer failed");

        emit TokenSold(msg.sender, token, amount, ethToReturn);
    }

    function withdrawETH(address token, uint256 amount) external nonReentrant {
        require(isTokenCreated[token], "Token not created");
        TokenInfo storage info = tokenList[token];

        require(msg.sender == info.creator, "Not token creator");
        require(amount <= info.ethPool, "Not enough ETH in pool");

        info.ethPool -= amount;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Withdrawal failed");

        emit CreatorWithdraw(msg.sender, token, amount);
    }

    function getTokenInfo(address token) external view returns (TokenInfo memory) {
        require(isTokenCreated[token], "Token not found");
        return tokenList[token];
    }

    function getUserTokenBalance(address token, address user) external view returns (uint256 balance) {
        require(isTokenCreated[token], "Token not created via launchpad");
    
        IERC20 tkn = IERC20(token);
        balance = tkn.balanceOf(user);
    
        return balance;
    }
}

contract MyToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 supply,
        address creator
    ) ERC20(name, symbol) {
        _mint(creator, supply * 10 ** decimals());
    }
}
