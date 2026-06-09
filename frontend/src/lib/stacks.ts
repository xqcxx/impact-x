import { request } from '@stacks/connect';
import { Cl, cvToValue, hexToCV } from '@stacks/transactions';
import { ACTIVE_NETWORK, getStacksNetwork } from './constants';

// Campaign registry V2 contract address
const CONTRACT_ADDRESSES = {
  testnet: import.meta.env.VITE_TESTNET_CAMPAIGN_CONTRACT_ADDRESS || 'STZ5Q1C2GVSMCWS9NWVDEKHNW04THC75SEGDHS74',
  mainnet: import.meta.env.VITE_MAINNET_CAMPAIGN_CONTRACT_ADDRESS || '',
} as const;

const CONTRACT_ADDRESS = CONTRACT_ADDRESSES[ACTIVE_NETWORK];

const CONTRACT_NAME = 'campaign-registry-v2';

const USDCX_CONTRACTS = {
  testnet: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx',
  mainnet: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
} as const;

const USDCX_CONTRACT = USDCX_CONTRACTS[ACTIVE_NETWORK];

function getContractAddress() {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Missing campaign registry contract address. Set VITE_MAINNET_CAMPAIGN_CONTRACT_ADDRESS for mainnet.');
  }

  return CONTRACT_ADDRESS;
}

function getContractId(): `${string}.${string}` {
  const contractAddress = getContractAddress();

  return `${contractAddress}.${CONTRACT_NAME}` as `${string}.${string}`;
}

function extractValue(value: any) {
  if (value && typeof value === 'object' && 'value' in value) {
    return value.value;
  }

  return value;
}

async function callReadOnly(functionName: string, functionArgs: string[]) {
  const apiUrl = getStacksNetwork().apiUrl;
  const contractAddress = getContractAddress();

  const response = await fetch(
    `${apiUrl}/v2/contracts/call-read/${contractAddress}/${CONTRACT_NAME}/${functionName}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: contractAddress,
        arguments: functionArgs,
      }),
    }
  );

  const data = await response.json();
  if (!data.okay || !data.result) {
    return null;
  }

  return cvToValue(hexToCV(data.result));
}

export interface CampaignData {
  id: number;
  owner: string;
  ipfsHash: string;
  goal: number;
  raised: number;
  deadline: number;
  claimed: boolean;
  createdAt: number;
  refundEnabled: boolean;
}

export interface CampaignUpdate {
  id: number;
  author: string;
  ipfsHash: string;
  createdAt: number;
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  ipfsHash: string,
  goalInUSDC: number,
  durationInDays: number,
  address?: string
): Promise<{ txId: string }> {
  if (ipfsHash.length > 64) {
    throw new Error('IPFS CID is too long for the campaign contract. Please use a CIDv0-compatible Pinata upload.');
  }

  const goalMicro = Math.floor(goalInUSDC * 1_000_000);
  const blocksPerDay = 144;
  const durationBlocks = durationInDays * blocksPerDay;

  const result = await request('stx_callContract', {
    contract: getContractId(),
    functionName: 'create-campaign',
    functionArgs: [
      Cl.stringAscii(ipfsHash),
      Cl.uint(goalMicro),
      Cl.uint(durationBlocks),
    ],
    network: ACTIVE_NETWORK === 'testnet' ? 'testnet' : 'mainnet',
    address,
  });

  return { txId: (result as any).txid ?? '' };
}

/**
 * Donate to a campaign (escrow-based)
 * This deposits USDCx into the contract's escrow
 */
export async function donate(
  campaignId: number,
  amountInUSDC: number
): Promise<{ txId: string }> {
  const amountMicro = Math.floor(amountInUSDC * 1_000_000);

  const result = await request('stx_callContract', {
    contract: getContractId(),
    functionName: 'donate',
    functionArgs: [
      Cl.uint(campaignId),
      Cl.uint(amountMicro),
      Cl.contractPrincipal(
        USDCX_CONTRACT.split('.')[0],
        USDCX_CONTRACT.split('.')[1]
      ),
    ],
    network: ACTIVE_NETWORK === 'testnet' ? 'testnet' : 'mainnet',
  });

  return { txId: (result as any).txid ?? '' };
}

/**
 * Claim funds from a successful campaign (with 5% platform fee)
 */
export async function claimFunds(campaignId: number): Promise<{ txId: string }> {
  const result = await request('stx_callContract', {
    contract: getContractId(),
    functionName: 'claim-funds',
    functionArgs: [
      Cl.uint(campaignId),
      Cl.contractPrincipal(
        USDCX_CONTRACT.split('.')[0],
        USDCX_CONTRACT.split('.')[1]
      ),
    ],
    network: ACTIVE_NETWORK === 'testnet' ? 'testnet' : 'mainnet',
  });

  return { txId: (result as any).txid ?? '' };
}

/**
 * Request refund if campaign failed (goal not met after deadline)
 */
export async function requestRefund(campaignId: number): Promise<{ txId: string }> {
  const result = await request('stx_callContract', {
    contract: getContractId(),
    functionName: 'request-refund',
    functionArgs: [
      Cl.uint(campaignId),
      Cl.contractPrincipal(
        USDCX_CONTRACT.split('.')[0],
        USDCX_CONTRACT.split('.')[1]
      ),
    ],
    network: ACTIVE_NETWORK === 'testnet' ? 'testnet' : 'mainnet',
  });

  return { txId: (result as any).txid ?? '' };
}

/**
 * Update campaign metadata
 */
export async function updateCampaignMetadata(
  campaignId: number,
  newIpfsHash: string
): Promise<{ txId: string }> {
  const result = await request('stx_callContract', {
    contract: getContractId(),
    functionName: 'update-campaign-metadata',
    functionArgs: [
      Cl.uint(campaignId),
      Cl.stringAscii(newIpfsHash),
    ],
    network: ACTIVE_NETWORK === 'testnet' ? 'testnet' : 'mainnet',
  });

  return { txId: (result as any).txid ?? '' };
}

/**
 * Endorse a campaign once from the connected wallet
 */
export async function endorseCampaign(campaignId: number): Promise<{ txId: string }> {
  const result = await request('stx_callContract', {
    contract: getContractId(),
    functionName: 'endorse-campaign',
    functionArgs: [Cl.uint(campaignId)],
    network: ACTIVE_NETWORK === 'testnet' ? 'testnet' : 'mainnet',
  });

  return { txId: (result as any).txid ?? '' };
}

/**
 * Post a creator update using an IPFS metadata hash
 */
export async function postCampaignUpdate(
  campaignId: number,
  ipfsHash: string
): Promise<{ txId: string }> {
  if (ipfsHash.length > 64) {
    throw new Error('IPFS CID is too long for the campaign contract. Please use a CIDv0-compatible Pinata upload.');
  }

  const result = await request('stx_callContract', {
    contract: getContractId(),
    functionName: 'post-campaign-update',
    functionArgs: [
      Cl.uint(campaignId),
      Cl.stringAscii(ipfsHash),
    ],
    network: ACTIVE_NETWORK === 'testnet' ? 'testnet' : 'mainnet',
  });

  return { txId: (result as any).txid ?? '' };
}

export async function fetchEndorsementCount(campaignId: number): Promise<number> {
  try {
    const value = await callReadOnly('get-endorsement-count', [Cl.serialize(Cl.uint(campaignId))]);
    const count = extractValue((value as any)?.count ?? 0);

    return Number(count);
  } catch (error) {
    console.error('Failed to fetch endorsement count:', error);
    return 0;
  }
}

export async function fetchHasEndorsed(campaignId: number, endorser?: string): Promise<boolean> {
  if (!endorser) return false;

  try {
    const value = await callReadOnly('has-endorsed', [
      Cl.serialize(Cl.uint(campaignId)),
      Cl.serialize(Cl.principal(endorser)),
    ]);

    return extractValue(value) === true;
  } catch (error) {
    console.error('Failed to fetch endorsement status:', error);
    return false;
  }
}

export async function fetchCampaignUpdateCount(campaignId: number): Promise<number> {
  try {
    const value = await callReadOnly('get-campaign-update-count', [Cl.serialize(Cl.uint(campaignId))]);
    const count = extractValue((value as any)?.count ?? 0);

    return Number(count);
  } catch (error) {
    console.error('Failed to fetch campaign update count:', error);
    return 0;
  }
}

export async function fetchCampaignUpdate(
  campaignId: number,
  updateId: number
): Promise<CampaignUpdate | null> {
  try {
    const value = await callReadOnly('get-campaign-update', [
      Cl.serialize(Cl.uint(campaignId)),
      Cl.serialize(Cl.uint(updateId)),
    ]);

    if (!value) return null;

    const update = extractValue(value) as {
      author: string;
      'ipfs-hash': string;
      'created-at': bigint | number;
    };

    if (!update || typeof update !== 'object' || !('ipfs-hash' in update)) {
      return null;
    }

    return {
      id: updateId,
      author: extractValue(update.author),
      ipfsHash: extractValue(update['ipfs-hash']),
      createdAt: Number(extractValue(update['created-at'])),
    };
  } catch (error) {
    console.error('Failed to fetch campaign update:', error);
    return null;
  }
}

export async function fetchCampaignUpdates(campaignId: number): Promise<CampaignUpdate[]> {
  const count = await fetchCampaignUpdateCount(campaignId);
  if (count === 0) return [];

  const updates = await Promise.all(
    Array.from({ length: count }, (_, index) => fetchCampaignUpdate(campaignId, index + 1))
  );

  return updates.filter((update): update is CampaignUpdate => update !== null).reverse();
}

/**
 * Fetch campaign donations from contract events
 */
export interface DonationEvent {
  txId: string;
  donor: string;
  amount: number;
  timestamp: number;
}

export async function fetchCampaignDonations(campaignId: number): Promise<DonationEvent[]> {
  const apiUrl = getStacksNetwork().apiUrl;
  const contractId = getContractId();

  try {
    const response = await fetch(
      `${apiUrl}/extended/v1/contract/${contractId}/events?limit=50`
    );

    const data = await response.json();
    const donations: DonationEvent[] = [];

    if (data.results) {
      for (const event of data.results) {
        if (
          event.event_type === 'smart_contract_log' &&
          event.contract_log.contract_id === contractId
        ) {
          const repr = event.contract_log.value.repr;
          
          // Check if it's a donation event and matches campaign ID
          // Event format: (tuple (amount u1000000) (campaign-id u1) (donor ST...) (event "donation-received") (new-total u1000000))
          if (
            repr.includes('(event "donation-received")') && 
            repr.includes(`(campaign-id u${campaignId})`)
          ) {
            // Parse donor and amount from repr string (basic parsing)
            // Example: ... (amount u1000000) ... (donor ST1...) ...
            
            const amountMatch = repr.match(/\(amount u(\d+)\)/);
            const donorMatch = repr.match(/\(donor (S[A-Z0-9]+)\)/); // Basic principal regex

            if (amountMatch && donorMatch) {
              donations.push({
                txId: event.tx_id,
                donor: donorMatch[1],
                amount: Number(amountMatch[1]) / 1_000_000,
                timestamp: Math.floor(new Date(event.block_time || Date.now()).getTime() / 1000), // Use block time or now
              });
            }
          }
        }
      }
    }

    return donations;
  } catch (error) {
    console.error('Failed to fetch donations:', error);
    return [];
  }
}

/**
 * Fetch campaign from contract (read-only)
 */
export async function fetchCampaign(campaignId: number): Promise<CampaignData | null> {
  const apiUrl = getStacksNetwork().apiUrl;
  const contractAddress = getContractAddress();

  try {
    console.log(`[fetchCampaign] Fetching campaign ${campaignId}...`);
    const response = await fetch(
      `${apiUrl}/v2/contracts/call-read/${contractAddress}/${CONTRACT_NAME}/get-campaign`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: contractAddress,
          arguments: [Cl.serialize(Cl.uint(campaignId))],
        }),
      }
    );

    const data = await response.json();
    console.log(`[fetchCampaign] Campaign ${campaignId} raw response:`, data);
    
    if (!data.okay || !data.result) {
      console.error(`[fetchCampaign] Campaign ${campaignId} not okay or no result`);
      return null;
    }

    const parsed = parseCampaignResponse(data.result, campaignId);
    console.log(`[fetchCampaign] Campaign ${campaignId} parsed:`, parsed);
    return parsed;
  } catch (error) {
    console.error(`[fetchCampaign] Failed to fetch campaign ${campaignId}:`, error);
    return null;
  }
}

/**
 * Fetch total campaign count
 */
export async function fetchCampaignCount(): Promise<number> {
  const apiUrl = getStacksNetwork().apiUrl;
  const contractAddress = getContractAddress();

  try {
    const response = await fetch(
      `${apiUrl}/v2/contracts/call-read/${contractAddress}/${CONTRACT_NAME}/get-campaign-count`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: contractAddress,
          arguments: [],
        }),
      }
    );

    const data = await response.json();
    
    if (!data.okay || !data.result) {
      return 0;
    }

    try {
      const cv = hexToCV(data.result);
      const value = cvToValue(cv);
      return typeof value === 'bigint' ? Number(value) : Number(value);
    } catch {
      return parseInt(data.result.replace('0x', ''), 16);
    }
  } catch (error) {
    console.error('Failed to fetch campaign count:', error);
    return 0;
  }
}

/**
 * Fetch backer count for a campaign
 */
export async function fetchBackerCount(campaignId: number): Promise<number> {
  const apiUrl = getStacksNetwork().apiUrl;
  const contractAddress = getContractAddress();

  try {
    console.log(`[fetchBackerCount] Fetching backer count for campaign ${campaignId}...`);
    const response = await fetch(
      `${apiUrl}/v2/contracts/call-read/${contractAddress}/${CONTRACT_NAME}/get-backer-count`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: contractAddress,
          arguments: [Cl.serialize(Cl.uint(campaignId))],
        }),
      }
    );

    const data = await response.json();
    console.log(`[fetchBackerCount] Raw response:`, data);
    
    if (!data.okay || !data.result) {
      console.warn(`[fetchBackerCount] No result for campaign ${campaignId}`);
      return 0;
    }

    try {
      const cv = hexToCV(data.result);
      const value = cvToValue(cv);
      console.log(`[fetchBackerCount] Parsed value:`, value);
      
      // Extract the actual count value
      const extractValue = (val: any) => {
        if (val && typeof val === 'object' && 'value' in val) {
          return val.value;
        }
        return val;
      };

      if (typeof value === 'object' && 'count' in value) {
        const count = extractValue(value.count);
        const numCount = Number(count);
        console.log(`[fetchBackerCount] Extracted count:`, count, '→', numCount);
        return numCount;
      }
      
      console.warn(`[fetchBackerCount] Unexpected value structure:`, value);
      return 0;
    } catch (err) {
      console.error(`[fetchBackerCount] Parse error:`, err);
      return 0;
    }
  } catch (error) {
    console.error(`[fetchBackerCount] Failed to fetch backer count for campaign ${campaignId}:`, error);
    return 0;
  }
}

/**
 * Check if user can request refund for a campaign
 */
export async function canRefund(campaignId: number): Promise<boolean> {
  const apiUrl = getStacksNetwork().apiUrl;
  const contractAddress = getContractAddress();

  try {
    const response = await fetch(
      `${apiUrl}/v2/contracts/call-read/${contractAddress}/${CONTRACT_NAME}/can-refund`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: contractAddress,
          arguments: [Cl.serialize(Cl.uint(campaignId))],
        }),
      }
    );

    const data = await response.json();
    
    if (!data.okay || !data.result) {
      return false;
    }

    const cv = hexToCV(data.result);
    const value = cvToValue(cv);
    return value === true;
  } catch (error) {
    console.error('Failed to check refund status:', error);
    return false;
  }
}

/**
 * Get user's donation for a campaign
 */
export async function getDonation(campaignId: number, donor: string): Promise<{ amount: number; refunded: boolean }> {
  const apiUrl = getStacksNetwork().apiUrl;
  const contractAddress = getContractAddress();

  try {
    const response = await fetch(
      `${apiUrl}/v2/contracts/call-read/${contractAddress}/${CONTRACT_NAME}/get-donation`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: contractAddress,
          arguments: [
            Cl.serialize(Cl.uint(campaignId)),
            Cl.serialize(Cl.principal(donor)),
          ],
        }),
      }
    );

    const data = await response.json();
    
    if (!data.okay || !data.result) {
      return { amount: 0, refunded: false };
    }

    const cv = hexToCV(data.result);
    const value = cvToValue(cv) as { amount: bigint | number; refunded: boolean };
    
    return {
      amount: Number(value.amount) / 1_000_000,
      refunded: value.refunded,
    };
  } catch (error) {
    console.error('Failed to fetch donation:', error);
    return { amount: 0, refunded: false };
  }
}

/**
 * Helper to parse Clarity campaign response
 */
function parseCampaignResponse(result: string, campaignId: number): CampaignData | null {
  try {
    console.log(`[parseCampaignResponse] Parsing campaign ${campaignId}, hex result:`, result);
    const cv = hexToCV(result);
    console.log(`[parseCampaignResponse] Converted to CV:`, cv);
    const value = cvToValue(cv);
    console.log(`[parseCampaignResponse] cvToValue result:`, value, 'type:', typeof value);
    
    if (!value || value === null) {
      console.error(`[parseCampaignResponse] Value is null or undefined`);
      return null;
    }

    // Handle optional wrapper - cvToValue returns the inner value for (some ...) 
    // or null for none. The value might be wrapped in a 'value' property for some versions.
    let campaign = value as {
      owner: string;
      'ipfs-hash': string;
      goal: bigint | number;
      raised: bigint | number;
      deadline: bigint | number;
      claimed: boolean;
      'created-at': bigint | number;
      'refund-enabled': boolean;
    };

    // If it's wrapped in 'value' property (some optional handling)
    if ('value' in value && typeof value.value === 'object') {
      console.log(`[parseCampaignResponse] Found value.value wrapper`);
      campaign = value.value;
    }

    // Validate we have required fields
    if (!campaign || typeof campaign !== 'object' || !('owner' in campaign)) {
      console.error('[parseCampaignResponse] Invalid campaign structure:', campaign);
      return null;
    }

    console.log(`[parseCampaignResponse] Final campaign object:`, campaign);
    console.log(`[parseCampaignResponse] IPFS hash (raw):`, campaign['ipfs-hash']);
    console.log(`[parseCampaignResponse] Goal (raw):`, campaign.goal, 'type:', typeof campaign.goal);
    console.log(`[parseCampaignResponse] Raised (raw):`, campaign.raised, 'type:', typeof campaign.raised);

    const ipfsHash = extractValue(campaign['ipfs-hash']);
    const owner = extractValue(campaign.owner);
    const goal = extractValue(campaign.goal);
    const raised = extractValue(campaign.raised);
    const deadline = extractValue(campaign.deadline);
    const claimed = extractValue(campaign.claimed);
    const createdAt = extractValue(campaign['created-at']);
    const refundEnabled = extractValue(campaign['refund-enabled']);

    console.log(`[parseCampaignResponse] Extracted IPFS hash:`, ipfsHash);
    console.log(`[parseCampaignResponse] Extracted goal:`, goal, 'type:', typeof goal);
    console.log(`[parseCampaignResponse] Extracted raised:`, raised, 'type:', typeof raised);

    const parsed = {
      id: campaignId,
      owner,
      ipfsHash,
      goal: Number(goal) / 1_000_000,
      raised: Number(raised) / 1_000_000,
      deadline: Number(deadline),
      claimed,
      createdAt: Number(createdAt),
      refundEnabled,
    };

    console.log(`[parseCampaignResponse] Parsed result:`, parsed);
    return parsed;
  } catch (error) {
    console.error('[parseCampaignResponse] Failed to parse campaign response:', error);
    return null;
  }
}

/**
 * Fetch multiple campaigns
 */
export async function fetchCampaigns(startId: number, count: number): Promise<CampaignData[]> {
  const campaigns: CampaignData[] = [];
  
  for (let i = startId; i < startId + count; i++) {
    const campaign = await fetchCampaign(i);
    if (campaign) {
      campaigns.push(campaign);
    }
  }
  
  return campaigns;
}

/**
 * Get contract info
 */
export function getContractInfo() {
  return {
    address: getContractAddress(),
    name: CONTRACT_NAME,
    fullName: getContractId(),
    usdcxContract: USDCX_CONTRACT,
  };
}
