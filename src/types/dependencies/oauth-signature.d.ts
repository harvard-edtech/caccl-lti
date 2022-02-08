/**
 * Manually define types for oauth-signature
 * @author Gabe Abrams
 */
declare module 'oauth-signature' {
  class oauth {
    static generate: (
      method: string,
      url: string,
      body: any,
      consumer_secret: string,
    ) => string;
  }

  export = oauth;
}
