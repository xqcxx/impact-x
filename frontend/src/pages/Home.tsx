import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CampaignCard, type Campaign } from '../components/CampaignCard';
import { Search, Filter, Plus, Zap, Globe, Shield, RefreshCw, ArrowRight, Wallet, CheckCircle2 } from 'lucide-react';
import { CAMPAIGN_CATEGORIES } from '../lib/ipfs';
import { getAllCampaigns, filterCampaigns, type FullCampaign } from '../lib/campaigns';

export function HomePage() {
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

  // Stats
  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);
  const totalBackers = campaigns.reduce((sum, c) => sum + c.backers, 0);
  const successfulCampaigns = campaigns.filter(c => c.raised >= c.goal).length;

  return (
    <div className="space-y-20 animate-in">
      {/* Hero Section */}
      <section className="text-center py-20 px-4 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
            </span>
            <span className="text-xs font-medium text-dark-300 uppercase tracking-wider">
              Live on Stacks Testnet
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-8 leading-tight">
            <span className="text-dark-100">Fund the Future of</span>
            <br />
            <span className="gradient-text">Bitcoin Builders</span>
          </h1>
          
          <p className="text-xl text-dark-300 max-w-2xl mx-auto mb-10 font-body leading-relaxed">
            The first crowdfunding platform powered by <span className="text-primary-400 font-medium">USDCx</span>. 
            Bridge seamlessly from Ethereum, donate with confidence using smart contract escrow.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link 
              to="/create" 
              className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
            >
              <Plus className="w-5 h-5" />
              Start a Campaign
            </Link>
            <a 
              href="#campaigns" 
              className="btn-secondary flex items-center gap-2 text-lg px-8 py-4"
            >
              Explore Projects
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2">
              <img src="https://cryptologos.cc/logos/stacks-stx-logo.svg?v=026" className="w-6 h-6" alt="Stacks" />
              <span className="font-heading font-semibold text-dark-200">Stacks</span>
            </div>
            <div className="flex items-center gap-2">
              <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=026" className="w-6 h-6" alt="USDC" />
              <span className="font-heading font-semibold text-dark-200">USDCx</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-dark-200" />
              <span className="font-heading font-semibold text-dark-200">Circle</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Technical Highlight */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="glass-card p-1 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[80px]" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-heading font-bold text-dark-100 mb-6">
                Cross-Chain Giving, <br />
                <span className="text-primary-400">Simplified.</span>
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark-100 mb-1">Bridge from Ethereum</h3>
                    <p className="text-dark-400 text-sm">
                      Hold USDC on Ethereum? Use our built-in bridge powered by Circle's xReserve to move funds to Stacks instantly.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark-100 mb-1">Donate with USDCx</h3>
                    <p className="text-dark-400 text-sm">
                      Fund campaigns using SIP-010 USDCx. Fast, low-fee transactions secured by Bitcoin finality.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-success-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-success-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark-100 mb-1">Trustless Escrow</h3>
                    <p className="text-dark-400 text-sm">
                      Funds are held in a smart contract. If the goal isn't met, donors get an automatic refund.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Abstract Visual Representation of Bridge */}
              <div className="relative z-10 glass-card p-6 border-primary-500/20 bg-dark-900/50">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <img src="https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=026" className="w-6 h-6" alt="ETH" />
                    </div>
                    <div className="text-xs font-mono text-dark-400">Ethereum</div>
                  </div>
                  <div className="flex-1 px-4 relative">
                    <div className="h-0.5 w-full bg-gradient-to-r from-blue-500/50 to-primary-500/50"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-900 p-2 rounded-full border border-white/10">
                      <RefreshCw className="w-4 h-4 text-dark-300 animate-spin-slow" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Zap className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="text-xs font-mono text-dark-400">Stacks</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-white/5">
                    <span className="text-dark-400">Status</span>
                    <span className="text-success-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-white/5">
                    <span className="text-dark-400">Protocol</span>
                    <span className="text-dark-200">Circle xReserve</span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-white/5">
                    <span className="text-dark-400">Security</span>
                    <span className="text-dark-200">Bitcoin Finality</span>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary-500/20 rounded-full blur-2xl -z-10" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto px-4">
        <div className="stat-card group hover:border-primary-500/30 transition-colors">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet className="w-6 h-6 text-primary-400" />
          </div>
          <div className="stat-value">
            ${totalRaised > 0 ? (totalRaised / 1000).toFixed(0) + 'K+' : '0'}
          </div>
          <div className="stat-label">Total Raised</div>
        </div>
        <div className="stat-card group hover:border-primary-500/30 transition-colors">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Globe className="w-6 h-6 text-secondary-400" />
          </div>
          <div className="stat-value">
            {totalBackers}+
          </div>
          <div className="stat-label">Backers</div>
        </div>
        <div className="stat-card group hover:border-primary-500/30 transition-colors">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-success-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-6 h-6 text-success-400" />
          </div>
          <div className="stat-value">
            {successfulCampaigns}
          </div>
          <div className="stat-label">Funded Projects</div>
        </div>
      </section>

      {/* Campaigns Section */}
      <section id="campaigns" className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-heading font-bold text-dark-100 mb-2">
              Explore Campaigns
            </h2>
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
                placeholder="Search..."
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
              <div key={i} className="glass-card overflow-hidden animate-pulse border-white/5">
                <div className="h-56 bg-dark-800" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-dark-800 rounded w-3/4" />
                  <div className="h-4 bg-dark-800 rounded w-full" />
                  <div className="h-4 bg-dark-800 rounded w-2/3" />
                  <div className="pt-4 flex justify-between">
                    <div className="h-8 bg-dark-800 rounded w-20" />
                    <div className="h-8 bg-dark-800 rounded w-20" />
                  </div>
                </div>
              </div>
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
      </section>
    </div>
  );
}
