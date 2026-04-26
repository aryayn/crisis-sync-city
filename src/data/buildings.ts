export type BuildingType = "airport" | "hotel" | "mall" | "tower";
export type Status = "normal" | "warning" | "critical";

export interface Building {
  id: string;
  name: string;
  shortName: string;
  type: BuildingType;
  status: Status;
  occupancy: number;
  capacity: number;
  floors: number;
  // Position on stylized map (0-100 percent)
  x: number;
  y: number;
  area: string;
  activeIncidents: number;
  tagline: string;
}

export const buildings: Building[] = [
  {
    id: "csmia",
    name: "Chhatrapati Shivaji Maharaj International Airport",
    shortName: "CSMIA Terminal 2",
    type: "airport",
    status: "critical",
    occupancy: 18420,
    capacity: 22000,
    floors: 4,
    x: 38,
    y: 42,
    area: "Andheri East",
    activeIncidents: 2,
    tagline: "International Gateway · Mumbai",
  },
  {
    id: "tajpalace",
    name: "The Taj Mahal Palace",
    shortName: "Taj Palace Hotel",
    type: "hotel",
    status: "warning",
    occupancy: 612,
    capacity: 850,
    floors: 7,
    x: 28,
    y: 78,
    area: "Colaba",
    activeIncidents: 1,
    tagline: "Heritage Wing · Apollo Bunder",
  },
  {
    id: "phoenix",
    name: "Phoenix Marketcity",
    shortName: "Phoenix Marketcity Mall",
    type: "mall",
    status: "normal",
    occupancy: 9840,
    capacity: 15000,
    floors: 5,
    x: 62,
    y: 55,
    area: "Kurla West",
    activeIncidents: 0,
    tagline: "Retail & Entertainment Complex",
  },
  {
    id: "bkc",
    name: "One BKC",
    shortName: "One BKC Tower",
    type: "tower",
    status: "normal",
    occupancy: 4200,
    capacity: 6500,
    floors: 22,
    x: 48,
    y: 60,
    area: "Bandra Kurla Complex",
    activeIncidents: 0,
    tagline: "Premium Commercial Tower",
  },
  {
    id: "inorbit",
    name: "Inorbit Mall Malad",
    shortName: "Inorbit Mall",
    type: "mall",
    status: "normal",
    occupancy: 5200,
    capacity: 12000,
    floors: 4,
    x: 30,
    y: 28,
    area: "Malad West",
    activeIncidents: 0,
    tagline: "Shopping & Dining Destination",
  },
  {
    id: "oberoi",
    name: "The Oberoi Mumbai",
    shortName: "The Oberoi",
    type: "hotel",
    status: "normal",
    occupancy: 320,
    capacity: 420,
    floors: 35,
    x: 22,
    y: 70,
    area: "Nariman Point",
    activeIncidents: 0,
    tagline: "Luxury Beachfront Hotel",
  },
  {
    id: "lodha",
    name: "Lodha World Towers",
    shortName: "Lodha World One",
    type: "tower",
    status: "warning",
    occupancy: 1840,
    capacity: 3200,
    floors: 76,
    x: 35,
    y: 50,
    area: "Lower Parel",
    activeIncidents: 1,
    tagline: "Residential High-Rise",
  },
];

export function getBuilding(id: string): Building | undefined {
  return buildings.find((b) => b.id === id);
}

export interface Incident {
  id: string;
  type: "fire" | "medical" | "security" | "structural" | "evacuation";
  severity: "low" | "medium" | "high" | "critical";
  location: string;
  floor: number;
  status: "active" | "responding" | "contained" | "resolved";
  reportedAt: string;
  responder: string;
  eta: string;
  description: string;
}

export const incidentsByBuilding: Record<string, Incident[]> = {
  csmia: [
    {
      id: "INC-2418",
      type: "fire",
      severity: "high",
      location: "Duty Free Zone D · Pier C",
      floor: 2,
      status: "responding",
      reportedAt: "2 min ago",
      responder: "Fire Response Unit · Squad 7",
      eta: "1 min",
      description: "Smoke detected in retail concourse near Gate C14.",
    },
    {
      id: "INC-2419",
      type: "medical",
      severity: "medium",
      location: "Immigration Hall · Counter 22",
      floor: 1,
      status: "active",
      reportedAt: "Just now",
      responder: "Airport Medical Team Alpha",
      eta: "3 min",
      description: "Passenger reported chest pain. Conscious and breathing.",
    },
  ],
  tajpalace: [
    {
      id: "INC-1187",
      type: "security",
      severity: "medium",
      location: "Heritage Wing · Floor 4 Corridor",
      floor: 4,
      status: "responding",
      reportedAt: "8 min ago",
      responder: "Hotel Security · Team Bravo",
      eta: "On site",
      description: "Unattended baggage flagged near suite 412.",
    },
  ],
  lodha: [
    {
      id: "INC-0892",
      type: "structural",
      severity: "low",
      location: "Tower A · Floor 41 Mechanical",
      floor: 41,
      status: "contained",
      reportedAt: "22 min ago",
      responder: "Building Engineering",
      eta: "Resolved 4 min",
      description: "Minor water leak from HVAC. Drainage in progress.",
    },
  ],
};

export interface Responder {
  id: string;
  name: string;
  role: string;
  status: "available" | "dispatched" | "on-scene";
  distance: string;
}

export const responders: Responder[] = [
  { id: "r1", name: "Squad 7 · Fire", role: "Fire Response", status: "dispatched", distance: "120m" },
  { id: "r2", name: "Medical Alpha", role: "Paramedic", status: "available", distance: "80m" },
  { id: "r3", name: "Security Bravo", role: "Security", status: "on-scene", distance: "On site" },
  { id: "r4", name: "Evac Coordinator", role: "Operations", status: "available", distance: "200m" },
];

export interface Message {
  id: string;
  from: string;
  role: string;
  text: string;
  time: string;
  kind: "info" | "alert" | "system";
}

export const initialMessages: Message[] = [
  { id: "m1", from: "Command Center", role: "System", text: "All response teams synchronized. Standing by.", time: "09:42", kind: "system" },
  { id: "m2", from: "Cmdr. R. Sharma", role: "Incident Commander", text: "Confirm visual on Zone D. Evacuation route Bravo open.", time: "09:43", kind: "info" },
  { id: "m3", from: "Squad 7", role: "Fire Response", text: "Containment in progress. No injuries reported.", time: "09:44", kind: "alert" },
];
