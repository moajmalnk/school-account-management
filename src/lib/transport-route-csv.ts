import { cell, columnIndex, headerKey, parseCsvMoney } from "@/lib/csv-import";
import { parseCsvText } from "@/lib/student-csv";
import {
  DEFAULT_FEE_COLLECTION_START_MONTH,
  FEE_MONTHS,
  withRouteFeeSchedule,
  type FeeTerm,
  type TransportRoute,
  type TransportVehicle,
} from "@/lib/tenant-store";

export const TRANSPORT_ROUTE_CSV_HEADERS = [
  "From",
  "To",
  "MorningFee",
  "EveningFee",
  "BothFee",
  "BillingCycle",
  "StartMonth",
  "Vehicles",
  "RouteId",
] as const;

export const TRANSPORT_ROUTE_EXPORT_HEADERS = [
  ...TRANSPORT_ROUTE_CSV_HEADERS,
  "FromLat",
  "FromLng",
  "ToLat",
  "ToLng",
] as const;

export type TransportRouteCsvDraft = {
  line: number;
  routeId: string;
  mapFrom: string;
  mapTo: string;
  morningFee: number;
  eveningFee: number;
  bothFee: number;
  billingCycle: "Monthly" | "Term";
  startMonth: string;
  vehiclesRaw: string;
  hasVehicleColumn: boolean;
  clearVehicles: boolean;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
};

export type TransportRouteCsvIssue = {
  line: number;
  rowLabel: string;
  message: string;
};

export type ParseTransportRouteCsvResult =
  | { ok: true; drafts: TransportRouteCsvDraft[]; issues: TransportRouteCsvIssue[] }
  | { ok: false; error: string; description?: string; issues: TransportRouteCsvIssue[] };

export type ResolvedTransportRouteImport = {
  line: number;
  previewLabel: string;
  previewExtra: string;
  bothFee: number;
  existingId: string | null;
  route: TransportRoute;
  vehicleIds: string[];
  applyVehicles: boolean;
  unknownVehicles: string[];
};

const FROM_ALIASES = [
  "from",
  "map from",
  "pickup",
  "pick up",
  "origin",
  "start",
  "bus point 1",
  "buspoint 1",
  "point 1",
];
const TO_ALIASES = [
  "to",
  "map to",
  "drop",
  "drop off",
  "destination",
  "end",
  "bus point 2",
  "buspoint 2",
  "point 2",
];
const MORNING_ALIASES = ["morning fee", "morningfee", "morning", "am fee"];
const EVENING_ALIASES = ["evening fee", "eveningfee", "evening", "pm fee"];
const BOTH_ALIASES = ["both fee", "bothfee", "both", "full fee", "fee", "amount"];
const CYCLE_ALIASES = ["billing cycle", "billingcycle", "cycle", "billing"];
const MONTH_ALIASES = ["start month", "startmonth", "collection start", "from month"];
const VEHICLE_ALIASES = ["vehicles", "vehicle", "bus", "assigned vehicles", "fleet"];
const ID_ALIASES = ["route id", "routeid", "id"];
const FROM_LAT_ALIASES = ["from lat", "fromlat", "pickup lat"];
const FROM_LNG_ALIASES = ["from lng", "fromlng", "from lon", "pickup lng"];
const TO_LAT_ALIASES = ["to lat", "tolat", "drop lat"];
const TO_LNG_ALIASES = ["to lng", "tolng", "to lon", "drop lng"];

function looksLikeHeader(cells: string[]): boolean {
  const joined = cells.map(headerKey).join(" ");
  return /from|pickup|origin|to|drop|morning|route|map/.test(joined);
}

function skipRow(cells: string[]): boolean {
  const joined = cells.map((c) => c.trim()).join("");
  return !joined || joined.startsWith("#");
}

function parseCoord(raw: string): number | undefined {
  const v = raw.trim();
  if (!v) return undefined;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function parseBillingCycle(raw: string): "Monthly" | "Term" | null {
  const v = headerKey(raw);
  if (!v) return "Monthly";
  if (/^term/.test(v) || v === "t") return "Term";
  if (/^month/.test(v) || v === "m" || /^annual/.test(v) || /^year/.test(v)) return "Monthly";
  return null;
}

function parseStartMonth(raw: string): string | null {
  const v = raw.trim();
  if (!v) return DEFAULT_FEE_COLLECTION_START_MONTH;
  const key = headerKey(v);
  const named = FEE_MONTHS.find(
    (month) => headerKey(month) === key || headerKey(month).startsWith(key.slice(0, 3)),
  );
  if (named) return named;
  const iso = v.match(/^(\d{4})-(\d{1,2})$/);
  if (iso) {
    const month = Number(iso[2]);
    if (month >= 1 && month <= 12) {
      return (
        [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ][month - 1] ?? DEFAULT_FEE_COLLECTION_START_MONTH
      );
    }
  }
  return null;
}

function parseVehicleIntent(raw: string): { clear: boolean; names: string[] } {
  const v = raw.trim();
  if (!v) return { clear: false, names: [] };
  if (/^(none|-|n\/a|na|unassigned|clear)$/i.test(v)) return { clear: true, names: [] };
  const names = v
    .split(/[;,|/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return { clear: false, names };
}

export function completeRouteFees(morning: number, evening: number, both: number) {
  let morningFee = Math.max(0, Math.round(morning) || 0);
  let eveningFee = Math.max(0, Math.round(evening) || 0);
  let bothFee = Math.max(0, Math.round(both) || 0);
  if (bothFee <= 0 && (morningFee > 0 || eveningFee > 0)) {
    bothFee = morningFee + eveningFee;
  }
  if (morningFee <= 0 && bothFee > 0) {
    morningFee = eveningFee > 0 && eveningFee < bothFee ? bothFee - eveningFee : bothFee;
  }
  if (eveningFee <= 0 && bothFee > 0) {
    eveningFee = morningFee > 0 && morningFee < bothFee ? bothFee - morningFee : bothFee;
  }
  return { morningFee, eveningFee, bothFee };
}

export function normalizeRouteStopKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ");
}

export function routePairKey(from: string, to: string): string {
  return `${normalizeRouteStopKey(from)}→${normalizeRouteStopKey(to)}`;
}

export function matchExistingTransportRoute(
  routes: TransportRoute[],
  input: { routeId?: string; mapFrom: string; mapTo: string },
): TransportRoute | undefined {
  const id = input.routeId?.trim().toLowerCase();
  if (id) {
    const byId = routes.find((route) => route.id.trim().toLowerCase() === id);
    if (byId) return byId;
  }
  const pair = routePairKey(input.mapFrom, input.mapTo);
  return routes.find((route) => routePairKey(route.mapFrom, route.mapTo) === pair);
}

export function matchTransportVehicles(
  names: string[],
  vehicles: TransportVehicle[],
): { matched: TransportVehicle[]; unknown: string[] } {
  const matched: TransportVehicle[] = [];
  const unknown: string[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const key = headerKey(name);
    const vehicle = vehicles.find((row) => {
      return (
        headerKey(row.id) === key ||
        headerKey(row.name) === key ||
        headerKey(row.registrationNo) === key
      );
    });
    if (!vehicle) {
      unknown.push(name);
      continue;
    }
    if (seen.has(vehicle.id)) continue;
    seen.add(vehicle.id);
    matched.push(vehicle);
  }
  return { matched, unknown };
}

export function vehiclesLabelForRoute(routeId: string, vehicles: TransportVehicle[]): string {
  return vehicles
    .filter((vehicle) => vehicle.routeIds.includes(routeId))
    .map((vehicle) => vehicle.name || vehicle.registrationNo)
    .filter(Boolean)
    .join("; ");
}

export function transportRouteCsvTemplateRows(): (string | number)[][] {
  return [
    ["Kondotty, Malappuram", "Mac Media School", 600, 600, 1200, "Monthly", "June", "", ""],
    ["University CALII", "School", 500, 500, 1000, "Monthly", "June", "", ""],
  ];
}

export function transportRouteCsvDemoRows(): (string | number)[][] {
  return [
    ["Kondotty, Malappuram", "Mac Media School", 600, 600, 1200, "Monthly", "June", "", ""],
    ["University CALII", "School", 500, 500, 1000, "Monthly", "June", "", ""],
    ["Feroke Town", "Main Campus", 700, 700, 1300, "Monthly", "June", "", ""],
  ];
}

export function transportRouteToCsvRow(
  route: TransportRoute,
  vehicles: TransportVehicle[],
): (string | number)[] {
  return [
    route.mapFrom,
    route.mapTo,
    route.morningFee,
    route.eveningFee,
    route.bothFee,
    route.billingCycle === "Term" ? "Term" : "Monthly",
    route.feeCollectionStartMonth || DEFAULT_FEE_COLLECTION_START_MONTH,
    vehiclesLabelForRoute(route.id, vehicles),
    route.id,
    route.fromLat ?? "",
    route.fromLng ?? "",
    route.toLat ?? "",
    route.toLng ?? "",
  ];
}

export function parseTransportRouteCsv(text: string): ParseTransportRouteCsvResult {
  const table = parseCsvText(text);
  if (!table.length) {
    return {
      ok: false,
      error: "CSV is empty",
      description: "Download the bus route template, fill From / To / fees, then upload",
      issues: [],
    };
  }

  const headerCells = table[0] ?? [];
  if (!looksLikeHeader(headerCells)) {
    return {
      ok: false,
      error: "Missing bus route header row",
      description: "First row must include From and To. Use Download template, then upload.",
      issues: [],
    };
  }
  const start = 1;
  const headers = headerCells;

  const fromIdx = columnIndex(headers, FROM_ALIASES);
  const toIdx = columnIndex(headers, TO_ALIASES);
  const morningIdx = columnIndex(headers, MORNING_ALIASES);
  const eveningIdx = columnIndex(headers, EVENING_ALIASES);
  const bothIdx = columnIndex(headers, BOTH_ALIASES);
  const cycleIdx = columnIndex(headers, CYCLE_ALIASES);
  const monthIdx = columnIndex(headers, MONTH_ALIASES);
  const vehicleIdx = columnIndex(headers, VEHICLE_ALIASES);
  const idIdx = columnIndex(headers, ID_ALIASES);
  const fromLatIdx = columnIndex(headers, FROM_LAT_ALIASES);
  const fromLngIdx = columnIndex(headers, FROM_LNG_ALIASES);
  const toLatIdx = columnIndex(headers, TO_LAT_ALIASES);
  const toLngIdx = columnIndex(headers, TO_LNG_ALIASES);

  if (fromIdx < 0 || toIdx < 0) {
    return {
      ok: false,
      error: "This does not look like a bus route CSV",
      description: "Need From and To columns. Use Download template on Transport Routes.",
      issues: [],
    };
  }

  const drafts: TransportRouteCsvDraft[] = [];
  const issues: TransportRouteCsvIssue[] = [];
  const seenPairs = new Map<string, number>();

  for (let i = start; i < table.length; i++) {
    const cells = table[i] ?? [];
    if (skipRow(cells)) continue;
    const line = i + 1;
    const mapFrom = cell(cells, fromIdx);
    const mapTo = cell(cells, toIdx);
    const rowLabel = [mapFrom, mapTo].filter(Boolean).join(" → ") || `Row ${line}`;

    if (!mapFrom || !mapTo) {
      issues.push({ line, rowLabel, message: "From and To are required" });
      continue;
    }

    const fees = completeRouteFees(
      parseCsvMoney(cell(cells, morningIdx)),
      parseCsvMoney(cell(cells, eveningIdx)),
      parseCsvMoney(cell(cells, bothIdx)),
    );
    if (fees.morningFee <= 0 || fees.eveningFee <= 0 || fees.bothFee <= 0) {
      issues.push({
        line,
        rowLabel,
        message: "Morning, evening, and both-shift fees must be positive amounts",
      });
      continue;
    }

    const cycle = parseBillingCycle(cell(cells, cycleIdx));
    if (!cycle) {
      issues.push({
        line,
        rowLabel,
        message: "Billing cycle must be Monthly or Term",
      });
      continue;
    }

    const startMonth = parseStartMonth(cell(cells, monthIdx));
    if (!startMonth) {
      issues.push({
        line,
        rowLabel,
        message: "Start month must be a calendar month (e.g. June)",
      });
      continue;
    }

    const pair = routePairKey(mapFrom, mapTo);
    const priorLine = seenPairs.get(pair);
    if (priorLine) {
      issues.push({
        line,
        rowLabel,
        message: `Duplicate of line ${priorLine} (${mapFrom} → ${mapTo})`,
      });
      continue;
    }
    seenPairs.set(pair, line);

    const vehicleRaw = vehicleIdx >= 0 ? cell(cells, vehicleIdx) : "";
    const vehicleIntent = parseVehicleIntent(vehicleRaw);
    drafts.push({
      line,
      routeId: cell(cells, idIdx),
      mapFrom,
      mapTo,
      ...fees,
      billingCycle: cycle,
      startMonth,
      vehiclesRaw: vehicleRaw,
      hasVehicleColumn: vehicleIdx >= 0,
      clearVehicles: vehicleIntent.clear,
      fromLat: parseCoord(cell(cells, fromLatIdx)),
      fromLng: parseCoord(cell(cells, fromLngIdx)),
      toLat: parseCoord(cell(cells, toLatIdx)),
      toLng: parseCoord(cell(cells, toLngIdx)),
    });
  }

  if (!drafts.length && !issues.length) {
    return {
      ok: false,
      error: "CSV had no bus route rows",
      description: "Use Download template, then fill pickup, drop, and shift fees",
      issues: [],
    };
  }

  return { ok: true, drafts, issues };
}

function withOptionalCoord<K extends string>(
  key: K,
  value: number | undefined,
): Partial<Record<K, number>> {
  return value != null && Number.isFinite(value) ? ({ [key]: value } as Partial<Record<K, number>>) : {};
}

export function resolveTransportRouteImport(
  drafts: TransportRouteCsvDraft[],
  opts: {
    routes: TransportRoute[];
    vehicles: TransportVehicle[];
    feeTerms: FeeTerm[];
  },
): { ready: ResolvedTransportRouteImport[]; issues: TransportRouteCsvIssue[] } {
  const ready: ResolvedTransportRouteImport[] = [];

  for (const draft of drafts) {
    const existing = matchExistingTransportRoute(opts.routes, draft);
    const vehicleIntent = parseVehicleIntent(draft.vehiclesRaw);
    const { matched, unknown } = matchTransportVehicles(vehicleIntent.names, opts.vehicles);
    const applyVehicles = draft.hasVehicleColumn && (vehicleIntent.clear || matched.length > 0);
    const vehicleIds = vehicleIntent.clear ? [] : matched.map((vehicle) => vehicle.id);

    const base: TransportRoute = {
      id: existing?.id ?? "",
      mapFrom: draft.mapFrom,
      mapTo: draft.mapTo,
      morningFee: draft.morningFee,
      eveningFee: draft.eveningFee,
      bothFee: draft.bothFee,
      billingCycle: draft.billingCycle,
      feeAmountMode: "fixed",
      morningFeeSchedule: [],
      eveningFeeSchedule: [],
      bothFeeSchedule: [],
      feeCollectionStartMonth: draft.startMonth,
      ...(existing?.fromLat != null ? { fromLat: existing.fromLat } : {}),
      ...(existing?.fromLng != null ? { fromLng: existing.fromLng } : {}),
      ...(existing?.toLat != null ? { toLat: existing.toLat } : {}),
      ...(existing?.toLng != null ? { toLng: existing.toLng } : {}),
      ...withOptionalCoord("fromLat", draft.fromLat),
      ...withOptionalCoord("fromLng", draft.fromLng),
      ...withOptionalCoord("toLat", draft.toLat),
      ...withOptionalCoord("toLng", draft.toLng),
    };
    const route = withRouteFeeSchedule(base, opts.feeTerms);
    const extraParts = [
      existing ? `Update ${existing.id}` : "New route",
      `Morning ₹${draft.morningFee.toLocaleString("en-IN")}`,
      `Evening ₹${draft.eveningFee.toLocaleString("en-IN")}`,
      draft.billingCycle,
    ];
    if (applyVehicles) {
      extraParts.push(
        vehicleIds.length ? `${vehicleIds.length} vehicle${vehicleIds.length === 1 ? "" : "s"}` : "No vehicles",
      );
    }
    if (unknown.length) {
      extraParts.push(`unknown vehicle skipped`);
    }

    ready.push({
      line: draft.line,
      previewLabel: `${draft.mapFrom} → ${draft.mapTo}`,
      previewExtra: extraParts.join(" · "),
      bothFee: draft.bothFee,
      existingId: existing?.id ?? null,
      route,
      vehicleIds,
      applyVehicles,
      unknownVehicles: unknown,
    });
  }

  return { ready, issues: [] };
}
