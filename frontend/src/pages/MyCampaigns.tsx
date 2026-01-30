import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  ExternalLink, 
  TrendingUp, 
  Users, 
  DollarSign,
  CheckCircle,
  Clock,
  Wallet,
  ArrowRight,
  RefreshCw,
  Loader2,
  Edit,
} from 'lucide-react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { ProgressBar } from '../components/ProgressBar';
import { EditCampaignModal } from '../components/EditCampaignModal';
import { CampaignCardSkeleton } from '../components/Skeleton';
import { getCampaignsByOwner, type FullCampaign } from '../lib/campaigns';
import { claimFunds } from '../lib/stacks';

export function MyCampaignsPage() {
  const { connected, connect, stxAddress } = useStacksWallet();
  const [campaigns, setCampaigns] = useState<FullCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<FullCampaign | null>(null);

  // Load campaigns when connected
  useEffect(() => {
    if (connected && stxAddress) {
      loadCampaigns();
    }
  }, [connected, stxAddress]);

  const loadCampaigns = async () => {
    if (!stxAddress) return;
    
    setLoading(true);
    try {
      const data = await getCampaignsByOwner(stxAddress);
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (campaignId: number) => {
    setClaimingId(campaignId);
    try {
      await claimFunds(campaignId);
      // Reload after claim
      setTimeout(loadCampaigns, 3000);
    } catch (error) {
      console.error('Failed to claim:', error);
    } finally {
      setClaimingId(null);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-in">
        <div className="glass-card p-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-500/15 flex items-center justify-center">
            <Wallet className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-dark-100 mb-3">Connect Your Wallet</h1>
          <p className="text-dark-400 mb-8">
            Connect your Stacks wallet to view and manage your campaigns.
          </p>
          <button onClick={connect} className="btn-primary">
            Connect Stacks Wallet
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);
  const totalBackers = campaigns.reduce((sum, c) => sum + c.backers, 0);
  const activeCampaigns = campaigns.filter(c => c.daysLeft > 0).length;

  return (
    <div className="space-y-8 animate-in max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-dark-100">My Campaigns</h1>
          <p className="text-dark-400">
            Manage your crowdfunding campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCampaigns}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link to="/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 hover:border-primary-500/30 transition-all hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-500/15">
              <TrendingUp className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-dark-100">
                {campaigns.length}
              </div>
              <div className="text-sm text-dark-500">Total Campaigns</div>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 hover:border-success-500/30 transition-all hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-500/15">
              <DollarSign className="w-5 h-5 text-success-400" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-dark-100">
                ${totalRaised.toLocaleString()}
              </div>
              <div className="text-sm text-dark-500">Total Raised</div>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 hover:border-secondary-500/30 transition-all hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-secondary-500/15">
              <Users className="w-5 h-5 text-secondary-400" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-dark-100">
                {totalBackers}
              </div>
              <div className="text-sm text-dark-500">Total Backers</div>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 hover:border-primary-500/30 transition-all hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-500/15">
              <Clock className="w-5 h-5 text-primary-300" />
            </div>
            <div>
              <div className="text-2xl font-heading font-bold text-dark-100">
                {activeCampaigns}
              </div>
              <div className="text-sm text-dark-500">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse border-white/5">
              <div className="flex gap-6">
                <div className="w-56 h-32 bg-white/5 rounded-lg" />
                <div className="flex-1 space-y-4">
                  <div className="h-5 bg-white/5 rounded w-1/2" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-2 bg-white/5 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="glass-card p-12 text-center border-white/5">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <Plus className="w-10 h-10 text-dark-500" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-dark-100 mb-2">No campaigns yet</h2>
          <p className="text-dark-400 mb-6">
            Create your first campaign and start raising funds.
          </p>
          <Link to="/create" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const isComplete = campaign.raised >= campaign.goal;
            const isExpired = campaign.daysLeft <= 0;
            const canClaim = isComplete && !campaign.claimed;
            const isClaiming = claimingId === campaign.id;

            return (
              <div
                key={campaign.id}
                className="glass-card overflow-hidden hover:border-white/10 transition-colors"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="md:w-56 h-40 md:h-auto flex-shrink-0 relative">
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-dark-900/80 hidden md:block" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading font-semibold text-dark-100 text-lg">
                            {campaign.title}
                          </h3>
                          {isComplete && (
                            <span className="badge-success flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Funded
                            </span>
                          )}
                          {campaign.claimed && (
                            <span className="badge px-2 py-0.5 bg-dark-700 text-dark-400">
                              Claimed
                            </span>
                          )}
                          {isExpired && !isComplete && (
                            <span className="badge px-2 py-0.5 bg-dark-700 text-dark-400">
                              Ended
                            </span>
                          )}
                        </div>
                        <span className="badge-primary text-xs">{campaign.category}</span>
                      </div>
                      <Link
                        to={`/campaign/${campaign.id}`}
                        className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm transition-colors"
                      >
                        View
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <ProgressBar
                        raised={campaign.raised}
                        goal={campaign.goal}
                        size="sm"
                      />
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-dark-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-secondary-400" />
                          {campaign.backers} backers
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-primary-400" />
                          {campaign.daysLeft > 0
                            ? `${campaign.daysLeft} days left`
                            : 'Ended'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-success-400" />
                          ${campaign.raised.toLocaleString()} / ${campaign.goal.toLocaleString()}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!campaign.claimed && (
                          <button
                            onClick={() => setEditingCampaign(campaign)}
                            className="btn-secondary py-2 text-sm flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                        
                        {canClaim && (
                          <button 
                            onClick={() => handleClaim(campaign.id)}
                            disabled={isClaiming}
                            className="btn-primary py-2 text-sm flex items-center gap-2"
                          >
                            {isClaiming ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Claiming...
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-4 h-4" />
                                Claim Funds
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Escrow Info */}
      <div className="glass-card p-6 border-primary-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary-500/15 flex-shrink-0">
            <ArrowRight className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-dark-100 mb-2">Escrow-Based Donations</h3>
            <p className="text-sm text-dark-400 mb-4">
              All donations are held in smart contract escrow. When your campaign goal is met, 
              you can claim funds (95% payout, 5% platform fee). If the goal isn't met by the deadline, 
              donors can request refunds.
            </p>
            <a 
              href="https://explorer.hiro.so/?chain=testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-400 font-medium hover:text-primary-300 transition-colors"
            >
              View on Stacks Explorer →
            </a>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCampaign && (
        <EditCampaignModal
          isOpen={!!editingCampaign}
          onClose={() => setEditingCampaign(null)}
          campaign={editingCampaign}
          onSuccess={() => {
            setEditingCampaign(null);
            loadCampaigns();
          }}
        />
      )}
    </div>
  );
}
