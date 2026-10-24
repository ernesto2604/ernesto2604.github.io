import { Bot, Braces, Layers, RefreshCw, type LucideIcon } from 'lucide-react';
import {
  siClaude,
  siDart,
  siDocker,
  siExpress,
  siFastapi,
  siFlask,
  siFlutter,
  siGit,
  siGo,
  siGooglegemini,
  siLinux,
  siNextdotjs,
  siNodedotjs,
  siOpencv,
  siPostgresql,
  siPython,
  siReact,
  siSnowflake,
  siSpringboot,
  siSqlite,
  siTailwindcss,
  siTypescript,
  siUltralytics,
  type SimpleIcon,
} from 'simple-icons';
import { EXTRA_LOGOS } from '../lib/brandLogos';

// Brand logos from simple-icons (single colour, drawn in the brand's hex), the few it lacks from EXTRA_LOGOS
// (full colour), and Lucide glyphs for concepts that have no logo. Keys are the `icon` ids in content/*.json.
const BRANDS: Record<string, SimpleIcon> = {
  claude: siClaude,
  dart: siDart,
  docker: siDocker,
  express: siExpress,
  fastapi: siFastapi,
  flask: siFlask,
  flutter: siFlutter,
  git: siGit,
  go: siGo,
  googlegemini: siGooglegemini,
  linux: siLinux,
  nextdotjs: siNextdotjs,
  nodedotjs: siNodedotjs,
  opencv: siOpencv,
  postgresql: siPostgresql,
  python: siPython,
  react: siReact,
  snowflake: siSnowflake,
  springboot: siSpringboot,
  sqlite: siSqlite,
  tailwindcss: siTailwindcss,
  typescript: siTypescript,
  ultralytics: siUltralytics,
};

const CONCEPTS: Record<string, LucideIcon> = { rag: Layers, agents: Bot, prompting: Braces, cicd: RefreshCw };

export const hasTechIcon = (id: string) => id in BRANDS || id in EXTRA_LOGOS || id in CONCEPTS;

export default function TechIcon({ id, className = 'size-7' }: { id: string; className?: string }) {
  const extra = EXTRA_LOGOS[id];
  if (extra) return <svg viewBox={extra.viewBox} className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: extra.body }} />;
  const brand = BRANDS[id];
  if (brand) {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill={`#${brand.hex}`}>
        <path d={brand.path} />
      </svg>
    );
  }
  const Concept = CONCEPTS[id];
  return Concept ? <Concept className={`${className} text-accent`} aria-hidden="true" strokeWidth={1.75} /> : null;
}
