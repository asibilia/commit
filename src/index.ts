#!/usr/bin/env bun

import { commit } from './commit'

// Handle CLI execution
async function main() {
    try {
        await commit()
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
