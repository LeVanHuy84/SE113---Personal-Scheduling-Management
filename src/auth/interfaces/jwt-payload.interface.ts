export interface JwtPayload {
  sub: string;
  email: string;
}

export interface VerificationJwtPayload {
  sub: string;
  type: 'verification';
}

export interface ResetJwtPayload {
  sub: string;
  type: 'reset';
}
