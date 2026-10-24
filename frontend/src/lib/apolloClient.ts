import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'
import { RetryLink } from '@apollo/client/link/retry'

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql',
})

const authLink = new SetContextLink((prevContext) => {
  const token = localStorage.getItem('token')
  return {
    headers: {
      ...prevContext.headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

// The API runs on Render's free tier, which sleeps when idle and can take up
// to a minute to wake. Retrying network failures with backoff lets the first
// visitor ride out the cold start instead of seeing an error.
const retryLink = new RetryLink({
  delay: { initial: 800, max: 8000, jitter: true },
  attempts: {
    max: 6,
    retryIf: (error, operation) => {
      // Never replay mutations — a retried createOrder could double-charge.
      const isQuery = operation.query.definitions.some(
        (d) => d.kind === 'OperationDefinition' && d.operation === 'query',
      )
      return isQuery && !!error
    },
  },
})

export const client = new ApolloClient({
  link: ApolloLink.from([retryLink, authLink, httpLink]),
  cache: new InMemoryCache(),
})
