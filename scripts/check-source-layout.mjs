import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const failures = [];
const categories = new Set([
  'pages',
  'components',
  'api',
  'state',
  'models',
  'forms',
  'utils',
  'config',
  'resolvers',
]);
const entries = readdirSync('src/app', { withFileTypes: true });
for (const entry of entries) {
  if (
    entry.isDirectory()
      ? entry.name !== 'features'
      : !['app.ts', 'app.config.ts', 'app.routes.ts'].includes(
          entry.name
        )
  ) {
    failures.push(
      `src/app/${entry.name}: place feature code under features/<feature>.`
    );
  }
}
const features = 'src/app/features';
if (!existsSync(features)) failures.push('Missing src/app/features.');
else
  for (const feature of readdirSync(features, {
    withFileTypes: true,
  })) {
    if (!feature.isDirectory()) {
      failures.push(
        `${features}/${feature.name}: expected a feature folder.`
      );
      continue;
    }
    for (const entry of readdirSync(join(features, feature.name), {
      withFileTypes: true,
    })) {
      if (
        entry.isDirectory()
          ? !categories.has(entry.name)
          : !entry.name.endsWith('.routes.ts')
      ) {
        failures.push(
          `${features}/${feature.name}/${entry.name}: use a documented category or feature route file.`
        );
      }
    }
  }
function walk(directory, visit) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, {
    withFileTypes: true,
  })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path, visit);
    else visit(path);
  }
}
walk('src', (path) => {
  if (path.endsWith('.spec.ts'))
    failures.push(
      `${path}: move specs into testing with matching folders.`
    );
});
walk('testing/app', (path) => {
  if (
    path.endsWith('.ts') &&
    !existsSync(dirname(path.replace(/^testing\//, 'src/')))
  ) {
    failures.push(`${path}: no matching production folder.`);
  }
});
if (failures.length) {
  failures.forEach((message) => console.error(message));
  process.exitCode = 1;
} else console.log('Source layout checks passed.');
