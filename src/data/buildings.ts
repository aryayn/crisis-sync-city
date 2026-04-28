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
  lat?: number;
  lng?: number;
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
    status: "normal",
    occupancy: 18420,
    capacity: 22000,
    floors: 4,
    lat: 19.0896,
    lng: 72.8656,
    x: 38,
    y: 42,
    area: "Andheri East",
    activeIncidents: 0,
    tagline: "International Gateway · Mumbai",
  },
  {
    id: "tajpalace",
    name: "The Taj Mahal Palace",
    shortName: "Taj Palace Hotel",
    type: "hotel",
    status: "normal",
    occupancy: 612,
    capacity: 850,
    floors: 7,
    lat: 18.9217,
    lng: 72.8331,
    x: 28,
    y: 78,
    area: "Colaba",
    activeIncidents: 0,
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
    lat: 19.086,
    lng: 72.8887,
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
    status: "normal",
    occupancy: 1840,
    capacity: 3200,
    floors: 76,
    lat: 18.9933,
    lng: 72.8258,
    x: 35,
    y: 50,
    area: "Lower Parel",
    activeIncidents: 0,
    tagline: "Residential High-Rise",
  },
  {
    id: "bse",
    name: "Phiroze Jeejeebhoy Towers",
    shortName: "BSE Tower",
    type: "tower",
    status: "normal",
    occupancy: 3100,
    capacity: 4000,
    floors: 29,
    lat: 18.9300,
    lng: 72.8333,
    x: 25,
    y: 85,
    area: "Dalal Street",
    activeIncidents: 0,
    tagline: "Bombay Stock Exchange",
  },
  {
    id: "jio",
    name: "Jio World Centre",
    shortName: "Jio World",
    type: "mall",
    status: "normal",
    occupancy: 15000,
    capacity: 25000,
    floors: 5,
    lat: 19.0660,
    lng: 72.8640,
    x: 55,
    y: 65,
    area: "BKC",
    activeIncidents: 0,
    tagline: "Convention & Retail Hub",
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
  translatedText?: string;
  detectedLanguage?: string;
}

export const incidentsByBuilding: Record<string, Incident[]> = {
  // Empty state. Real incidents are now created dynamically and stored in IncidentContext (sessionStorage).
};

export interface Responder {
  id: string;
  name: string;
  role: string;
  status: "available" | "dispatched" | "on-scene";
  distance: string;
}

export const responders: Responder[] = [
  { id: "r1", name: "Station 4 · Fire Rescue", role: "Fire Response", status: "available", distance: "Stationed" },
  { id: "r2", name: "City Hospital Paramedics", role: "Paramedic", status: "available", distance: "Stationed" },
  { id: "r3", name: "On-Site Security Team", role: "Security", status: "available", distance: "Stationed" },
  { id: "r4", name: "Building Operations", role: "Operations", status: "available", distance: "Stationed" },
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
  { id: "m1", from: "Command Center", role: "System", text: "All response teams synchronized. Standing by.", time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), kind: "system" },
];
