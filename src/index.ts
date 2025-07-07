#!/usr/bin/env bun

import { readFileSync } from 'fs'
import { resolve } from 'path'

import { Command } from 'commander'

import { commit } from './commit'

// Read package.json for version
const packagePath = resolve(import.meta.dir, '../package.json')
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

const program = new Command()

program
    .name('commit')
    .description(
        'Interactive CLI tool for creating standardized commit messages with customizable types and scopes'
    )
    .version(packageJson.version)
    .option('-c, --config <path>', 'specify custom config file path')
    .option('--dry-run', 'show commit message without executing git commands')
    .helpOption('-h, --help', 'display help for command')

// Parse command line arguments
program.parse()

const options = program.opts()

// Handle CLI execution
async function main() {
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

// Only run if this file is executed directly
if (import.meta.main) {
    main()
}

// Export for programmatic use
export { commit } from './commit'
export * from './utils/schemas/config'
