/**
 * Frees the API port before `npm run dev` (Windows-friendly).
 * Prevents EADDRINUSE when an old node process is still listening.
 */
const { execSync } = require('child_process');

const port = String(process.env.PORT || 4000);

function freePortWin() {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split('\n')) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`[free-port] Stopped process ${pid} on port ${port}`);
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* nothing listening */
  }
}

if (process.platform === 'win32') {
  freePortWin();
}
