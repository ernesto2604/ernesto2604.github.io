import type { ReactNode } from 'react';

// Table row shared by the About section and the project cases: a mono label on the left, the content on one
// shared axis on the right, a hairline above.
export default function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-16 gap-y-3 border-t border-line py-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)]">
      <h3 className="font-mono text-xs uppercase tracking-[0.06em] text-muted">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
