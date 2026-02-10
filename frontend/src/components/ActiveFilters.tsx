import { X } from "lucide-react";

interface ActiveFiltersProps {
  filters: {
    query?: string;
    category?: string;
    status?: string;
    minGoal?: number;
    maxGoal?: number;
    minFunded?: number;
    maxFunded?: number;
    daysLeft?: number;
  };
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ filters, onRemoveFilter, onClearAll }: ActiveFiltersProps) {
  const activeFilters: Array<{ key: string; label: string; value: string }> = [];

  if (filters.query && filters.query.trim()) {
    activeFilters.push({
      key: "query",
      label: "Search",
      value: `"${filters.query}"`,
    });
  }

  if (filters.category && filters.category !== "All") {
    activeFilters.push({
      key: "category",
      label: "Category",
      value: filters.category,
    });
  }

  if (filters.status && filters.status !== "all") {
    activeFilters.push({
      key: "status",
      label: "Status",
      value: filters.status.charAt(0).toUpperCase() + filters.status.slice(1),
    });
  }

  if (filters.minGoal !== undefined || filters.maxGoal !== undefined) {
    const min = filters.minGoal ? `$${filters.minGoal.toLocaleString()}` : "0";
    const max = filters.maxGoal ? `$${filters.maxGoal.toLocaleString()}` : "∞";
    activeFilters.push({
      key: "goalRange",
      label: "Goal",
      value: `${min} - ${max}`,
    });
  }

  if (filters.minFunded !== undefined || filters.maxFunded !== undefined) {
    const min = filters.minFunded || 0;
    const max = filters.maxFunded || 100;
    activeFilters.push({
      key: "fundingRange",
      label: "Funded",
      value: `${min}% - ${max}%`,
    });
  }

  if (filters.daysLeft !== undefined) {
    activeFilters.push({
      key: "daysLeft",
      label: "Days Left",
      value: `≤ ${filters.daysLeft} days`,
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-dark-500">Active filters:</span>
      {activeFilters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onRemoveFilter(filter.key)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 transition-colors group"
        >
          <span className="text-xs font-medium">
            {filter.label}: {filter.value}
          </span>
          <X className="w-3 h-3 opacity-70 group-hover:opacity-100" />
        </button>
      ))}
      <button onClick={onClearAll} className="text-xs text-dark-500 hover:text-dark-300 underline">
        Clear all
      </button>
    </div>
  );
}
