import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, '.output', 'public');
const targetDir = path.join(rootDir, 'dist', 'client');

if (!fs.existsSync(sourceDir)) {
  // Vercel builds use the Nitro `vercel` preset (.vercel/output), not .output/public.
  if (process.env.VERCEL && fs.existsSync(path.join(rootDir, '.vercel', 'output'))) {
    console.log('Vercel build detected (.vercel/output) - skipping dist/client preparation.');
    process.exit(0);
  }
  throw new Error(`Deployment source directory does not exist: ${sourceDir}`);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });

function copyDirectory(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirectory(srcPath, destPath);
      continue;
    }

    fs.copyFileSync(srcPath, destPath);
  }
}

copyDirectory(sourceDir, targetDir);

// Add _redirects file for Netlify client-side routing
const redirectsPath = path.join(targetDir, '_redirects');
if (!fs.existsSync(redirectsPath)) {
  fs.writeFileSync(redirectsPath, '/* /index.html 200\n');
}
console.log(`Prepared deployment output at ${targetDir}`);
