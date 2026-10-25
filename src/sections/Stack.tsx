import { Asterisk } from 'lucide-react';
import TechIcon from '../components/TechIcon';
import { useMessages } from '../i18n';

// The tools I use, one row per layer: the layer name large on the left, logos and names on the right.
// It continues section 03 (Generate): no thinking of its own, and the same stage for the progress pill.
export default function Stack() {
  const s = useMessages().stack;
  return (
    <section id="skills" data-stage="generate" aria-labelledby="skills-title" className="scroll-mt-24 px-5 py-24 sm:px-8 md:py-32">
      <div className="relative mx-auto max-w-6xl">
        <h2 id="skills-title" className="flex items-center gap-2.5 text-sm font-medium uppercase tracking-[0.08em] text-muted">
          <Asterisk className="size-5 text-accent" aria-hidden="true" strokeWidth={2} />
          {s.label}
        </h2>
        <div>
          {s.groups.map((g) => (
            <div key={g.group} className="grid gap-x-12 gap-y-6 border-t border-line py-10 first:mt-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:py-14">
              <h3 className="font-display text-3xl leading-[1.05]">{g.group}</h3>
              <ul className="flex flex-wrap gap-x-9 gap-y-5">
                {g.items.map((it) => (
                  <li key={it.name} className="flex items-center gap-3 text-lg font-medium tracking-tight">
                    <TechIcon id={it.icon} />
                    {it.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
