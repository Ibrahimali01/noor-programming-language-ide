#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// الحصول على المسار الحقيقي وموقع ملف noor-cli.ts باستخدام require.resolve
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const realPath = fs.existsSync(__filename) ? fs.realpathSync(__filename) : __filename;

let cliPath = '';
try {
  cliPath = require.resolve('../noor-cli.ts');
} catch (err) {
  cliPath = path.resolve(path.dirname(realPath), '..', 'noor-cli.ts');
}
const args = process.argv.slice(2);

// محاولة البحث عن tsx بشكل مباشر داخل مجلدات الحزمة لتجنب مشاكل npx في ديركتوري آخر
let tsxCliPath = '';
try {
  const tsxPkgPath = path.dirname(require.resolve('tsx/package.json'));
  const cliMjs = path.join(tsxPkgPath, 'dist', 'cli.mjs');
  if (fs.existsSync(cliMjs)) {
    tsxCliPath = cliMjs;
  }
} catch (err) {
  // الاعتماد على npx كبديل احتياطي
}

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const execCmd = tsxCliPath ? 'node' : npxCmd;
const execArgs = tsxCliPath ? [tsxCliPath, cliPath, ...args] : ['tsx', cliPath, ...args];

if (process.env.NOOR_DEBUG) {
  console.log(`[Noor Launcher] Platform: ${process.platform}`);
  console.log(`[Noor Launcher] Real Path: ${realPath}`);
  console.log(`[Noor Launcher] CLI Path: ${cliPath}`);
  console.log(`[Noor Launcher] tsx CLI Path: ${tsxCliPath || 'Not Found (Using npx)'}`);
}

// استخدام tsx لتشغيل ملف TypeScript مباشرة
const child = spawn(execCmd, execArgs, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NOOR_PLATFORM: process.platform }
});

child.on('error', (err) => {
  console.error('❌ فشل تشغيل محرك نور:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
