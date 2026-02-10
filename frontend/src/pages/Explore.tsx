import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { CampaignCard, type Campaign } from "../components/CampaignCard";
import { CampaignCardSkeleton } from "../components/Skeleton";
import { CategoryFilter } from "../components/CategoryFilter";
import { SearchBar } from "../components/SearchBar";
import { SortDropdown } from "../components/SortDropdown";
import { StatusFilterTabs } from "../components/StatusFilterTabs";
import { AdvancedFilters } from "../components/AdvancedFilters";
import { ActiveFilters } from "../components/ActiveFilters";
import { SearchResultsHeader, EmptySearchResults } from "../components/SearchResults";
import { Plus, RefreshCw } from "lucide-react";
import { useAdvancedSearch } from "../hooks/useAdvancedSearch";
import { getAllCampaigns, type FullCampaign } from "../lib/campaigns";
import { StatusFilter } from "../lib/search";

export function ExplorePage() {
  const [campaigns, setCampaigns] = useState<FullCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
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
  } = useAdvancedSearch(campaigns);

  // Fetch campaigns on mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
      setError("Failed to load campaigns. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: campaigns.length,
      active: 0,
      funded: 0,
      ended: 0,
    };
    campaigns.forEach((c) => {
      if (c.raised >= c.goal) counts.funded++;
      else if (c.daysLeft > 0) counts.active++;
      else counts.ended++;
    });
    return counts;
  }, [campaigns]);

  // Filter removal handler
  const handleRemoveFilter = (key: string) => {
    switch (key) {
      case "query":
        setQuery("");
        break;
      case "category":
        setCategory("All");
        break;
      case "status":
        setStatus("all");
        break;
      case "goalRange":
        setGoalRange(undefined, undefined);
        break;
      case "fundingRange":
        setFundingRange(undefined, undefined);
        break;
      case "daysLeft":
        setDaysLeft(undefined);
        break;
    }
  };

  // Filter campaigns by search query on top of category filter
  const searchFilteredCampaigns = filterCampaigns(categoryFilteredCampaigns, {
    searchQuery,
  });

  // Convert FullCampaign to Campaign for CampaignCard
  const displayCampaigns: Campaign[] = filteredCampaigns.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    imageUrl: c.imageUrl,
    goal: c.goal,
    raised: c.raised,
    backers: c.backers,
    daysLeft: c.daysLeft,
    category: c.category,
    owner: c.owner,
  }));

  return (
    <div className="space-y-8 animate-in max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 pt-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-dark-100 mb-2">Explore Campaigns</h1>
          <p className="text-dark-400">
            Discover and fund the next generation of Bitcoin applications
          </p>
        </div>

        {/* Search and Actions */}
        <div className="flex gap-3 w-full md:w-auto">
          <SearchBar
            value={filters.query || ""}
            onChange={setQuery}
            placeholder="Search campaigns..."
          />
          <button
            onClick={loadCampaigns}
            disabled={loading}
            className="btn-secondary px-4 flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="pt-4">
        <StatusFilterTabs
          selectedStatus={filters.status || "all"}
          onSelectStatus={setStatus}
          counts={statusCounts}
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <CategoryFilter
            selectedCategory={filters.category || "All"}
            onSelectCategory={setCategory}
          />
        </div>
        <div className="flex gap-2">
          <AdvancedFilters
            minGoal={filters.minGoal}
            maxGoal={filters.maxGoal}
            minFunded={filters.minFunded}
            maxFunded={filters.maxFunded}
            daysLeft={filters.daysLeft}
            onGoalRangeChange={setGoalRange}
            onFundingRangeChange={setFundingRange}
            onDaysLeftChange={setDaysLeft}
            onClear={() => {
              setGoalRange(undefined, undefined);
              setFundingRange(undefined, undefined);
              setDaysLeft(undefined);
            }}
          />
          <SortDropdown selectedSort={filters.sortBy || "newest"} onSelectSort={setSortBy} />
        </div>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <ActiveFilters
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={clearFilters}
        />
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="glass-card text-center py-20 border-red-500/20">
          <p className="text-dark-400 text-lg mb-6">{error}</p>
          <button onClick={loadCampaigns} className="btn-primary">
            Try Again
          </button>
        </div>
      ) : (
        <>
          <SearchResultsHeader
            totalResults={campaigns.length}
            filteredResults={displayCampaigns.length}
            isFiltered={activeFilterCount > 0}
          />
          {displayCampaigns.length === 0 ? (
            <EmptySearchResults hasFilters={activeFilterCount > 0} onClearFilters={clearFilters} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
              {displayCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
