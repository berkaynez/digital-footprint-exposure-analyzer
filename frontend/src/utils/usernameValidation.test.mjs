import assert from 'node:assert/strict'
import test from 'node:test'

import { MAX_USERNAME_LENGTH, getUsernameLengthError } from './usernameValidation.mjs'

test('accepts usernames at the global safety limit', () => {
  assert.equal(getUsernameLengthError('a'.repeat(MAX_USERNAME_LENGTH)), '')
})

test('shows a clear error for usernames above the global safety limit', () => {
  assert.equal(
    getUsernameLengthError('a'.repeat(MAX_USERNAME_LENGTH + 1)),
    `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.`,
  )
})

test('validates the trimmed username length used by the API', () => {
  assert.equal(getUsernameLengthError(` ${'a'.repeat(MAX_USERNAME_LENGTH)} `.trim()), '')
  assert.equal(
    getUsernameLengthError(` ${'a'.repeat(MAX_USERNAME_LENGTH + 1)} `.trim()),
    `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.`,
  )
})
