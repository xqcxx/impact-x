import { useState, useMemo } from "react";
import { CampaignCategory } from "../lib/categories";
import { FullCampaign } from "../lib/campaigns";

interface UseCategoryFilterReturn {
  selectedCategory: CampaignCategory | "All";
  setSelectedCategory: (category: CampaignCategory | "All") => void;
  filteredCampaigns: FullCampaign[];
  categoryCounts: Record<string, number>;
  clearFilter: () => void;
}

export function useCategoryFilter(campaigns: FullCampaign[]): UseCategoryFilterReturn {
  const [selectedCategory, setSelectedCategory] = useState<CampaignCategory | "All">("All");

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: campaigns.length };

    campaigns.forEach((campaign) => {
      const category = campaign.category || "Other";
      counts[category] = (counts[category] || 0) + 1;
    });

    return counts;
  }, [campaigns]);

  // Filter campaigns by selected category
  const filteredCampaigns = useMemo(() => {
    if (selectedCategory === "All") {
      return campaigns;
    }
    return campaigns.filter((campaign) => campaign.category === selectedCategory);
  }, [campaigns, selectedCategory]);

  const clearFilter = () => {
    setSelectedCategory("All");
  };

  return {
    selectedCategory,
    setSelectedCategory,
    filteredCampaigns,
    categoryCounts,
    clearFilter,
  };
}
