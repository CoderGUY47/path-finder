"use client";

import { useState } from "react";
import { GoogleMap, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { dijkstra, Graph, NodeId } from "./utils/dijkstra";
import { FaExchangeAlt } from "react-icons/fa";

// Map container style
const containerStyle = {
  width: "100vw",
  height: "100vh",
  borderRadius: "1.5rem",
  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.7)",
};

// Center of the map (Dhaka, Bangladesh)
const center = {
  lat: 23.8103,
  lng: 90.4125,
};

type Place = {
  id: NodeId;
  name: string;
  position: { lat: number; lng: number };
};

// Arrange nodes in a regular octagon around Dhaka
const polygonCount = 9;
const radius = 0.018; // ~2km radius
const initialPlaces: Place[] = Array.from({ length: polygonCount }, (_, i) => {
  const angle = (2 * Math.PI * i) / polygonCount - Math.PI / 2;
  return {
    id: String.fromCharCode(65 + i), // 'A', 'B', ...
    name: `Place ${String.fromCharCode(65 + i)}`,
    position: {
      lat: center.lat + radius * Math.cos(angle),
      lng: center.lng + radius * Math.sin(angle),
    },
  };
});

// Build a graph where each node connects to its two neighbors (polygon ring)
const graph: Graph = {};
for (let i = 0; i < polygonCount; i++) {
  const currId = String.fromCharCode(65 + i);
  const nextId = String.fromCharCode(65 + ((i + 1) % polygonCount));
  const prevId = String.fromCharCode(65 + ((i - 1 + polygonCount) % polygonCount));
  // Random integer weight between 5 and 70
  const randomWeight = () => Math.floor(Math.random() * 66) + 5;
  graph[currId] = [
    { to: nextId, weight: randomWeight() },
    { to: prevId, weight: randomWeight() },
  ];
}

// Custom SVG marker with purple/sky gradient glow
const getGlowMarker = (label: string, type: "normal" | "start" | "end" = "normal") => {
  const glowColor =
    type === "start"
      ? "#38bdf8"
      : type === "end"
      ? "#a21caf"
      : "#818cf8";

  const outerGlow =
    type === "start" || type === "end"
      ? `<circle cx="32" cy="32" r="28" fill="${glowColor}" opacity="0.8" />`
      : "";

  return {
    url:
      "data:image/svg+xml;utf-8," +
      encodeURIComponent(
        `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#a5b4fc" stop-opacity="1"/>
              <stop offset="60%" stop-color="#818cf8" stop-opacity="0.8"/>
              <stop offset="100%" stop-color="#c084fc" stop-opacity="0.4"/>
            </radialGradient>
          </defs>
          ${outerGlow}
          <circle cx="32" cy="32" r="22" fill="url(%23glow)" />
          <circle cx="32" cy="32" r="13" fill="#7c3aed" stroke="#a5b4fc" stroke-width="3"/>
          <text x="32" y="38" text-anchor="middle" font-size="18" font-family="Arial" font-weight="bold" fill="#fff">${label}</text>
        </svg>`
      ),
    scaledSize: { width: 52, height: 52 } as google.maps.Size,
    anchor: { x: 28, y: 28 } as google.maps.Point,
  };
};

const GRADIENT_PATH_COLOR = "#7C3AED";

// Helper to get midpoint between two coordinates
function getMidpoint(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return {
    lat: (a.lat + b.lat) / 2,
    lng: (a.lng + b.lng) / 2,
  };
}

export default function Page() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDBtHfIieV3nmz17jGKEuyNgqyCsq81ZMk",
  });

  // Start and end are empty initially
  const [start, setStart] = useState<NodeId | "">("");
  const [end, setEnd] = useState<NodeId | "">("");

  // Only compute path if both start and end are selected
  const path =
    start && end
      ? dijkstra(graph, start as NodeId, end as NodeId)
      : [];

  const getPlaceById = (id: NodeId) => initialPlaces.find((p) => p.id === id);

  const handleSwap = () => {
    setStart(end);
    setEnd(start);
  };

  if (!isLoaded)
    return (
      <div className="flex items-center justify-center h-screen text-3xl font-bold text-gray-700">
        Loading Dijkstra Algorithm Map...
      </div>
    );

  const renderedEdges = new Set<string>();
  const renderedLines = new Set<string>();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black/80 to-gray-900 flex items-center justify-center">
      {/* Glassmorphism Control Panel */}
      <div className="absolute z-10 top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="backdrop-blur-lg bg-gradient-to-b from-purple-500 to-purple-700 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] px-8 py-6 flex flex-row items-center justify-center gap-8">
          {/* Start Selector */}
          <div className="flex flex-col items-center gap-2">
            <label className="font-medium text-white">Start:</label>
            <select
              value={start}
              onChange={(e) => setStart(e.target.value as NodeId)}
              className="rounded-lg px-3 py-2 text-gray-600 font-semibold bg-white/70 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)]"
            >
              <option value="">Select start</option>
              {initialPlaces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {/* Swap Button */}
          <button
            onClick={handleSwap}
            className="p-2 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow transition transform hover:scale-110"
            title="Swap start and end"
            aria-label="Swap start and end"
            disabled={!start && !end}
          >
            <FaExchangeAlt />
          </button>
          {/* End Selector */}
          <div className="flex flex-col items-center gap-2">
            <label className="font-bold text-white">End:</label>
            <select
              value={end}
              onChange={(e) => setEnd(e.target.value as NodeId)}
              className="rounded-lg px-3 py-2 text-gray-600 font-semibold bg-white/70 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)]"
            >
              <option value="">Select end</option>
              {initialPlaces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600 font-medium tracking-wide bg-white/60 px-4 py-1 rounded-xl shadow-2xl">
          {start && end
            ? path.length > 1
              ? `Shortest path: ${path.join(" → ")}`
              : "No path found"
            : "Select start and end places"}
        </div>
      </div>
      {/* Map Container with rounded corners and shadow */}
      <div className="w-[90vw] h-[80vh] rounded-3xl shadow-2xl overflow-hidden border-4 border-white/40">
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14}>
          {/* Draw all edges as slim gray lines */}
          {Object.entries(graph).flatMap(([from, edges]) =>
            edges.map((edge) => {
              const edgeKey = [from, edge.to].sort().join("-");
              if (renderedLines.has(edgeKey)) return null;
              renderedLines.add(edgeKey);
              const fromPlace = getPlaceById(from);
              const toPlace = getPlaceById(edge.to);
              if (!fromPlace || !toPlace) return null;
              return (
                <Polyline
                  key={edgeKey}
                  path={[fromPlace.position, toPlace.position]}
                  options={{
                    strokeColor: "#cbd5e1",
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    zIndex: 1,
                  }}
                />
              );
            })
          )}
          {/* Render markers */}
          {initialPlaces.map((place) => {
            // Only highlight the currently selected start and end nodes
            let markerType: "normal" | "start" | "end" = "normal";
            if (start === place.id) markerType = "start";
            else if (end === place.id) markerType = "end";
            // All other nodes are normal, even if they were in a previous path
            return (
              <Marker
                key={place.id}
                position={place.position}
                title={place.name}
                icon={getGlowMarker(place.id, markerType)}
                zIndex={markerType !== "normal" ? 999 : 1}
              />
            );
          })}
          {/* Draw single dotted path with a gradient-like color */}
          {start && end && path.length > 1 && (
            <Polyline
              path={path.map((id) => getPlaceById(id)!.position)}
              options={{
                strokeColor: GRADIENT_PATH_COLOR,
                strokeOpacity: 0,
                strokeWeight: 7,
                zIndex: 2,
                icons: [
                  {
                    icon: {
                      path: "M 0,-2 0,2",
                      strokeOpacity: 1,
                      scale: 4,
                    },
                    offset: "0",
                    repeat: "18px",
                  },
                ],
              }}
            />
          )}
          {/* Render edge weights as labels at midpoints */}
          {Object.entries(graph).flatMap(([from, edges]) =>
            edges.map((edge) => {
              if (from < edge.to) {
                const fromPlace = getPlaceById(from);
                const toPlace = getPlaceById(edge.to);
                if (!fromPlace || !toPlace) return null;
                const midpoint = getMidpoint(fromPlace.position, toPlace.position);
                const edgeKey = `${from}-${edge.to}`;
                if (renderedEdges.has(edgeKey)) return null;
                renderedEdges.add(edgeKey);
                return (
                  <Marker
                    key={edgeKey}
                    position={midpoint}
                    icon={{
                      url:
                        "data:image/svg+xml;utf-8," +
                        encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="20">
                            <rect x="0" y="0" rx="6" ry="6" width="36" height="20" fill="#fff" fill-opacity="0.85" />
                            <text x="18" y="14" text-anchor="middle" font-size="12" font-family="Poppins, Arial, sans-serif" font-weight="bold" fill="#7c3aed">${edge.weight}</text>
                          </svg>`
                        ),
                      scaledSize: { width: 36, height: 20 } as google.maps.Size,
                      anchor: { x: 18, y: 10 } as google.maps.Point,
                      labelOrigin: { x: 18, y: 10 } as google.maps.Point,
                    }}
                    clickable={false}
                    zIndex={100}
                  />
                );
              }
              return null;
            })
          )}
        </GoogleMap>
      </div>
      {/* Attribution */}
      <div className="absolute bottom-2 right-4 text-xs text-gray-500 bg-white/60 px-2 py-1 rounded">
        Powered by Google Maps & Dijkstra's Algorithm | Centered on Dhaka, Bangladesh
      </div>
    </div>
  );
}