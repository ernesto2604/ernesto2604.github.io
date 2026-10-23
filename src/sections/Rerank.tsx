import Stage from '../components/Stage';
import ProjectCard from '../components/ProjectCard';
import { useT } from '../i18n';
import { featured } from '../lib/projects';

export default function Rerank() {
  const t = useT();
  return (
    <Stage id="rerank" index={3} eyebrow={t('rerank.eyebrow')} title={t('rerank.title')} className="py-24 md:py-32">
      <p className="-mt-4 mb-10 max-w-[70ch] font-mono text-xs leading-relaxed text-muted">{t('rerank.rule')}</p>
      <div className="grid gap-5">
        {featured.map((p, i) => (
          <ProjectCard key={p.slug} project={p} position={i + 1} />
        ))}
      </div>
    </Stage>
  );
}
