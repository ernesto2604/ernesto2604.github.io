export type Vars = Record<string, string | number>;

// Throws on missing keys so the prerender step fails the build instead of shipping a raw key.
export function translate(dict: unknown, key: string, vars?: Vars): string {
  const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], dict);
  if (typeof value !== 'string') throw new Error(`Missing i18n key: ${key}`);
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}
