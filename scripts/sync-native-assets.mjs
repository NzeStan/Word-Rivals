// Downloads the app icon, splash and notification icon links from src/config/native.json into assets/native/.
// Run after changing those links: npm run assets:sync
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const native = JSON.parse(await readFile(new URL('../src/config/native.json', import.meta.url), 'utf8'));
const out = new URL('../assets/native/', import.meta.url);
const files = {
  icon: 'icon.png',
  adaptiveForeground: 'adaptive-foreground.png',
  adaptiveMonochrome: 'adaptive-monochrome.png',
  splash: 'splash.png',
  notificationIcon: 'notification-icon.png',
};

await mkdir(out, { recursive: true });
for (const [key, file] of Object.entries(files)) {
  const res = await fetch(native.links[key]);
  if (!res.ok) throw new Error(`${key}: ${native.links[key]} returned ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.subarray(1, 4).toString() !== 'PNG') throw new Error(`${key}: ${native.links[key]} is not a PNG`);
  await writeFile(new URL(file, out), bytes);
  console.log(`${file}  ${(bytes.length / 1024).toFixed(0)} KB`);
}
