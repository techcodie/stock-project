import { useEffect, useRef, useState } from 'react';
import { motion as Motion, animate, useReducedMotion } from 'motion/react';

// Shared, tasteful entrance animations built on Motion (formerly Framer Motion).
// Kept as components only (no exported config objects) so React Fast Refresh
// stays happy. `motion` is imported as `Motion` so the linter treats it like a
// component identifier.

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

// Reveal a single block on mount (fade + slide up).
export function Reveal({ children, className, delay = 0, y = 14 }) {
  const reduce = useReducedMotion();
  return (
    <Motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </Motion.div>
  );
}

// Container that staggers the entrance of its <StaggerItem> children.
export function Stagger({ children, className }) {
  return (
    <Motion.div className={className} variants={containerVariants} initial="hidden" animate="show">
      {children}
    </Motion.div>
  );
}

// A single staggered child. `lift` adds a subtle hover raise for cards.
export function StaggerItem({ children, className, lift = false }) {
  return (
    <Motion.div
      className={className}
      variants={itemVariants}
      whileHover={lift ? { y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      {children}
    </Motion.div>
  );
}

// Animated number that counts up on mount and tweens on later changes.
export function CountUp({ value, prefix = '', suffix = '', decimals = 2, className }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(prev.current, value, {
      duration: 0.7,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  const shown = reduce ? value : display;
  return (
    <span className={className}>
      {prefix}
      {shown.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}
