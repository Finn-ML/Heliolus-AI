import { Risk, Likelihood, Impact } from '@/types/assessment';

interface RiskHeatmapProps {
  risks: Risk[];
}

const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ risks }) => {
  const likelihoodLevels: Likelihood[] = ['CERTAIN', 'LIKELY', 'POSSIBLE', 'UNLIKELY', 'RARE'];
  const impactLevels: Impact[] = ['NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC'];

  // Create a map of risks by likelihood and impact
  const riskMap = new Map<string, Risk[]>();
  risks.forEach(risk => {
    const key = `${risk.likelihood}-${risk.impact}`;
    if (!riskMap.has(key)) {
      riskMap.set(key, []);
    }
    riskMap.get(key)!.push(risk);
  });

  // Get cell color based on risk level
  const getCellColor = (likelihood: Likelihood, impact: Impact): string => {
    const score = getMatrixScore(likelihood, impact);
    if (score >= 20) return 'bg-red-500/30 border-red-500/50';
    if (score >= 15) return 'bg-orange-500/30 border-orange-500/50';
    if (score >= 10) return 'bg-yellow-500/30 border-yellow-500/50';
    if (score >= 5) return 'bg-green-500/30 border-green-500/50';
    return 'bg-gray-800/30 border-gray-700/50';
  };

  // Calculate risk score based on position in matrix
  const getMatrixScore = (likelihood: Likelihood, impact: Impact): number => {
    const likelihoodScore = {
      RARE: 1,
      UNLIKELY: 2,
      POSSIBLE: 3,
      LIKELY: 4,
      CERTAIN: 5,
    };

    const impactScore = {
      NEGLIGIBLE: 1,
      MINOR: 2,
      MODERATE: 3,
      MAJOR: 4,
      CATASTROPHIC: 5,
    };

    return likelihoodScore[likelihood] * impactScore[impact];
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Matrix Header */}
        <div className="flex items-end mb-2">
          <div className="w-32 pb-2">
            <p className="text-sm font-medium text-gray-400 -rotate-90 transform origin-left translate-x-12 translate-y-12">
              Likelihood →
            </p>
          </div>
          <div className="flex-1 flex">
            {impactLevels.map(impact => (
              <div key={impact} className="flex-1 text-center">
                <p className="text-xs text-gray-400 capitalize">{impact.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="space-y-1">
          {likelihoodLevels.map(likelihood => (
            <div key={likelihood} className="flex items-center">
              <div className="w-32 pr-3 text-right">
                <p className="text-xs text-gray-400 capitalize">{likelihood.toLowerCase()}</p>
              </div>
              <div className="flex-1 flex gap-1">
                {impactLevels.map(impact => {
                  const cellRisks = riskMap.get(`${likelihood}-${impact}`) || [];
                  const cellColor = getCellColor(likelihood, impact);

                  return (
                    <div
                      key={`${likelihood}-${impact}`}
                      className={`
                        flex-1 aspect-square border rounded-lg p-2
                        flex items-center justify-center relative group
                        transition-all duration-200 hover:scale-105 hover:z-10
                        ${cellColor}
                      `}
                      data-testid={`heatmap-cell-${likelihood}-${impact}`}
                    >
                      {cellRisks.length > 0 && (
                        <>
                          <span className="text-white font-bold text-lg">{cellRisks.length}</span>

                          {/* Tooltip */}
                          <div
                            className="
                            absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                            bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl
                            opacity-0 group-hover:opacity-100 pointer-events-none
                            transition-opacity duration-200 z-50 w-64
                            hidden group-hover:block
                          "
                          >
                            <p className="text-xs font-medium text-gray-300 mb-2">
                              {cellRisks.length} risk{cellRisks.length > 1 ? 's' : ''} in this
                              category:
                            </p>
                            <ul className="space-y-1">
                              {cellRisks.slice(0, 3).map((risk, idx) => (
                                <li key={idx} className="text-xs text-gray-400">
                                  • {risk.title}
                                </li>
                              ))}
                              {cellRisks.length > 3 && (
                                <li className="text-xs text-gray-500">
                                  ... and {cellRisks.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Matrix Footer */}
        <div className="mt-4 flex items-center justify-center">
          <p className="text-sm text-gray-400">Impact →</p>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500/30 border border-green-500/50 rounded" />
            <span className="text-xs text-gray-400">Low Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500/30 border border-yellow-500/50 rounded" />
            <span className="text-xs text-gray-400">Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500/30 border border-orange-500/50 rounded" />
            <span className="text-xs text-gray-400">High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/30 border border-red-500/50 rounded" />
            <span className="text-xs text-gray-400">Critical Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskHeatmap;
