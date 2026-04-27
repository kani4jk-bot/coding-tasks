#!/usr/bin/env node
// Scans tasks/ for Expo apps and regenerates the APPS array in app-launcher.html.
// Run: node scripts/generate-launcher.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TASKS_DIR = path.join(ROOT, 'tasks');
const LAUNCHER = path.join(ROOT, 'app-launcher.html');

const EMOJI_MAP = [
  [/bird|song|audio/i,       '🐦'],
  [/plant|garden|flower/i,   '🌿'],
  [/vehicle|car|auto/i,      '🚗'],
  [/travel|trip|plan/i,      '✈️'],
  [/charade|game|party/i,    '🎭'],
  [/architect|home|house|visual/i, '🏠'],
  [/food|recipe|cook/i,      '🍽️'],
  [/fitness|workout|health/i,'💪'],
  [/music|sound/i,           '🎵'],
  [/photo|camera/i,          '📷'],
  [/weather/i,               '🌤️'],
  [/map|location|geo/i,      '🗺️'],
];

function pickEmoji(name, folder) {
  const text = `${name} ${folder}`.toLowerCase();
  for (const [re, emoji] of EMOJI_MAP) {
    if (re.test(text)) return emoji;
  }
  return '📱';
}

function readAppJson(dir) {
  // Check root app.json first (standalone apps like charades)
  const root = path.join(TASKS_DIR, dir, 'app.json');
  if (fs.existsSync(root)) return { file: root, appPath: dir };
  // Then mobile subfolder
  const mobile = path.join(TASKS_DIR, dir, 'mobile', 'app.json');
  if (fs.existsSync(mobile)) return { file: mobile, appPath: `${dir}/mobile` };
  return null;
}

const taskDirs = fs
  .readdirSync(TASKS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

const apps = [];
for (const dir of taskDirs) {
  const found = readAppJson(dir);
  if (!found) continue;
  try {
    const json = JSON.parse(fs.readFileSync(found.file, 'utf8'));
    const expo = json.expo || json;
    const name = expo.name;
    const slug = expo.slug || dir;
    if (!name) continue;
    apps.push({
      name,
      emoji: pickEmoji(name, dir),
      path: `tasks/${found.appPath}`,
      slug,
    });
  } catch {
    console.warn(`Skipping ${dir}: could not parse app.json`);
  }
}

const appsJs = apps
  .map(a => `      { name: '${a.name}', emoji: '${a.emoji}', path: '${a.path}', slug: '${a.slug}' },`)
  .join('\n');

const marker = {
  start: '// AUTO-GENERATED-APPS-START',
  end: '// AUTO-GENERATED-APPS-END',
};

let html = fs.readFileSync(LAUNCHER, 'utf8');
const re = new RegExp(
  `(${marker.start})[\\s\\S]*?(${marker.end})`,
  'm'
);
const replacement = `${marker.start}\n    const APPS = [\n${appsJs}\n    ];\n    ${marker.end}`;

if (re.test(html)) {
  html = html.replace(re, replacement);
} else {
  console.error('Could not find AUTO-GENERATED markers in app-launcher.html');
  process.exit(1);
}

fs.writeFileSync(LAUNCHER, html);
console.log(`Updated app-launcher.html with ${apps.length} apps:`);
apps.forEach(a => console.log(`  ${a.emoji}  ${a.name}  (${a.path})`));
