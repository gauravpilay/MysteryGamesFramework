/**
 * AssessmentEngine.js
 * Transforms raw game metrics into deep, qualitative intelligence insights.
 */

export const generateAssessment = (userData, objMap) => {
    const { stats, objectiveStats, byMission } = userData;

    // 1. Core Competency Analysis
    const competencies = Object.entries(objectiveStats).map(([name, stat]) => {
        const avg = Math.round(stat.total / stat.count);
        const sortedRuns = [...(stat.runs || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
        const first = sortedRuns[0]?.score || 0;
        const last = sortedRuns[sortedRuns.length - 1]?.score || 0;
        const trend = last - first;

        return { name, avg, trend, runs: stat.count };
    });

    const topSkill = [...competencies].sort((a, b) => b.avg - a.avg)[0];
    const growthSkill = [...competencies].sort((a, b) => b.trend - a.trend)[0];
    const riskSkill = [...competencies].sort((a, b) => a.avg - b.avg)[0];

    // 2. Efficiency Analysis
    const avgTimePerMission = stats.totalPlayed > 0 ? stats.totalTime / stats.totalPlayed : 0;
    const efficiencyScore = Math.max(0, 100 - (avgTimePerMission / 600) * 50); // Normalized score

    // 3. Behavioral Archetype
    let archetype = "Field Agent";
    if (efficiencyScore > 80 && stats.winRate > 90) archetype = "Elite Specialist";
    else if (growthSkill?.trend > 20) archetype = "Rapid Adapter";
    else if (stats.totalPlayed > 10) archetype = "Veteran Investigator";
    else if (stats.totalPlayed < 3) archetype = "Initiate";

    // 4. Detailed Summary (Narrative)
    let summary = "";
    if (stats.totalPlayed === 0) {
        summary = "Personnel has no recorded field activity. Baseline assessment pending.";
    } else {
        summary = `Agent profile indicates a ${archetype} archetype. `;
        if (topSkill) summary += `Demonstrates peak performance in ${topSkill.name} with an average efficiency of ${topSkill.avg}%. `;
        if (growthSkill && growthSkill.trend > 0) summary += `The most significant growth is observed in ${growthSkill.name}, showing a ${growthSkill.trend}% improvement over the training cycle. `;
        if (riskSkill && riskSkill.avg < 60) summary += `Primary vulnerability identified in ${riskSkill.name}; recommending targeted simulation reinforcement. `;
    }

    // 5. Recommendations
    const recommendations = [];
    if (riskSkill && riskSkill.avg < 70) {
        recommendations.push(`Reinforce ${riskSkill.name} fundamentals through specialized case studies.`);
    }
    if (efficiencyScore < 50) {
        recommendations.push("Focus on evidence synthesis speed and interrogation efficiency.");
    }
    if (stats.winRate < 70) {
        recommendations.push("Review 'Critical Decision Points' in previous failures to identify recurring logic gaps.");
    }
    if (recommendations.length === 0) {
        recommendations.push("Ready for High-Stakes Operations. Maintain current performance levels.");
    }

    return {
        archetype,
        efficiencyScore,
        summary,
        recommendations,
        competencies,
        metrics: {
            topSkill,
            growthSkill,
            riskSkill,
            avgTimePerMission
        }
    };
};

export const getAgencyBenchmarks = (allResults) => {
    // Calculate global averages
    const totalTime = allResults.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 0), 0);
    const totalWins = allResults.filter(r => r.outcome === 'success').length;
    const avgScore = allResults.reduce((acc, curr) => acc + (curr.score || 0), 0) / (allResults.length || 1);

    return {
        avgWinRate: (totalWins / (allResults.length || 1)) * 100,
        avgTimeMinutes: (totalTime / (allResults.length || 1)) / 60,
        avgScore: Math.round(avgScore)
    };
};
