/**
 * Social Sharing Utilities
 * Handles sharing campaigns across social platforms
 */

export interface ShareData {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
}

// Share URLs for different platforms
export function getTwitterShareUrl(data: ShareData): string {
  const text = encodeURIComponent(`${data.title} - Support this campaign on Impact-X!`);
  const url = encodeURIComponent(data.url);
  return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
}

export function getFacebookShareUrl(data: ShareData): string {
  const url = encodeURIComponent(data.url);
  return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
}

export function getLinkedInShareUrl(data: ShareData): string {
  const url = encodeURIComponent(data.url);
  const title = encodeURIComponent(data.title);
  const summary = encodeURIComponent(data.description.slice(0, 200));
  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`;
}

export function getTelegramShareUrl(data: ShareData): string {
  const text = encodeURIComponent(
    `${data.title}\n\n${data.description.slice(0, 100)}...\n\n${data.url}`,
  );
  return `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${text}`;
}

export function getWhatsAppShareUrl(data: ShareData): string {
  const text = encodeURIComponent(`${data.title}\n\n${data.url}`);
  return `https://wa.me/?text=${text}`;
}

export function getEmailShareUrl(data: ShareData): string {
  const subject = encodeURIComponent(`Check out this campaign: ${data.title}`);
  const body = encodeURIComponent(
    `I found this campaign on Impact-X and thought you might be interested:\n\n${data.title}\n\n${data.description.slice(0, 200)}...\n\n${data.url}`,
  );
  return `mailto:?subject=${subject}&body=${body}`;
}

// Copy link to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
}

// Open share window
export function openShareWindow(url: string, width = 600, height = 400): void {
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  window.open(
    url,
    "share",
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
  );
}

// Share via Web Share API (mobile)
export async function shareViaWebAPI(data: ShareData): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.description,
        url: data.url,
      });
      return true;
    } catch (err) {
      // User cancelled or share failed
      return false;
    }
  }
  return false;
}

// Generate embed code
export function generateEmbedCode(campaignUrl: string, width = 600, height = 400): string {
  return `<iframe 
  src="${campaignUrl}/embed" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  scrolling="no"
  style="border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;"
></iframe>`;
}

// Generate open graph meta tags
export function generateOpenGraphTags(data: ShareData): string {
  return `
<meta property="og:title" content="${data.title}" />
<meta property="og:description" content="${data.description.slice(0, 200)}" />
<meta property="og:url" content="${data.url}" />
${data.imageUrl ? `<meta property="og:image" content="${data.imageUrl}" />` : ""}
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${data.title}" />
<meta name="twitter:description" content="${data.description.slice(0, 200)}" />
${data.imageUrl ? `<meta name="twitter:image" content="${data.imageUrl}" />` : ""}
  `.trim();
}
