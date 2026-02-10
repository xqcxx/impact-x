/**
 * Advanced Search System Documentation
 *
 * A comprehensive search and filtering system for campaign discovery.
 *
 * ## Features
 *
 * ### Text Search
 * - Search across campaign titles, descriptions, categories, and owner addresses
 * - Real-time filtering as users type
 * - Clear button for quick reset
 *
 * ### Category Filtering
 * - Filter by 13 predefined categories
 * - Visual category badges with icons
 * - Campaign count per category
 *
 * ### Status Filtering
 * - All: Show all campaigns
 * - Active: Campaigns currently accepting donations
 * - Funded: Campaigns that reached their goal
 * - Ended: Campaigns past their deadline
 *
 * ### Advanced Filters
 * - **Goal Range**: Filter by minimum/maximum funding goal
 * - **Funding Progress**: Filter by percentage funded (0-100%)
 * - **Days Left**: Show campaigns ending within X days
 *
 * ### Sorting Options
 * 1. Newest First - Most recently created campaigns
 * 2. Oldest First - Earliest created campaigns
 * 3. Most Funded - Highest funding percentage
 * 4. Least Funded - Lowest funding percentage
 * 5. Most Backers - Campaigns with most supporters
 * 6. Ending Soon - Sorted by deadline (soonest first)
 * 7. Alphabetical - A to Z by title
 *
 * ## Components
 *
 * ### SearchBar
 * Text input with search icon and clear button
 *
 * ### StatusFilterTabs
 * Horizontal tabs showing campaign status with counts
 *
 * ### CategoryFilter
 * Visual category selection with badges and icons
 *
 * ### SortDropdown
 * Dropdown menu with 7 sorting options
 *
 * ### AdvancedFilters
 * Collapsible panel with goal, funding, and time filters
 *
 * ### ActiveFilters
 * Display active filters as removable badges
 *
 * ### SearchResultsHeader
 * Shows result count and match percentage
 *
 * ### EmptySearchResults
 * Empty state with clear filters option
 *
 * ## Hooks
 *
 * ### useAdvancedSearch
 * Main hook managing all search state and filtering logic
 *
 * ```tsx
 * const {
 *   filteredCampaigns,
 *   filters,
 *   setQuery,
 *   setCategory,
 *   setStatus,
 *   setGoalRange,
 *   setFundingRange,
 *   setDaysLeft,
 *   setSortBy,
 *   clearFilters,
 *   activeFilterCount,
 * } = useAdvancedSearch(campaigns);
 * ```
 *
 * ## Performance Optimizations
 *
 * - Memoized filtering to prevent unnecessary recalculations
 * - Active filter count calculation
 * - Efficient array operations
 * - Debounced search input (can be added)
 *
 * ## Usage Example
 *
 * ```tsx
 * import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
 * import { SearchBar } from '../components/SearchBar';
 * import { SortDropdown } from '../components/SortDropdown';
 *
 * function ExplorePage() {
 *   const [campaigns, setCampaigns] = useState([]);
 *   const { filteredCampaigns, filters, setQuery, setSortBy } = useAdvancedSearch(campaigns);
 *
 *   return (
 *     <div>
 *       <SearchBar value={filters.query} onChange={setQuery} />
 *       <SortDropdown selectedSort={filters.sortBy} onSelectSort={setSortBy} />
 *       {filteredCampaigns.map(campaign => <CampaignCard {...campaign} />)}
 *     </div>
 *   );
 * }
 * ```
 *
 * ## Filter Combinations
 *
 * All filters work together:
 * - Search + Category + Status
 * - Goal range + Funding progress
 * - Multiple filters + Sorting
 *
 * ## Future Enhancements
 *
 * - Debounced search input
 * - Search history and suggestions
 * - Saved filter presets
 * - URL parameter sync for sharing searches
 * - Advanced text search with operators (AND, OR, NOT)
 * - Faceted search with count predictions
 * - Search analytics and popular queries
 */

export {};
