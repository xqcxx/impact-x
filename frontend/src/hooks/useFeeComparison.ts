import { useState, useEffect } from "react";
import { estimateStacksFee, estimateEthereumGas } from "../lib/gas";

export interface FeeComparison {
  stacksFeeUSD: number;
  ethereumFeeUSD: number;
  cheaper: "stacks" | "ethereum";
  savings: number;
  savingsPercentage: number;
}

export function useFeeComparison(amount: number = 100): {
  comparison: FeeComparison | null;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [comparison, setComparison] = useState<FeeComparison | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateComparison = async () => {
    setLoading(true);
    try {
      const [stacksFee, ethereumGas] = await Promise.all([
        estimateStacksFee("donate"),
        estimateEthereumGas(BigInt(amount * 1e6)),
      ]);

      const stacksFeeUSD = stacksFee.estimatedFeeUSD;
      const ethereumFeeUSD = ethereumGas.estimatedCostUSD;

      const cheaper = stacksFeeUSD < ethereumFeeUSD ? "stacks" : "ethereum";
      const savings = Math.abs(stacksFeeUSD - ethereumFeeUSD);
      const savingsPercentage = (savings / Math.max(stacksFeeUSD, ethereumFeeUSD)) * 100;

      setComparison({
        stacksFeeUSD,
        ethereumFeeUSD,
        cheaper,
        savings,
        savingsPercentage,
      });
    } catch (error) {
      console.error("Failed to compare fees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateComparison();
  }, [amount]);

  return {
    comparison,
    loading,
    refresh: calculateComparison,
  };
}
