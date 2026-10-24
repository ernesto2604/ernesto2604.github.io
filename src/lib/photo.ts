import profile from '../content/profile.json';

// Hero photo set written by scripts/photo.py (AVIF + WebP, metadata stripped). Keep widths and ratio in sync with it.
export const PHOTO_WIDTHS = [400, 640, 960];
export const PHOTO_SIZE = { width: 1099, height: 1066 };
export const PHOTO_SIZES = '(min-width: 1024px) 460px, 80vw';
export const photoSrcSet = (ext: 'avif' | 'webp') => PHOTO_WIDTHS.map((w) => `${profile.photo}-${w}.${ext} ${w}w`).join(', ');
