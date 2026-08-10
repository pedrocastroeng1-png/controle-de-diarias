const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const versionData = {
  version: pkg.version,
  buildTime: new Date().toISOString()
};

fs.writeFileSync('public/version.json', JSON.stringify(versionData, null, 2));
console.log(`Generated version.json for version ${pkg.version}`);
