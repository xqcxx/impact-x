import {
  Cpu,
  Palette,
  Users,
  Coins,
  BookOpen,
  Leaf,
  Gamepad2,
  Heart,
  Building2,
  Music,
  HeartHandshake,
  Trophy,
  Circle,
} from "lucide-react";
import { CampaignCategory, CATEGORY_METADATA, getCategoryColor } from "../lib/categories";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu,
  Palette,
  Users,
  Coins,
  BookOpen,
  Leaf,
  Gamepad2,
  Heart,
  Building2,
  Music,
  HeartHandshake,
  Trophy,
  Circle,
};

interface CategoryBadgeProps {
  category: CampaignCategory;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "filled";
}

export function CategoryBadge({ category, size = "md", variant = "default" }: CategoryBadgeProps) {
  const color = getCategoryColor(category);
  const Icon = iconMap[CATEGORY_METADATA[category]?.icon || "Circle"];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const variantStyles = {
    default: {
      background: `${color}20`,
      borderColor: `${color}40`,
      color: color,
    },
    outlined: {
      background: "transparent",
      borderColor: color,
      color: color,
    },
    filled: {
      background: color,
      borderColor: color,
      color: "#FFFFFF",
    },
  };

  const style = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-heading font-semibold uppercase tracking-wider border ${sizeClasses[size]}`}
      style={{
        backgroundColor: style.background,
        borderColor: style.borderColor,
        color: style.color,
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      {category}
    </span>
  );
}
