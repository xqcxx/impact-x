import { StatusFilter, getStatusLabel } from "../lib/search";
import { Activity, CheckCircle, Clock, Layers } from "lucide-react";

interface StatusFilterTabsProps {
  selectedStatus: StatusFilter;
  onSelectStatus: (status: StatusFilter) => void;
  counts?: Record<StatusFilter, number>;
}

const statusOptions: Array<{
  value: StatusFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    value: "all",
    label: "All",
    icon: Layers,
    color: "text-dark-400",
  },
  {
    value: "active",
    label: "Active",
    icon: Activity,
    color: "text-primary-400",
  },
  {
    value: "funded",
    label: "Funded",
    icon: CheckCircle,
    color: "text-success-400",
  },
  {
    value: "ended",
    label: "Ended",
    icon: Clock,
    color: "text-dark-500",
  },
];

export function StatusFilterTabs({
  selectedStatus,
  onSelectStatus,
  counts,
}: StatusFilterTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {statusOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedStatus === option.value;
        const count = counts?.[option.value];

        return (
          <button
            key={option.value}
            onClick={() => onSelectStatus(option.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              isSelected
                ? "bg-primary-500/20 border-2 border-primary-500 text-primary-400"
                : "bg-white/5 border-2 border-white/10 text-dark-400 hover:border-white/20"
            }`}
          >
            <Icon className={`w-4 h-4 ${isSelected ? "text-primary-400" : option.color}`} />
            <span className="text-sm font-medium">{option.label}</span>
            {count !== undefined && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isSelected ? "bg-primary-400 text-dark-900" : "bg-white/10 text-dark-500"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
