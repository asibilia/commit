#!/usr/bin/env node

import { resolve } from 'path'

import { Command } from 'commander'

import { commit } from './commit'

// Handle CLI execution
async function main() {
    // Read version dynamically using Bun.file()
    let packageVersion = '1.0.3' // fallback version
    try {
        const packagePath = resolve(import.meta.dir, '../package.json')
        const packageFile = Bun.file(packagePath)
        const packageJson = await packageFile.json()
        packageVersion = packageJson.version
    } catch (error) {
        // Fallback for compiled binaries where package.json might not be accessible
        // This is expected behavior for compiled binaries, so no warning needed
    }

    const program = new Command()

    program
        .name('commit')
        .description(
            'Interactive CLI tool for creating standardized commit messages with customizable types and scopes'
        )
        .version(packageVersion)
        .option('-c, --config <path>', 'specify custom config file path')
        .option(
            '--dry-run',
            'show commit message without executing git commands'
        )
        .helpOption('-h, --help', 'display help for command')

    // Parse command line arguments
    program.parse()

    const options = program.opts()

    try {
        await commit({
            configPath: options.config,
            dryRun: options.dryRun,
        })
    } catch (error) {
        console.error('An error occurred:', error)
        process.exit(1)
    }
}

// Always run main when this module is loaded as the entry point
// This works better with compiled binaries
main()

// Export for programmatic use
export { commit } from './commit'
export * from './utils/schemas/config'
