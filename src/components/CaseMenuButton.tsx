import { useT } from '../i18n';
import { Burger } from './Nav';

// The menu's two lines inside a project case or the CV, where the page's own button is out of reach (the overlay
// is modal). Nav listens for 'menu:open'; picking a section there closes the overlay and lands on it.
export default function CaseMenuButton() {
  const t = useT();
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event('menu:open'))} aria-label={t('menu.open')} className="case-menu no-js-hide">
      <Burger />
    </button>
  );
}
