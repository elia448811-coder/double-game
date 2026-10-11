import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const images = JSON.parse(readFileSync('src/data/hosted-images.json', 'utf8'));
const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
const csp = config.headers.flatMap((entry) => entry.headers)
  .find((header) => header.key === 'Content-Security-Policy').value;
for (const directive of ['img-src', 'connect-src']) {
  assert(csp.split(';').find((part) => part.trim().startsWith(directive)).includes('https://res.cloudinary.com'));
}
const requests = Object.entries(images).flatMap(([key, image]) => {
  assert(image.publicId.startsWith('double-game/'));
  assert(image.url.startsWith('https://res.cloudinary.com/ipb43mz0/image/upload/'));
  return [{ key, width: 'original', url: image.url, sha256: image.sha256 },
    ...(key === 'background' ? [1600] : [480, 960]).map((width) => ({
      key, width, url: image.url.replace('/image/upload/', `/image/upload/f_webp,q_82,c_limit,w_${width}/`),
    }))];
});
const results = [];
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < requests.length) {
    const item = requests[next++];
    const response = await fetch(item.url, { signal: AbortSignal.timeout(30_000) });
    assert.equal(response.status, 200, item.url);
    const contentType = response.headers.get('content-type');
    assert(contentType?.startsWith('image/'), item.url);
    assert.equal(response.headers.get('access-control-allow-origin'), '*', item.url);
    if (item.width !== 'original') {
      assert.equal(contentType, 'image/webp', item.url);
      assert(!/\b(?:accept|user-agent)\b/i.test(response.headers.get('vary') || ''), `Offline cache varies by browser headers: ${item.url}`);
    }
    const data = Buffer.from(await response.arrayBuffer());
    assert(data.length > 100, item.url);
    if (item.sha256) assert.equal(createHash('sha256').update(data).digest('hex'), item.sha256, item.url);
    results.push({ key: item.key, width: item.width, url: item.url, status: response.status, contentType, bytes: data.length });
  }
}));
results.sort((a, b) => a.key.localeCompare(b.key) || String(a.width).localeCompare(String(b.width)));
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2) + '\n');
console.log(`Verified ${Object.keys(images).length} originals and ${results.length - Object.keys(images).length} delivery variants; hashes, CORS, CSP and image responses passed.`);
