import { SignJWT } from 'jose'

export async function generateToken(payload: { userId: number; roleId: number }, secret: string, expiresIn: string): Promise<string> {
  const secretKey = new TextEncoder().encode(secret)
  return new SignJWT({ userId: payload.userId, roleId: payload.roleId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey)
}

export function hasPermission(permissions: string[], requiredPermission: string): boolean {
  if (permissions.includes('system:manage')) return true
  return permissions.includes(requiredPermission)
}
