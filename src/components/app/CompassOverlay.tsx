'use client';

import { useGPSStore } from '@/lib/store/gpsStore';
import { useMapStore } from '@/lib/store/mapStore';

export default function CompassOverlay() {
  const bearing = useMapStore((s) => s.bearing);
  const gpsHeading = useGPSStore((s) => s.fix?.heading ?? null);

  const roseAngle = -bearing;
  const hasHeading = gpsHeading !== null && !Number.isNaN(gpsHeading);
  const needleAngle = hasHeading ? gpsHeading! - bearing : null;

  return (
    <div className="pointer-events-none">
      <div className="bg-background/80 backdrop-blur-sm border border-border rounded-full shadow-md p-1">
        <svg width="64" height="64" viewBox="-32 -32 64 64">
          {/* Compass rose — rotates so N always points to true north */}
          <g transform={`rotate(${roseAngle})`}>
            {/* Cardinal ticks */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                x1={0}
                y1={-28}
                x2={0}
                y2={deg % 90 === 0 ? -22 : -25}
                stroke="currentColor"
                strokeWidth={deg % 90 === 0 ? 1.5 : 0.75}
                strokeOpacity={0.5}
                transform={`rotate(${deg})`}
              />
            ))}
            {/* North needle — red, always visible */}
            <polygon points="0,-22 4,-8 0,-13 -4,-8" fill="#ef4444" fillOpacity={0.95} />
            {/* South needle — muted */}
            <polygon points="0,22 4,8 0,13 -4,8" fill="currentColor" fillOpacity={0.25} />
            {/* N label */}
            <text
              y={-16}
              textAnchor="middle"
              dominantBaseline="auto"
              fontSize="7"
              fontWeight="700"
              fill="#ef4444"
              transform="translate(0,-9)"
            >
              N
            </text>
          </g>

          {/* GPS heading needle — only when device reports heading */}
          {needleAngle !== null && (
            <g transform={`rotate(${needleAngle})`}>
              <polygon
                points="0,-26 2.5,-18 0,-21 -2.5,-18"
                fill="#f97316"
                fillOpacity={0.9}
              />
              <polygon
                points="0,26 2.5,18 0,21 -2.5,18"
                fill="#f97316"
                fillOpacity={0.3}
              />
            </g>
          )}

          {/* Center dot */}
          <circle r="2.5" fill={hasHeading ? '#f97316' : '#ef4444'} fillOpacity={0.9} />
        </svg>
      </div>
    </div>
  );
}
