#!/usr/bin/env node
import { execSync } from 'node:child_process';

// Rebuild the protected production entry point, then test the real current screens.
execSync('npm run build', { stdio: 'inherit' });
execSync('npx playwright test --grep layouts --reporter=line', { stdio: 'inherit' });
