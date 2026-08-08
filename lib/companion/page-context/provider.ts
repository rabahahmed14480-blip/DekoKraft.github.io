import { ContextChangeDetector } from "./changeDetector.ts";
import { pageContextResolver, PageContextResolver } from "./resolver.ts";
import type { ContextChangeEvent, ContextSnapshot, PageContextInput } from "./types.ts";

export class PageContextProvider {
  private current?: ContextSnapshot; private previous?: ContextSnapshot; private history: ContextSnapshot[] = [];
  private listeners = new Set<(event: ContextChangeEvent) => void>(); private resolver: PageContextResolver; private detector = new ContextChangeDetector();
  constructor(resolver: PageContextResolver = pageContextResolver) { this.resolver = resolver; }
  update(input: PageContextInput) { const next = this.resolver.resolve(input); for (const event of this.detector.detect(next, this.current)) for (const listener of this.listeners) listener(event); if (this.current?.fingerprint !== next.fingerprint) { this.previous = this.current; this.current = next; this.history = [...this.history, next].slice(-30); } return next; }
  getCurrent() { return this.current; } getPrevious() { return this.previous; } getHistory() { return [...this.history]; }
  subscribe(listener: (event: ContextChangeEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  clear() { this.current = undefined; this.previous = undefined; this.history = []; }
}
