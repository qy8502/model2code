import {DelonAuthConfig, JWTInterceptor} from "@delon/auth";

export const ALLOW_ANONYMOUS_KEY = '_allow_anonymous';
export const ALLOW_ANONYMOUS: any = {};
ALLOW_ANONYMOUS[ALLOW_ANONYMOUS_KEY] = true;

export class JWTFixedInterceptor extends JWTInterceptor {

  intercept(req, next) {
    const options = {...new DelonAuthConfig(), ...this.injector.get(DelonAuthConfig, null)};
    if (!(req.headers.has('authorization') || req.headers.has('Authorization') || req.headers.has('AUTHORIZATION'))
      && options.allow_anonymous_key &&
      (req.params.has(options.allow_anonymous_key) ||
        new RegExp(`[\?|&]${options.allow_anonymous_key}=[^&]+`).test(req.urlWithParams))) {
      if (super.isAuth(options)) {
        req = super.setReq(req, options);
      }
    }
    return super.intercept(req, next);
  }
}
