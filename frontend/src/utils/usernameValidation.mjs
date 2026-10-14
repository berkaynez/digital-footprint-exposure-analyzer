export const MAX_USERNAME_LENGTH = 255

export function getUsernameLengthError(username) {
  if (username.length > MAX_USERNAME_LENGTH) {
    return `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.`
  }

  return ''
}
