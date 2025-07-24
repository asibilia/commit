import { resolve } from 'path'

import { select, text } from '@clack/prompts'
import chalk from 'chalk'

import {
    CommitConfigSchema,
    type GitConfig,
    type OptionConfig,
} from '~/utils/schemas/config'

interface CommitOptions {
    configPath?: string
    dryRun?: boolean
}

export async function commit(options: CommitOptions = {}) {
    // Use provided config path or default to project root
    const configPath = options.configPath
        ? resolve(options.configPath)
        : resolve(process.cwd(), 'commit.config.ts')

    let commitConfiguration
    try {
        commitConfiguration = await import(configPath)
    } catch (e) {
        if (options.configPath) {
            console.log(
                chalk.yellow(`✗ Config file not found: ${options.configPath}`)
            )
        } else {
            console.log(chalk.yellow('✗ No config file found'))
        }
        commitConfiguration = {}
    }

    const { success, data, error } = CommitConfigSchema.safeParse(
        commitConfiguration.default || commitConfiguration
    )

    let types: OptionConfig[] = []
    let scopes: OptionConfig[] = []
    let git: GitConfig = {}

    if (success) {
        console.log(chalk.green('✓ Successfully parsed config'))

        types = data.types
        scopes = data.scopes
        git = data.git
    } else {
        console.error(chalk.red('✗ Failed to parse config'))
        console.error(chalk.red('└─ ') + chalk.dim(error?.message))

        const defaultConfig = CommitConfigSchema.parse({})
        types = defaultConfig.types
        scopes = defaultConfig.scopes
        git = defaultConfig.git
    }

    const type = (await select({
        message: 'Select the type of change',
        options: types,
    })) as string

    const scope = (await select({
        message: 'Select the scope',
        options: scopes,
    })) as string

    const message = (await text({
        message: 'Enter your commit message',
        validate: (value) => {
            if (!value) return 'Please enter a commit message'
            return undefined
        },
    })) as string

    const commitMessage = `${type}(${scope}): ${message}`

    // Show commit message preview
    console.log('\n' + chalk.blue('📝 Commit message:'))
    console.log(chalk.blue('└─ ') + chalk.dim.yellow(commitMessage))

    // If dry-run mode, just show the message and exit
    if (options.dryRun) {
        console.log(
            '\n' + chalk.green('✓ Dry run completed - no git commands executed')
        )
        return
    }

    if (git.auto_add_all) {
        console.log('\n' + chalk.blue('📦 Adding all changes...'))
        // Add all changes
        const addProcess = Bun.spawn(['git', 'add', '.'])
        await addProcess.exited

        if (addProcess.exitCode === 0) {
            console.log(chalk.green('✓ Successfully added all changes'))
        } else {
            console.error(chalk.red('✗ Failed to add changes'))
            const errorOutput = await new Response(addProcess.stderr).text()
            console.error(chalk.red('└─ ') + chalk.dim(errorOutput.trim()))
            return
        }
    }

    // Execute git commit command
    console.log('\n' + chalk.blue('💾 Committing changes...'))
    const commitProcess = Bun.spawn(['git', 'commit', '-m', commitMessage])
    const output = await new Response(commitProcess.stdout).text()
    await commitProcess.exited

    if (commitProcess.exitCode === 0) {
        console.log(chalk.green('✓ Successfully committed changes'))
        console.log(chalk.green('└─ ') + chalk.dim.yellow(output.trim()))
    } else {
        console.error(chalk.red('✗ Failed to commit changes'))
        const errorOutput = await new Response(commitProcess.stderr).text()
        console.error(chalk.red('└─ ') + chalk.dim(errorOutput.trim()))
        return
    }

    if (git.auto_push) {
        console.log('\n' + chalk.blue('🚀 Pushing changes...'))
        const pushProcess = Bun.spawn(['git', 'push'])
        await pushProcess.exited

        if (pushProcess.exitCode === 0) {
            console.log(chalk.green('✓ Successfully pushed changes'))
        } else {
            console.error(chalk.red('✗ Failed to push changes'))
            const errorOutput = await new Response(pushProcess.stderr).text()
            console.error(chalk.red('└─ ') + chalk.dim(errorOutput.trim()))
        }
    }
}
