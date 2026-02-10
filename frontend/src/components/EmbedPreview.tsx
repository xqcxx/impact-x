import { useState } from "react";
import { ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { Campaign } from "./CampaignCard";
import { ProgressBar } from "./ProgressBar";

interface EmbedPreviewProps {
  campaign: Campaign;
}

export function EmbedPreview({ campaign }: EmbedPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = Math.min((campaign.raised / campaign.goal) * 100, 100);

  return (
    <div
      className={`glass-card overflow-hidden transition-all duration-300 ${
        isExpanded ? "fixed inset-4 z-50" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-heading font-semibold text-dark-100">
          {isExpanded ? "Embedded Campaign Preview" : "Embed Preview"}
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-white/5 text-dark-400 hover:text-dark-200"
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Embedded View */}
      <div className={`p-4 ${isExpanded ? "h-[calc(100%-60px)] overflow-auto" : ""}`}>
        <div className="max-w-md mx-auto bg-dark-900 rounded-xl overflow-hidden border border-white/10">
          {/* Image */}
          <div className="relative h-40">
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/400x200?text=Campaign";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <span className="badge-primary text-xs mb-2 inline-block">{campaign.category}</span>
              <h4 className="font-heading font-semibold text-dark-100 line-clamp-2">
                {campaign.title}
              </h4>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Progress */}
            <ProgressBar raised={campaign.raised} goal={campaign.goal} size="sm" />

            <div className="flex justify-between text-sm">
              <span className="font-heading font-semibold text-primary-400">
                ${campaign.raised.toLocaleString()}
              </span>
              <span className="text-dark-500">of ${campaign.goal.toLocaleString()}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-dark-400 pt-3 border-t border-white/10">
              <span>{campaign.backers} backers</span>
              <span>{campaign.daysLeft > 0 ? `${campaign.daysLeft} days left` : "Ended"}</span>
            </div>

            {/* CTA */}
            <a
              href={`/campaign/${campaign.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Campaign
            </a>
          </div>

          {/* Powered by */}
          <div className="px-4 py-2 bg-dark-950 text-center">
            <span className="text-xs text-dark-600">Powered by Impact-X</span>
          </div>
        </div>
      </div>
    </div>
  );
}
