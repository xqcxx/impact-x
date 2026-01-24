import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Zap, Globe, Shield, RefreshCw, ArrowRight, Wallet, CheckCircle2 } from 'lucide-react';
import { getAllCampaigns, type FullCampaign } from '../lib/campaigns';

export function HomePage() {
  const [campaigns, setCampaigns] = useState<FullCampaign[]>([]);
  const [, setLoading] = useState(true);

  // Fetch campaigns on mount for stats
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await getAllCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

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
            <Link 
              to="/explore" 
              className="btn-secondary flex items-center gap-2 text-lg px-8 py-4"
            >
              Explore Projects
              <ArrowRight className="w-5 h-5" />
            </Link>
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
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto px-4 pb-20">
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
    </div>
  );
}