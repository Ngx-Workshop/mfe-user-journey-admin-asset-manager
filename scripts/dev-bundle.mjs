// Copied into generated MFEs. Supervise both processes so Ctrl+C stops both.
import { spawn } from 'node:child_process';
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Start this runner with npm run dev:bundle.');
const children = ['watch', 'serve:bundle'].map(script => spawn(process.execPath, [npm, 'run', script], {
  stdio: 'inherit', detached: process.platform !== 'win32',
}));
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (!child.pid) continue;
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
    else { try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; } }
  }
}
process.on('SIGINT', () => stop(130));
process.on('SIGTERM', () => stop(143));
for (const child of children) {
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => stop(code ?? 1));
}
