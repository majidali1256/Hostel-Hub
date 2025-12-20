import React, { useState, useEffect } from 'react';

interface MarketTrendsChartProps {
    location: string;
}

interface MarketTrend {
    location: string;
    averagePrice: number;
    medianPrice: number;
    priceRange: { min: number; max: number };
    totalListings: number;
    occupancyRate: number;
    demandIndex: number;
    seasonalTrend: string;
    growthRate: number;
    topAmenities: Array<{ name: string; count: number; avgPriceImpact: number }>;
    priceByType: {
        private: { avg: number; count: number };
        shared: { avg: number; count: number };
        dorm: { avg: number; count: number };
    };
}

const MarketTrendsChart: React.FC<MarketTrendsChartProps> = ({ location }) => {
    const [trends, setTrends] = useState<MarketTrend | null>(null);
    const [forecast, setForecast] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTrends();
        loadForecast();
    }, [location]);

    const loadTrends = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5001/api/price/market/${encodeURIComponent(location)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setTrends(data);
            }
        } catch (error) {
            console.error('Failed to load trends:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadForecast = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5001/api/price/forecast/${encodeURIComponent(location)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setForecast(data);
            }
        } catch (error) {
            console.error('Failed to load forecast:', error);
        }
    };

    const getSeasonalColor = (trend: string) => {
        switch (trend) {
            case 'peak': return 'text-red-600 bg-red-100';
            case 'high': return 'text-orange-600 bg-orange-100';
            case 'medium': return 'text-blue-600 bg-blue-100';
            case 'low': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getDemandColor = (demand: number) => {
        if (demand >= 70) return 'text-green-600';
        if (demand >= 40) return 'text-blue-600';
        return 'text-gray-600';
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="text-gray-500">Loading market trends...</div>
            </div>
        );
    }

    if (!trends) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                <p className="text-gray-600">No market data available for {location}</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Market Trends - {location}</h2>
                <p className="text-gray-600 mt-1">{trends.totalListings} active listings</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-600">Average Price</p>
                    <p className="text-2xl font-bold text-gray-900">${trends.averagePrice}</p>
                    <p className="text-xs text-gray-500">per night</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-600">Median Price</p>
                    <p className="text-2xl font-bold text-gray-900">${trends.medianPrice}</p>
                    <p className="text-xs text-gray-500">per night</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-600">Occupancy Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{trends.occupancyRate}%</p>
                    <p className="text-xs text-gray-500">average</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-600">Growth Rate</p>
                    <p className={`text-2xl font-bold ${trends.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trends.growthRate >= 0 ? '+' : ''}{trends.growthRate}%
                    </p>
                    <p className="text-xs text-gray-500">vs last period</p>
                </div>
            </div>

            {/* Seasonal & Demand */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Trend</h3>
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-lg font-medium capitalize ${getSeasonalColor(trends.seasonalTrend)}`}>
                            {trends.seasonalTrend}
                        </span>
                        <p className="text-sm text-gray-600">
                            {trends.seasonalTrend === 'peak' && 'Highest demand period'}
                            {trends.seasonalTrend === 'high' && 'Strong demand'}
                            {trends.seasonalTrend === 'medium' && 'Moderate demand'}
                            {trends.seasonalTrend === 'low' && 'Lower demand period'}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Index</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className={`h-4 rounded-full ${getDemandColor(trends.demandIndex)} bg-current`}
                                    style={{ width: `${trends.demandIndex}%` }}
                                />
                            </div>
                        </div>
                        <span className={`text-2xl font-bold ${getDemandColor(trends.demandIndex)}`}>
                            {trends.demandIndex}
                        </span>
                    </div>
                </div>
            </div>

            {/* Price Range */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range Distribution</h3>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Minimum</p>
                        <p className="text-xl font-bold text-gray-900">${trends.priceRange.min}</p>
                    </div>
                    <div className="flex-1">
                        <div className="relative h-8 bg-gradient-to-r from-green-200 via-blue-200 to-red-200 rounded-lg">
                            <div
                                className="absolute top-0 h-8 w-1 bg-blue-600"
                                style={{ left: `${((trends.averagePrice - trends.priceRange.min) / (trends.priceRange.max - trends.priceRange.min)) * 100}%` }}
                            >
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-blue-600 whitespace-nowrap">
                                    Avg: ${trends.averagePrice}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-600">Maximum</p>
                        <p className="text-xl font-bold text-gray-900">${trends.priceRange.max}</p>
                    </div>
                </div>
            </div>

            {/* Price by Type */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Price by Room Type</h3>
                <div className="grid grid-cols-3 gap-4">
                    {Object.entries(trends.priceByType).map(([type, data]) => (
                        <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 capitalize mb-2">{type} Room</p>
                            <p className="text-2xl font-bold text-gray-900">${data.avg || 'N/A'}</p>
                            <p className="text-xs text-gray-500 mt-1">{data.count} listings</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Amenities */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Valued Amenities</h3>
                <div className="space-y-3">
                    {trends.topAmenities.slice(0, 5).map((amenity, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                                <span className="font-medium text-gray-900 capitalize">{amenity.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600">{amenity.count} listings</span>
                                <span className={`text-sm font-medium ${amenity.avgPriceImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {amenity.avgPriceImpact >= 0 ? '+' : ''}${amenity.avgPriceImpact}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Forecast */}
            {forecast && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">30-Day Price Forecast</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Current Average</p>
                            <p className="text-2xl font-bold text-gray-900">${forecast.currentAverage}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Predicted Price</p>
                            <p className="text-2xl font-bold text-purple-600">${forecast.predictedPrice}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Trend</p>
                            <p className={`text-2xl font-bold capitalize ${forecast.trend === 'increasing' ? 'text-green-600' :
                                forecast.trend === 'decreasing' ? 'text-red-600' :
                                    'text-gray-600'
                                }`}>
                                {forecast.trend}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                        Confidence: {forecast.confidence}%
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketTrendsChart;
