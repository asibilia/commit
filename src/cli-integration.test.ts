import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

const CLI_PATH = resolve(import.meta.dir, 'index.ts')

const CONFIG_SOURCE = `export default {
    types: [
        { value: 'feat', label: 'A new feature' },
        { value: 'fix', label: 'A bug fix' },
        { value: 'docs', label: 'Docs' },
    ],
    scopes: [
        { value: 'cli', label: 'CLI' },
        { value: 'git', label: 'Git' },
    ],
    git: { auto_add_all: true, auto_push: false },
}
`

interface RunResult {
    exitCode: number
    stdout: string
    stderr: string
    output: string
}

function git(cwd: string, args: string[]): string {
    const result = Bun.spawnSync(['git', ...args], { cwd })
    return result.stdout.toString()
}

async function runCli(cwd: string, args: string[]): Promise<RunResult> {
    const proc = Bun.spawn([process.execPath, CLI_PATH, ...args], {
        cwd,
        stdin: 'ignore',
        stdout: 'pipe',
        stderr: 'pipe',
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    })
    const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
    ])
    return { exitCode, stdout, stderr, output: stdout + stderr }
}

function commitCount(cwd: string): number {
    const result = Bun.spawnSync(['git', 'rev-list', '--count', 'HEAD'], {
        cwd,
    })
    return result.exitCode === 0 ? Number(result.stdout.toString().trim()) : 0
}

describe('CLI (non-TTY)', () => {
    let repo: string

    beforeEach(() => {
        repo = mkdtempSync(join(tmpdir(), 'commit-cli-'))
        git(repo, ['init', '-q'])
        git(repo, ['config', 'user.name', 'Test User'])
        git(repo, ['config', 'user.email', 'test@example.com'])
        git(repo, ['config', 'commit.gpgsign', 'false'])
        writeFileSync(join(repo, 'commit.config.ts'), CONFIG_SOURCE)
        writeFileSync(join(repo, 'file.txt'), 'hello\n')
    })

    afterEach(() => {
        rmSync(repo, { recursive: true, force: true })
    })

    test('all flags: commits the full message and exits 0', async () => {
        const result = await runCli(repo, [
            '--type',
            'feat',
            '--scope',
            'cli',
            '--subject',
            'add non-interactive flags',
            '--body',
            'First paragraph.\n\n# not a comment',
            '--breaking',
            'prompts are skipped when flags are given',
            '--trailer',
            'Refs: #42',
            '--trailer',
            'Co-Authored-By: Claude <noreply@anthropic.com>',
        ])

        expect(result.exitCode).toBe(0)
        expect(git(repo, ['log', '-1', '--format=%B']).trimEnd()).toBe(
            [
                'feat(cli)!: add non-interactive flags',
                '',
                'First paragraph.',
                '',
                '# not a comment',
                '',
                'BREAKING CHANGE: prompts are skipped when flags are given',
                'Refs: #42',
                'Co-Authored-By: Claude <noreply@anthropic.com>',
            ].join('\n')
        )
    })

    test('short flags and -c config path work from another cwd', async () => {
        const otherCwd = mkdtempSync(join(tmpdir(), 'commit-cli-cwd-'))
        try {
            const result = await runCli(otherCwd, [
                '-c',
                join(repo, 'commit.config.ts'),
                '-t',
                'fix',
                '-s',
                'git',
                '-m',
                'x',
                '--dry-run',
            ])
            expect(result.exitCode).toBe(0)
            expect(result.stdout).toContain('fix(git): x')
        } finally {
            rmSync(otherCwd, { recursive: true, force: true })
        }
    })

    test('missing scope/subject: exits 1 naming the flags, no commit', async () => {
        const result = await runCli(repo, ['--type', 'feat'])

        expect(result.exitCode).toBe(1)
        expect(result.stderr).toContain(
            'Missing required flags for non-interactive use: --scope, --subject'
        )
        expect(result.output).not.toContain('Select the')
        expect(commitCount(repo)).toBe(0)
    })

    test('no flags at all: exits 1 without drawing a prompt', async () => {
        const result = await runCli(repo, [])

        expect(result.exitCode).toBe(1)
        expect(result.stderr).toContain('--type, --scope, --subject')
        expect(result.output).not.toContain('Select the')
        expect(commitCount(repo)).toBe(0)
    })

    test('unknown type: non-zero exit listing allowed values', async () => {
        const result = await runCli(repo, [
            '--type',
            'foo',
            '--scope',
            'cli',
            '--subject',
            'x',
        ])

        expect(result.exitCode).not.toBe(0)
        expect(result.stderr).toContain(
            'Unknown type "foo". Allowed: feat, fix, docs'
        )
        expect(commitCount(repo)).toBe(0)
    })

    test('malformed trailer: non-zero exit with format hint', async () => {
        const result = await runCli(repo, [
            '-t',
            'feat',
            '-s',
            'cli',
            '-m',
            'x',
            '--trailer',
            'not a trailer',
        ])

        expect(result.exitCode).toBe(1)
        expect(result.stderr).toContain('Invalid trailer "not a trailer"')
        expect(commitCount(repo)).toBe(0)
    })

    test('--dry-run: prints the message, exits 0, commits and stages nothing', async () => {
        const result = await runCli(repo, [
            '-t',
            'docs',
            '-s',
            'cli',
            '-m',
            'document flags',
            '-b',
            'Body text',
            '--trailer',
            'Refs: #7',
            '--dry-run',
        ])

        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('docs(cli): document flags')
        expect(result.stdout).toContain('Body text')
        expect(result.stdout).toContain('Refs: #7')
        expect(commitCount(repo)).toBe(0)
        expect(git(repo, ['diff', '--cached', '--name-only']).trim()).toBe('')
    })

    test('nothing to commit: non-zero exit', async () => {
        git(repo, ['add', '.'])
        git(repo, ['commit', '-q', '-m', 'initial'])

        const result = await runCli(repo, [
            '-t',
            'fix',
            '-s',
            'git',
            '-m',
            'nothing here',
        ])

        expect(result.exitCode).not.toBe(0)
        expect(result.stderr).toContain('Failed to commit changes')
        expect(commitCount(repo)).toBe(1)
    })
})
