import { Asterisk } from 'lucide-react';
import TechIcon from '../components/TechIcon';
import { useMessages } from '../i18n';

// Skills: three main groups (name large on the left, logos and names on the right), then the rest in a marquee.
// It continues section 03 (Generate): the same stage for the progress pill.
export default function Stack() {
  const s = useMessages().stack;
  return (
    <section id="skills" data-stage="generate" aria-labelledby="skills-title" className="scroll-mt-24 px-5 py-24 sm:px-8 md:py-32">
      <div className="relative mx-auto max-w-6xl">
        <h2 id="skills-title" className="flex items-center gap-2.5 text-sm font-medium uppercase tracking-[0.08em] text-muted">
          <Asterisk className="size-5 text-accent" aria-hidden="true" strokeWidth={2} />
          {/* Negative text (global.css .ink-auto): reads over paper, fog and ink alike. */}
          <span className="ink-auto ink-muted">{s.label}</span>
        </h2>
        <div>
          {s.groups.map((g) => (
            <div key={g.group} className="grid gap-x-12 gap-y-6 border-t border-line py-10 first:mt-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:py-14">
              <h3 className="ink-auto font-display text-3xl leading-[1.05]">{g.group}</h3>
              <ul className="flex flex-wrap gap-x-9 gap-y-5">
                {g.items.map((it) => (
                  <li key={it.name} className="flex items-center gap-3 text-lg font-medium tracking-tight">
                    <TechIcon id={it.icon} />
                    <span className="ink-auto">{it.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {/* The rest, smaller and moving: names only, since brand colours would invert under the blend. */}
          <div className="border-t border-line py-10 lg:py-14">
            <h3 className="ink-auto font-display text-xl leading-[1.05]">{s.also.title}</h3>
            {/* Full bleed: margins, not a transform, so the blend still reaches the page. */}
            <div className="marquee mt-8 mx-[calc(50%-50dvw)]">
              <div className="marquee-track ink-auto ink-muted">
                {[0, 1].map((copy) => (
                  <ul key={copy} aria-hidden={copy === 1 || undefined} className="gap-x-10 gap-y-3 pr-10">
                    {s.also.items.map((it) => (
                      <li key={it.name} className="flex items-center gap-10 whitespace-nowrap text-xl font-medium tracking-tight">
                        {it.name}
                        <span aria-hidden="true" className="text-sm">✱</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
