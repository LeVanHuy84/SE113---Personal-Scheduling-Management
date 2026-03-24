export interface JwtPayload {
  sub: string;
  email: string;
}

export interface VerificationJwtPayload {
  sub: string;
  type: 'verification';
}
