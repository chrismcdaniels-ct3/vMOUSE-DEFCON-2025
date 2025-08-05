import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { CognitoIdentityProviderClient, InitiateAuthCommand, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider'

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1'
})

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Cognito',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          // Authenticate with Cognito
          const authCommand = new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: process.env.COGNITO_CLIENT_ID!,
            AuthParameters: {
              USERNAME: credentials.username,
              PASSWORD: credentials.password
            }
          })

          const authResponse = await cognitoClient.send(authCommand)
          
          if (!authResponse.AuthenticationResult?.AccessToken) {
            return null
          }

          // Get user info and groups
          const getUserCommand = new GetUserCommand({
            AccessToken: authResponse.AuthenticationResult.AccessToken
          })
          
          const userResponse = await cognitoClient.send(getUserCommand)
          
          // Check if user is in admins group
          const groups = userResponse.UserAttributes?.find(
            attr => attr.Name === 'cognito:groups'
          )?.Value?.split(',') || []
          
          if (!groups.includes('admins')) {
            console.log('User not in admins group')
            return null
          }

          return {
            id: userResponse.Username!,
            email: userResponse.UserAttributes?.find(attr => attr.Name === 'email')?.Value || '',
            name: userResponse.Username!,
            groups: groups
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.groups = user.groups
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.groups = token.groups as string[]
      }
      return session
    }
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60 // 30 minutes
  }
}