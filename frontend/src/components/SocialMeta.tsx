import { Helmet } from "react-helmet-async";
import { ShareData } from "../lib/social";

interface SocialMetaProps {
  data: ShareData;
  campaignId: number;
}

export function SocialMeta({ data, campaignId }: SocialMetaProps) {
  const siteName = "Impact-X";
  const defaultImage = "https://impact-x.io/og-image.jpg"; // Replace with actual OG image URL

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{data.title} | Impact-X</title>
      <meta name="description" content={data.description.slice(0, 200)} />

      {/* Open Graph */}
      <meta property="og:title" content={data.title} />
      <meta property="og:description" content={data.description.slice(0, 200)} />
      <meta property="og:url" content={data.url} />
      <meta property="og:image" content={data.imageUrl || defaultImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={data.title} />
      <meta name="twitter:description" content={data.description.slice(0, 200)} />
      <meta name="twitter:image" content={data.imageUrl || defaultImage} />
      <meta name="twitter:site" content="@ImpactX" />

      {/* Additional SEO */}
      <link rel="canonical" href={data.url} />
      <meta name="robots" content="index, follow" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CrowdfundingProject",
          name: data.title,
          description: data.description,
          url: data.url,
          image: data.imageUrl || defaultImage,
          identifier: campaignId.toString(),
          funding: {
            "@type": "MonetaryAmount",
            currency: "USDC",
          },
        })}
      </script>
    </Helmet>
  );
}
