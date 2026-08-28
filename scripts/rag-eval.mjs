import { execFileSync } from 'node:child_process';

execFileSync('npx', ['tsx', 'scripts/rag-eval.ts'], { stdio: 'inherit' });
