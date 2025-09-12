import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET env var is required");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export type SessionClaims = JWTPayload & {
  sub: string; // userId
  email: string;
};

export async function signSession(claims: SessionClaims, expiresIn = "7d") {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifySession<T extends SessionClaims>(token: string) {
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  return payload as T;
}
