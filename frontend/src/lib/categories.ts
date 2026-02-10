/**
 * Campaign Categories
 * Predefined categories for organizing campaigns
 */

export const CAMPAIGN_CATEGORIES = [
  "Technology",
  "Art & Creative",
  "Community",
  "DeFi",
  "Education",
  "Environment",
  "Gaming",
  "Health",
  "Infrastructure",
  "Music",
  "Social Impact",
  "Sports",
  "Other",
] as const;

export type CampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number];

// Category metadata with colors and descriptions
export const CATEGORY_METADATA: Record<
  CampaignCategory,
  {
    color: string;
    description: string;
    icon: string;
  }
> = {
  Technology: {
    color: "#3B82F6",
    description: "Software, hardware, and tech innovation projects",
    icon: "Cpu",
  },
  "Art & Creative": {
    color: "#EC4899",
    description: "Art, design, photography, and creative endeavors",
    icon: "Palette",
  },
  Community: {
    color: "#10B981",
    description: "Local initiatives, meetups, and community building",
    icon: "Users",
  },
  DeFi: {
    color: "#F59E0B",
    description: "Decentralized finance and blockchain projects",
    icon: "Coins",
  },
  Education: {
    color: "#8B5CF6",
    description: "Learning resources, courses, and educational content",
    icon: "BookOpen",
  },
  Environment: {
    color: "#22C55E",
    description: "Sustainability, conservation, and green initiatives",
    icon: "Leaf",
  },
  Gaming: {
    color: "#EF4444",
    description: "Video games, board games, and gaming platforms",
    icon: "Gamepad2",
  },
  Health: {
    color: "#06B6D4",
    description: "Healthcare, wellness, and medical innovation",
    icon: "Heart",
  },
  Infrastructure: {
    color: "#6366F1",
    description: "Public goods, tools, and infrastructure projects",
    icon: "Building2",
  },
  Music: {
    color: "#F97316",
    description: "Albums, concerts, and music-related projects",
    icon: "Music",
  },
  "Social Impact": {
    color: "#14B8A6",
    description: "Nonprofits, activism, and social causes",
    icon: "HeartHandshake",
  },
  Sports: {
    color: "#84CC16",
    description: "Athletic events, equipment, and sports initiatives",
    icon: "Trophy",
  },
  Other: {
    color: "#6B7280",
    description: "Projects that do not fit other categories",
    icon: "Circle",
  },
};

// Get category color
export function getCategoryColor(category: CampaignCategory): string {
  return CATEGORY_METADATA[category]?.color || "#6B7280";
}

// Get category icon name
export function getCategoryIcon(category: CampaignCategory): string {
  return CATEGORY_METADATA[category]?.icon || "Circle";
}

// Get category description
export function getCategoryDescription(category: CampaignCategory): string {
  return CATEGORY_METADATA[category]?.description || "";
}

// Validate category
export function isValidCategory(category: string): category is CampaignCategory {
  return CAMPAIGN_CATEGORIES.includes(category as CampaignCategory);
}
