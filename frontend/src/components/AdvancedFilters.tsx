import { useState } from "react";
import { SlidersHorizontal, X, DollarSign, TrendingUp, Calendar } from "lucide-react";

interface AdvancedFiltersProps {
  minGoal?: number;
  maxGoal?: number;
  minFunded?: number;
  maxFunded?: number;
  daysLeft?: number;
  onGoalRangeChange: (min?: number, max?: number) => void;
  onFundingRangeChange: (min?: number, max?: number) => void;
  onDaysLeftChange: (days?: number) => void;
  onClear: () => void;
}

export function AdvancedFilters({
  minGoal,
  maxGoal,
  minFunded,
  maxFunded,
  daysLeft,
  onGoalRangeChange,
  onFundingRangeChange,
  onDaysLeftChange,
  onClear,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localMinGoal, setLocalMinGoal] = useState(minGoal?.toString() || "");
  const [localMaxGoal, setLocalMaxGoal] = useState(maxGoal?.toString() || "");
  const [localMinFunded, setLocalMinFunded] = useState(minFunded?.toString() || "");
  const [localMaxFunded, setLocalMaxFunded] = useState(maxFunded?.toString() || "");
  const [localDaysLeft, setLocalDaysLeft] = useState(daysLeft?.toString() || "");

  const hasActiveFilters = minGoal || maxGoal || minFunded || maxFunded || daysLeft;

  const applyFilters = () => {
    onGoalRangeChange(
      localMinGoal ? parseFloat(localMinGoal) : undefined,
      localMaxGoal ? parseFloat(localMaxGoal) : undefined,
    );
    onFundingRangeChange(
      localMinFunded ? parseFloat(localMinFunded) : undefined,
      localMaxFunded ? parseFloat(localMaxFunded) : undefined,
    );
    onDaysLeftChange(localDaysLeft ? parseInt(localDaysLeft) : undefined);
    setIsOpen(false);
  };

  const clearAll = () => {
    setLocalMinGoal("");
    setLocalMaxGoal("");
    setLocalMinFunded("");
    setLocalMaxFunded("");
    setLocalDaysLeft("");
    onClear();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
          hasActiveFilters
            ? "bg-primary-500/20 border-primary-500 text-primary-400"
            : "bg-white/5 border-white/10 text-dark-300 hover:bg-white/10"
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
        {hasActiveFilters && (
          <span className="px-1.5 py-0.5 rounded-full bg-primary-500 text-dark-900 text-xs font-bold">
            {[minGoal, maxGoal, minFunded, maxFunded, daysLeft].filter(Boolean).length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 glass-card z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-dark-100">Advanced Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/5 rounded transition-colors"
              >
                <X className="w-4 h-4 text-dark-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Goal Range */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
                  <DollarSign className="w-4 h-4 text-primary-400" />
                  Goal Amount (USDC)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={localMinGoal}
                    onChange={(e) => setLocalMinGoal(e.target.value)}
                    className="input py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={localMaxGoal}
                    onChange={(e) => setLocalMaxGoal(e.target.value)}
                    className="input py-2 text-sm"
                  />
                </div>
              </div>

              {/* Funding Percentage */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
                  <TrendingUp className="w-4 h-4 text-success-400" />
                  Funding Progress (%)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min %"
                    min="0"
                    max="100"
                    value={localMinFunded}
                    onChange={(e) => setLocalMinFunded(e.target.value)}
                    className="input py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max %"
                    min="0"
                    max="100"
                    value={localMaxFunded}
                    onChange={(e) => setLocalMaxFunded(e.target.value)}
                    className="input py-2 text-sm"
                  />
                </div>
              </div>

              {/* Days Left */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-dark-300 mb-2">
                  <Calendar className="w-4 h-4 text-secondary-400" />
                  Maximum Days Left
                </label>
                <input
                  type="number"
                  placeholder="Days"
                  min="1"
                  value={localDaysLeft}
                  onChange={(e) => setLocalDaysLeft(e.target.value)}
                  className="input py-2 text-sm w-full"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
              <button onClick={clearAll} className="flex-1 btn-secondary text-sm py-2">
                Clear All
              </button>
              <button onClick={applyFilters} className="flex-1 btn-primary text-sm py-2">
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
