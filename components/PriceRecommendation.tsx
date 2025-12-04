import React, { useState, useEffect } from 'react';

interface PriceRecommendationProps {
    hostelId: string;
    onPriceUpdate?: (newPrice: number) => void;
}

interface Analysis {
    currentPrice: number;
    recommendedPrice: number;
    priceRange: { min: number; max: number };
    confidenceScore: number;
    revenueOptimization: {
        currentRevenue: number;
        projectedRevenue: number;
        revenueIncrease: number;
    };
    scoreBreakdown: {
        location: number;
        amenities: number;
        marketPosition: number;
        demand: number;
        competition: number;
    };
    marketPosition: number;
}

const PriceRecommendation: React.FC<PriceRecommendationProps> = ({ hostelId, onPriceUpdate }) => {
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPrice, setSelectedPrice] = useState(0);
    const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);

    useEffect(() => {
        loadAnalysis();
    }, [hostelId]);

    const loadAnalysis = async () => {
        try {
            const token = localStorage.getItem('hh_access_token');
            const res = await fetch(`http://localhost:5001/api/price/analysis/${hostelId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setAnalysis(data);
                setSelectedPrice(data.recommendedPrice);
            } else if (res.status === 404) {
                // No analysis yet, run one
                await runAnalysis();
            }
        } catch (error) {
            console.error('Failed to load analysis:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const runAnalysis = async () => {
        setIsRunningAnalysis(true);
        try {
            const token = localStorage.getItem('hh_access_token');
            const res = await fetch(`http://localhost:5001/api/price/analysis/${hostelId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setAnalysis(data);
                setSelectedPrice(data.recommendedPrice);
            }
        } catch (error) {
            console.error('Failed to run analysis:', error);
        } finally {
            setIsRunningAnalysis(false);
        }
    };

    const getPriceStatus = () => {
        if (!analysis) return 'neutral';
        const diff = ((analysis.currentPrice - analysis.recommendedPrice) / analysis.recommendedPrice) * 100;
        if (diff > 15) return 'overpriced';
        if (diff < -15) return 'underpriced';
        return 'optimal';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'overpriced': return 'text-red-600 bg-red-50 border-red-200';
            case 'underpriced': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'overpriced': return 'Above Market';
            case 'underpriced': return 'Below Market';
            case 'optimal': return 'Optimal Price';
            default: return 'Unknown';
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="text-gray-500">Loading price analysis...</div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
                <p className="text-gray-600 mb-4">No price analysis available</p>
                <button
                    onClick={runAnalysis}
                    disabled={isRunningAnalysis}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {isRunningAnalysis ? 'Analyzing...' : 'Run Price Analysis'}
                </button>
            </div>
        );
    }

    const status = getPriceStatus();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Price Recommendations</h2>
                <button
                    onClick={runAnalysis}
                    disabled={isRunningAnalysis}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                    {isRunningAnalysis ? 'Analyzing...' : 'Refresh Analysis'}
                </button>
            </div>

            {/* Price Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Price */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Current Price</p>
                    <p className="text-4xl font-bold text-gray-900">${analysis.currentPrice}</p>
                    <p className="text-sm text-gray-500 mt-2">per night</p>
                </div>

                {/* Recommended Price */}
                <div className={`p-6 rounded-xl shadow-sm border-2 ${getStatusColor(status)}`}>
                    <p className="text-sm font-medium mb-2">Recommended Price</p>
                    <p className="text-4xl font-bold">${analysis.recommendedPrice}</p>
                    <p className="text-sm mt-2">{getStatusText(status)}</p>
                </div>
            </div>

            {/* Price Range Slider */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Adjust Price</label>
                        <span className="text-2xl font-bold text-blue-600">${selectedPrice}</span>
                    </div>
                    <input
                        type="range"
                        min={analysis.priceRange.min}
                        max={analysis.priceRange.max}
                        value={selectedPrice}
                        onChange={(e) => setSelectedPrice(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>${analysis.priceRange.min}</span>
                        <span>${analysis.priceRange.max}</span>
                    </div>
                </div>

                <button
                    onClick={() => onPriceUpdate?.(selectedPrice)}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                >
                    Update Price to ${selectedPrice}
                </button>
            </div>

            {/* Revenue Impact */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Impact</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Current Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                            ${analysis.revenueOptimization.currentRevenue}
                        </p>
                        <p className="text-xs text-gray-500">per month</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Projected Revenue</p>
                        <p className="text-2xl font-bold text-blue-600">
                            ${analysis.revenueOptimization.projectedRevenue}
                        </p>
                        <p className="text-xs text-gray-500">per month</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Increase</p>
                        <p className={`text-2xl font-bold ${analysis.revenueOptimization.revenueIncrease >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {analysis.revenueOptimization.revenueIncrease >= 0 ? '+' : ''}
                            {analysis.revenueOptimization.revenueIncrease}%
                        </p>
                        <p className="text-xs text-gray-500">change</p>
                    </div>
                </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Score Breakdown</h3>
                <div className="space-y-3">
                    {Object.entries(analysis.scoreBreakdown).map(([category, score]) => {
                        const maxScores: Record<string, number> = {
                            location: 30,
                            amenities: 25,
                            marketPosition: 20,
                            demand: 15,
                            competition: 10
                        };
                        const max = maxScores[category] || 100;
                        const percentage = (score / max) * 100;

                        return (
                            <div key={category}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="capitalize text-gray-700">{category.replace(/([A-Z])/g, ' $1')}</span>
                                    <span className="font-medium">{score}/{max}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Market Position & Confidence */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
                    <p className="text-sm text-gray-600 mb-2">Market Position</p>
                    <p className="text-3xl font-bold text-gray-900">{analysis.marketPosition}th</p>
                    <p className="text-sm text-gray-500 mt-1">percentile</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
                    <p className="text-sm text-gray-600 mb-2">Confidence Score</p>
                    <p className="text-3xl font-bold text-green-600">{analysis.confidenceScore}%</p>
                    <p className="text-sm text-gray-500 mt-1">reliability</p>
                </div>
            </div>
        </div>
    );
};

export default PriceRecommendation;
