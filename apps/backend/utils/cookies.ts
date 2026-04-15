import '@fastify/cookie'
import type { FastifyReply } from 'fastify'

export const ACCESS_TTL = '10m'
export const REFRESH_DAYS = 30

interface IAuthTokens {
  accessToken: string
  refreshToken: string
}

export function refreshExpiryDate() {
  const d = new Date()
  d.setDate(d.getDate() + REFRESH_DAYS)
  return d
}

export function setAuthCookies(reply: FastifyReply, { accessToken, refreshToken }: IAuthTokens) {
  const isProd = process.env.NODE_ENV === 'production'

  reply.setCookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  })

  reply.setCookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/auth/refresh', // important: refresh only sent here
  })
}
