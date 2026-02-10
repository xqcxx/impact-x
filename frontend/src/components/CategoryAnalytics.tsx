import { CampaignCategory, CAMPAIGN_CATEGORIES, CATEGORY_METADATA } from "../lib/categories";
import { FullCampaign } from "../lib/campaigns";
import { useMemo } from "react";
import { TrendingUp, DollarSign, Users, Target } from "lucide-react";

interface CategoryAnalyticsProps {
  campaigns: FullCampaign[];
}

interface CategoryStats {
  category: CampaignCategory;
  count: number;
  totalRaised: number;
  totalBackers: number;
  fundedCount: number;
  averageGoal: number;
}

export function CategoryAnalytics({ campaigns }: CategoryAnalyticsProps) {
  const stats = useMemo(() => {
    const categoryStats: Record<string, CategoryStats> = {};

    // Initialize all categories
    CAMPAIGN_CATEGORIES.forEach((cat) => {
      categoryStats[cat] = {
        category: cat,
        count: 0,
        totalRaised: 0,
        totalBackers: 0,
        fundedCount: 0,
        averageGoal: 0,
      };
    });

    // Calculate stats
    campaigns.forEach((campaign) => {
      const category = (campaign.category || "Other") as CampaignCategory;
      if (categoryStats[category]) {
        categoryStats[category].count += 1;
        categoryStats[category].totalRaised += campaign.raised;
        categoryStats[category].totalBackers += campaign.backers;
        if (campaign.raised >= campaign.goal) {
          categoryStats[category].fundedCount += 1;
        }
      }
    });

    // Calculate averages
    Object.values(categoryStats).forEach((stat) => {
      if (stat.count > 0) {
        stat.averageGoal = Math.round(stat.totalRaised / stat.count);
      }
    });

    // Sort by total raised
    return Object.values(categoryStats)
      .filter((stat) => stat.count > 0)
      .sort((a, b) => b.totalRaised - a.totalRaised);
  }, [campaigns]);

  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);

  return (
    <div className="glass-card p-6 space-y-6">
      <h3 className="text-lg font-heading font-semibold text-dark-100 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary-400" />
        Category Analytics
      </h3>

      <div className="space-y-4">
        {stats.map((stat) => {
          const color = CATEGORY_METADATA[stat.category].color;
          const percentage = totalRaised > 0 ? (stat.totalRaised / totalRaised) * 100 : 0;
          const successRate = stat.count > 0 ? (stat.fundedCount / stat.count) * 100 : 0;

          return (
            <div key={stat.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-dark-200">{stat.category}</span>
                <span className="text-sm text-dark-400">
                  {stat.count} campaigns • {successRate.toFixed(0)}% success
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-dark-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(percentage, 1)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>

              <div className="flex items-center gap-4 text-sm text-dark-500">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />${stat.totalRaised.toLocaleString()} raised
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {stat.totalBackers} backers
                </span>
              </div>
            </div>
          );
        })}

        {stats.length === 0 && (
          <div className="text-center py-8 text-dark-500">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No campaigns yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
