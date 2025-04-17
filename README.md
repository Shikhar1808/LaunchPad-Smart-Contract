# 🚀 Launchpad Smart Contract

## 📖 Introduction

The **Launchpad** smart contract allows users to create and manage their own ERC20 tokens, and facilitates a decentralized token sale mechanism. It's designed for Ethereum and built with Solidity using OpenZeppelin's secure, reusable components.

Users can:
- Create new ERC20 tokens with custom names, symbols, and supply
- Set a price in ETH for their tokens
- Fund the token with ETH liquidity
- Allow others to buy or sell tokens based on the set price
- Withdraw ETH collected from token sales

The smart contract also includes an internal token contract (`MyToken`) that mints tokens upon creation.

---

## 📦 Imports & Their Purpose

```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
```

### ✅ OpenZeppelin Imports Breakdown:

| Import | Purpose | Use Case in This Contract |
|--------|---------|----------------------------|
| `ERC20.sol` | Base contract for creating ERC20 tokens | Used in `MyToken` to create standard tokens |
| `SafeERC20.sol` | Safer interactions with ERC20 (handles non-standard return values) | Ensures safe transfer and approval logic in `buyToken` and `sellToken` |
| `ReentrancyGuard.sol` | Prevents reentrancy attacks | Protects `buyToken`, `sellToken`, and `withdrawETH` functions |

---

## 🛠️ How to Use Locally with Hardhat

Follow the steps below to deploy and interact with this contract locally using Hardhat.

### 📌 Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- Hardhat

### 📁 Project Structure

```
.
├── contracts/
│   └── Launchpad.sol
├── scripts/
│   └── deploy.js
├── tests/
│   └── Launchpad.test.js
├── hardhat.config.js
```

### ⚙️ Setup

1. **Clone the project and install dependencies**

```bash
git clone https://github.com/Shikhar1808/LaunchPad-Smart-Contract.git
npm install --save-dev hardhat
npx hardhat init
```

Choose "Create a basic sample project" if you're starting from scratch.

2. **Install OpenZeppelin Contracts**

```bash
npm install @openzeppelin/contracts
```

3. **Compile Contracts**

```bash
npx hardhat compile
```

4. **Deploy to Local Network**

Start Hardhat node:

```bash
npx hardhat node
```

In a new terminal, deploy the contract:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

You should see an output like:

```bash
🚀 Deploying contracts with account: 0x...
✅ Launchpad deployed to: 0x...
```

---

## 🧪 Tests

The project includes a comprehensive test suite using Hardhat and Chai.

### 🧪 Test File

- `tests/Launchpad.test.js`

### ✅ What is Tested

| Test Case | Description |
|-----------|-------------|
| 🆕 Token Creation | Verifies tokens can be created with correct parameters and liquidity |
| 💰 Token Purchase | Validates token buying logic and balance updates |
| ❌ Unapproved Token Buy | Ensures error is thrown if tokens aren't approved by creator |
| 💸 Refund Logic | Ensures excess ETH is refunded if user sends more than needed |
| 🔁 Token Sell | Checks that users can sell tokens back and receive correct ETH |
| 🔓 Creator Withdrawal | Confirms only token creator can withdraw ETH from pool |
| ⛔ Unauthorized Withdrawal | Reverts if a non-creator attempts to withdraw ETH |

### ▶️ Run the Tests

```bash
npx hardhat test
```

You’ll see detailed output with console logs for each step and assertion results.

---

## 🔐 License

This project is licensed under the **MIT License**.

---

## 🧑‍💻 Contributors

Feel free to open issues, fork the repo, and contribute improvements!

---
