/**
 * IPFS Integration for Campaign Metadata
 * 
 * Campaign metadata is stored on IPFS via Pinata and referenced by CID in the smart contract.
 * This allows for rich content (images, long descriptions) without blockchain storage costs.
 */

// Campaign metadata structure stored in IPFS
export interface CampaignMetadata {
  title: string;
  description: string;
  story: string;           // Full campaign story/details (can be HTML)
  imageUrl: string;        // Main campaign image URL (IPFS gateway URL)
  category: string;
  targetAmount: number;    // In USDC (for display purposes)
  creatorName?: string;
  creatorAvatar?: string;
  website?: string;
  twitter?: string;
  createdAt: number;       // Unix timestamp
  updatedAt?: number;
}

export interface CampaignUpdateMetadata {
  title: string;
  body: string;
  createdAt: number;
}

// Available categories
export const CAMPAIGN_CATEGORIES = [
  'Technology',
  'Community',
  'Education',
  'Environment',
  'Health',
  'Arts & Culture',
  'Infrastructure',
  'Research',
  'Other',
] as const;

export type CampaignCategory = typeof CAMPAIGN_CATEGORIES[number];

// IPFS Gateway URLs (in order of preference)
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://w3s.link/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
];

/**
 * Upload campaign metadata to IPFS via Pinata
 */
export async function uploadToIPFS(metadata: CampaignMetadata): Promise<string> {
  const pinataJWT = import.meta.env.VITE_PINATA_JWT;
  
  if (!pinataJWT) {
    throw new Error('IPFS upload requires Pinata JWT. Please set VITE_PINATA_JWT in your .env file.');
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pinataJWT}`,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: `impact-x-campaign-${Date.now()}`,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Pinata upload failed:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }

  const result = await response.json();
  console.log('Uploaded to IPFS:', result.IpfsHash);
  return result.IpfsHash;
}

export async function uploadJSONToIPFS(content: unknown, name: string): Promise<string> {
  const pinataJWT = import.meta.env.VITE_PINATA_JWT;

  if (!pinataJWT) {
    throw new Error('IPFS upload requires Pinata JWT. Please set VITE_PINATA_JWT in your .env file.');
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${pinataJWT}`,
    },
    body: JSON.stringify({
      pinataContent: content,
      pinataMetadata: { name },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Pinata upload failed:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }

  const result = await response.json();
  return result.IpfsHash;
}

/**
 * Fetch metadata from IPFS
 */
export async function fetchFromIPFS(cid: string): Promise<CampaignMetadata | null> {
  if (!cid || cid.length < 10) {
    console.error('[fetchFromIPFS] Invalid CID:', cid);
    return null;
  }

  console.log(`[fetchFromIPFS] Fetching CID: ${cid}`);

  // Try each gateway until one works
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${cid}`;
      console.log(`[fetchFromIPFS] Trying gateway: ${url}`);
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[fetchFromIPFS] Successfully fetched from ${gateway}:`, data);
        return data;
      } else {
        console.warn(`[fetchFromIPFS] Gateway ${gateway} returned status ${response.status}`);
      }
    } catch (error) {
      console.warn(`[fetchFromIPFS] Gateway ${gateway} failed:`, error);
      continue;
    }
  }
  
  console.error('[fetchFromIPFS] All IPFS gateways failed for CID:', cid);
  return null;
}

/**
 * Upload an image to IPFS via Pinata
 * Returns the IPFS gateway URL for the image
 */
export async function uploadImageToIPFS(file: File): Promise<string> {
  const pinataJWT = import.meta.env.VITE_PINATA_JWT;
  
  if (!pinataJWT) {
    throw new Error('Image upload requires Pinata JWT. Please set VITE_PINATA_JWT in your .env file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('pinataMetadata', JSON.stringify({
    name: `impact-x-image-${Date.now()}-${file.name}`,
  }));

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pinataJWT}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Pinata image upload failed:', error);
    throw new Error('Failed to upload image to IPFS');
  }

  const result = await response.json();
  console.log('Uploaded image to IPFS:', result.IpfsHash);
  
  // Return gateway URL
  return `${IPFS_GATEWAYS[0]}${result.IpfsHash}`;
}

/**
 * Create a valid IPFS URL from a CID
 */
export function getIPFSUrl(cid: string): string {
  return `${IPFS_GATEWAYS[0]}${cid}`;
}

/**
 * Check if a string is a valid IPFS CID
 */
export function isValidCID(cid: string): boolean {
  // Basic validation - CIDs start with Qm (v0) or ba (v1)
  return /^(Qm[a-zA-Z0-9]{44}|ba[a-zA-Z0-9]+)$/.test(cid);
}
