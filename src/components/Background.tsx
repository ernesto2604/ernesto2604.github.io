// Gutter k sits between columns k-1 and k of the content grid; k runs past both ends so the pairs reach the
// window edges (36 covers 1 to 12 columns at any width up to ~3300px). CSS places each one.
const GUTTERS = Array.from({ length: 36 }, (_, i) => i - 12);

// Dashed column guides: one pair of rules per gutter, falling into place left to right after the loader.
export function Guides() {
  return (
    <div className="guides">
      {GUTTERS.map((k) => (
        <span key={k} className="guide" style={{ '--k': k } as React.CSSProperties} />
      ))}
    </div>
  );
}

// Fixed page ground: flat paper with the guides on top.
export default function Background() {
  return (
    <div aria-hidden="true" className="backdrop pointer-events-none fixed inset-0 -z-10">
      <Guides />
    </div>
  );
}
