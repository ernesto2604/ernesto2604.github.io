import { useActiveStage } from '../hooks/useActiveStage';
import { useT } from '../i18n';
import { STAGES } from '../lib/stages';

export default function PipelineIndicator() {
  const t = useT();
  const active = useActiveStage();
  const activeIndex = STAGES.indexOf(active);

  return (
    <nav
      aria-label={t('a11y.pipelineNav')}
      className={`glass fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-30 transition-opacity duration-300 ${active === 'input' ? 'max-lg:invisible max-lg:opacity-0' : ''} -translate-x-1/2 rounded-full px-2 py-1.5 lg:bottom-auto lg:left-5 lg:top-1/2 lg:-translate-x-0 lg:-translate-y-1/2 lg:px-1.5 lg:py-2`}
    >
      <ol className="flex items-center lg:flex-col lg:items-stretch">
        {STAGES.map((stage, i) => {
          const isActive = stage === active;
          const name = t(`stages.${stage}`);
          return (
            <li key={stage}>
              <a
                href={`#${stage}`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={t('indicator.goTo', { n: i + 1, name })}
                className="group flex h-11 min-w-11 items-center gap-2 rounded-full px-3 text-[0.8125rem] text-muted transition-colors duration-200 hover:text-text aria-[current=step]:text-text"
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 shrink-0 rounded-full transition-[background-color,transform] duration-300 ${
                    isActive ? 'scale-125 bg-accent-fill' : i < activeIndex ? 'bg-muted' : 'bg-line-strong'
                  }`}
                />
                <span aria-hidden="true" className={isActive ? 'whitespace-nowrap lg:max-2xl:hidden' : 'hidden whitespace-nowrap 2xl:group-hover:inline 2xl:group-focus-visible:inline'}>
                  {String(i + 1).padStart(2, '0')} {name}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
