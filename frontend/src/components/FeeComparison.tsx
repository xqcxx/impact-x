import { TrendingDown, Zap } from "lucide-react";
import { useFeeComparison } from "../hooks/useFeeComparison";

interface FeeComparisonProps {
  amount?: number;
}

export function FeeComparison({ amount = 100 }: FeeComparisonProps) {
  const { comparison, loading } = useFeeComparison(amount);

  if (loading || !comparison) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
        <div className="h-16 bg-white/5 rounded" />
      </div>
    );
  }

  const isCheaper = comparison.cheaper === "stacks";

  return (
    <div
      className={`p-4 rounded-xl border ${
        isCheaper ? "bg-success-500/10 border-success-500/30" : "bg-blue-500/10 border-blue-500/30"
      }`}
    >
      <div className="flex items-start gap-3">
        {isCheaper ? (
          <TrendingDown className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
        ) : (
          <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <h4
            className={`font-heading font-medium mb-1 ${
              isCheaper ? "text-success-300" : "text-blue-300"
            }`}
          >
            {isCheaper ? "Lower Fees on Stacks" : "Alternative Available"}
          </h4>
          <p className={`text-sm ${isCheaper ? "text-success-400/80" : "text-blue-400/80"}`}>
            {isCheaper ? (
              <>
                Save ${comparison.savings.toFixed(2)} ({comparison.savingsPercentage.toFixed(0)}%)
                compared to Ethereum gas fees
              </>
            ) : (
              <>
                Ethereum gas: ${comparison.ethereumFeeUSD.toFixed(2)} • Stacks fee: $
                {comparison.stacksFeeUSD.toFixed(2)}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
