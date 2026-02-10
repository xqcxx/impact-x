import React from "react";
import { Link } from "react-router-dom";
import { ProgressBar } from "./ProgressBar";
import { Clock, Users, ArrowUpRight } from "lucide-react";

export interface Campaign {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  goal: number;
  raised: number;
  backers: number;
  daysLeft: number;
  category: string;
  owner: string;
}

interface CampaignCardProps {
  campaign: Campaign;
}

function CampaignCardComponent({ campaign }: CampaignCardProps) {
  const isComplete = campaign.raised >= campaign.goal;

  return (
    <Link
      to={`/campaign/${campaign.id}`}
      className="glass-card group block overflow-hidden hover:scale-[1.02] transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/400x200?text=Campaign";
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="badge-primary">{campaign.category}</span>
        </div>

        {/* Funded Badge */}
        {isComplete && (
          <div className="absolute top-3 right-3">
            <span className="badge-success">Funded</span>
          </div>
        )}

        {/* Arrow on hover */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-dark-900" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-heading font-semibold text-[var(--card-foreground)] mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
          {campaign.title}
        </h3>

        <p className="text-sm text-[var(--muted-foreground)] mb-5 line-clamp-2 font-body">
          {campaign.description}
        </p>

        {/* Progress */}
        <ProgressBar raised={campaign.raised} goal={campaign.goal} size="sm" showLabels={false} />

        {/* Amount raised */}
        <div className="mt-3 flex justify-between items-center">
          <span className="text-lg font-heading font-bold text-primary-400">
            ${campaign.raised.toLocaleString()}
          </span>
          <span className="text-sm text-[var(--muted-foreground)]">of ${campaign.goal.toLocaleString()}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Users className="w-4 h-4 text-secondary-400" />
            <span>{campaign.backers} backers</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Clock className="w-4 h-4 text-primary-400" />
            <span>
              {campaign.daysLeft > 0 
                ? `${campaign.daysLeft} days left` 
                : 'Ended'}
            </span>
          </div>
        </div>
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <Clock className="w-4 h-4 text-primary-400" />
            <span>{campaign.daysLeft > 0 ? `${campaign.daysLeft} days left` : "Ended"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const CampaignCard = React.memo(CampaignCardComponent);
