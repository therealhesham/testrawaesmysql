/*
  SaudiMapComponent.tsx
  React component (default export) that renders an interactive map of Saudi Arabia with city markers.
  - Uses react-simple-maps for drawing GeoJSON/SVG map
  - Expects a `geoJson` prop (GeoJSON FeatureCollection for Saudi Arabia boundary)
  - Accepts `cityData` array with { id, name, coordinates: [lon, lat], value }
  - Provides simple color scaling, tooltip, hover, click handler, and basic zoom controls

  How to use:
  1. Install dependencies:
     npm install react-simple-maps d3-scale d3-format

  2. Provide a GeoJSON for Saudi Arabia (e.g. save as saudi.geo.json) and a city data array.

  3. Example usage is included at the bottom (commented).

  Notes:
  - This component is designed to be flexible: you can pass any GeoJSON in `geoJson`.
  - If you want a ready GeoJSON of Saudi Arabia, you can download one from Natural Earth or other sources and pass it in.
*/

import React, { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { format as d3format } from "d3-format";

// Types
type CityDatum = {
  id: string | number;
  name: string;
  coordinates: [number, number]; // [lon, lat]
  value: number;
  meta?: any;
};

type Props = {
  geoJson: any; // GeoJSON FeatureCollection for Saudi boundary (or larger region) — required
  cityData?: CityDatum[]; // array of cities + values
  width?: number;
  height?: number;
  minRadius?: number; // smallest marker radius
  maxRadius?: number; // largest marker radius
  colorRange?: [string, string]; // [lowColor, highColor]
  onCityClick?: (city: CityDatum) => void;
};

export default function SaudiMap({
  geoJson,
  cityData = [],
  width = 800,
  height = 700,
  minRadius = 4,
  maxRadius = 18,
  colorRange = ["#ffe6e6", "#c91f1f"],
  onCityClick,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([45, 25]); // Saudi center estimate

  // Build scales based on values in cityData
  const values = cityData.map((d) => d.value);
  const valueMin = Math.min(...(values.length ? values : [0]));
  const valueMax = Math.max(...(values.length ? values : [1]));

  const radiusScale = useMemo(
    () => scaleLinear().domain([valueMin, valueMax]).range([minRadius, maxRadius]),
    [valueMin, valueMax, minRadius, maxRadius]
  );

  const colorScale = useMemo(
    () =>
      scaleLinear<string>().domain([valueMin, valueMax]).range([colorRange[0], colorRange[1]]),
    [valueMin, valueMax, colorRange]
  );

  const fmt = d3format(
    values.some((v) => Math.abs(v) >= 1000) ? ",.0f" : ".2f"
  );

  function handleZoomIn() {
    setZoom((z) => Math.min(6, z * 1.5));
  }
  function handleZoomOut() {
    setZoom((z) => Math.max(0.5, z / 1.5));
  }

  function handleReset() {
    setZoom(1);
    setCenter([45, 25]);
  }

  return (
    <div className="p-4 bg-white rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold">خريطة السعودية — المدن والبيانات</div>
        <div className="space-x-2">
          <button
            onClick={handleZoomIn}
            className="px-3 py-1 rounded-md border hover:shadow-sm"
            title="تكبير"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="px-3 py-1 rounded-md border hover:shadow-sm"
            title="تصغير"
          >
            -
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1 rounded-md border hover:shadow-sm"
            title="إعادة"
          >
            ↺
          </button>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: width }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 1200, center }}
          width={width}
          height={height}
          style={{ width: "100%", height: "auto" }}
        >
          <ZoomableGroup zoom={zoom} center={center} onMoveEnd={({ coordinates }) => setCenter(coordinates as [number, number])}>
            <Geographies geography={geoJson}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#f3f4f6"
                    stroke="#9ca3af"
                    strokeWidth={0.5}
                    onMouseEnter={() => {
                      setTooltip((geo.properties && (geo.properties.NAME || geo.properties.name)) || "منطقة");
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))
              }
            </Geographies>

            {/* City markers */}
            {cityData.map((c) => {
              const r = radiusScale(c.value ?? 0);
              const fill = colorScale(c.value ?? 0) as string;
              const isHovered = hovered === String(c.id);
              return (
                <Marker
                  key={c.id}
                  coordinates={c.coordinates}
                  onMouseEnter={() => {
                    setHovered(String(c.id));
                    setTooltip(`${c.name}: ${fmt(c.value)}`);
                  }}
                  onMouseLeave={() => {
                    setHovered(null);
                    setTooltip(null);
                  }}
                  onClick={() => onCityClick && onCityClick(c)}
                >
                  <g transform={`translate(${-r / 2},${-r / 2})`}>
                    <circle
                      r={r}
                      fill={fill}
                      stroke={isHovered ? "#111827" : "#ffffff"}
                      strokeWidth={isHovered ? 2 : 1}
                      style={{ cursor: onCityClick ? "pointer" : "default", opacity: 0.95 }}
                    />
                    {/* small white center for contrast */}
                    <circle r={Math.max(1, r / 5)} fill="#fff" cx={0} cy={0} />
                  </g>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-2 p-2 text-sm bg-gray-50 border rounded-md shadow-sm">
          <strong>{tooltip}</strong>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center space-x-4 rtl:space-x-reverse">
        <div className="text-sm">مفتاح الألوان (القيمة)</div>
        <div className="flex items-center gap-2">
          <div className="w-40 h-4 rounded-full" style={{ background: `linear-gradient(90deg, ${colorRange[0]}, ${colorRange[1]})` }} />
          <div className="text-xs">{fmt(valueMin)}</div>
          <div className="text-xs">{fmt(valueMax)}</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------
   Example usage (put in a parent component):

import React from 'react';
import SaudiMap from './SaudiMapComponent';
import saudiGeoJson from './saudi.geo.json';

const cityData = [
  { id: 'riyadh', name: 'الرياض', coordinates: [46.6753, 24.7136], value: 120 },
  { id: 'jeddah', name: 'جدة', coordinates: [39.19797, 21.54333], value: 95 },
  { id: 'dammam', name: 'الدمام', coordinates: [50.0995, 26.3927], value: 60 },
  { id: 'makkah', name: 'مكة', coordinates: [39.8262, 21.4225], value: 80 },
  { id: 'madinah', name: 'المدينة', coordinates: [39.6142, 24.5247], value: 55 },
  { id: 'abha', name: 'أبها', coordinates: [42.5126, 18.2166], value: 28 },
  { id: 'tabuk', name: 'تبوك', coordinates: [36.5456, 28.3838], value: 18 },
  { id: 'hail', name: 'حائل', coordinates: [41.6901, 27.5114], value: 12 },
];

export default function App() {
  return (
    <div className="p-6">
      <SaudiMap
        geoJson={saudiGeoJson}
        cityData={cityData}
        width={900}
        height={720}
        onCityClick={(c) => alert(`${c.name}: ${c.value}`)}
      />
    </div>
  );
}
  Notes about obtaining saudi.geo.json:
  - You can export a GeoJSON for Saudi Arabia from Natural Earth (1:50m or 1:10m) or GADM.
  - Save it in your project (e.g. `public/saudi.geo.json`) and import as shown above.
------------------------------------------------------- */

