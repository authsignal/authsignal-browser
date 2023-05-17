declare type CookieOptions = {
    name: string;
    value: string;
    expire: number;
    domain: string;
    secure: boolean;
};
export declare const setCookie: ({ name, value, expire, domain, secure }: CookieOptions) => void;
export declare const getCookieDomain: () => string;
export declare const getCookie: (name: string) => string | null;
export {};
