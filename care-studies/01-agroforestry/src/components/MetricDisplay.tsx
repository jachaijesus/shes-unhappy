import React, { useEffect, useState } from 'react';

interface MetricDisplayProps {
  stage: number;
}

interface Metric {
  name: string;
  unit: string;
  values: number[];
  labels: string[];
  max: number;
  color: string;
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({ stage }) => {
  const metrics: Metric[] = [
    {
      name: "Soil Organic Matter",
      unit: "%",
      values: [1.2, 2.5, 4.8, 6.8],
      labels: ["Critical", "Improving", "Healthy", "Rich Loam"],
      max: 10,
      color: "var(--stage-3-accent)"
    },
    {
      name: "Carbon Sequestration",
      unit: " t/ha/yr",
      values: [-0.8, 0.6, 2.1, 3.6],
      labels: ["Net Source", "Low Capture", "Moderate", "High Sink"],
      max: 5,
      color: "var(--stage-2-accent)"
    },
    {
      name: "Biodiversity Index",
      unit: "%",
      values: [12, 38, 72, 96],
      labels: ["Desertified", "Pioneer Species", "Developing", "Saturated"],
      max: 100,
      color: "var(--stage-1-accent)"
    },
    {
      name: "Water Infiltration",
      unit: " mm/hr",
      values: [15, 45, 90, 140],
      labels: ["Runoff Risk", "Slow Absorption", "Moderate", "Excellent Reservoir"],
      max: 150,
      color: "#ec4899" // hot pink
    }
  ];

  // Helper hook/state for number interpolation
  const [displayedValues, setDisplayedValues] = useState<number[]>([1.2, -0.8, 12, 15]);

  useEffect(() => {
    const steps = 30;
    const duration = 800; // ms
    const intervalTime = duration / steps;
    let stepCount = 0;

    const startValues = [...displayedValues];
    const targetValues = metrics.map(m => m.values[stage]);

    const timer = setInterval(() => {
      stepCount++;
      const ratio = stepCount / steps;
      // Smooth easeOutQuad interpolation
      const easeRatio = ratio * (2 - ratio);

      const nextValues = startValues.map((startVal, index) => {
        const targetVal = targetValues[index];
        return startVal + (targetVal - startVal) * easeRatio;
      });

      setDisplayedValues(nextValues);

      if (stepCount >= steps) {
        setDisplayedValues(targetValues);
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [stage]);

  return (
    <div className="metrics-grid">
      {metrics.map((metric, index) => {
        const val = displayedValues[index];
        const rawTarget = metrics.map(m => m.values[stage])[index]; // update metric raw target lookup
        const delta = rawTarget - (stage > 0 ? metric.values[0] : rawTarget);
        
        // Calculate SVG circle progress
        const radius = 26;
        const circumference = 2 * Math.PI * radius;
        // Normalize value (safeguard positive offsets)
        const normalizedVal = Math.max(0, Math.min(metric.max, metric.name === "Carbon Sequestration" ? val + 1 : val));
        const normalizedMax = metric.name === "Carbon Sequestration" ? metric.max + 1 : metric.max;
        const strokeDashoffset = circumference - (normalizedVal / normalizedMax) * circumference;

        return (
          <div key={metric.name} className="metric-card glass-panel ui-element">
            <div className="metric-gauge-container">
              <svg width="70" height="70" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track circle */}
                <circle
                  cx="35"
                  cy="35"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="4"
                  fill="transparent"
                />
                {/* Gauge circle */}
                <circle
                  cx="35"
                  cy="35"
                  r={radius}
                  stroke={metric.color}
                  strokeWidth="4.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 0.1s ease-out, stroke 0.4s ease'
                  }}
                />
              </svg>
              <div className="metric-value">
                {metric.name === "Carbon Sequestration" 
                  ? `${val >= 0 ? '+' : ''}${val.toFixed(1)}` 
                  : val.toFixed(metric.name === "Soil Organic Matter" ? 1 : 0)
                }
                <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{metric.unit}</span>
              </div>
            </div>

            <div className="metric-label">{metric.name}</div>
            
            <div style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
              {metric.labels[stage]}
            </div>

            {stage > 0 && (
              <div className={`metric-delta ${delta >= 0 ? 'positive' : 'negative'}`}>
                {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}{metric.unit} vs baseline
              </div>
            )}
            {stage === 0 && (
              <div className="metric-delta negative">
                Baseline state
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MetricDisplay;
