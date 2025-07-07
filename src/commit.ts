import { select, text } from '@clack/prompts'
import chalk from 'chalk'

import {
    CommitConfigSchema,
    type GitConfig,
    type OptionConfig,
} from '~/utils/schemas/config'

export async function commit() {
    const commitConfiguration = await import('../commit.config.ts')
    const { success, data, error } =
        CommitConfigSchema.safeParse(commitConfiguration)

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

    if (git.auto_add_all) {
        // Add all changes
        const addProcess = Bun.spawn(['git', 'add', '.'])
        await addProcess.exited
    }

    // Execute git commit command
    const commitProcess = Bun.spawn(['git', 'commit', '-m', commitMessage])
    const output = await new Response(commitProcess.stdout).text()
    await commitProcess.exited

    if (commitProcess.exitCode === 0) {
        console.log('\n' + chalk.green('✓ Successfully committed changes'))
        console.log(chalk.green('└─ ') + chalk.dim.yellow(output.trim()))
    } else {
        console.error('\n' + chalk.red('✗ Failed to commit changes'))
        const errorOutput = await new Response(commitProcess.stderr).text()
        console.error(chalk.red('└─ ') + chalk.dim(errorOutput.trim()))
    }

    if (git.auto_push) {
        const pushProcess = Bun.spawn(['git', 'push'])
        await pushProcess.exited

        if (pushProcess.exitCode === 0) {
            console.log('\n' + chalk.green('✓ Successfully pushed changes'))
        } else {
            console.error('\n' + chalk.red('✗ Failed to push changes'))
        }
    }
}
