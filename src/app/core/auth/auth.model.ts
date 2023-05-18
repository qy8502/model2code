import {JWTTokenModel} from "@delon/auth";
import {isArray} from "util";


export function verifyAuthority(ownedAuthority: string, checkAuthority: string): boolean {
  // 权限可以由":"拆分成多段，逐段验证，一般情况权限格式为"功能权限:数据权限类型（属性）:数据值"或者"功能权限"或者"ROLE_角色"
  const ownedAuthoritySplit: string[] = ownedAuthority.split(":");
  const checkAuthoritySplit: string[] = checkAuthority.split(":");
  if (ownedAuthoritySplit.length < checkAuthoritySplit.length) {
    // "管理员"权限不能通过"管理员:区域:/山东/济南/"验证要求
    return false;
  }
  for (let i = 0; i < checkAuthoritySplit.length; i++) {
    // 具备比验证要求严格的权限可以通过，如："管理人员:区域:/山东/济南/"权限能通过"管理人员"验证要求
    if (checkAuthoritySplit[i] === ownedAuthoritySplit[i]) {
      // 与验证要求完全一致的权限可以通过，如：
      // "管理人员"权限能通过"管理人员"验证要求；
      // "管理人员:区域:/山东/济南/"权限能通过"管理人员:区域:/山东/济南/"验证要求 ；
      continue;
    }
    if (ownedAuthoritySplit[i] === "*") {
      // 是通配符的权限，可以通过验证
      // "管理人员:区域:*"权限能通过"管理人员:区域:/山东/济南/"验证要求
      continue;
    }
    if (checkAuthoritySplit[i].startsWith("*") &&
      checkAuthoritySplit[i].substring(1).startsWith(ownedAuthoritySplit[i])) {
      // 以通配符开始的验证要求是模糊匹配，具备范围大于其要求的权限，可以通过验证
      // "管理人员:区域:/山东/济南/"权限能通过"管理人员:区域:*/山东/济南/市中区/"验证要求
      continue;
    }
    // 其他情况不通过验证。
    return false;
  }
  return true;
}


export class AuthRequest {
  constructor(public username?: string,
              public password?: string) {
  }

  grant_type? = 'password';

}


export class AuthVerificationCodeRequest {
  constructor(public username?: string,
              public code?: string,
              public passwordReplacement?: string) {
  }

  grant_type ? = 'verification_code';

}

export class AuthAttemptCodeRequest {
  constructor(public code?: string) {
  }

  grant_type ? = 'attempt_code';

}

export class AuthSocialRequest {
  constructor(public provider?: string,
              public redirectUri?: string,
              public code?: string) {
  }

  grant_type ? = `social_${this.provider}`;

}


export const TOKEN_REFRESH_TOKEN = "refresh_token";
export const TOKEN_USER_ID = "user_id";
export const TOKEN_USER_NAME = "user_name";
export const TOKEN_USER_AVATAR = "user_avatar";
export const TOKEN_AUTHORITIES = "authorities";

export class AccessToken extends JWTTokenModel {

  constructor(data?: any) {
    super();
    // noinspection TypeScriptValidateTypes
    Object.assign(this, data);
  }

  token: string;

  get access_token(): string {
    return this.token;
  };

  set access_token(value: string) {
    this.token = value;
  };

  expires_in: number;
  refresh_token: string;
  token_type: string;

  [key: string]: any;
}

export const ROLE_PREFIX = "ROLE_"

export class UserDetailDTO {
  constructor(data?: any) {
    if (isArray(data.authorities)) {
      data.authorities = data.authorities.map((item: any) => item.authority ? item.authority : item);
    }
    // noinspection TypeScriptValidateTypes
    Object.assign(this, data);
  }

  enabled?: boolean;
  avatar: string;
  id: string;
  name: string;
  authorities: string[];

  get rolesText(): string {
    const text = "";
    // if (this.roles || this.roles.length) {
    //   text = this.roles.map((role) => role.name).join(' , ');
    // }
    return text;
  }

}
