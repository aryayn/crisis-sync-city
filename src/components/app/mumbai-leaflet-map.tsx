import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import { useMemo } from "react";
import type { Building, Status } from "@/data/buildings";
import { useNavigate } from "@tanstack/react-router";

function statusToCssVar(status: Status) {
  switch (status) {
    case "critical":
      return "--destructive";
    case "warning":
      return "--warning";
    case "normal":
    default:
      return "--success";
  }
}

function createStatusIcon(status: Status) {
  const cssVar = statusToCssVar(status);
  return L.divIcon({
    className: "cs-leaflet-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    tooltipAnchor: [0, -18],
    html: `
      <div class="cs-leaflet-pin" style="--pin: var(${cssVar});">
        <span class="cs-leaflet-dot"></span>
      </div>
    `,
  });
}

const mumbaiCenter: [number, number] = [19.076, 72.8777];

export function MumbaiLeafletMap({ buildings }: { buildings: Building[] }) {
  const navigate = useNavigate();

  const markers = useMemo(() => {
    return buildings
      .filter((b) => typeof b.lat === "number" && typeof b.lng === "number")
      .map((b) => ({
        ...b,
        position: [b.lat as number, b.lng as number] as [number, number],
        icon: createStatusIcon(b.status),
      }));
  }, [buildings]);

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={mumbaiCenter}
        zoom={12}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {markers.map((b) => (
          <Marker
            key={b.id}
            position={b.position}
            icon={b.icon}
            eventHandlers={{
              click: () => {
                navigate({ to: "/building/$buildingId/dashboard", params: { buildingId: b.id } });
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} className="cs-leaflet-tooltip">
              <span className="cs-leaflet-tooltip-row">
                <span className="cs-leaflet-tooltip-dot" style={{ background: `var(${statusToCssVar(b.status)})` }} />
                <span className="cs-leaflet-tooltip-name">{b.shortName}</span>
              </span>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

