import type { ReactNode } from 'react';
import type { Stage as StageId } from '../lib/stages';

type Props = { id: StageId; index: number; eyebrow?: string; title?: string; children: ReactNode; className?: string };

// A pipeline stage: section landmark, ghost numeral, optional eyebrow + h2.
export default function Stage({ id, index, eyebrow, title, children, className = '' }: Props) {
  const n = String(index).padStart(2, '0');
  return (
    <section id={id} aria-labelledby={title ? `${id}-title` : undefined} className={`relative scroll-mt-24 px-5 sm:px-8 ${className}`}>
      <div className="relative mx-auto max-w-6xl">
        {title && (
          <header className="relative mb-10 md:mb-14">
            <span aria-hidden="true" className="ghost-numeral">{n}</span>
            <p className="eyebrow relative">{eyebrow}</p>
            <h2 id={`${id}-title`} className="relative mt-3 max-w-3xl font-display text-3xl font-light leading-[1.05] tracking-tight">
              {title}
            </h2>
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
