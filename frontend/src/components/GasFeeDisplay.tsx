import { Fuel, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { useGasEstimate } from "../hooks/useGasEstimate";
import { formatFee } from "../lib/gas";

interface GasFeeDisplayProps {
  transactionType?: "create-campaign" | "donate" | "claim-funds" | "refund";
  amount?: number;
  network?: "stacks" | "ethereum";
  showRefresh?: boolean;
  variant?: "compact" | "detailed";
}

export function GasFeeDisplay({
  transactionType = "donate",
  amount = 0,
  network = "stacks",
  showRefresh = false,
  variant = "compact",
}: GasFeeDisplayProps) {
  const { stacksFee, ethereumGas, loading, error, refresh } = useGasEstimate({
    transactionType,
    amount,
    network,
  });

  if (loading && !stacksFee && !ethereumGas) {
    return (
      <div className="flex items-center gap-2 text-sm text-dark-500 animate-pulse">
        <Fuel className="w-4 h-4" />
        <span>Estimating fees...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400">
        <AlertCircle className="w-4 h-4" />
        <span>Failed to estimate fee</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-dark-400 flex items-center gap-1.5">
          <Fuel className="w-3.5 h-3.5" />
          Network fee
        </span>
        <div className="flex items-center gap-2">
          <span className="font-medium text-dark-200">
            {network === "stacks" && stacksFee && <>≈ ${stacksFee.estimatedFeeUSD.toFixed(3)}</>}
            {network === "ethereum" && ethereumGas && (
              <>≈ ${ethereumGas.estimatedCostUSD.toFixed(2)}</>
            )}
          </span>
          {showRefresh && (
            <button
              onClick={refresh}
              className="p-1 hover:bg-white/5 rounded transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-3 h-3 text-dark-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-dark-200 flex items-center gap-2">
          <Fuel className="w-4 h-4 text-primary-400" />
          Transaction Fee Estimate
        </h4>
        {showRefresh && (
          <button
            onClick={refresh}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 text-dark-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {network === "stacks" && stacksFee && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Network</span>
            <span className="text-dark-200 font-medium">Stacks</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Fee</span>
            <span className="text-dark-200 font-medium font-mono">
              {formatFee(stacksFee.estimatedFee, "STX")}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">USD Value</span>
            <span className="text-primary-400 font-semibold">
              ${stacksFee.estimatedFeeUSD.toFixed(3)}
            </span>
          </div>
        </div>
      )}

      {network === "ethereum" && ethereumGas && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Network</span>
            <span className="text-dark-200 font-medium">Ethereum</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Gas Limit</span>
            <span className="text-dark-200 font-medium font-mono">
              {ethereumGas.gasLimit.toString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Gas Price</span>
            <span className="text-dark-200 font-medium font-mono">
              {(Number(ethereumGas.gasPrice) / 1e9).toFixed(2)} gwei
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Total Cost</span>
            <span className="text-dark-200 font-medium font-mono">
              {ethereumGas.estimatedCostETH} ETH
            </span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-white/10">
            <span className="text-dark-400">USD Value</span>
            <span className="text-primary-400 font-semibold">
              ${ethereumGas.estimatedCostUSD.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-dark-500 pt-2 border-t border-white/10">
        <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>Fee estimates may vary based on network congestion</span>
      </div>
    </div>
  );
}
