import { motion } from 'framer-motion';

// Mini bar chart component
export const MiniBarChart = ({ data, height = 60 }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((item, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(item.value / maxValue) * 100}%` }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="flex-1 rounded-t-sm relative group cursor-pointer"
          style={{ backgroundColor: item.color, minHeight: item.value > 0 ? 4 : 0 }}
        >
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-surface-900 text-xs text-surface-200 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {item.label}: {item.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Donut chart component
export const DonutChart = ({ data, size = 120, strokeWidth = 20 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  let currentOffset = 0;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-surface-800"
        />
        {data.map((item, i) => {
          const percentage = total > 0 ? item.value / total : 0;
          const dashLength = circumference * percentage;
          const offset = currentOffset;
          currentOffset += dashLength;
          
          return (
            <motion.circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${dashLength} ${circumference}`}
              strokeDashoffset={-offset}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${dashLength} ${circumference}` }}
              transition={{ delay: i * 0.2, duration: 0.8 }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-surface-100">{total}</span>
        <span className="text-xs text-surface-500">Total</span>
      </div>
    </div>
  );
};

// Progress wave animation
export const ProgressWave = ({ value, color = '#6366f1' }) => (
  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="h-full rounded-full relative overflow-hidden"
      style={{ backgroundColor: color }}
    >
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
    </motion.div>
  </div>
);

// Progress circle component
export const ProgressCircle = ({ value, size = 80, strokeWidth = 8, color = '#6366f1' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-surface-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>{value}%</span>
      </div>
    </div>
  );
};

// Horizontal bar chart for comparison
export const HorizontalBarChart = ({ data, maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-surface-300 truncate">{item.label}</span>
            <span className="text-surface-400 font-medium">{item.value}</span>
          </div>
          <div className="h-3 bg-surface-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="h-full rounded-full"
              style={{ backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Radar chart for skills
export const RadarChart = ({ data, size = 200 }) => {
  const center = size / 2;
  const radius = size * 0.4;
  const angleStep = (2 * Math.PI) / data.length;
  
  const getPoint = (value, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };
  
  const gridLevels = [25, 50, 75, 100];
  
  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Grid */}
      {gridLevels.map(level => {
        const r = (level / 100) * radius;
        const points = data.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            key={level}
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-surface-700"
          />
        );
      })}
      
      {/* Axes */}
      {data.map((item, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return (
          <g key={i}>
            <line
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-surface-700"
            />
            <text
              x={center + (radius + 20) * Math.cos(angle)}
              y={center + (radius + 20) * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-surface-400 text-xs"
            >
              {item.label}
            </text>
          </g>
        );
      })}
      
      {/* Data polygon */}
      <motion.polygon
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        points={data.map((item, i) => {
          const pt = getPoint(item.value, i);
          return `${pt.x},${pt.y}`;
        }).join(' ')}
        fill="rgba(99, 102, 241, 0.2)"
        stroke="#6366f1"
        strokeWidth="2"
      />
      
      {/* Data points */}
      {data.map((item, i) => {
        const pt = getPoint(item.value, i);
        return (
          <motion.circle
            key={i}
            initial={{ r: 0 }}
            animate={{ r: 4 }}
            transition={{ delay: i * 0.1 }}
            cx={pt.x}
            cy={pt.y}
            fill="#6366f1"
          />
        );
      })}
    </svg>
  );
};

// Distribution pie chart
export const DistributionPie = ({ data, size = 120 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const center = size / 2;
  const radius = size * 0.4;
  
  let currentAngle = -Math.PI / 2;
  
  return (
    <svg width={size} height={size}>
      {data.map((item, i) => {
        const percentage = total > 0 ? item.value / total : 0;
        const angle = percentage * 2 * Math.PI;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;
        
        const x1 = center + radius * Math.cos(startAngle);
        const y1 = center + radius * Math.sin(startAngle);
        const x2 = center + radius * Math.cos(endAngle);
        const y2 = center + radius * Math.sin(endAngle);
        
        const largeArc = angle > Math.PI ? 1 : 0;
        
        return (
          <motion.path
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={item.color}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
        );
      })}
      <circle cx={center} cy={center} r={radius * 0.5} fill="currentColor" className="text-surface-900" />
      <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" className="fill-surface-200 text-lg font-bold">
        {total}
      </text>
    </svg>
  );
};
