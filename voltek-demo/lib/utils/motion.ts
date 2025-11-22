// Framer Motion animation variants and utilities

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
};

export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity },
  },
};

export const bounceAnimation = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 0.6, repeat: Infinity },
  },
};

export const liftOnHover = {
  whileHover: {
    y: -4,
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)',
    transition: { duration: 0.2 },
  },
};

// Reduced motion variant
export const reducedMotion = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
