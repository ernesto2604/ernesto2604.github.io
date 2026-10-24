import { useT } from '../i18n';
import { PHOTO_SIZE, PHOTO_SIZES, photoSrcSet } from '../lib/photo';
import profile from '../content/profile.json';

// The photo sits below the fold (Output), so it loads lazily; the hero holds the hologram.
export default function Portrait({ className = '' }: { className?: string }) {
  const t = useT();
  // No photo configured: a neutral panel, never a stand-in face. The build warns loudly (scripts/prerender.mjs).
  if (!profile.photo) {
    return (
      <div className={`portrait grid place-items-center text-sm text-muted ${className}`} data-photo="pending">
        {t('hero.photoPending')}
      </div>
    );
  }
  return (
    <picture className={`portrait block ${className}`}>
      <source type="image/avif" srcSet={photoSrcSet('avif')} sizes={PHOTO_SIZES} />
      <img
        src={`${profile.photo}-640.webp`}
        srcSet={photoSrcSet('webp')}
        sizes={PHOTO_SIZES}
        width={PHOTO_SIZE.width}
        height={PHOTO_SIZE.height}
        alt={t('hero.photoAlt')}
        loading="lazy"
        decoding="async"
        className="size-full object-contain object-bottom"
      />
    </picture>
  );
}
