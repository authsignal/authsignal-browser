export type EnrollTotpResponse = {
  userAuthenticatorId: string;
  userId: string;
  uri: string;
  secret: string;
};
