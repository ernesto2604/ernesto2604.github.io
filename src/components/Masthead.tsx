import { useEffect, useState } from 'react';
import { Guides } from './Background';
import TypeLoop from './ui/TypeLoop';
import { useWelcomeDone } from '../hooks/useWelcomeDone';

const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' });

// "23:45 CET" / "23:45 CEST" in Madrid, whatever the visitor's own zone.
export function madridTime(date: Date) {
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const zone = get('timeZoneName').replace(/^GMT\+1$/, 'CET').replace(/^GMT\+2$/, 'CEST');
  return `${get('hour')}:${get('minute')} ${zone}`;
}

// Top band: a soft blur the page scrolls under, with my local time level with the menu button.
// Decorative: the city is stated in About, so the clock is hidden from assistive tech.
export default function Masthead() {
  // Empty on the server: prerendered HTML would carry a stale time.
  const [time, setTime] = useState('');
  const ready = useWelcomeDone();
  useEffect(() => {
    let timer = 0;
    const tick = () => {
      const now = new Date();
      setTime(madridTime(now));
      timer = window.setTimeout(tick, 60_000 - (now.getTime() % 60_000));
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div aria-hidden="true" className="masthead pointer-events-none fixed inset-x-0 top-0 z-30">
      <div className="masthead-blur">
        <span />
        <span />
        <span />
        <span />
      </div>
      {/* The tint, drawn by DarkFog's shader so it always matches the fog behind it (CSS tint above without WebGL). */}
      <canvas className="masthead-fog" />
      <Guides />
      {/* Types itself in after the loader, like the hero lines. */}
      <p className="masthead-clock tabular-nums">
        <TypeLoop once items={[`Madrid ${time}`]} play={ready && time !== ''} />
      </p>
    </div>
  );
}
