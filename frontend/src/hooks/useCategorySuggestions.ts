import { useMemo } from "react";
import { CampaignCategory } from "../lib/categories";
import { FullCampaign } from "../lib/campaigns";

interface SuggestionResult {
  suggestedCampaigns: FullCampaign[];
  relatedCategories: CampaignCategory[];
}

export function useCategorySuggestions(
  campaigns: FullCampaign[],
  currentCategory: CampaignCategory | null,
  currentCampaignId?: number,
): SuggestionResult {
  return useMemo(() => {
    if (!currentCategory || campaigns.length === 0) {
      return { suggestedCampaigns: [], relatedCategories: [] };
    }

    // Filter out current campaign if provided
    const otherCampaigns = campaigns.filter((c) => c.id !== currentCampaignId);

    // Get campaigns in the same category
    const sameCategory = otherCampaigns.filter((c) => c.category === currentCategory);

    // Find related categories (categories with similar campaign owners or backers)
    const categoryScores: Record<string, number> = {};

    sameCategory.forEach((campaign) => {
      otherCampaigns.forEach((other) => {
        if (other.category !== currentCategory) {
          // Boost score if same owner
          if (other.owner === campaign.owner) {
            categoryScores[other.category] = (categoryScores[other.category] || 0) + 3;
          }
          // Small boost for any campaign
          categoryScores[other.category] = (categoryScores[other.category] || 0) + 1;
        }
      });
    });

    // Get top 3 related categories
    const relatedCategories = Object.entries(categoryScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat as CampaignCategory);

    // Get suggestions from same category, sorted by recent and popular
    const suggestedCampaigns = sameCategory
      .sort((a, b) => {
        // Prioritize: funded campaigns, then by backer count, then by created date
        const aFunded = a.raised >= a.goal ? 1 : 0;
        const bFunded = b.raised >= b.goal ? 1 : 0;
        if (aFunded !== bFunded) return bFunded - aFunded;
        if (b.backers !== a.backers) return b.backers - a.backers;
        return b.createdAt - a.createdAt;
      })
      .slice(0, 4);

    return { suggestedCampaigns, relatedCategories };
  }, [campaigns, currentCategory, currentCampaignId]);
}
