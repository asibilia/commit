import { type CommitConfig } from '~/utils/schemas/config'

const config: CommitConfig = {
    types: [
        { value: 'feat', label: '✨ A new feature' },
        { value: 'fix', label: '🐛 A bug fix' },
        { value: 'docs', label: '📚 Documentation only changes' },
        {
            value: 'style',
            label: '💎 Changes that do not affect the meaning of the code',
        },
        {
            value: 'refactor',
            label: '📦 A code change that neither fixes a bug nor adds a feature',
        },
        { value: 'test', label: '🚨 Adding missing tests' },
        {
            value: 'chore',
            label: '♻️ Changes to the build process or auxiliary tools',
        },
    ],
    scopes: [
        { value: 'cli', label: 'Command line interface' },
        { value: 'config', label: 'Configuration handling' },
        { value: 'git', label: 'Git operations' },
        { value: 'core', label: 'Core functionality' },
        { value: 'version', label: 'Version Update' },
        { value: 'release', label: 'New Release' },
        { value: 'beta', label: 'Beta Release' },
        { value: 'alpha', label: 'Alpha Release' },
    ],
    git: {
        auto_add_all: true,
        auto_push: true,
    },
}

export default config
