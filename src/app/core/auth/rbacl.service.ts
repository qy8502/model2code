import {ACLService, DelonACLConfig} from "@delon/acl";
import {Injectable} from "@angular/core";
import {ROLE_PREFIX, verifyAuthority} from "@core/auth/auth.model";
import {ACLCanType, ACLType} from "@delon/acl/src/acl.type";


@Injectable()
export class RBACLService extends ACLService {
  _options: DelonACLConfig;


  constructor(options: DelonACLConfig) {
    super(options);
    this._options = options;
  }

  add(value: ACLType) {
    if (value.role && value.role.length > 0) {
      value = this.parseRole(value.role);
    }
    super.add(value);
  }

  /**
   * 为当前用户附加角色
   */
  attachRole(roles: string[]) {
    super.attachRole(this.parseRole(roles).role);
  }

  parseRole(value: ACLCanType): ACLType {
    if (typeof value === 'number' || typeof value === 'string' || Array.isArray(value)) {
      value = {role: (Array.isArray(value) ? value : [value]) as string[]};
    }
    if (value.role && value.role.length > 0) {
      value.role = value.role.map((item) => item.indexOf(ROLE_PREFIX) === 0 ? item : ROLE_PREFIX + item);
    }
    return value;
  }

  _parseACLType(val: ACLCanType | null): ACLType {
    let t;
    if (Array.isArray(val)) {
      t = {role: [], ability: []};
      (val as any[]).forEach(item =>
        typeof item === 'number' || (typeof item === 'string' && item.indexOf(ROLE_PREFIX) !== 0) ?
          t.ability.push(item) : t.role.push(item)
      );
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      t = {...val};
    } else if (typeof val === 'number' || (typeof val === 'string' && val.indexOf(ROLE_PREFIX) !== 0)) {
      t = {ability: [val]};
    } else {
      t = {role: val == null ? [] : [val]};
    }
    return {except: false, ...t};
  }


  /**
   * 当前用户是否有对应角色，其实 `number` 表示Ability
   */
  can(roleOrAbility: ACLCanType | null) {
    const {preCan} = this._options;
    if (preCan) {
      roleOrAbility = preCan(roleOrAbility);
    }

    const t = this._parseACLType(roleOrAbility);
    let result = false;
    if (this.data.full === true || !roleOrAbility) {
      result = true;
    } else {
      const checkAuthorities = [...t.role ? this.parseRole(t).role : [], ...t.ability ? t.ability : []];
      const authorities = [...super.data.roles ? super.data.roles : [], ...super.data.abilities ? super.data.abilities : []];

      result = t.mode === 'allOf' ?
        checkAuthorities.every(ca => authorities.some(a => verifyAuthority(a.toString(), ca.toString()))) :
        checkAuthorities.some(ca => authorities.some(a => verifyAuthority(a.toString(), ca.toString())));

    }
    return t.except === true ? !result : result;
  }

}
