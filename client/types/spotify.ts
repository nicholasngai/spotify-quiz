export type TokenBundle = {
  accessToken: string;
  issueTime: Date;
  expirySeconds: number;
  refreshToken: string;
};

export function validateTokenBundle(obj: unknown): obj is TokenBundle {
  return (
    typeof obj === 'object' &&
    obj != null &&
    'accessToken' in obj &&
    typeof obj.accessToken === 'string' &&
    'issueTime' in obj &&
    obj.issueTime instanceof Date &&
    'expirySeconds' in obj &&
    typeof obj.expirySeconds === 'number' &&
    'refreshToken' in obj &&
    typeof obj.refreshToken === 'string'
  );
}
