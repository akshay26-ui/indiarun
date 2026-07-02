"use client";

export function MiniChart({
  values,
  color = "#818cf8",
  height = 150,
  label,
}: {
  values: number[];
  color?: string;
  height?: number;
  label: string;
}) {
  const width = 520;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - 16 - ((value - min) / range) * (height - 36);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="block w-full" height={height}>
      <defs>
        <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((line) => (
        <line key={line} x1="0" x2={width} y1={height * line} y2={height * line} stroke="rgba(255,255,255,.07)" strokeDasharray="4 6" />
      ))}
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#fill-${color.replace("#", "")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((value, index) => {
        const [x, y] = points.split(" ")[index].split(",");
        return <circle key={`${value}-${index}`} cx={x} cy={y} r="4" fill="#080b12" stroke={color} strokeWidth="2" />;
      })}
    </svg>
  );
}
