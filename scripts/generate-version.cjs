const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const buildDate = new Date().toISOString();

const versionData = {
  version: pkg.version,
  buildTime: buildDate
};

fs.writeFileSync('public/version.json', JSON.stringify(versionData, null, 2));
fs.writeFileSync('src/config/appVersion.ts', `export const version = '${pkg.version}';\nexport const buildDate = '${buildDate}';\n`);
console.log(`Generated version.json for version ${pkg.version}`);
