import { useState, useMemo } from "react";
import { FullCampaign } from "../lib/campaigns";
import { SearchFilters, searchAndFilter, SortOption, StatusFilter } from "../lib/search";
import { CampaignCategory } from "../lib/categories";

interface UseAdvancedSearchReturn {
  filteredCampaigns: FullCampaign[];
  filters: SearchFilters;
  setQuery: (query: string) => void;
  setCategory: (category: CampaignCategory | "All") => void;
  setStatus: (status: StatusFilter) => void;
  setGoalRange: (min?: number, max?: number) => void;
  setFundingRange: (min?: number, max?: number) => void;
  setDaysLeft: (days?: number) => void;
  setSortBy: (sort: SortOption) => void;
  clearFilters: () => void;
  activeFilterCount: number;
}

export function useAdvancedSearch(campaigns: FullCampaign[]): UseAdvancedSearchReturn {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "All",
    status: "all",
    sortBy: "newest",
  });

  const filteredCampaigns = useMemo(() => {
    return searchAndFilter(campaigns, filters);
  }, [campaigns, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.query && filters.query.trim()) count++;
    if (filters.category && filters.category !== "All") count++;
    if (filters.status && filters.status !== "all") count++;
    if (filters.minGoal !== undefined || filters.maxGoal !== undefined) count++;
    if (filters.minFunded !== undefined || filters.maxFunded !== undefined) count++;
    if (filters.daysLeft !== undefined) count++;
    return count;
  }, [filters]);

  const setQuery = (query: string) => {
    setFilters((prev) => ({ ...prev, query }));
  };

  const setCategory = (category: CampaignCategory | "All") => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const setStatus = (status: StatusFilter) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const setGoalRange = (min?: number, max?: number) => {
    setFilters((prev) => ({
      ...prev,
      minGoal: min,
      maxGoal: max,
    }));
  };

  const setFundingRange = (min?: number, max?: number) => {
    setFilters((prev) => ({
      ...prev,
      minFunded: min,
      maxFunded: max,
    }));
  };

  const setDaysLeft = (days?: number) => {
    setFilters((prev) => ({ ...prev, daysLeft: days }));
  };

  const setSortBy = (sortBy: SortOption) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      category: "All",
      status: "all",
      sortBy: "newest",
    });
  };

  return {
    filteredCampaigns,
    filters,
    setQuery,
    setCategory,
    setStatus,
    setGoalRange,
    setFundingRange,
    setDaysLeft,
    setSortBy,
    clearFilters,
    activeFilterCount,
  };
}
