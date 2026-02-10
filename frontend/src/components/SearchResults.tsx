import { Search, Filter, TrendingUp, Layers } from "lucide-react";

interface SearchResultsHeaderProps {
  totalResults: number;
  filteredResults: number;
  isFiltered: boolean;
}

export function SearchResultsHeader({
  totalResults,
  filteredResults,
  isFiltered,
}: SearchResultsHeaderProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {isFiltered ? (
            <Filter className="w-4 h-4 text-primary-400" />
          ) : (
            <Layers className="w-4 h-4 text-dark-500" />
          )}
          <span className="text-sm text-dark-400">
            {isFiltered ? "Filtered Results" : "All Campaigns"}
          </span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <span className="text-2xl font-heading font-bold text-dark-100">
            {filteredResults.toLocaleString()}
          </span>
          {isFiltered && totalResults !== filteredResults && (
            <span className="text-sm text-dark-500">of {totalResults.toLocaleString()}</span>
          )}
        </div>
      </div>

      {isFiltered && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/30">
          <TrendingUp className="w-3 h-3 text-primary-400" />
          <span className="text-xs font-medium text-primary-400">
            {((filteredResults / totalResults) * 100).toFixed(0)}% match
          </span>
        </div>
      )}
    </div>
  );
}

interface EmptySearchResultsProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
}

export function EmptySearchResults({ hasFilters, onClearFilters }: EmptySearchResultsProps) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-dark-800 flex items-center justify-center">
        <Search className="w-8 h-8 text-dark-600" />
      </div>
      <h3 className="text-xl font-heading font-semibold text-dark-200 mb-2">No campaigns found</h3>
      <p className="text-dark-400 mb-6 max-w-md mx-auto">
        {hasFilters
          ? "Try adjusting your filters or search query to find more campaigns."
          : "There are no campaigns matching your criteria."}
      </p>
      {hasFilters && onClearFilters && (
        <button onClick={onClearFilters} className="btn-secondary">
          Clear all filters
        </button>
      )}
    </div>
  );
}
