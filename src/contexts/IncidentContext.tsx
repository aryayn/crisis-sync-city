/**
 * IncidentContext — global, real-time incident state.
 *
 * Single source of truth for all incidents across:
 *   SOS wizard → Incidents page → Dashboard overview → Floor plan
 *
 * Persists to sessionStorage per building so page refreshes survive.
 * Static seed incidents from buildings.ts are merged in on mount.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { incidentsByBuilding, type Incident } from "@/data/buildings";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IncidentMap = Record<string, Incident[]>;

interface IncidentState {
  byBuilding: IncidentMap;
  /** Last incident ID that was added (for badge/notification purposes) */
  lastAddedId: string | null;
}

type IncidentAction =
  | { type: "HYDRATE"; payload: IncidentMap }
  | { type: "ADD"; buildingId: string; incident: Incident }
  | { type: "UPDATE"; buildingId: string; incident: Incident }
  | { type: "RESOLVE"; buildingId: string; incidentId: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SS_PREFIX = "cs-incidents-v2-";

function loadFromStorage(buildingId: string): Incident[] {
  try {
    const raw = localStorage.getItem(`${SS_PREFIX}${buildingId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Incident[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(buildingId: string, incidents: Incident[]) {
  try {
    localStorage.setItem(
      `${SS_PREFIX}${buildingId}`,
      JSON.stringify(incidents.slice(0, 50))
    );
  } catch {}
}

/** Merge static seed + session incidents, deduplicate by id. */
function mergeIncidents(seed: Incident[], live: Incident[]): Incident[] {
  const seen = new Set<string>();
  const merged: Incident[] = [];
  // Live incidents first (they take priority / are newer)
  for (const inc of [...live, ...seed]) {
    if (!seen.has(inc.id)) {
      seen.add(inc.id);
      merged.push(inc);
    }
  }
  return merged;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: IncidentState, action: IncidentAction): IncidentState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, byBuilding: { ...state.byBuilding, ...action.payload } };

    case "ADD": {
      const existing = state.byBuilding[action.buildingId] ?? [];
      // Prevent duplicates
      if (existing.some((i) => i.id === action.incident.id)) return state;
      const updated = [action.incident, ...existing];
      saveToStorage(action.buildingId, updated);
      return {
        byBuilding: { ...state.byBuilding, [action.buildingId]: updated },
        lastAddedId: action.incident.id,
      };
    }

    case "UPDATE": {
      const existing = state.byBuilding[action.buildingId] ?? [];
      const updated = existing.map((i) =>
        i.id === action.incident.id ? action.incident : i
      );
      saveToStorage(action.buildingId, updated);
      return {
        ...state,
        byBuilding: { ...state.byBuilding, [action.buildingId]: updated },
      };
    }

    case "RESOLVE": {
      const existing = state.byBuilding[action.buildingId] ?? [];
      const updated = existing.map((i) =>
        i.id === action.incidentId ? { ...i, status: "resolved" as const } : i
      );
      saveToStorage(action.buildingId, updated);
      return {
        ...state,
        byBuilding: { ...state.byBuilding, [action.buildingId]: updated },
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface IncidentContextValue {
  byBuilding: IncidentMap;
  lastAddedId: string | null;
  addIncident: (buildingId: string, incident: Incident) => void;
  updateIncident: (buildingId: string, incident: Incident) => void;
  resolveIncident: (buildingId: string, incidentId: string) => void;
  getIncidents: (buildingId: string) => Incident[];
  getActiveCount: (buildingId: string) => number;
}

const IncidentContext = createContext<IncidentContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function IncidentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    byBuilding: {},
    lastAddedId: null,
  });

  const hydrated = useRef(false);

  // Hydrate once: merge static seeds with stored live incidents
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const allBuildingIds = Object.keys(incidentsByBuilding);
    const hydrated_map: IncidentMap = {};

    for (const bid of allBuildingIds) {
      const seed = incidentsByBuilding[bid] ?? [];
      const live = loadFromStorage(bid);
      hydrated_map[bid] = mergeIncidents(seed, live);
    }

    // Also load any buildings that only have live incidents (user reported in session)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(SS_PREFIX)) continue;
        const bid = key.slice(SS_PREFIX.length);
        if (!hydrated_map[bid]) {
          hydrated_map[bid] = loadFromStorage(bid);
        }
      }
    } catch {}

    dispatch({ type: "HYDRATE", payload: hydrated_map });

    // Listen for changes from other tabs to sync in real time
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith(SS_PREFIX)) {
        const bid = e.key.slice(SS_PREFIX.length);
        try {
          const live = e.newValue ? JSON.parse(e.newValue) : [];
          const seed = incidentsByBuilding[bid] ?? [];
          dispatch({ 
            type: "HYDRATE", 
            payload: { [bid]: mergeIncidents(seed, live) } // We merge this specific building's updates
          });
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const addIncident = useCallback(
    (buildingId: string, incident: Incident) => {
      dispatch({ type: "ADD", buildingId, incident });
    },
    []
  );

  const updateIncident = useCallback(
    (buildingId: string, incident: Incident) => {
      dispatch({ type: "UPDATE", buildingId, incident });
    },
    []
  );

  const resolveIncident = useCallback(
    (buildingId: string, incidentId: string) => {
      dispatch({ type: "RESOLVE", buildingId, incidentId });
    },
    []
  );

  const getIncidents = useCallback(
    (buildingId: string): Incident[] => {
      return state.byBuilding[buildingId] ?? [];
    },
    [state.byBuilding]
  );

  const getActiveCount = useCallback(
    (buildingId: string): number => {
      const incidents = state.byBuilding[buildingId] ?? [];
      return incidents.filter(
        (i) => i.status === "active" || i.status === "responding"
      ).length;
    },
    [state.byBuilding]
  );

  return (
    <IncidentContext.Provider
      value={{
        byBuilding: state.byBuilding,
        lastAddedId: state.lastAddedId,
        addIncident,
        updateIncident,
        resolveIncident,
        getIncidents,
        getActiveCount,
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useIncidentContext() {
  const ctx = useContext(IncidentContext);
  if (!ctx) throw new Error("useIncidentContext must be inside IncidentProvider");
  return ctx;
}

/** Convenience hook: get incidents for a specific building */
export function useIncidents(buildingId: string): Incident[] {
  const { getIncidents } = useIncidentContext();
  return getIncidents(buildingId);
}

/** Convenience hook: get active incident count for a building */
export function useActiveCount(buildingId: string): number {
  const { getActiveCount } = useIncidentContext();
  return getActiveCount(buildingId);
}
