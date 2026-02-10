import { CampaignCategory, CAMPAIGN_CATEGORIES, CATEGORY_METADATA } from "../lib/categories";
import {
  Cpu,
  Palette,
  Users,
  Coins,
  BookOpen,
  Leaf,
  Gamepad2,
  Heart,
  Building2,
  Music,
  HeartHandshake,
  Trophy,
  Circle,
  Check,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu,
  Palette,
  Users,
  Coins,
  BookOpen,
  Leaf,
  Gamepad2,
  Heart,
  Building2,
  Music,
  HeartHandshake,
  Trophy,
  Circle,
};

interface CategorySelectorProps {
  selectedCategory: CampaignCategory | "";
  onSelectCategory: (category: CampaignCategory) => void;
  error?: string;
}

export function CategorySelector({
  selectedCategory,
  onSelectCategory,
  error,
}: CategorySelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-dark-200">
        Campaign Category <span className="text-red-500">*</span>
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {CAMPAIGN_CATEGORIES.map((category) => {
          const Icon = iconMap[CATEGORY_METADATA[category].icon];
          const isSelected = selectedCategory === category;
          const color = CATEGORY_METADATA[category].color;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
                isSelected
                  ? "border-primary-500 bg-primary-500/10"
                  : "border-white/10 bg-dark-800/50 hover:border-white/20 hover:bg-dark-700/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: isSelected ? color : `${color}20`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: isSelected ? "#FFFFFF" : color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark-100 text-sm">{category}</p>
                  <p className="text-xs text-dark-500 mt-0.5 line-clamp-2">
                    {CATEGORY_METADATA[category].description}
                  </p>
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      {!selectedCategory && !error && (
        <p className="text-sm text-dark-500 mt-2">
          Select a category to help backers find your campaign
        </p>
      )}
    </div>
  );
}
