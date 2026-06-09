import { useEffect, useState } from 'react';
import { User, Clock, ExternalLink } from 'lucide-react';
import { fetchCampaignDonations, type DonationEvent } from '../lib/stacks';
import { truncateAddress } from '../lib/helpers';
import { Skeleton } from './Skeleton';
import { ACTIVE_NETWORK } from '../lib/constants';

const stacksExplorerChain = ACTIVE_NETWORK === 'testnet' ? '?chain=testnet' : '';

interface DonationListProps {
  campaignId: number;
}

export function DonationList({ campaignId }: DonationListProps) {
  const [donations, setDonations] = useState<DonationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDonations();
  }, [campaignId]);

  const loadDonations = async () => {
    try {
      const data = await fetchCampaignDonations(campaignId);
      // Sort by newest first
      setDonations(data.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to load donations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 animate-pulse">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-500/10 flex items-center justify-center">
          <User className="w-6 h-6 text-primary-400 opacity-50" />
        </div>
        <p className="text-dark-400 text-sm">No donations yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {donations.map((donation) => (
        <div 
          key={donation.txId} 
          className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm">
              {donation.donor.slice(0, 2)}
            </div>
            <div>
              <div className="font-medium text-dark-200 flex items-center gap-2">
                {truncateAddress(donation.donor)}
                <a 
                  href={`https://explorer.hiro.so/txid/${donation.txId}${stacksExplorerChain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-dark-500 hover:text-primary-400"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="text-xs text-dark-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(donation.timestamp * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-heading font-bold text-success-400">
              +${donation.amount.toLocaleString()}
            </div>
            <div className="text-xs text-dark-500">USDCx</div>
          </div>
        </div>
      ))}
    </div>
  );
}
