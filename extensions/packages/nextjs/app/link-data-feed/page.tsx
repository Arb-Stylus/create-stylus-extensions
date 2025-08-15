"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { useTheme } from "next-themes";
import useChainlinkArbUsdFeed from "~~/hooks/chainlink-data-feed/useChainlinkArbUsdFeed";

interface PriceData {
  price: number;
  timestamp: number;
  roundId: bigint;
}

const PriceFeedPage: NextPage = () => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const { data, isPending, refetch } = useChainlinkArbUsdFeed();
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [isRefetching, setIsRefetching] = useState(false);

  // Convert Chainlink price to USD (Chainlink ARB/USD has 8 decimals)
  const currentPrice = data?.answer ? Number(data.answer) / 100000000 : 0;
  const lastUpdated = data?.updatedAt ? new Date(Number(data.updatedAt) * 1000) : null;

  // Add new price data to history when data updates
  useEffect(() => {
    if (data?.answer && data?.roundId && data?.updatedAt) {
      const newPriceData: PriceData = {
        price: Number(data.answer) / 100000000,
        timestamp: Number(data.updatedAt) * 1000,
        roundId: data.roundId,
      };

      setPriceHistory(prev => {
        // Check if this roundId already exists to avoid duplicates
        const exists = prev.some(item => item.roundId === newPriceData.roundId);
        if (exists) return prev;

        // Keep only the last 50 data points for performance
        const newHistory = [...prev, newPriceData].slice(-50);
        return newHistory.sort((a, b) => a.timestamp - b.timestamp);
      });
    }
  }, [data]);

  const handleRefetch = async () => {
    setIsRefetching(true);
    try {
      await refetch();
    } finally {
      setIsRefetching(false);
    }
  };

  // Calculate min and max for chart scaling
  const prices = priceHistory.map(d => d.price).filter(price => !isNaN(price));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 1;
  const priceRange = maxPrice - minPrice || 0.01; // Use small range instead of 0

  // Generate SVG path for price chart
  const generatePath = () => {
    if (priceHistory.length < 2) return "";

    const width = 600;
    const height = 200;
    const padding = 20;

    return priceHistory
      .map((point, index) => {
        const x =
          priceHistory.length === 1 ? width / 2 : padding + (index / (priceHistory.length - 1)) * (width - 2 * padding);
        const y =
          priceRange <= 0.01
            ? height / 2
            : height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);

        // Ensure coordinates are valid numbers
        if (isNaN(x) || isNaN(y)) return "";

        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .filter(Boolean) // Remove empty strings
      .join(" ");
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-6xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Chainlink ARB/USD Data Feed</span>
          <span className="block text-lg text-gray-600 mt-2">Live Chainlink Data</span>
        </h1>

        {/* Instructions for adding new data feeds */}
        <div
          className="rounded-lg p-6 mb-8 border"
          style={{
            backgroundColor: isDarkMode ? "#2a2a2a" : "#f0f8ff",
            borderColor: isDarkMode ? "#444" : "#cce7ff",
          }}
        >
          <h2 className="text-xl font-semibold mb-4">💡 Want to add your own Chainlink Data Feed?</h2>
          <div className="space-y-3 text-sm">
            <p>Follow these simple steps to integrate any Chainlink price feed:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>
                <strong>Add the contract:</strong> Go to{" "}
                <code className="dark:bg-gray-200 bg-gray-700 px-2 py-1 rounded">
                  packages/nextjs/contracts/externalContracts.ts
                </code>{" "}
                and add your desired Chainlink feed address to the configuration.
              </li>
              <li>
                <strong>Create a hook:</strong> Create a new hook in{" "}
                <code className="dark:bg-gray-200bg-gray-700 px-2 py-1 rounded">
                  packages/nextjs/hooks/chainlink-data-feed/
                </code>{" "}
                following the pattern in{" "}
                <code className="dark:bg-gray-200 bg-gray-700 px-2 py-1 rounded">useChainlinkArbUsdFeed.ts</code>
              </li>
              <li>
                <strong>Update this page:</strong> Import and use your new hook to display the data feed.
              </li>
            </ol>
            <p className="text-xs text-gray-500 mt-3">
              Find Chainlink feed addresses at{" "}
              <a
                href="https://docs.chain.link/data-feeds/price-feeds/addresses"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                docs.chain.link/data-feeds
              </a>
            </p>
          </div>
        </div>

        {/* Current Price Display */}
        <div
          className="rounded-2xl p-8 mb-8 border-2"
          style={{
            backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
            borderColor: isDarkMode ? "#333" : "#e9ecef",
          }}
        >
          <div className="text-center">
            <div className="text-6xl font-bold mb-4" style={{ color: "#E3066E" }}>
              {isPending ? <div className="animate-pulse">Loading...</div> : `$${currentPrice.toFixed(4)}`}
            </div>
            <div className="text-lg text-gray-600 mb-4">
              {lastUpdated && (
                <>
                  Last Updated: {lastUpdated.toLocaleString()}
                  <br />
                  Round ID: {data?.roundId?.toString()}
                </>
              )}
            </div>
            <button
              onClick={handleRefetch}
              disabled={isRefetching || isPending}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-lg 
                         hover:from-pink-600 hover:to-red-600 transition-all duration-200 
                         disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isRefetching ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Refreshing...
                </span>
              ) : (
                "Refresh Price"
              )}
            </button>
          </div>
        </div>

        {/* Price Chart */}
        <div
          className="rounded-2xl p-8 border-2"
          style={{
            backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
            borderColor: isDarkMode ? "#333" : "#e9ecef",
          }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Price Movement</h2>
          {priceHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-20">
              <p className="text-lg">No price data yet</p>
              <p className="text-sm mt-2">Click &quot;Refresh Price&quot; to start collecting data</p>
            </div>
          ) : (
            <div className="relative">
              <svg
                viewBox="0 0 600 200"
                className="w-full h-auto border rounded-lg"
                style={{
                  backgroundColor: isDarkMode ? "#000" : "#fff",
                  borderColor: isDarkMode ? "#333" : "#ddd",
                }}
              >
                {/* Grid lines */}
                <defs>
                  <pattern id="grid" width="60" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 40" fill="none" stroke={isDarkMode ? "#333" : "#eee"} strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="600" height="200" fill="url(#grid)" />

                {/* Price line */}
                {priceHistory.length > 1 && (
                  <path
                    d={generatePath()}
                    fill="none"
                    stroke="#E3066E"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data points */}
                {priceHistory.map((point, index) => {
                  const x =
                    priceHistory.length === 1
                      ? 300 // Center the single point
                      : 20 + (index / (priceHistory.length - 1)) * 560;
                  const y =
                    priceRange <= 0.01
                      ? 100 // Center vertically if no price range
                      : 180 - ((point.price - minPrice) / priceRange) * 160;

                  // Ensure coordinates are valid numbers
                  if (isNaN(x) || isNaN(y)) return null;

                  return (
                    <circle
                      key={point.roundId.toString()}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#E3066E"
                      stroke="#fff"
                      strokeWidth="2"
                    >
                      <title>{`$${point.price.toFixed(4)} at ${new Date(point.timestamp).toLocaleTimeString()}`}</title>
                    </circle>
                  );
                })}

                {/* Y-axis labels */}
                <text x="10" y="25" fontSize="12" fill={isDarkMode ? "#ccc" : "#666"}>
                  ${maxPrice.toFixed(4)}
                </text>
                <text x="10" y="195" fontSize="12" fill={isDarkMode ? "#ccc" : "#666"}>
                  ${minPrice.toFixed(4)}
                </text>
              </svg>

              {/* Chart statistics */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
                    border: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
                  }}
                >
                  <div className="text-sm text-gray-500">Data Points</div>
                  <div className="text-lg font-semibold">{priceHistory.length}</div>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
                    border: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
                  }}
                >
                  <div className="text-sm text-gray-500">Price Range</div>
                  <div className="text-lg font-semibold">${priceRange.toFixed(4)}</div>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
                    border: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
                  }}
                >
                  <div className="text-sm text-gray-500">Time Span</div>
                  <div className="text-lg font-semibold">
                    {priceHistory.length > 1
                      ? `${Math.round(
                          (priceHistory[priceHistory.length - 1].timestamp - priceHistory[0].timestamp) / 60000,
                        )}m`
                      : "0m"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Data provided by Chainlink ARB/USD Price Feed</p>
          <p className="mt-1">Chart shows the last 50 price updates</p>
        </div>
      </div>
    </div>
  );
};

export default PriceFeedPage;
