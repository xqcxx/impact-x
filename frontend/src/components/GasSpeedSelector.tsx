import { useState } from "react";
import { Activity, Zap, TrendingDown, TrendingUp } from "lucide-react";

export type GasSpeed = "slow" | "standard" | "fast";

interface GasSpeedSelectorProps {
  selectedSpeed: GasSpeed;
  onSelectSpeed: (speed: GasSpeed) => void;
  network: "stacks" | "ethereum";
}

interface SpeedOption {
  speed: GasSpeed;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  multiplier: number;
  estimatedTime: string;
  description: string;
}

export function GasSpeedSelector({ selectedSpeed, onSelectSpeed, network }: GasSpeedSelectorProps) {
  const speedOptions: SpeedOption[] = [
    {
      speed: "slow",
      label: "Slow",
      icon: TrendingDown,
      multiplier: 0.8,
      estimatedTime: network === "stacks" ? "~15 min" : "~5 min",
      description: "Lower fee, slower confirmation",
    },
    {
      speed: "standard",
      label: "Standard",
      icon: Activity,
      multiplier: 1.0,
      estimatedTime: network === "stacks" ? "~10 min" : "~2 min",
      description: "Balanced fee and speed",
    },
    {
      speed: "fast",
      label: "Fast",
      icon: Zap,
      multiplier: 1.3,
      estimatedTime: network === "stacks" ? "~5 min" : "~30 sec",
      description: "Higher fee, faster confirmation",
    },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-dark-200">Transaction Speed</label>

      <div className="grid grid-cols-3 gap-3">
        {speedOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedSpeed === option.speed;

          return (
            <button
              key={option.speed}
              type="button"
              onClick={() => onSelectSpeed(option.speed)}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? "border-primary-500 bg-primary-500/10"
                  : "border-white/10 bg-dark-800/50 hover:border-white/20 hover:bg-dark-700/50"
              }`}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <Icon className={`w-5 h-5 ${isSelected ? "text-primary-400" : "text-dark-400"}`} />
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isSelected ? "text-dark-100" : "text-dark-300"
                    }`}
                  >
                    {option.label}
                  </p>
                  <p className="text-xs text-dark-500 mt-0.5">{option.estimatedTime}</p>
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-dark-500">
        {speedOptions.find((o) => o.speed === selectedSpeed)?.description}
      </p>
    </div>
  );
}
