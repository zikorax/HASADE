import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Dynamically import to avoid edge runtime issues in middleware
        const { prisma } = await import('@/lib/prisma')
        const bcrypt = (await import('bcryptjs')).default

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) return null

        return { id: user.id.toString(), email: user.email }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = parseInt(user.id as string)
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.userId
      return session
    },
  },
  pages: { signIn: '/login' },
})
