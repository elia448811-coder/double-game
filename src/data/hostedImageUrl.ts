import images from './hosted-images.json' with { type: 'json' };

export type HostedImageKey = keyof typeof images;

/** Versioned originals stay in the shared account's double-game folder. */
export function hostedImageUrl(key: HostedImageKey, width: number): string {
  return images[key].url.replace('/image/upload/', `/image/upload/f_webp,q_82,c_limit,w_${width}/`);
}

export const OFFLINE_IMAGE_URLS = Object.keys(images).flatMap((key) => {
  const imageKey = key as HostedImageKey;
  return imageKey === 'background'
    ? [hostedImageUrl(imageKey, 1600)]
    : [hostedImageUrl(imageKey, 480), hostedImageUrl(imageKey, 960)];
});
