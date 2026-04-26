import { Plane, Hotel, ShoppingBag, Building2, type LucideIcon } from "lucide-react";
import type { BuildingType, Status } from "@/data/buildings";

export const buildingIcon: Record<BuildingType, LucideIcon> = {
  airport: Plane,
  hotel: Hotel,
  mall: ShoppingBag,
  tower: Building2,
};

export const buildingTypeLabel: Record<BuildingType, string> = {
  airport: "Airport",
  hotel: "Hotel",
  mall: "Mall",
  tower: "Tower",
};

export const statusConfig: Record<Status, { label: string; color: string; ring: string; dot: string }> = {
  normal: {
    label: "Normal",
    color: "text-success",
    ring: "ring-success/30",
    dot: "bg-success shadow-[0_0_12px_var(--success)]",
  },
  warning: {
    label: "Warning",
    color: "text-warning",
    ring: "ring-warning/40",
    dot: "bg-warning shadow-[0_0_12px_var(--warning)]",
  },
  critical: {
    label: "Critical",
    color: "text-destructive",
    ring: "ring-destructive/50",
    dot: "bg-destructive shadow-[0_0_16px_var(--destructive)]",
  },
};
