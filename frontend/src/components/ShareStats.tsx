import { useEffect, useState } from "react";
import { Share2, TrendingUp, Users, ExternalLink } from "lucide-react";
import { getShareHistory } from "../lib/social";

interface ShareStatsProps {
  campaignId: number;
}

interface ShareStats {
  totalShares: number;
  platformBreakdown: Record<string, number>;
  recentShares: number;
}

export function ShareStats({ campaignId }: ShareStatsProps) {
  const [stats, setStats] = useState<ShareStats>({
    totalShares: 0,
    platformBreakdown: {},
    recentShares: 0,
  });

  useEffect(() => {
    const history = getShareHistory(campaignId);

    const platformBreakdown: Record<string, number> = {};
    let recentShares = 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    history.forEach((event) => {
      platformBreakdown[event.platform] = (platformBreakdown[event.platform] || 0) + 1;
      if (event.timestamp > oneDayAgo) {
        recentShares++;
      }
    });

    setStats({
      totalShares: history.length,
      platformBreakdown,
      recentShares,
    });
  }, [campaignId]);

  const platforms = [
    { name: "Twitter", color: "#1DA1F2" },
    { name: "Facebook", color: "#4267B2" },
    { name: "LinkedIn", color: "#0077B5" },
    { name: "Other", color: "#6B7280" },
  ];

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading font-semibold text-dark-100 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary-400" />
          Share Stats
        </h3>
        <div className="flex items-center gap-1 text-xs text-success-400">
          <TrendingUp className="w-3 h-3" />
          <span>+{stats.recentShares} today</span>
        </div>
      </div>

      {/* Total Shares */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
          <Users className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <p className="text-2xl font-heading font-bold text-dark-100">
            {stats.totalShares.toLocaleString()}
          </p>
          <p className="text-sm text-dark-500">Total shares</p>
        </div>
      </div>

      {/* Platform Breakdown */}
      {stats.totalShares > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-dark-500 uppercase tracking-wider">By Platform</p>
          {platforms.map((platform) => {
            const count = stats.platformBreakdown[platform.name] || 0;
            const percentage = stats.totalShares > 0 ? (count / stats.totalShares) * 100 : 0;

            return (
              <div key={platform.name} className="flex items-center gap-3">
                <div className="w-20 text-sm text-dark-400">{platform.name}</div>
                <div className="flex-1 h-2 rounded-full bg-dark-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: platform.color,
                    }}
                  />
                </div>
                <div className="w-12 text-right text-sm text-dark-300">{count}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
        <p className="text-sm text-primary-300 flex items-start gap-2">
          <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0" />
          Campaigns shared on social media receive 3x more donations on average
        </p>
      </div>
    </div>
  );
}

// Helper function to get share history from localStorage
function getShareHistory(campaignId: number) {
  try {
    const history = JSON.parse(localStorage.getItem("shareHistory") || "[]");
    return history.filter((event: { campaignId: number }) => event.campaignId === campaignId);
  } catch {
    return [];
  }
}
