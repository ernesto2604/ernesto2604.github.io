import { Asterisk } from 'lucide-react';
import TechIcon from '../components/TechIcon';
import Thinking, { useGenerate } from '../components/Thinking';
import { useMessages } from '../i18n';

const THINK_MS = 1200;

// The tools I use, one row per layer: the layer name large on the left, logos and names on the right.
// It is part of the Output answer, so it shares that stage for the progress pill.
export default function Stack() {
  const s = useMessages().stack;
  const gen = useGenerate<HTMLDivElement>(THINK_MS);
  return (
    <section id="skills" data-stage="output" aria-labelledby="skills-title" className="scroll-mt-24 px-5 py-24 sm:px-8 md:py-32">
      <div ref={gen.ref} data-gen={gen.state} className="relative mx-auto max-w-6xl">
        <Thinking block="stack" ms={THINK_MS} />
        <h2 id="skills-title" className="flex items-center gap-2.5 text-sm font-medium uppercase tracking-[0.08em] text-muted">
          <Asterisk className="size-5 text-accent" aria-hidden="true" strokeWidth={2} />
          {s.label}
        </h2>
        <div data-stream>
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
