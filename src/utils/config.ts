import { resolve } from 'path'

import chalk from 'chalk'

import { CommitConfigSchema } from './schemas/config'

/**
 * Parsed commit configuration with schema defaults applied.
 */
export type ResolvedCommitConfig = ReturnType<typeof CommitConfigSchema.parse>

/**
 * Loads and parses `commit.config.ts` (or the file at `configPath`).
 *
 * Falls back to the schema defaults, with a warning on stderr, when the file
 * cannot be imported or fails validation. This matches the CLI's historical
 * behaviour.
 *
 * @param configPath - Optional path to the config file. Defaults to
 *   `commit.config.ts` in `process.cwd()`
 * @returns The parsed configuration
 */
export async function loadCommitConfig(
    configPath?: string
): Promise<ResolvedCommitConfig> {
    const resolvedPath = configPath
        ? resolve(configPath)
        : resolve(process.cwd(), 'commit.config.ts')

    let rawConfig: Record<string, unknown> = {}
    try {
        rawConfig = await import(resolvedPath)
    } catch {
        console.warn(
            chalk.yellow(
                configPath
                    ? `✗ Config file not found: ${configPath}`
                    : '✗ No config file found'
            )
        )
    }

    const result = CommitConfigSchema.safeParse(rawConfig.default ?? rawConfig)

    if (result.success) {
        console.log(chalk.green('✓ Successfully parsed config'))
        return result.data
    }

    console.error(chalk.red('✗ Failed to parse config'))
    console.error(chalk.red('└─ ') + chalk.dim(result.error.message))
    return CommitConfigSchema.parse({})
}
