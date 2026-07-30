import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface SandboxEnvironment {
  sandboxPath: string;
  cleanup: () => void;
  createFile: (relativePath: string, content: string) => void;
  runGitCommand: (command: string) => string;
}

export function createSandboxWorkspace(testName: string): SandboxEnvironment {
  const sandboxBase = path.resolve(__dirname, '../.sandbox');
  const uniqueId = `${testName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sandboxPath = path.join(sandboxBase, uniqueId);

  fs.mkdirSync(sandboxPath, { recursive: true });

  // Initialize a fresh isolated git repository
  execSync('git init -b develop', { cwd: sandboxPath, stdio: 'ignore' });
  execSync('git config user.name "Harness Test"', { cwd: sandboxPath, stdio: 'ignore' });
  execSync('git config user.email "harness-test@brids.internal"', { cwd: sandboxPath, stdio: 'ignore' });

  const createFile = (relativePath: string, content: string) => {
    const fullPath = path.join(sandboxPath, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
  };

  const runGitCommand = (cmd: string): string => {
    return execSync(cmd, { cwd: sandboxPath, encoding: 'utf-8' });
  };

  const cleanup = () => {
    if (fs.existsSync(sandboxPath)) {
      try {
        fs.rmSync(sandboxPath, { recursive: true, force: true });
      } catch (err) {
        // Silently ignore cleanup race conditions
      }
    }
  };

  return {
    sandboxPath,
    cleanup,
    createFile,
    runGitCommand,
  };
}
