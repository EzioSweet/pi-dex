export type PidexThemeName = "pidex-dark" | "pidex-light";
export type PidexDensity = "compact" | "comfortable";

export interface PidexPrefs {
  themeName: PidexThemeName;
  density: PidexDensity;
  forceTheme: boolean;
  showHeader: boolean;
  compactTools: boolean;
}

export const PIDEX_PREFS_ENTRY = "pidex-prefs";

export const DEFAULT_PREFS: PidexPrefs = {
  themeName: "pidex-dark",
  density: "compact",
  forceTheme: true,
  showHeader: true,
  compactTools: true,
};

type MaybeCustomEntry = {
  type?: string;
  customType?: string;
  data?: unknown;
};

export function normalizePrefs(input: unknown): PidexPrefs {
  if (!input || typeof input !== "object") return { ...DEFAULT_PREFS };
  const source = input as Partial<PidexPrefs>;
  return {
    themeName: source.themeName === "pidex-light" ? "pidex-light" : "pidex-dark",
    density: source.density === "comfortable" ? "comfortable" : "compact",
    forceTheme: source.forceTheme ?? DEFAULT_PREFS.forceTheme,
    showHeader: source.showHeader ?? DEFAULT_PREFS.showHeader,
    compactTools: source.compactTools ?? DEFAULT_PREFS.compactTools,
  };
}

export function loadPrefs(entries: ReadonlyArray<MaybeCustomEntry>): PidexPrefs {
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];
    if (entry?.type === "custom" && entry.customType === PIDEX_PREFS_ENTRY) {
      return normalizePrefs(entry.data);
    }
  }
  return { ...DEFAULT_PREFS };
}
