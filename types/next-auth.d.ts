import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    groups?: string[]
  }

  interface Session {
    user: {
      id: string
      groups?: string[]
    } & DefaultSession['user']
  }
}