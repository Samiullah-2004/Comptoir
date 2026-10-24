import { CombinedGraphQLErrors } from '@apollo/client/errors'

// Turn an Apollo error into one short sentence that's safe to show users.
export function friendlyError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors[0]?.message || fallback
  }
  if (error instanceof Error) {
    if (/fetch|network|load failed/i.test(error.message)) {
      return "We couldn't reach the kitchen. Check your connection and try again."
    }
    return error.message || fallback
  }
  return fallback
}

export function isServiceUnavailable(error: unknown) {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.some((e) => e.extensions?.code === 'SERVICE_UNAVAILABLE')
  }
  return error instanceof Error && /fetch|network|load failed/i.test(error.message)
}
