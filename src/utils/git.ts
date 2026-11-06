/**
 * Captured result of a git invocation.
 */
export interface GitResult {
    exitCode: number
    stdout: string
    stderr: string
}

/**
 * Runs `git` with the given arguments in the current working directory and
 * captures its output. Never throws for a non-zero exit; a failure to spawn
 * git at all is reported as exit code 127.
 *
 * @param args - Arguments after `git`, e.g. `['commit', '-m', message]`
 * @returns Exit code plus trimmed stdout/stderr
 *
 * @example
 * ```typescript
 * const result = await runGit(['add', '.'])
 * if (result.exitCode !== 0) console.error(result.stderr)
 * ```
 */
export async function runGit(args: string[]): Promise<GitResult> {
    try {
        const proc = Bun.spawn(['git', ...args], {
            stdin: 'ignore',
            stdout: 'pipe',
            stderr: 'pipe',
        })
        const [stdout, stderr, exitCode] = await Promise.all([
            new Response(proc.stdout).text(),
            new Response(proc.stderr).text(),
            proc.exited,
        ])
        return { exitCode, stdout: stdout.trim(), stderr: stderr.trim() }
    } catch (error) {
        return {
            exitCode: 127,
            stdout: '',
            stderr: error instanceof Error ? error.message : String(error),
        }
    }
}
