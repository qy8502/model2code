import {IStore, ITokenModel} from '@delon/auth';
import {CookieService} from 'ngx-cookie-service';

export class CookieStore implements IStore {
  domain: string;

  constructor(private cookieService: CookieService) {
    const hosts = window.location.hostname.split('.');
    if (hosts.length > 2) {
      hosts[0] = '';
    }
    this.domain = hosts.join('.');
  }

  get(key: string): ITokenModel {
    const token = this.cookieService.get(`${key}_token`);
    const refresh_token = this.cookieService.get(`${key}_refresh_token`);
    return token ? {token, refresh_token} : {} as ITokenModel;
  }

  set(key: string, value: ITokenModel): boolean {
    if (!value || !value.token) {
      this.remove(key);
      return true;
    }
    const expiresDay = Math.ceil(value.expires_in / 86400);
    this.cookieService.set(`${key}_token`, value.token, expiresDay, '/', this.domain);
    this.cookieService.set(`${key}_refresh_token`, value.refresh_token, expiresDay, '/', this.domain);
    return true;
  }

  remove(key: string): void {
    this.cookieService.delete(`${key}_token`, '/', this.domain);
    this.cookieService.delete(`${key}_refresh_token`, '/', this.domain);
  }
}
