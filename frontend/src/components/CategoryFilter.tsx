import { useState } from "react";
import { CampaignCategory, CAMPAIGN_CATEGORIES } from "../lib/categories";
import { CategoryBadge } from "./CategoryBadge";
import { ChevronDown, X } from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: CampaignCategory | "All";
  onSelectCategory: (category: CampaignCategory | "All") => void;
  campaignCounts?: Record<string, number>;
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  campaignCounts = {},
}: CategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = ["All" as const, ...CAMPAIGN_CATEGORIES];

  return (
    <div className="w-full">
      {/* Mobile/Compact View */}
      <div className="md:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-dark-800/50 border border-white/10"
        >
          <span className="flex items-center gap-2">
            <span className="text-dark-400">Category:</span>
            {selectedCategory === "All" ? (
              <span className="font-medium">All Categories</span>
            ) : (
              <CategoryBadge category={selectedCategory} size="sm" />
            )}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-dark-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {isExpanded && (
          <div className="mt-2 p-3 rounded-xl bg-dark-800/50 border border-white/10 space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  onSelectCategory(category as CampaignCategory | "All");
                  setIsExpanded(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                  selectedCategory === category ? "bg-primary-500/20" : "hover:bg-white/5"
                }`}
              >
                {category === "All" ? (
                  <span className="font-medium">All Categories</span>
                ) : (
                  <CategoryBadge
                    category={category as CampaignCategory}
                    size="sm"
                    variant={selectedCategory === category ? "filled" : "default"}
                  />
                )}
                <span className="text-sm text-dark-500">{campaignCounts[category] || 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop/Expanded View */}
      <div className="hidden md:flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category as CampaignCategory | "All")}
            className="group relative"
          >
            {category === "All" ? (
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-heading font-semibold uppercase tracking-wider border transition-all ${
                  selectedCategory === "All"
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-dark-800/50 text-dark-400 border-white/10 hover:border-white/20"
                }`}
              >
                All
                {campaignCounts[category] > 0 && (
                  <span className="ml-1.5 text-xs opacity-70">({campaignCounts[category]})</span>
                )}
              </span>
            ) : (
              <CategoryBadge
                category={category as CampaignCategory}
                size="md"
                variant={selectedCategory === category ? "filled" : "default"}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
