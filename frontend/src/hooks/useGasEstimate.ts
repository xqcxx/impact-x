import { useState, useEffect } from "react";
import {
  estimateStacksFee,
  estimateEthereumGas,
  StacksFeeEstimate,
  EthereumGasEstimate,
} from "../lib/gas";

interface UseGasEstimateOptions {
  transactionType?: "create-campaign" | "donate" | "claim-funds" | "refund";
  amount?: number;
  network?: "stacks" | "ethereum";
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseGasEstimateReturn {
  stacksFee: StacksFeeEstimate | null;
  ethereumGas: EthereumGasEstimate | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useGasEstimate({
  transactionType = "donate",
  amount = 0,
  network = "stacks",
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
}: UseGasEstimateOptions = {}): UseGasEstimateReturn {
  const [stacksFee, setStacksFee] = useState<StacksFeeEstimate | null>(null);
  const [ethereumGas, setEthereumGas] = useState<EthereumGasEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstimate = async () => {
    setLoading(true);
    setError(null);

    try {
      if (network === "stacks") {
        const estimate = await estimateStacksFee(transactionType);
        setStacksFee(estimate);
        setEthereumGas(null);
      } else {
        const estimate = await estimateEthereumGas(BigInt(amount * 1e6));
        setEthereumGas(estimate);
        setStacksFee(null);
      }
    } catch (err) {
      console.error("Failed to estimate gas:", err);
      setError("Failed to estimate transaction fee");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimate();

    if (autoRefresh) {
      const interval = setInterval(fetchEstimate, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [transactionType, amount, network, autoRefresh, refreshInterval]);

  return {
    stacksFee,
    ethereumGas,
    loading,
    error,
    refresh: fetchEstimate,
  };
}
