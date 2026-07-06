#!/usr/bin/env node
/**
 * filter-published-models.js — strip low-quality model output from a built dist/.
 *
 * Runs as a postbuild step (see package.json) so the excluded model's files
 * and catalog entries never reach the published github.io site, while
 * public/domains/ keeps the full data for local model-comparison review.
 *
 * Usage:
 *   node scripts/filter-published-models.js [--models gemma3,other] [--dist dist]
 */
import fs from 'fs';
import path from 'path';

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag, fallback) => {
    const i = args.indexOf(flag);
    return i === -1 ? fallback : args[i + 1];
  };
  return {
    models: get('--models', 'gemma3').split(',').map((m) => m.trim()).filter(Boolean),
    distDir: get('--dist', 'dist'),
  };
}

function removeModelDirs(domainsRoot, models) {
  let removed = 0;
  for (const domainName of fs.readdirSync(domainsRoot)) {
    const outputRoot = path.join(domainsRoot, domainName, 'output');
    if (!fs.statSync(path.join(domainsRoot, domainName)).isDirectory()) continue;
    if (!fs.existsSync(outputRoot)) continue;
    for (const levelLangName of fs.readdirSync(outputRoot)) {
      const levelLangDir = path.join(outputRoot, levelLangName);
      if (!fs.statSync(levelLangDir).isDirectory()) continue;
      for (const model of models) {
        const modelDir = path.join(levelLangDir, model);
        if (fs.existsSync(modelDir)) {
          fs.rmSync(modelDir, { recursive: true, force: true });
          removed++;
        }
      }
    }
  }
  return removed;
}

// public/concepts/{level}.{language}/{model}/ — the canonical concept-page
// pool that books link to instead of inlining (see src/lib/paths.js).
function removeCanonicalConceptDirs(conceptsRoot, models) {
  let removed = 0;
  if (!fs.existsSync(conceptsRoot)) return removed;
  for (const levelLangName of fs.readdirSync(conceptsRoot)) {
    const levelLangDir = path.join(conceptsRoot, levelLangName);
    if (!fs.statSync(levelLangDir).isDirectory()) continue;
    for (const model of models) {
      const modelDir = path.join(levelLangDir, model);
      if (fs.existsSync(modelDir)) {
        fs.rmSync(modelDir, { recursive: true, force: true });
        removed++;
      }
    }
  }
  return removed;
}

function filterEntries(entries, models) {
  return entries.filter((e) => !models.includes(e.model));
}

function filterCatalogFile(filePath, models) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let changed = false;
  for (const key of ['books', 'generated_concepts', 'pdfs']) {
    if (!Array.isArray(data[key])) continue;
    const before = data[key].length;
    data[key] = filterEntries(data[key], models);
    changed ||= data[key].length !== before;
  }
  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  }
  return changed;
}

function main() {
  const { models, distDir } = parseArgs();
  const domainsRoot = path.join(distDir, 'domains');
  if (!fs.existsSync(domainsRoot)) {
    console.error(`filter-published-models: ${domainsRoot} not found, skipping`);
    return;
  }

  const removedDirs = removeModelDirs(domainsRoot, models)
    + removeCanonicalConceptDirs(path.join(distDir, 'concepts'), models);

  let touchedFiles = 0;
  const catalogJson = path.join(domainsRoot, 'catalog.json');
  const catalogEntries = JSON.parse(fs.readFileSync(catalogJson, 'utf-8'));
  for (const entry of catalogEntries) {
    let changed = false;
    for (const key of ['books', 'generated_concepts', 'pdfs']) {
      if (!Array.isArray(entry[key])) continue;
      const before = entry[key].length;
      entry[key] = filterEntries(entry[key], models);
      changed ||= entry[key].length !== before;
    }
    if (changed) touchedFiles++;
  }
  fs.writeFileSync(catalogJson, JSON.stringify(catalogEntries, null, 2) + '\n', 'utf-8');

  const catalogDetailDir = path.join(domainsRoot, 'catalog');
  let touchedDetails = 0;
  if (fs.existsSync(catalogDetailDir)) {
    for (const fname of fs.readdirSync(catalogDetailDir)) {
      if (!fname.endsWith('.json')) continue;
      if (filterCatalogFile(path.join(catalogDetailDir, fname), models)) touchedDetails++;
    }
  }

  console.log(
    `filter-published-models: removed ${removedDirs} model dir(s), ` +
    `updated ${touchedFiles} catalog.json entries and ${touchedDetails} detail file(s) ` +
    `for models [${models.join(', ')}]`
  );
}

main();
