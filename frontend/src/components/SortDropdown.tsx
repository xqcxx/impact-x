import { ArrowUpDown, Check } from "lucide-react";
import { SortOption, getSortLabel } from "../lib/search";
import { useState } from "react";

interface SortDropdownProps {
  selectedSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
}

const sortOptions: SortOption[] = [
  "newest",
  "oldest",
  "most-funded",
  "least-funded",
  "most-backers",
  "ending-soon",
  "alphabetical",
];

export function SortDropdown({ selectedSort, onSelectSort }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-dark-300"
      >
        <ArrowUpDown className="w-4 h-4" />
        <span className="text-sm font-medium">{getSortLabel(selectedSort)}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 glass-card z-50 p-2">
            <div className="px-3 py-2 text-xs font-medium text-dark-500 uppercase tracking-wider border-b border-white/10 mb-1">
              Sort By
            </div>
            {sortOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onSelectSort(option);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedSort === option
                    ? "bg-primary-500/20 text-primary-400"
                    : "text-dark-300 hover:bg-white/5"
                }`}
              >
                <span>{getSortLabel(option)}</span>
                {selectedSort === option && <Check className="w-4 h-4 text-primary-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
