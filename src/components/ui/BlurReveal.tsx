import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type React from 'react';

export interface BlurRevealProps {
  children: string;
  className?: string;
  delay?: number;
  speedReveal?: number;
  speedSegment?: number;
  trigger?: boolean;
  onAnimationComplete?: () => void;
  onAnimationStart?: () => void;
  as?: keyof React.JSX.IntrinsicElements;
  style?: React.CSSProperties;
  inView?: boolean;
  once?: boolean;
  letterSpacing?: string | number;
}

// Letters fade in out of a blur, one after another (on mount, or when scrolled into view with `inView`).
// Reduced motion: the plain text. Without JS the prerendered hidden styles are overridden in global.css.
export function BlurReveal({
  children,
  className,
  delay = 0,
  speedReveal = 1.5,
  speedSegment = 0.5,
  trigger = true,
  onAnimationComplete,
  onAnimationStart,
  as = 'p',
  style,
  inView = false,
  once = true,
  letterSpacing,
}: BlurRevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  if (reduce) {
    const Tag = as as React.ElementType;
    return trigger ? <Tag className={className} style={style}>{children}</Tag> : null;
  }

  const stagger = 0.03 / speedReveal;
  const baseDuration = 0.3 / speedSegment;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: stagger, delayChildren: delay } },
    exit: { transition: { staggerChildren: stagger, staggerDirection: -1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, filter: 'blur(12px)', y: 10 },
    visible: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: baseDuration } },
    exit: { opacity: 0, filter: 'blur(12px)', y: 10 },
  };

  return (
    <AnimatePresence mode="popLayout">
      {trigger && (
        <MotionTag
          data-blur-reveal
          initial="hidden"
          whileInView={inView ? 'visible' : undefined}
          animate={inView ? undefined : 'visible'}
          exit="exit"
          variants={containerVariants}
          viewport={{ once }}
          className={className}
          onAnimationComplete={onAnimationComplete}
          onAnimationStart={onAnimationStart}
          style={style}
        >
          <span className="sr-only">{children}</span>
          {children.split(' ').map((word, wordIndex, wordsArray) => (
            <span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap" aria-hidden="true">
              {word.split('').map((char, charIndex) => (
                <motion.span
                  key={`char-${wordIndex}-${charIndex}`}
                  variants={itemVariants}
                  className="inline-block"
                  style={letterSpacing ? { marginRight: letterSpacing } : undefined}
                >
                  {char}
                </motion.span>
              ))}
              {wordIndex < wordsArray.length - 1 && (
                <motion.span variants={itemVariants} className="inline-block">
                  &nbsp;
                </motion.span>
              )}
            </span>
          ))}
        </MotionTag>
      )}
    </AnimatePresence>
  );
}

export default BlurReveal;
