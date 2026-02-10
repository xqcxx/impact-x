import { useState, useEffect } from "react";
import { Activity, Clock, DollarSign } from "lucide-react";

interface GasPriceTrackerProps {
  network: "stacks" | "ethereum";
}

interface GasData {
  current: number;
  low: number;
  average: number;
  high: number;
  trend: "up" | "down" | "stable";
  lastUpdated: Date;
}

export function GasPriceTracker({ network }: GasPriceTrackerProps) {
  const [gasData, setGasData] = useState<GasData>({
    current: 30,
    low: 25,
    average: 30,
    high: 45,
    trend: "stable",
    lastUpdated: new Date(),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock gas price fetching - replace with actual API
    const fetchGasData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockData: GasData = {
        current: Math.floor(Math.random() * 20) + 25,
        low: 20,
        average: 30,
        high: 50,
        trend: ["up", "down", "stable"][Math.floor(Math.random() * 3)] as "up" | "down" | "stable",
        lastUpdated: new Date(),
      };

      setGasData(mockData);
      setLoading(false);
    };

    fetchGasData();
    const interval = setInterval(fetchGasData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [network]);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-red-400";
      case "down":
        return "text-success-400";
      default:
        return "text-dark-400";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "↑";
      case "down":
        return "↓";
      default:
        return "→";
    }
  };

  const unit = network === "stacks" ? "µSTX" : "gwei";

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-dark-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-400" />
          Gas Tracker
        </h4>
        <div className="flex items-center gap-1 text-xs text-dark-500">
          <Clock className="w-3 h-3" />
          <span>Live</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 text-sm text-dark-500 animate-pulse">
          Loading gas prices...
        </div>
      ) : (
        <>
          {/* Current Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-heading font-bold text-dark-100">{gasData.current}</span>
            <span className="text-sm text-dark-400">{unit}</span>
            <span className={`text-sm font-medium ${getTrendColor(gasData.trend)}`}>
              {getTrendIcon(gasData.trend)} {gasData.trend}
            </span>
          </div>

          {/* Range */}
          <div className="space-y-2">
            <div className="h-2 rounded-full bg-dark-800 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-success-400 via-primary-400 to-red-400"
                style={{
                  width: `${((gasData.current - gasData.low) / (gasData.high - gasData.low)) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-dark-500">
              <span>
                {gasData.low} {unit}
              </span>
              <span>
                {gasData.average} {unit}
              </span>
              <span>
                {gasData.high} {unit}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
            <div className="text-center">
              <p className="text-xs text-dark-500">Low</p>
              <p className="text-sm font-medium text-success-400">{gasData.low}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-dark-500">Avg</p>
              <p className="text-sm font-medium text-dark-300">{gasData.average}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-dark-500">High</p>
              <p className="text-sm font-medium text-red-400">{gasData.high}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
