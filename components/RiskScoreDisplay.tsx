import React from 'react';

interface RiskScoreDisplayProps {
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    flags?: string[];
    showDetails?: boolean;
}

const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = ({
    riskScore,
    riskLevel,
    flags = [],
    showDetails = false
}) => {
    const getRiskColor = (level: string) => {
        const colors = {
            low: 'bg-green-100 text-green-800 border-green-300',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            high: 'bg-orange-100 text-orange-800 border-orange-300',
            critical: 'bg-red-100 text-red-800 border-red-300'
        };
        return colors[level as keyof typeof colors] || colors.low;
    };

    const getRiskIcon = (level: string) => {
        const icons = {
            low: '✓',
            medium: '⚠',
            high: '⚠',
            critical: '🚨'
        };
        return icons[level as keyof typeof icons] || '?';
    };

    const getRiskLabel = (level: string) => {
        const labels = {
            low: 'Low Risk',
            medium: 'Medium Risk',
            high: 'High Risk',
            critical: 'Critical Risk'
        };
        return labels[level as keyof typeof labels] || 'Unknown';
    };

    return (
        <div className="space-y-3">
            {/* Risk Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold ${getRiskColor(riskLevel)}`}>
                <span className="text-xl">{getRiskIcon(riskLevel)}</span>
                <span>{getRiskLabel(riskLevel)}</span>
                <span className="ml-2 text-sm opacity-75">({riskScore}/100)</span>
            </div>

            {/* Risk Score Bar */}
            <div className="w-full">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Risk Score</span>
                    <span>{riskScore}/100</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${riskLevel === 'critical' ? 'bg-red-600' :
                                riskLevel === 'high' ? 'bg-orange-500' :
                                    riskLevel === 'medium' ? 'bg-yellow-500' :
                                        'bg-green-500'
                            }`}
                        style={{ width: `${riskScore}%` }}
                    />
                </div>
            </div>

            {/* Flags */}
            {showDetails && flags.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Detected Issues:</h4>
                    <ul className="space-y-1">
                        {flags.map((flag, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span>{flag}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default RiskScoreDisplay;
