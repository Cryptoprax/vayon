import type { UniversalHistoryStore } from "../contracts/ports";
import type {
  UniversalHistoryItem,
  UniversalHistoryKind,
} from "../domain/contracts";
const key = "vayon.universal-bar.history.v1",
  maxItems = 30;
export class LocalUniversalBarHistory implements UniversalHistoryStore {
  constructor(private readonly scope?: string) {}
  private get storageKey() { return this.scope ? `${key}:${encodeURIComponent(this.scope)}` : key; }
  list(kind?: UniversalHistoryKind) {
    const values = this.read();
    return kind ? values.filter((item) => item.kind === kind) : values;
  }
  record(item: UniversalHistoryItem) {
    const prior = this.read().find(value => value.id === item.id && value.kind === item.kind);
    const values = [
      { ...item, visits: item.kind === "recently-opened" ? (prior?.visits ?? 0) + 1 : item.visits },
      ...this.read().filter(
        (value) => !(value.id === item.id && value.kind === item.kind),
      ),
    ].slice(0, maxItems);
    this.write(values);
  }
  toggle(
    kind: "pinned" | "favorites",
    item: Omit<UniversalHistoryItem, "kind" | "recordedAt">,
  ) {
    const values = this.read(),
      exists = values.some(
        (value) => value.id === item.id && value.kind === kind,
      );
    this.write(
      exists
        ? values.filter(
            (value) => !(value.id === item.id && value.kind === kind),
          )
        : [
            { ...item, kind, recordedAt: new Date().toISOString() },
            ...values,
          ].slice(0, maxItems),
    );
  }
  has(kind: "pinned" | "favorites", id: string) {
    return this.read().some((item) => item.kind === kind && item.id === id);
  }
  private read(): readonly UniversalHistoryItem[] {
    if (typeof window === "undefined") return [];
    try {
      const parsed: unknown = JSON.parse(
        window.localStorage.getItem(this.storageKey) ?? "[]",
      );
      return Array.isArray(parsed) ? parsed.filter(isHistoryItem) : [];
    } catch {
      return [];
    }
  }
  private write(items: readonly UniversalHistoryItem[]) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      /* Storage can be unavailable or full. */
    }
  }
}
function isHistoryItem(value: unknown): value is UniversalHistoryItem {
  return Boolean(
    value &&
    typeof value === "object" &&
    "id" in value &&
    "label" in value &&
    "kind" in value &&
    "recordedAt" in value,
  );
}
