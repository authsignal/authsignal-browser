import {EnrollResponse} from "./shared";

export type EnrollTotpResponse = {
  uri: string;
  secret: string;
} & EnrollResponse;
