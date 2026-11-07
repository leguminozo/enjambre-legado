'use client';

interface RadarConstellationProps {
  axes: readonly string[];
  scores: Record<string, number>;
  size?: number;
}

export function RadarConstellation({
  axes,
  scores,
  size = 200,
}: RadarConstellationProps) {
  const totalAxes = axes.length || 8;
  const cx = size / 2;
  const cy = size / 2;
  const rMax = (size / 2) * 0.68;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const points = axes.map((axis, i) => {
    const val = Math.max(1.0, Math.min(10.0, scores[axis] ?? 1.0)) / 10;
    const angle = ((Math.PI * 2) / totalAxes) * i - Math.PI / 2;
    const r = val * rMax;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), val, axis };
  });

  const polyStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div
      className="relative mx-auto flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
        <defs>
          <radialGradient id="radar-constellation-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.08" />
          </radialGradient>
        </defs>

        {levels.map((lvl) => {
          const pts = axes
            .map((_, i) => {
              const angle = ((Math.PI * 2) / totalAxes) * i - Math.PI / 2;
              const r = lvl * rMax;
              return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
            })
            .join(' ');
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="currentColor"
              className="text-border/50"
              strokeWidth="0.8"
              strokeDasharray={lvl === 1.0 ? undefined : '2 2'}
            />
          );
        })}

        {axes.map((_, i) => {
          const angle = ((Math.PI * 2) / totalAxes) * i - Math.PI / 2;
          const x2 = cx + rMax * Math.cos(angle);
          const y2 = cy + rMax * Math.sin(angle);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x2.toFixed(1)}
              y2={y2.toFixed(1)}
              stroke="currentColor"
              className="text-border/40"
              strokeWidth="0.8"
            />
          );
        })}

        <polygon
          points={polyStr}
          fill="url(#radar-constellation-grad)"
          stroke="var(--primary)"
          strokeWidth="2"
          className="transition-all duration-300 ease-out"
        />

        {points.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="3.5"
            className="fill-primary stroke-card transition-all duration-300 ease-out"
            strokeWidth="1.5"
          />
        ))}
      </svg>
    </div>
  );
}
