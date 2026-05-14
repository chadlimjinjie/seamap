'use client';

import { useGPSStore } from '@/lib/store/gpsStore';
import { useMapStore } from '@/lib/store/mapStore';

export default function CompassOverlay() {
  const bearing = useMapStore((s) => s.bearing);
  const gpsHeading = useGPSStore((s) => s.fix?.heading ?? null);

  const roseAngle = -bearing;
  const needleAngle = gpsHeading !== null ? gpsHeading - bearing : null;

  return (
    <div className="absolute top-4 right-4 z-10 pointer-events-none">
      <div className="bg-background/80 backdrop-blur-sm border border-border rounded-full shadow-md p-1">
        <svg width="64" height="64" viewBox="-32 -32 64 64">
          {/* Compass rose */}
          <g transform={`rotate(${roseAngle})`}>
            {/* Cardinal ticks */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                x1={0}
                y1={-28}
                x2={0}
                y2={deg % 90 === 0 ? -22 : -24}
                stroke="currentColor"
                strokeWidth={deg % 90 === 0 ? 1.5 : 0.75}
                strokeOpacity={0.6}
                transform={`rotate(${deg})`}
              />
            ))}
            {/* N label */}
            <text
              y={-16}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fontWeight="700"
              fill="#ef4444"
            >
              N
            </text>
            {/* S label */}
            <text
              y={18}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fill="currentColor"
              fillOpacity={0.5}
            >
              S
            </text>
            {/* E label */}
            <text
              x={17}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fill="currentColor"
              fillOpacity={0.5}
            >
              E
            </text>
            {/* W label */}
            <text
              x={-17}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fill="currentColor"
              fillOpacity={0.5}
            >
              W
            </text>
          </g>

          {/* GPS heading needle */}
          {needleAngle !== null && (
            <g transform={`rotate(${needleAngle})`}>
              <polygon
                points="0,-24 3,-14 0,-18 -3,-14"
                fill="#f97316"
                fillOpacity={0.9}
              />
              <polygon
                points="0,24 3,14 0,18 -3,14"
                fill="currentColor"
                fillOpacity={0.3}
              />
            </g>
          )}

          {/* Center dot */}
          <circle r="2.5" fill="currentColor" fillOpacity={0.7} />
        </svg>
      </div>
    </div>
  );
}
