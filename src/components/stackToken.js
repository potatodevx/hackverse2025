import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

// Staking Token ABI
const stakingTokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

// StakeDapp ABI
const stakeDappABI = [
  "function stake(uint256 amount)"
];

const STAKING_TOKEN_ADDRESS = "0x2b135a08c50e8871C6a8932B74d8cD0325e44D9b";
const STAKE_DAPP_ADDRESS = "0x8755B5bFfC86dFabB8B15148074d05C411Aad1b6";

const StakeToken = ({ onBalanceUpdate }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [stakingToken, setStakingToken] = useState(null);
  const [stakeDapp, setStakeDapp] = useState(null);
  const [amountToApprove, setAmountToApprove] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [allowance, setAllowance] = useState('0'); // State to track allowance
  const [error, setError] = useState(null);

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      setError(null);
      const ethProvider = await detectEthereumProvider({ mustBeMetaMask: true });
      if (!ethProvider) {
        setError("MetaMask not detected. Please install MetaMask.");
        return;
      }

      const provider = new ethers.providers.Web3Provider(ethProvider);
      let accounts;
      try {
        accounts = await provider.send("eth_requestAccounts", []);
      } catch (err) {
        setError("Failed to connect to MetaMask. Please unlock your wallet or allow access.");
        console.error("MetaMask connection error:", err);
        return;
      }

      const signer = provider.getSigner();
      const userAddress = accounts[0];

      setProvider(provider);
      setSigner(signer);
      setAccount(userAddress);

      // Initialize staking token contract
      const stakingTokenContract = new ethers.Contract(STAKING_TOKEN_ADDRESS, stakingTokenABI, signer);
      setStakingToken(stakingTokenContract);

      // Initialize StakeDapp contract
      const stakeDappContract = new ethers.Contract(STAKE_DAPP_ADDRESS, stakeDappABI, signer);
      setStakeDapp(stakeDappContract);

      // Fetch balance and allowance after connecting
      fetchBalance(userAddress, stakingTokenContract);
      fetchAllowance(userAddress, stakingTokenContract);
    } catch (err) {
      setError("Unexpected error during wallet connection. Check console for details.");
      console.error("Wallet connection error:", err);
    }
  };

  // Fetch balance
  const fetchBalance = async (userAccount, stakingTokenContract) => {
    try {
      if (stakingTokenContract && userAccount) {
        const balance = await stakingTokenContract.balanceOf(userAccount);
        const formattedBalance = ethers.utils.formatEther(balance);
        setTokenBalance(formattedBalance);
        if (onBalanceUpdate) {
          onBalanceUpdate(formattedBalance);
        }
      }
    } catch (err) {
      setError("Failed to fetch balance. Check console for details.");
      console.error("Balance fetch error:", err);
    }
  };

  // Fetch allowance
  const fetchAllowance = async (userAccount, stakingTokenContract) => {
    try {
      if (stakingTokenContract && userAccount) {
        const allowance = await stakingTokenContract.allowance(userAccount, STAKE_DAPP_ADDRESS);
        const formattedAllowance = ethers.utils.formatEther(allowance);
        setAllowance(formattedAllowance);
      }
    } catch (err) {
      setError("Failed to fetch allowance. Check console for details.");
      console.error("Allowance fetch error:", err);
    }
  };

  // Approve tokens
  const handleApprove = async () => {
    if (!stakingToken || !account) {
      setError("Connect wallet first!");
      return;
    }
    if (!amountToApprove) {
      setError("Enter an amount to approve!");
      return;
    }
    try {
      setError(null);
      const amountToApproveWei = ethers.utils.parseEther(amountToApprove);
      const tx = await stakingToken.approve(STAKE_DAPP_ADDRESS, amountToApproveWei);
      await tx.wait();
      alert("Approval successful!");
      fetchBalance(account, stakingToken);
      fetchAllowance(account, stakingToken); // Refresh allowance after approval
    } catch (err) {
      setError("Approval failed: " + (err.reason || err.message));
      console.error("Approval error:", err);
    }
  };

  // Stake tokens
  const handleStake = async () => {
    if (!stakeDapp || !account) {
      setError("Connect wallet first!");
      return;
    }
    if (!amountToApprove) {
      setError("Enter an amount to stake!");
      return;
    }
    try {
      setError(null);
      const amountToStake = ethers.utils.parseEther(amountToApprove);

      // Check balance
      const balanceWei = ethers.utils.parseEther(tokenBalance);
      if (amountToStake.gt(balanceWei)) {
        setError("Insufficient balance to stake this amount!");
        return;
      }

      // Check allowance
      const allowanceWei = ethers.utils.parseEther(allowance);
      if (amountToStake.gt(allowanceWei)) {
        setError("Insufficient allowance. Please approve more tokens.");
        return;
      }

      // Attempt to stake with a manual gas limit
      const tx = await stakeDapp.stake(amountToStake, { gasLimit: 300000 });
      await tx.wait();
      alert("Staking successful!");
      fetchBalance(account, stakingToken); // Refresh balance after staking
      fetchAllowance(account, stakingToken); // Refresh allowance after staking
    } catch (err) {
      if (err.code === "UNPREDICTABLE_GAS_LIMIT") {
        setError("Gas estimation failed: " + (err.reason || "Try increasing the gas limit or check contract logic."));
      } else if (err.reason) {
        setError("Staking failed: " + err.reason);
      } else {
        setError("Staking failed: " + err.message);
      }
      console.error("Staking error:", err);
    }
  };

  return (
    <div className="StakeToken">
      <h2>Stake Token</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!account ? (
        <button onClick={connectWallet}>Connect MetaMask</button>
      ) : (
        <>
          <p>Account: {account}</p>
          <p>Balance: {tokenBalance} STK</p>
          <p>Allowance for StakeDapp: {allowance} STK</p>
          <input
            type="text"
            placeholder="Amount to approve/stake"
            value={amountToApprove}
            onChange={(e) => setAmountToApprove(e.target.value)}
          />
          <button onClick={handleApprove}>Approve Tokens</button>
          <button onClick={handleStake}>Stake Tokens</button>
        </>
      )}
    </div>
  );
};

export default StakeToken;