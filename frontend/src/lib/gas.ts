/**
 * Gas Fee Estimation Utilities
 * Handles gas/fee estimation for Stacks and Ethereum transactions
 */

import { fetchCallReadOnlyFunction } from "@stacks/transactions";
import { StacksTestnet } from "@stacks/network";

// Stacks fee estimation
export interface StacksFeeEstimate {
  estimatedFee: number; // in microSTX
  estimatedFeeUSD: number;
  transactionType: string;
}

// Ethereum gas estimation
export interface EthereumGasEstimate {
  gasLimit: bigint;
  gasPrice: bigint; // in wei
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCostETH: string;
  estimatedCostUSD: number;
}

// Get STX to USD price (mock - replace with real price feed)
async function getSTXPrice(): Promise<number> {
  // TODO: Integrate with actual price API (CoinGecko, etc.)
  return 0.5; // Mock price
}

// Get ETH to USD price (mock - replace with real price feed)
async function getETHPrice(): Promise<number> {
  // TODO: Integrate with actual price API
  return 3000; // Mock price
}

/**
 * Estimate Stacks transaction fee
 */
export async function estimateStacksFee(
  transactionType: "create-campaign" | "donate" | "claim-funds" | "refund",
): Promise<StacksFeeEstimate> {
  // Base fee estimates for different transaction types (in microSTX)
  const baseFees: Record<string, number> = {
    "create-campaign": 50000, // ~0.05 STX
    donate: 30000, // ~0.03 STX
    "claim-funds": 40000, // ~0.04 STX
    refund: 35000, // ~0.035 STX
  };

  const estimatedFee = baseFees[transactionType] || 30000;
  const stxPrice = await getSTXPrice();
  const estimatedFeeUSD = (estimatedFee / 1_000_000) * stxPrice;

  return {
    estimatedFee,
    estimatedFeeUSD,
    transactionType,
  };
}

/**
 * Estimate Ethereum gas for bridge transaction
 */
export async function estimateEthereumGas(
  amount: bigint,
  from?: string,
): Promise<EthereumGasEstimate> {
  try {
    // Base gas limit for USDC transfer + bridge operation
    const gasLimit = BigInt(150000); // Conservative estimate

    // Mock gas price (in gwei)
    const gasPriceGwei = BigInt(30); // 30 gwei
    const gasPrice = gasPriceGwei * BigInt(1_000_000_000); // Convert to wei

    // EIP-1559 estimates
    const maxFeePerGas = BigInt(50) * BigInt(1_000_000_000); // 50 gwei
    const maxPriorityFeePerGas = BigInt(2) * BigInt(1_000_000_000); // 2 gwei

    // Calculate total cost in ETH
    const totalCostWei = gasLimit * gasPrice;
    const estimatedCostETH = (Number(totalCostWei) / 1e18).toFixed(6);

    // Convert to USD
    const ethPrice = await getETHPrice();
    const estimatedCostUSD = parseFloat(estimatedCostETH) * ethPrice;

    return {
      gasLimit,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
      estimatedCostETH,
      estimatedCostUSD,
    };
  } catch (error) {
    console.error("Failed to estimate Ethereum gas:", error);
    // Return fallback estimates
    return {
      gasLimit: BigInt(150000),
      gasPrice: BigInt(30_000_000_000),
      maxFeePerGas: BigInt(50_000_000_000),
      maxPriorityFeePerGas: BigInt(2_000_000_000),
      estimatedCostETH: "0.0045",
      estimatedCostUSD: 13.5,
    };
  }
}

/**
 * Format fee for display
 */
export function formatFee(fee: number, currency: "STX" | "ETH" | "USD"): string {
  switch (currency) {
    case "STX":
      return `${(fee / 1_000_000).toFixed(6)} STX`;
    case "ETH":
      return `${fee} ETH`;
    case "USD":
      return `$${fee.toFixed(2)}`;
    default:
      return fee.toString();
  }
}

/**
 * Get fee estimate for campaign creation
 */
export async function getCreateCampaignFee(): Promise<{
  stacksFee: StacksFeeEstimate;
}> {
  const stacksFee = await estimateStacksFee("create-campaign");
  return { stacksFee };
}

/**
 * Get fee estimate for donation
 */
export async function getDonationFee(
  amount: number,
  fromEthereum: boolean,
): Promise<{
  stacksFee?: StacksFeeEstimate;
  ethereumGas?: EthereumGasEstimate;
  totalFeeUSD: number;
}> {
  if (fromEthereum) {
    const ethereumGas = await estimateEthereumGas(BigInt(amount * 1e6)); // USDC has 6 decimals
    return {
      ethereumGas,
      totalFeeUSD: ethereumGas.estimatedCostUSD,
    };
  } else {
    const stacksFee = await estimateStacksFee("donate");
    return {
      stacksFee,
      totalFeeUSD: stacksFee.estimatedFeeUSD,
    };
  }
}

/**
 * Get fee estimate for claiming funds
 */
export async function getClaimFundsFee(): Promise<{
  stacksFee: StacksFeeEstimate;
}> {
  const stacksFee = await estimateStacksFee("claim-funds");
  return { stacksFee };
}
