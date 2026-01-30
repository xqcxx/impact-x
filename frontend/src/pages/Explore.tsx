import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CampaignCard, type Campaign } from '../components/CampaignCard';
import { CampaignCardSkeleton } from '../components/Skeleton';
import { Search, Filter, Plus, RefreshCw } from 'lucide-react';
import { CAMPAIGN_CATEGORIES } from '../lib/ipfs';
import { getAllCampaigns, filterCampaigns, type FullCampaign } from '../lib/campaigns';

export function ExplorePage() {
  const [campaigns, setCampaigns] = useState<FullCampaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      console.error('Failed to load campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter campaigns
  const filteredCampaigns = filterCampaigns(campaigns, {
    searchQuery,
    category: selectedCategory,
  });

  // Convert FullCampaign to Campaign for CampaignCard
  const displayCampaigns: Campaign[] = filteredCampaigns.map(c => ({
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
          <h1 className="text-3xl font-heading font-bold text-dark-100 mb-2">
            Explore Campaigns
          </h1>
          <p className="text-dark-400">
            Discover and fund the next generation of Bitcoin applications
          </p>
        </div>
        
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 py-2 text-sm"
            />
          </div>
          <button
            onClick={loadCampaigns}
            disabled={loading}
            className="btn-secondary py-2 px-4 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <Filter className="w-4 h-4 text-dark-500 flex-shrink-0 mr-2" />
        {['All', ...CAMPAIGN_CATEGORIES].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'bg-primary-500 text-dark-900 shadow-lg shadow-primary-500/20'
                : 'bg-white/5 text-dark-300 hover:bg-white/10 hover:text-dark-100 border border-white/5'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid */}
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
      ) : displayCampaigns.length === 0 ? (
        <div className="glass-card text-center py-24 border-white/5">
          <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-dark-600" />
          </div>
          <h3 className="text-xl font-heading font-semibold text-dark-200 mb-2">No campaigns found</h3>
          <p className="text-dark-400 text-lg mb-8 max-w-md mx-auto">
            {campaigns.length === 0 
              ? 'Be the first to launch a campaign on Impact-X!'
              : 'We couldn\'t find any campaigns matching your criteria.'}
          </p>
          <Link to="/create" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Start a Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}