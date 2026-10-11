import { useState } from 'react';
import { CONTENT_ARTWORK, type ArtworkKey } from '../data/contentArtwork';
import '../styles/artwork.css';

type Props = { artwork: ArtworkKey; variant?: 'card' | 'hero' | 'option' };

export function ContentArtwork({ artwork, variant = 'card' }: Props) {
  const image = CONTENT_ARTWORK[artwork];
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [retrySrc, setRetrySrc] = useState<string | null>(null);
  const retrying = retrySrc === image.src;
  if (failedSrc === image.src) return null;
  return (
    <div className={`content-artwork content-artwork--${variant}`} data-artwork={artwork} aria-hidden="true">
      <img
        key={`${image.src}-${retrying ? 'retry' : 'initial'}`}
        src={image.small}
        srcSet={retrying ? undefined : `${image.small} 480w, ${image.src} 960w`}
        sizes={variant === 'hero' ? '(max-width: 600px) 90vw, 880px' : variant === 'option' ? '180px' : '(max-width: 600px) 90vw, 520px'}
        width={960} height={640} alt=""
        loading={variant === 'option' ? 'lazy' : 'eager'}
        decoding="async"
        crossOrigin="anonymous"
        fetchPriority={variant === 'hero' ? 'high' : 'auto'}
        onError={() => retrying ? setFailedSrc(image.src) : setRetrySrc(image.src)}
      />
      {variant === 'card' && <span className="content-artwork__label">{image.label}</span>}
    </div>
  );
}
