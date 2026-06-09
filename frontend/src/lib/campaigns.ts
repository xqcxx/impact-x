/**
 * Campaign Service
 * Handles fetching and managing campaign data from the smart contract and IPFS
 */

import {
  fetchCampaign,
  fetchCampaignCount,
  fetchBackerCount,
  fetchEndorsementCount,
  fetchCampaignUpdates,
  type CampaignUpdate,
} from './stacks';
import { fetchFromIPFS, type CampaignMetadata, type CampaignUpdateMetadata } from './ipfs';
import { getStacksNetwork } from './constants';

export interface CreatorUpdate extends CampaignUpdate {
  title: string;
  body: string;
}

// Combined campaign type with on-chain and off-chain data
export interface FullCampaign {
  id: number;
  title: string;
  description: string;
  story: string;
  imageUrl: string;
  category: string;
  goal: number;        // in USDC
  raised: number;      // in USDC
  backers: number;
  endorsements: number;
  updates: CreatorUpdate[];
  daysLeft: number;
  deadline: number;    // block height
  claimed: boolean;
  owner: string;
  ipfsHash: string;
  createdAt: number;
  refundEnabled: boolean;
}

// Approximate blocks per day on Stacks (~10 min per block)
const BLOCKS_PER_DAY = 144;

// Current block height cache
let cachedBlockHeight: number | null = null;
let blockHeightFetchedAt: number = 0;

/**
 * Get current Stacks block height
 */
async function getCurrentBlockHeight(): Promise<number> {
  // Cache for 1 minute
  if (cachedBlockHeight && Date.now() - blockHeightFetchedAt < 60000) {
    return cachedBlockHeight;
  }

  try {
    const response = await fetch(`${getStacksNetwork().apiUrl}/v2/info`);
    const data = await response.json();
    cachedBlockHeight = data.stacks_tip_height as number;
    blockHeightFetchedAt = Date.now();
    return cachedBlockHeight as number;
  } catch (error) {
    console.error('Failed to fetch block height:', error);
    return cachedBlockHeight || 0;
  }
}

/**
 * Calculate days left from deadline block height
 */
function calculateDaysLeft(deadline: number, currentBlock: number): number {
  if (currentBlock >= deadline) return 0;
  const blocksLeft = deadline - currentBlock;
  return Math.ceil(blocksLeft / BLOCKS_PER_DAY);
}

/**
 * Fetch a single campaign with full metadata
 */
export async function getFullCampaign(campaignId: number): Promise<FullCampaign | null> {
  try {
    console.log(`[getFullCampaign] Fetching campaign ${campaignId}...`);
    
    // Fetch on-chain data
    const onChainData = await fetchCampaign(campaignId);
    if (!onChainData) {
      console.error(`[getFullCampaign] No on-chain data for campaign ${campaignId}`);
      return null;
    }

    console.log(`[getFullCampaign] On-chain data for campaign ${campaignId}:`, onChainData);

    // Fetch social and activity data
    const [backerCount, endorsementCount, rawUpdates] = await Promise.all([
      fetchBackerCount(campaignId),
      fetchEndorsementCount(campaignId),
      fetchCampaignUpdates(campaignId),
    ]);
    console.log(`[getFullCampaign] Backer count for campaign ${campaignId}:`, backerCount);
    console.log(`[getFullCampaign] Endorsement count for campaign ${campaignId}:`, endorsementCount);

    // Fetch IPFS metadata
    let metadata: CampaignMetadata | null = null;
    if (onChainData.ipfsHash) {
      console.log(`[getFullCampaign] Fetching IPFS metadata for ${onChainData.ipfsHash}...`);
      metadata = await fetchFromIPFS(onChainData.ipfsHash);
      console.log(`[getFullCampaign] IPFS metadata result:`, metadata);
    } else {
      console.warn(`[getFullCampaign] No IPFS hash for campaign ${campaignId}`);
    }

    // Get current block height for days calculation
    const currentBlock = await getCurrentBlockHeight();
    const daysLeft = calculateDaysLeft(onChainData.deadline, currentBlock);
    console.log(`[getFullCampaign] Days left: ${daysLeft} (deadline: ${onChainData.deadline}, current: ${currentBlock})`);

    const updates = await Promise.all(
      rawUpdates.map(async update => {
        const updateMetadata = await fetchFromIPFS(update.ipfsHash) as CampaignUpdateMetadata | null;

        return {
          ...update,
          title: updateMetadata?.title || `Update #${update.id}`,
          body: updateMetadata?.body || 'Update details could not be loaded.',
        };
      })
    );

    // Combine data
    const fullCampaign = {
      id: campaignId,
      title: metadata?.title || `Campaign #${campaignId}`,
      description: metadata?.description || 'No description available',
      story: metadata?.story || '',
      imageUrl: metadata?.imageUrl || 'https://via.placeholder.com/800x400?text=Campaign',
      category: metadata?.category || 'Other',
      goal: onChainData.goal,
      raised: onChainData.raised,
      backers: backerCount,
      endorsements: endorsementCount,
      updates,
      daysLeft,
      deadline: onChainData.deadline,
      claimed: onChainData.claimed,
      owner: onChainData.owner,
      ipfsHash: onChainData.ipfsHash,
      createdAt: onChainData.createdAt,
      refundEnabled: onChainData.refundEnabled,
    };

    console.log(`[getFullCampaign] Final full campaign for ${campaignId}:`, fullCampaign);
    return fullCampaign;
  } catch (error) {
    console.error(`[getFullCampaign] Failed to fetch campaign ${campaignId}:`, error);
    return null;
  }
}

/**
 * Fetch all campaigns
 */
export async function getAllCampaigns(): Promise<FullCampaign[]> {
  try {
    const count = await fetchCampaignCount();
    if (count === 0) {
      return [];
    }

    // Fetch all campaigns in parallel (with limit to avoid rate limiting)
    const batchSize = 10;
    const campaigns: FullCampaign[] = [];

    for (let i = 1; i <= count; i += batchSize) {
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, count + 1); j++) {
        batch.push(getFullCampaign(j));
      }
      
      const results = await Promise.all(batch);
      campaigns.push(...results.filter((c): c is FullCampaign => c !== null));
    }

    // Sort by newest first
    return campaigns.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return [];
  }
}

/**
 * Fetch campaigns owned by a specific address
 */
export async function getCampaignsByOwner(ownerAddress: string): Promise<FullCampaign[]> {
  const allCampaigns = await getAllCampaigns();
  return allCampaigns.filter(c => c.owner === ownerAddress);
}

/**
 * Get campaign statistics
 */
export async function getCampaignStats(): Promise<{
  totalCampaigns: number;
  totalRaised: number;
  totalBackers: number;
  fundedCampaigns: number;
}> {
  const campaigns = await getAllCampaigns();
  
  return {
    totalCampaigns: campaigns.length,
    totalRaised: campaigns.reduce((sum, c) => sum + c.raised, 0),
    totalBackers: campaigns.reduce((sum, c) => sum + c.backers, 0),
    fundedCampaigns: campaigns.filter(c => c.raised >= c.goal).length,
  };
}

/**
 * Search and filter campaigns
 */
export function filterCampaigns(
  campaigns: FullCampaign[],
  options: {
    searchQuery?: string;
    category?: string;
    status?: 'active' | 'funded' | 'ended' | 'all';
  }
): FullCampaign[] {
  let filtered = [...campaigns];

  // Search filter
  if (options.searchQuery) {
    const query = options.searchQuery.toLowerCase();
    filtered = filtered.filter(
      c =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
    );
  }

  // Category filter
  if (options.category && options.category !== 'All') {
    filtered = filtered.filter(c => c.category === options.category);
  }

  // Status filter
  if (options.status && options.status !== 'all') {
    switch (options.status) {
      case 'active':
        filtered = filtered.filter(c => c.daysLeft > 0 && c.raised < c.goal);
        break;
      case 'funded':
        filtered = filtered.filter(c => c.raised >= c.goal);
        break;
      case 'ended':
        filtered = filtered.filter(c => c.daysLeft <= 0);
        break;
    }
  }

  return filtered;
}
