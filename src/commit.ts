import chalk from 'chalk'

import {
    type CommitFieldsInput,
    findMissingFields,
    formatMissingFlagsError,
    isCompleteFields,
    validateCommitFields,
} from './utils/commit-fields'
import { buildCommitMessage } from './utils/commit-message'
import { loadCommitConfig } from './utils/config'
import { type GitResult, runGit } from './utils/git'
import { promptForMissingFields } from './utils/prompts'
import {
    type CommitOptions,
    CommitOptionsSchema,
} from './utils/schemas/options'

/**
 * Process exit codes used by the CLI.
 *
 * - `SUCCESS` (0): a commit was created (and pushed, if `auto_push`), or a
 *   dry run completed
 * - `FAILURE` (1): invalid or missing input, or any git step failed
 *   (including "nothing to commit")
 * - `CANCELLED` (130): the user cancelled an interactive prompt
 */
export const EXIT_CODES = {
    SUCCESS: 0,
    FAILURE: 1,
    CANCELLED: 130,
} as const

/**
 * Outcome of {@link commit}. Errors are returned, not thrown, so the CLI layer
 * can map them to exit codes and programmatic callers can inspect them.
 */
export type CommitResult =
    | { success: true; message: string; dryRun: boolean }
    | { success: false; exitCode: number; errors: string[] }

function failure(
    errors: string[],
    exitCode: number = EXIT_CODES.FAILURE
): CommitResult {
    return { success: false, exitCode, errors }
}

function gitFailure(summary: string, result: GitResult): CommitResult {
    const detail = result.stderr || result.stdout
    return failure([detail ? `${summary}\n└─ ${detail}` : summary])
}

function indent(message: string): string {
    return message
        .split('\n')
        .map((line, index) => {
            if (index === 0) return chalk.blue('└─ ') + chalk.yellow(line)
            return line ? '   ' + chalk.yellow(line) : ''
        })
        .join('\n')
}

/**
 * Creates a conventional commit.
 *
 * Fields (`type`, `scope`, `subject`, `body`, `breaking`, `trailers`) can be
 * passed directly. Provided values are validated against `commit.config.ts`.
 * Missing required fields are prompted for when `interactive` is true
 * (defaults to `process.stdin.isTTY`); otherwise the call fails without
 * prompting.
 *
 * Respects `git.auto_add_all` and `git.auto_push` from the config. In dry-run
 * mode, prints the message and runs no git commands.
 *
 * @param rawOptions - See {@link CommitOptions}
 * @returns `{ success: true, message, dryRun }` or
 *   `{ success: false, exitCode, errors }`
 *
 * @example
 * ```typescript
 * const result = await commit({
 *     type: 'feat',
 *     scope: 'cli',
 *     subject: 'add non-interactive flags',
 *     trailers: ['Co-Authored-By: Claude <noreply@anthropic.com>'],
 * })
 * if (!result.success) process.exit(result.exitCode)
 * ```
 */
export async function commit(
    rawOptions: CommitOptions = {}
): Promise<CommitResult> {
    const parsedOptions = CommitOptionsSchema.safeParse(rawOptions)
    if (!parsedOptions.success) {
        return failure(
            parsedOptions.error.issues.map(
                (issue) =>
                    `Invalid option ${issue.path.join('.')}: ${issue.message}`
            )
        )
    }
    const options = parsedOptions.data

    const config = await loadCommitConfig(options.configPath)
    const allowed = {
        types: config.types.map((option) => option.value),
        scopes: config.scopes.map((option) => option.value),
    }

    const provided: CommitFieldsInput = {
        type: options.type,
        scope: options.scope,
        subject: options.subject,
        body: options.body,
        breaking: options.breaking,
        trailers: options.trailers,
    }

    const validation = validateCommitFields(provided, allowed)
    if (!validation.success) return failure(validation.errors)

    // Decide about prompting before anything is drawn on screen.
    const missing = findMissingFields(provided)
    let fields = provided
    if (missing.length > 0) {
        if (!options.interactive) {
            return failure([formatMissingFlagsError(missing)])
        }

        const prompted = await promptForMissingFields(provided, missing, {
            types: config.types,
            scopes: config.scopes,
        })
        if (prompted.cancelled) {
            return failure(['Cancelled'], EXIT_CODES.CANCELLED)
        }
        fields = prompted.fields

        const promptedValidation = validateCommitFields(fields, allowed)
        if (!promptedValidation.success) {
            return failure(promptedValidation.errors)
        }
    }

    if (!isCompleteFields(fields)) {
        return failure([formatMissingFlagsError(findMissingFields(fields))])
    }

    const message = buildCommitMessage(fields)

    console.log('\n' + chalk.blue('📝 Commit message:'))
    console.log(indent(message))

    if (options.dryRun) {
        console.log(
            '\n' + chalk.green('✓ Dry run completed - no git commands executed')
        )
        return { success: true, message, dryRun: true }
    }

    if (config.git.auto_add_all) {
        console.log('\n' + chalk.blue('📦 Adding all changes...'))
        const addResult = await runGit(['add', '.'])
        if (addResult.exitCode !== 0) {
            return gitFailure('Failed to add changes', addResult)
        }
        console.log(chalk.green('✓ Successfully added all changes'))
    }

    console.log('\n' + chalk.blue('💾 Committing changes...'))
    const commitResult = await runGit(['commit', '-m', message])
    if (commitResult.exitCode !== 0) {
        return gitFailure('Failed to commit changes', commitResult)
    }
    console.log(chalk.green('✓ Successfully committed changes'))
    console.log(chalk.green('└─ ') + chalk.dim.yellow(commitResult.stdout))

    if (config.git.auto_push) {
        console.log('\n' + chalk.blue('🚀 Pushing changes...'))
        const pushResult = await runGit(['push'])
        if (pushResult.exitCode !== 0) {
            return gitFailure(
                'Committed, but failed to push changes',
                pushResult
            )
        }
        console.log(chalk.green('✓ Successfully pushed changes'))
    }

    return { success: true, message, dryRun: false }
}
