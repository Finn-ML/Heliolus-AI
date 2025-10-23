import { useEffect, useRef } from 'react';

interface RiskScoreGaugeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({
  score,
  size = 'medium',
  showLabel = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const dimensions = {
    small: { width: 120, height: 80, radius: 50 },
    medium: { width: 180, height: 120, radius: 75 },
    large: { width: 240, height: 160, radius: 100 },
  };

  const dim = dimensions[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dim.width, dim.height);

    // Set up dimensions
    const centerX = dim.width / 2;
    const centerY = dim.height - 20;
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    // Draw background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, dim.radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(75, 85, 99, 0.3)';
    ctx.lineWidth = size === 'large' ? 20 : size === 'medium' ? 15 : 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Calculate score angle
    const scoreAngle = startAngle + (score / 100) * Math.PI;

    // Create gradient for score arc
    // Higher score = better compliance = greener color
    const gradient = ctx.createLinearGradient(0, 0, dim.width, 0);
    if (score < 30) {
      // CRITICAL: 0-29 = red
      gradient.addColorStop(0, '#ef4444'); // red
      gradient.addColorStop(1, '#f87171');
    } else if (score < 60) {
      // HIGH: 30-59 = orange
      gradient.addColorStop(0, '#f97316'); // orange
      gradient.addColorStop(1, '#fb923c');
    } else if (score < 80) {
      // MEDIUM: 60-79 = yellow
      gradient.addColorStop(0, '#f59e0b'); // yellow
      gradient.addColorStop(1, '#fbbf24');
    } else {
      // LOW: 80-100 = green
      gradient.addColorStop(0, '#10b981'); // green
      gradient.addColorStop(1, '#34d399');
    }

    // Draw score arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, dim.radius, startAngle, scoreAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = size === 'large' ? 20 : size === 'medium' ? 15 : 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw score text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size === 'large' ? '36px' : size === 'medium' ? '28px' : '20px'} sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${score}`, centerX, centerY - 10);

    if (showLabel) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = `${size === 'large' ? '14px' : '12px'} sans-serif`;
      ctx.fillText('Risk Score', centerX, centerY + (size === 'large' ? 15 : 10));
    }

    // Draw ticks
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      const tickAngle = startAngle + (i / tickCount) * Math.PI;
      const innerRadius = dim.radius - (size === 'large' ? 25 : size === 'medium' ? 18 : 12);
      const outerRadius = dim.radius - (size === 'large' ? 30 : size === 'medium' ? 22 : 15);

      const x1 = centerX + Math.cos(tickAngle) * innerRadius;
      const y1 = centerY + Math.sin(tickAngle) * innerRadius;
      const x2 = centerX + Math.cos(tickAngle) * outerRadius;
      const y2 = centerY + Math.sin(tickAngle) * outerRadius;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [score, size, dim, showLabel]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={dim.width}
        height={dim.height}
        className="w-full h-full"
        data-testid={`risk-gauge-${score}`}
      />
    </div>
  );
};

export default RiskScoreGauge;
