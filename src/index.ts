#!/usr/bin/env node

import { resolve } from 'path'

import chalk from 'chalk'
import { Command } from 'commander'

import { commit, EXIT_CODES } from './commit'
import { CliOptionsSchema } from './utils/schemas/options'

// Accumulates repeatable flags (--body, --trailer). No commander default, so
// `--help` stays clean; CliOptionsSchema handles absent values.
function collect(value: string, previous: string[] | undefined): string[] {
    return [...(previous ?? []), value]
}

function printErrors(errors: string[]) {
    for (const error of errors) {
        console.error(chalk.red(`✗ ${error}`))
    }
}

// Handle CLI execution
async function main() {
    // Read version dynamically using Bun.file()
    let packageVersion = '1.0.3' // fallback version
    try {
        const packagePath = resolve(import.meta.dir, '../package.json')
        const packageFile = Bun.file(packagePath)
        const packageJson = await packageFile.json()
        packageVersion = packageJson.version
    } catch {
        // Fallback for compiled binaries where package.json might not be accessible
        // This is expected behavior for compiled binaries, so no warning needed
    }

    const program = new Command()

    program
        .name('commit')
        .description(
            'CLI tool for creating standardized commit messages with customizable types and scopes. Interactive by default; pass --type, --scope and --subject to run without prompts.'
        )
        .version(packageVersion)
        .option('-c, --config <path>', 'specify custom config file path')
        .option(
            '--dry-run',
            'show commit message without executing git commands'
        )
        .option('-t, --type <type>', 'commit type (must exist in config)')
        .option('-s, --scope <scope>', 'commit scope (must exist in config)')
        .option('-m, --subject <text>', 'commit subject (header description)')
        .option(
            '-b, --body <text>',
            "commit body paragraph (repeatable, one paragraph each, joined by a blank line); use $'...' for real newlines",
            collect
        )
        .option(
            '--breaking <description>',
            'mark as breaking: adds "!" to the header and a BREAKING CHANGE footer'
        )
        .option(
            '--trailer <trailer>',
            'add a trailer footer, e.g. "Co-Authored-By: Name <email>" (repeatable)',
            collect
        )
        .helpOption('-h, --help', 'display help for command')
        .addHelpText(
            'after',
            `
Exit codes:
  ${EXIT_CODES.SUCCESS}    commit created (and pushed if auto_push), or dry run succeeded
  ${EXIT_CODES.FAILURE}    invalid/missing input or a git step failed (incl. nothing to commit)
  ${EXIT_CODES.CANCELLED}  interactive prompt cancelled

When stdin is not a TTY, --type, --scope and --subject are required.`
        )

    // Parse command line arguments
    program.parse()

    const cliOptions = CliOptionsSchema.safeParse(program.opts())
    if (!cliOptions.success) {
        printErrors(cliOptions.error.issues.map((issue) => issue.message))
        process.exitCode = EXIT_CODES.FAILURE
        return
    }

    try {
        const result = await commit(cliOptions.data)
        if (!result.success) {
            printErrors(result.errors)
            process.exitCode = result.exitCode
        }
    } catch (error) {
        console.error('An error occurred:', error)
        process.exitCode = EXIT_CODES.FAILURE
    }
}

// Always run main when this module is loaded as the entry point
// This works better with compiled binaries
main()

// Export for programmatic use
export { commit, EXIT_CODES, type CommitResult } from './commit'
export { buildCommitMessage, type CommitFields } from './utils/commit-message'
export {
    findMissingFields,
    validateCommitFields,
    validateTrailer,
} from './utils/commit-fields'
export * from './utils/schemas/config'
export * from './utils/schemas/options'
