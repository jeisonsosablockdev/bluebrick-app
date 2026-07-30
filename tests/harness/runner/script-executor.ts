import { spawnSync, SpawnSyncOptions } from 'child_process';
import path from 'path';

export interface ScriptExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export function executeHarnessScript(
  scriptRelativePath: string,
  args: string[] = [],
  options: { cwd: string; env?: Record<string, string> }
): ScriptExecutionResult {
  const repoRoot = path.resolve(__dirname, '../../../');
  const fullScriptPath = path.isAbsolute(scriptRelativePath)
    ? scriptRelativePath
    : path.join(repoRoot, scriptRelativePath);

  const isShell = scriptRelativePath.endsWith('.sh');
  const command = isShell ? 'bash' : process.execPath;
  const commandArgs = isShell ? [fullScriptPath, ...args] : [fullScriptPath, ...args];

  const spawnOptions: SpawnSyncOptions = {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    encoding: 'utf-8',
  };

  const proc = spawnSync(command, commandArgs, spawnOptions);

  return {
    exitCode: proc.status ?? 1,
    stdout: proc.stdout ? proc.stdout.toString() : '',
    stderr: proc.stderr ? proc.stderr.toString() : '',
  };
}
