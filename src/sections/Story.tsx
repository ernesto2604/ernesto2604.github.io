import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Hologram from '../components/Hologram';
import MorphingText from '../components/ui/MorphingText';
import ScrambleText from '../components/ui/ScrambleText';
import TypeLoop from '../components/ui/TypeLoop';
import { useShortcutLabel, openAgent, AGENT_READY } from '../components/Nav';
import { useMedia, useReducedMotion } from '../hooks/useMedia';
import { useWelcomeDone } from '../hooks/useWelcomeDone';
import profile from '../content/profile.json';
import { useT } from '../i18n';

export default function Story() {
  const t = useT();
  const shortcut = useShortcutLabel();
  const ready = useWelcomeDone();
  const reducedMotion = useReducedMotion();
  // How to open the agent, typed after the invitation: the shortcut with a keyboard, a tap on touch screens.
  const askKey = useMedia('(pointer: coarse)') ? `[${t('hero.askTap')}]` : `[${shortcut.replace(' ', ' + ')}]`;
  // The [ask] tag by the pointer decodes each time the pointer enters the hologram.
  const [askPlay, setAskPlay] = useState(0);
  const replayAsk = () => setAskPlay((n) => n + 1);
  const followPointer = (e: ReactPointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--cx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--cy', `${e.clientY - r.top}px`);
  };

  return (
    <div className="story relative">
      <div className="story-stage mx-auto max-w-6xl px-5 sm:px-8">
        {/* 01 · Input: the role, who I am and the hologram that opens the agent. */}
        <div id="input" data-stage="input" className="story-hero relative grid min-h-[100svh] content-center gap-x-12 gap-y-8 pb-16 pt-24 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
          <div className="lg:order-1">
            {/* Loops between my name and my role. The heading's name is the sr-only line; without JS (or with reduced
                motion) it rests on the first text. */}
            <h1 className="hero-title">
              <span className="sr-only">{`${t('hero.greeting')}, ${t('hero.role')}`}</span>
              <MorphingText texts={[t('hero.greeting'), t('hero.role')]} play={ready && !reducedMotion} cooldownTime={2.5} />
            </h1>
            {/* The lines around the title type themselves in once the loader has gone. */}
            <p className="hero-tagline mt-5 sm:mt-6">
              <span className="sr-only">{t('hero.valueProp')}</span>
              <TypeLoop once items={[t('hero.valueProp')]} play={ready} />
            </p>
          </div>
          {/* The hologram is the way into the agent: clicking it (or Ctrl/Cmd+K) asks "me". */}
          {AGENT_READY ? (
            // The name comes from the visible label (label-in-name); without JS neither the model nor the agent can run.
            <button type="button" onClick={openAgent} onPointerEnter={replayAsk} onPointerMove={followPointer} aria-keyshortcuts={shortcut === '⌘K' ? 'Meta+K' : 'Control+K'} className="hero-ask no-js-hide lg:order-2">
              <Hologram className="hero-photo" active={ready} />
              <span className="sr-only">{t('hero.askHologram')}</span>
              {/* Under the feet: the invitation, then how to open it, typed as one line; the key then blinks. */}
              <span className="hero-ask-label">
                <TypeLoop fit once items={[t('hero.askHologram')]} tail={askKey} play={ready} className="hero-ask-typed" />
              </span>
              {/* Mouse only: an [ask] tag rides next to the pointer over the figure. */}
              <span className="hero-ask-cursor" aria-hidden="true">
                [<ScrambleText text={t('hero.askCursor')} play={askPlay} />]
              </span>
            </button>
          ) : (
            <Hologram className="hero-photo lg:order-2" active={ready} />
          )}
          {/* Bottom centre of the first screen. */}
          <p aria-hidden="true" className="hero-scroll">
            <TypeLoop fit once items={[`[${t('hero.scroll')}]`]} play={ready} />
          </p>
          {/* Bottom right, in the scroll cue's mono voice and on its line; from lg up, where both fit side by side (they are in the menu too). */}
          <ul className="hero-socials">
            {[
              [profile.linkedin, t('contact.linkedin')],
              [profile.github, t('contact.github')],
              [`mailto:${profile.email}`, t('contact.email')],
            ].map(([href, label]) => {
              const external = href.startsWith('http');
              return (
                <li key={href}>
                  <a href={href} {...(external && { target: '_blank', rel: 'noopener noreferrer' })}>
                    <span className="sr-only">{label}{external && ` ${t('a11y.newTab')}`}</span>
                    <TypeLoop once items={[label]} play={ready} />
                    <ArrowUpRight className="size-3" aria-hidden="true" strokeWidth={1.75} />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
