import { useEffect, useRef, useState } from 'react';
import { useMessages, useT } from '../i18n';
import { DIAGRAMS, NODE_H, wrap } from './diagrams';

// Accessible architecture diagram: role="img" with title/desc, plus the same flow as an ordered list.
// Drawing progress is the CSS variable --p (0..1): set by scroll in the pinned scene, or animated once on view.
export default function Diagram({ slug, scrollDriven = false }: { slug: string; scrollDriven?: boolean }) {
  const t = useT();
  const c = (useMessages().cases as Record<string, { nodes: Record<string, string>; edges: Record<string, string>; steps: string[] }>)[slug];
  const spec = DIAGRAMS[slug];
  const n = Math.max(...spec.nodes.map((x) => x.s)) + 1;
  const ref = useRef<SVGSVGElement>(null);
  // Server HTML shows the finished drawing; on the client it resets and draws when seen.
  const [drawn, setDrawn] = useState(true);

  useEffect(() => {
    if (scrollDriven) return;
    const el = ref.current!;
    if (el.getBoundingClientRect().top < innerHeight) return;
    setDrawn(false);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setDrawn(true);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [scrollDriven]);

  const id = `dg-${slug}`;
  return (
    <figure className="m-0">
      <div className="-mx-1 overflow-x-auto px-1 pb-1" tabIndex={0} role="region" aria-label={t(`cases.${slug}.diagramTitle`)}>
      <svg
        ref={ref}
        viewBox="0 0 720 420"
        role="img"
        aria-labelledby={`${id}-t ${id}-d`}
        data-drawn={drawn}
        className={`diagram h-auto w-full min-w-[620px] ${scrollDriven ? 'scroll-driven' : ''}`}
        style={{ ['--n' as string]: n }}
      >
        <title id={`${id}-t`}>{t(`cases.${slug}.diagramTitle`)}</title>
        <desc id={`${id}-d`}>{t(`cases.${slug}.diagramDesc`)}</desc>
        <defs>
          <marker id={`${id}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8 z" fill="var(--text-muted)" />
          </marker>
        </defs>

        {spec.edges.map((e, i) => (
          <g key={i} className="d-edge" style={{ ['--s' as string]: e.s }}>
            <path d={e.d} pathLength={1} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray={e.dashed ? '0.012 0.012' : undefined} markerEnd={`url(#${id}-arrow)`} />
            {e.label && (
              <text x={e.lx} y={e.ly} className="d-label">
                {c.edges[e.label]}
              </text>
            )}
          </g>
        ))}

        {spec.nodes.map((node) => {
          const h = node.h ?? NODE_H;
          const lines = wrap(c.nodes[node.id], node.w).slice(0, 2);
          const fill = node.tone === 'model' ? 'var(--accent-fill)' : node.tone === 'key' ? 'var(--surface-2)' : 'var(--surface)';
          const ink = node.tone === 'model' ? 'var(--accent-ink)' : 'var(--text)';
          return (
            <g key={node.id} className="d-node" style={{ ['--s' as string]: node.s }}>
              <rect x={node.x} y={node.y} width={node.w} height={h} rx={10} fill={fill} stroke={node.tone === 'key' ? 'var(--accent)' : 'var(--line-strong)'} strokeWidth={node.tone === 'key' ? 1.5 : 1} />
              <text x={node.x + node.w / 2} y={node.y + h / 2 - (lines.length - 1) * 9} textAnchor="middle" dominantBaseline="middle" fill={ink} className="d-text">
                {lines.map((line, i) => (
                  <tspan key={i} x={node.x + node.w / 2} dy={i ? 18 : 0}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
      <details className="mt-4 text-sm text-muted">
        <summary className="inline-flex min-h-11 cursor-pointer items-center hover:text-text">{t('generate.diagramText')}</summary>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          {c.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </details>
    </figure>
  );
}
