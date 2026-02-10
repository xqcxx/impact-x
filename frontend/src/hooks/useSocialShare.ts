import { useState, useCallback } from "react";

interface ShareEvent {
  platform: string;
  campaignId: number;
  timestamp: number;
}

interface UseSocialShareReturn {
  lastShared: ShareEvent | null;
  shareCount: number;
  trackShare: (platform: string, campaignId: number) => void;
  getShareHistory: (campaignId: number) => ShareEvent[];
}

export function useSocialShare(): UseSocialShareReturn {
  const [lastShared, setLastShared] = useState<ShareEvent | null>(null);
  const [shareCount, setShareCount] = useState(0);

  const trackShare = useCallback((platform: string, campaignId: number) => {
    const event: ShareEvent = {
      platform,
      campaignId,
      timestamp: Date.now(),
    };

    setLastShared(event);
    setShareCount((prev) => prev + 1);

    // Store in localStorage for persistence
    try {
      const history = JSON.parse(localStorage.getItem("shareHistory") || "[]");
      history.push(event);
      // Keep only last 100 shares
      if (history.length > 100) {
        history.shift();
      }
      localStorage.setItem("shareHistory", JSON.stringify(history));
    } catch {
      // Ignore storage errors
    }

    // Log for analytics (could be sent to backend)
    console.log("Social share:", { platform, campaignId, timestamp: event.timestamp });
  }, []);

  const getShareHistory = useCallback((campaignId: number): ShareEvent[] => {
    try {
      const history: ShareEvent[] = JSON.parse(localStorage.getItem("shareHistory") || "[]");
      return history.filter((event) => event.campaignId === campaignId);
    } catch {
      return [];
    }
  }, []);

  return {
    lastShared,
    shareCount,
    trackShare,
    getShareHistory,
  };
}
