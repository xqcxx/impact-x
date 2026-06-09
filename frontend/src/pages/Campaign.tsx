import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Share2, 
  Clock, 
  Users, 
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Loader2,
  ArrowDownCircle,
  Twitter,
  Lock,
  Heart,
  Send,
  MessageSquare
} from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';
import { DonateModal } from '../components/DonateModal';
import { DonationList } from '../components/DonationList';
import { truncateAddress } from '../lib/helpers';
import { getFullCampaign, type FullCampaign } from '../lib/campaigns';
import { claimFunds, endorseCampaign, fetchHasEndorsed, postCampaignUpdate } from '../lib/stacks';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { ACTIVE_NETWORK } from '../lib/constants';
import { uploadJSONToIPFS } from '../lib/ipfs';

const stacksExplorerChain = ACTIVE_NETWORK === 'testnet' ? '?chain=testnet' : '';

export function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const { connected, stxAddress } = useStacksWallet();
  const [campaign, setCampaign] = useState<FullCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [hasEndorsed, setHasEndorsed] = useState(false);
  const [endorsing, setEndorsing] = useState(false);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [postingUpdate, setPostingUpdate] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, [id, stxAddress]);

  const loadCampaign = async () => {
    setLoading(true);
    try {
      const campaignId = parseInt(id || '1');
      const data = await getFullCampaign(campaignId);
      setCampaign(data);
      setHasEndorsed(await fetchHasEndorsed(campaignId, stxAddress ?? undefined));
    } catch (error) {
      console.error('Failed to load campaign:', error);
      toast.error('Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign?.title,
          text: campaign?.description,
          url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleTwitterShare = () => {
    if (!campaign) return;
    const text = `Check out "${campaign.title}" on Impact-X! Support with USDCx on Stacks. 🚀`;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`, '_blank');
  };

  const handleClaim = async () => {
    if (!campaign) return;
    
    setClaiming(true);
    const toastId = toast.loading('Processing claim...');
    
    try {
      const result = await claimFunds(campaign.id);
      console.log('Claim transaction:', result.txId);
      setClaimSuccess(true);
      toast.success('Funds claimed successfully!', { id: toastId });
      
      // Reload campaign after claim
      setTimeout(loadCampaign, 3000);
    } catch (error: any) {
      console.error('Failed to claim funds:', error);
      toast.error(error.message || 'Failed to claim funds', { id: toastId });
    } finally {
      setClaiming(false);
    }
  };

  const handleEndorse = async () => {
    if (!campaign) return;
    if (!connected) {
      toast.error('Connect your Stacks wallet to endorse this campaign');
      return;
    }

    setEndorsing(true);
    const toastId = toast.loading('Submitting endorsement...');

    try {
      const result = await endorseCampaign(campaign.id);
      console.log('Endorsement transaction:', result.txId);
      setHasEndorsed(true);
      toast.success('Campaign endorsed!', { id: toastId });
      setTimeout(loadCampaign, 3000);
    } catch (error: any) {
      console.error('Failed to endorse campaign:', error);
      toast.error(error.message || 'Failed to endorse campaign', { id: toastId });
    } finally {
      setEndorsing(false);
    }
  };

  const handlePostUpdate = async () => {
    if (!campaign) return;
    if (!updateTitle.trim() || !updateBody.trim()) {
      toast.error('Add both an update title and details');
      return;
    }

    setPostingUpdate(true);
    const toastId = toast.loading('Uploading update...');

    try {
      const ipfsHash = await uploadJSONToIPFS(
        {
          title: updateTitle.trim(),
          body: updateBody.trim(),
          createdAt: Date.now(),
        },
        `impact-x-campaign-${campaign.id}-update-${Date.now()}`
      );

      toast.loading('Posting update on-chain...', { id: toastId });
      const result = await postCampaignUpdate(campaign.id, ipfsHash);
      console.log('Campaign update transaction:', result.txId);
      setUpdateTitle('');
      setUpdateBody('');
      toast.success('Update posted!', { id: toastId });
      setTimeout(loadCampaign, 3000);
    } catch (error: any) {
      console.error('Failed to post update:', error);
      toast.error(error.message || 'Failed to post update', { id: toastId });
    } finally {
      setPostingUpdate(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse space-y-6 pt-8 px-4">
        <div className="h-8 bg-white/5 rounded w-24" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-80 bg-white/5 rounded-2xl" />
            <div className="h-10 bg-white/5 rounded w-3/4" />
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="h-4 bg-white/5 rounded w-full" />
          </div>
          <div className="h-96 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="max-w-md mx-auto mt-20 glass-card text-center py-16 px-6">
        <AlertTriangle className="w-12 h-12 text-primary-400 mx-auto mb-4" />
        <h2 className="text-xl font-heading font-semibold text-dark-100 mb-2">Campaign not found</h2>
        <p className="text-dark-400 mb-6">This campaign may have been removed or doesn't exist.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to campaigns
        </Link>
      </div>
    );
  }

  const isComplete = campaign.raised >= campaign.goal;
  const isExpired = campaign.daysLeft <= 0;
  const percentage = Math.min((campaign.raised / campaign.goal) * 100, 100);
  const isOwner = connected && stxAddress === campaign.owner;
  const canClaim = isOwner && isComplete && !campaign.claimed;

  return (
    <div className="max-w-5xl mx-auto animate-in px-4 pt-8 pb-20">
      {/* Back Link */}
      <Link 
        to="/explore" 
        className="inline-flex items-center gap-2 text-dark-400 hover:text-dark-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-body">Back to campaigns</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Image */}
          <div className="relative rounded-2xl overflow-hidden glass-card group">
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full h-64 md:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent" />
            
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="badge-primary shadow-lg shadow-primary-500/20">
                {campaign.category}
              </span>
              {isComplete && (
                <span className="badge-success flex items-center gap-1 shadow-lg shadow-success-500/20">
                  <CheckCircle className="w-3 h-3" />
                  Funded
                </span>
              )}
              {campaign.claimed && (
                <span className="badge px-2 py-0.5 bg-dark-700 text-dark-400">
                  Claimed
                </span>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-dark-100 mb-4 leading-tight">
              {campaign.title}
            </h1>
            <p className="text-dark-300 text-lg font-body leading-relaxed">
              {campaign.description}
            </p>
          </div>

          {/* Story */}
          {campaign.story && (
            <div className="glass-card p-8">
              <h2 className="text-xl font-heading font-bold text-dark-100 mb-6 border-b border-white/5 pb-4">
                About the Campaign
              </h2>
              <div 
                className="prose prose-invert max-w-none prose-headings:font-heading prose-a:text-primary-400"
                dangerouslySetInnerHTML={{ __html: campaign.story }}
              />
            </div>
          )}

          {/* Creator Updates */}
          <div className="glass-card p-8">
            <h2 className="text-xl font-heading font-bold text-dark-100 mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
              <MessageSquare className="w-5 h-5 text-primary-400" />
              Creator Updates
            </h2>

            {isOwner && (
              <div className="mb-8 p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">Update title</label>
                  <input
                    value={updateTitle}
                    onChange={(event) => setUpdateTitle(event.target.value.slice(0, 80))}
                    className="input-field w-full"
                    placeholder="New milestone reached"
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">Update details</label>
                  <textarea
                    value={updateBody}
                    onChange={(event) => setUpdateBody(event.target.value.slice(0, 1000))}
                    className="input-field w-full min-h-32 resize-none"
                    placeholder="Share what changed, what shipped, or what supporters should know."
                    maxLength={1000}
                  />
                  <div className="text-xs text-dark-500 text-right mt-1">{updateBody.length}/1000</div>
                </div>
                <button
                  onClick={handlePostUpdate}
                  disabled={postingUpdate}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {postingUpdate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post Update
                </button>
              </div>
            )}

            {campaign.updates.length > 0 ? (
              <div className="space-y-4">
                {campaign.updates.map(update => (
                  <article key={update.id} className="p-5 rounded-xl bg-dark-800/60 border border-white/5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-heading font-semibold text-dark-100">{update.title}</h3>
                      <span className="text-xs text-dark-500 whitespace-nowrap">Update #{update.id}</span>
                    </div>
                    <p className="text-dark-300 whitespace-pre-wrap leading-relaxed">{update.body}</p>
                    <a
                      href={`https://ipfs.io/ipfs/${update.ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 mt-4"
                    >
                      View IPFS record
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-dark-400">No creator updates yet.</p>
            )}
          </div>

          {/* Recent Supporters */}
          <div className="glass-card p-8">
            <h2 className="text-xl font-heading font-bold text-dark-100 mb-6 flex items-center justify-between">
              <span>Recent Supporters</span>
              <span className="text-sm font-normal text-dark-400 bg-white/5 px-3 py-1 rounded-full">
                Real-time
              </span>
            </h2>
            <DonationList campaignId={campaign.id} />
          </div>

          {/* Creator Info */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-heading font-semibold text-dark-100 mb-4">Campaign Creator</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-heading font-bold text-lg">
                  {campaign.owner.slice(0, 2)}
                </span>
              </div>
              <div>
                <p className="font-heading font-medium text-dark-100">
                  {truncateAddress(campaign.owner)}
                  {isOwner && <span className="ml-2 text-primary-400 font-bold">(You)</span>}
                </p>
                <a
                  href={`https://explorer.hiro.so/address/${campaign.owner}${stacksExplorerChain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
                >
                  View on Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Funding Card */}
          <div className="glass-card p-6 border-t-4 border-t-primary-500">
            {/* Amount Raised */}
            <div className="mb-6">
              <div className="text-4xl font-heading font-bold text-dark-100 mb-1">
                ${campaign.raised.toLocaleString()}
              </div>
              <div className="flex justify-between items-baseline text-dark-400 font-body">
                <span>raised of <span className="text-dark-200 font-semibold">${campaign.goal.toLocaleString()}</span> goal</span>
                <span className="text-primary-400 font-bold">{percentage.toFixed(0)}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <ProgressBar 
                raised={campaign.raised} 
                goal={campaign.goal}
                showLabels={false}
                size="lg"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="flex flex-col p-4 rounded-xl bg-white/5 border border-white/5">
                <Users className="w-5 h-5 text-secondary-400 mb-2" />
                <div className="font-heading font-bold text-2xl text-dark-100">{campaign.backers}</div>
                <div className="text-xs text-dark-500 uppercase tracking-wider">Backers</div>
              </div>
              <div className="flex flex-col p-4 rounded-xl bg-white/5 border border-white/5">
                <Heart className="w-5 h-5 text-pink-400 mb-2" />
                <div className="font-heading font-bold text-2xl text-dark-100">{campaign.endorsements}</div>
                <div className="text-xs text-dark-500 uppercase tracking-wider">Endorse</div>
              </div>
              <div className="flex flex-col p-4 rounded-xl bg-white/5 border border-white/5">
                <Clock className="w-5 h-5 text-primary-400 mb-2" />
                <div className="font-heading font-bold text-2xl text-dark-100">
                  {campaign.daysLeft > 0 ? campaign.daysLeft : 0}
                </div>
                <div className="text-xs text-dark-500 uppercase tracking-wider">Days Left</div>
              </div>
            </div>

            {/* CTA Buttons */}
            {canClaim ? (
              <div className="space-y-3">
                <button
                  onClick={handleClaim}
                  disabled={claiming || claimSuccess}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40"
                >
                  {claiming ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Claiming Funds...
                    </>
                  ) : claimSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Funds Claimed!
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5" />
                      Claim Funds Now
                    </>
                  )}
                </button>
                <p className="text-xs text-dark-400 text-center">
                  5% platform fee will be deducted automatically
                </p>
              </div>
            ) : campaign.claimed ? (
              <div className="w-full py-4 bg-dark-800 text-dark-400 rounded-xl font-medium text-center border border-white/5">
                Funds have been claimed
              </div>
            ) : !isExpired ? (
              <button
                onClick={() => setShowDonateModal(true)}
                className="w-full btn-primary py-4 text-lg font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:scale-[1.02] transition-all"
              >
                Back this project
              </button>
            ) : (
              <div className="w-full py-4 bg-dark-800 text-dark-400 rounded-xl font-medium text-center border border-white/5">
                Campaign ended
              </div>
            )}

            <button
              onClick={handleEndorse}
              disabled={endorsing || hasEndorsed}
              className="w-full btn-secondary flex items-center justify-center gap-2 mt-4"
            >
              {endorsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
              {hasEndorsed ? 'Endorsed' : 'Endorse Campaign'}
            </button>

            {isOwner && !campaign.claimed && (
              <button
                className="w-full btn-secondary flex items-center justify-center gap-2 mt-4"
              >
                <ArrowDownCircle className="w-4 h-4" />
                Manage Campaign
              </button>
            )}

            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
              <button 
                onClick={handleShare}
                className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2 text-sm"
              >
                <Share2 className="w-4 h-4" />
                Copy Link
              </button>
              <button 
                onClick={handleTwitterShare}
                className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2 text-sm"
              >
                <Twitter className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Bridge Info */}
            {!campaign.claimed && !isExpired && (
              <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 items-start">
                <div className="p-1.5 bg-blue-500/20 rounded-full mt-0.5">
                  <ArrowDownCircle className="w-3 h-3 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-300 mb-1">Cross-Chain Ready</p>
                  <p className="text-xs text-blue-200/70">
                    Donate with USDC on Ethereum. We'll bridge it to Stacks automatically via Circle xReserve.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* On-chain Info */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-heading font-semibold text-dark-100 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-dark-400" />
              On-Chain Verification
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-dark-400">Campaign ID</span>
                <span className="text-dark-200 font-mono">#{campaign.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Contract</span>
                <span className="text-dark-200 font-mono">campaign-registry-v2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">IPFS Hash</span>
                <a 
                  href={`https://ipfs.io/ipfs/${campaign.ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 font-mono hover:underline"
                >
                  {campaign.ipfsHash.slice(0, 16)}...
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Donate Modal */}
      <DonateModal
        isOpen={showDonateModal}
        onClose={() => setShowDonateModal(false)}
        campaignTitle={campaign.title}
        campaignId={campaign.id}
        onSuccess={() => {
          setShowDonateModal(false);
          loadCampaign(); // Refresh data
        }}
      />

    </div>
  );
}
