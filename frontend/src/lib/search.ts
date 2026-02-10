/**
 * Advanced Search Utilities
 * Provides comprehensive search, filter, and sorting for campaigns
 */

import { FullCampaign } from "./campaigns";
import { CampaignCategory } from "./categories";

export type SortOption =
  | "newest"
  | "oldest"
  | "most-funded"
  | "least-funded"
  | "most-backers"
  | "ending-soon"
  | "alphabetical";

export type StatusFilter = "all" | "active" | "funded" | "ended";

export interface SearchFilters {
  query?: string;
  category?: CampaignCategory | "All";
  status?: StatusFilter;
  minGoal?: number;
  maxGoal?: number;
  minFunded?: number; // Percentage
  maxFunded?: number; // Percentage
  daysLeft?: number; // Maximum days left
  sortBy?: SortOption;
}

/**
 * Apply all filters to campaigns
 */
export function applyFilters(campaigns: FullCampaign[], filters: SearchFilters): FullCampaign[] {
  let filtered = [...campaigns];

  // Text search
  if (filters.query && filters.query.trim()) {
    const query = filters.query.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        c.owner.toLowerCase().includes(query),
    );
  }

  // Category filter
  if (filters.category && filters.category !== "All") {
    filtered = filtered.filter((c) => c.category === filters.category);
  }

  // Status filter
  if (filters.status && filters.status !== "all") {
    switch (filters.status) {
      case "active":
        filtered = filtered.filter((c) => c.daysLeft > 0 && c.raised < c.goal);
        break;
      case "funded":
        filtered = filtered.filter((c) => c.raised >= c.goal);
        break;
      case "ended":
        filtered = filtered.filter((c) => c.daysLeft <= 0);
        break;
    }
  }

  // Goal amount range
  if (filters.minGoal !== undefined) {
    filtered = filtered.filter((c) => c.goal >= filters.minGoal!);
  }
  if (filters.maxGoal !== undefined) {
    filtered = filtered.filter((c) => c.goal <= filters.maxGoal!);
  }

  // Funding percentage range
  if (filters.minFunded !== undefined) {
    filtered = filtered.filter((c) => (c.raised / c.goal) * 100 >= filters.minFunded!);
  }
  if (filters.maxFunded !== undefined) {
    filtered = filtered.filter((c) => (c.raised / c.goal) * 100 <= filters.maxFunded!);
  }

  // Days left filter
  if (filters.daysLeft !== undefined) {
    filtered = filtered.filter((c) => c.daysLeft <= filters.daysLeft! && c.daysLeft > 0);
  }

  return filtered;
}

/**
 * Sort campaigns
 */
export function sortCampaigns(
  campaigns: FullCampaign[],
  sortBy: SortOption = "newest",
): FullCampaign[] {
  const sorted = [...campaigns];

  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => b.createdAt - a.createdAt);

    case "oldest":
      return sorted.sort((a, b) => a.createdAt - b.createdAt);

    case "most-funded":
      return sorted.sort((a, b) => {
        const aPercent = (a.raised / a.goal) * 100;
        const bPercent = (b.raised / b.goal) * 100;
        return bPercent - aPercent;
      });

    case "least-funded":
      return sorted.sort((a, b) => {
        const aPercent = (a.raised / a.goal) * 100;
        const bPercent = (b.raised / b.goal) * 100;
        return aPercent - bPercent;
      });

    case "most-backers":
      return sorted.sort((a, b) => b.backers - a.backers);

    case "ending-soon":
      return sorted
        .filter((c) => c.daysLeft > 0)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .concat(sorted.filter((c) => c.daysLeft <= 0));

    case "alphabetical":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));

    default:
      return sorted;
  }
}

/**
 * Get sort option display name
 */
export function getSortLabel(option: SortOption): string {
  const labels: Record<SortOption, string> = {
    newest: "Newest First",
    oldest: "Oldest First",
    "most-funded": "Most Funded",
    "least-funded": "Least Funded",
    "most-backers": "Most Backers",
    "ending-soon": "Ending Soon",
    alphabetical: "A to Z",
  };
  return labels[option];
}

/**
 * Get status filter display name
 */
export function getStatusLabel(status: StatusFilter): string {
  const labels: Record<StatusFilter, string> = {
    all: "All Campaigns",
    active: "Active",
    funded: "Funded",
    ended: "Ended",
  };
  return labels[status];
}

/**
 * Search and filter with sorting
 */
export function searchAndFilter(campaigns: FullCampaign[], filters: SearchFilters): FullCampaign[] {
  const filtered = applyFilters(campaigns, filters);
  return sortCampaigns(filtered, filters.sortBy);
}
