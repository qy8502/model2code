import {formatDateTime, SearchParam} from "@shared/shared.model";

/**
 * 用户实体
 */
export class UserDTO {

  constructor(data?: any) {
    // noinspection TypeScriptValidateTypes
    Object.assign(this, data);
    if (this.createdTime) {
      this.createdTime = new Date(this.createdTime);
    }
    if (this.updatedTime) {
      this.updatedTime = new Date(this.updatedTime);
    }
  }


  /**
   * 编号
   */
  id: string;

  /**
   * 姓名
   */
  name: string;

  /**
   * 用户名
   */
  userName: string;

  /**
   * 密码
   */
  password: string;

  /**
   * 头像地址
   */
  avatarUrl: string;

  avatar?: string;

  /**
   * 邮箱
   */
  email: string;

  /**
   * 邮箱是否验证
   */
  emailAuthed: boolean;

  /**
   * 手机号码
   */
  phone: string;

  /**
   * 手机号码是否验证
   */
  phoneAuthed: boolean;

  /**
   * GithubID
   */
  github: string;

  /**
   * 微信
   */
  weixin: string;
  /**
   * 创建时间
   */
  createdTime: Date;

  /**
   * 创建时间（格式化字符）
   */
  get createdTimeText(): string {
    return formatDateTime(this.createdTime);
  }

  /**
   * 创建者
   */
  creator: string;

  /**
   * 更新时间
   */
  updatedTime: Date;

  /**
   * 更新时间（格式化字符）
   */
  get updatedTimeText(): string {
    return formatDateTime(this.updatedTime);
  }

  /**
   * 更新者
   */
  updater: string;

  /**
   * 是否可用
   */
  available: boolean;

  verificationCode: number;
}


/**
 * 用户分页搜索参数
 */
export class UserSearchParam extends SearchParam {

  constructor(data?: any) {
    super();
    // noinspection TypeScriptValidateTypes
    Object.assign(this, data);
  }

  /**
   * 姓名
   */
  name?: string;

  /**
   * 用户名
   */
  userName?: string;


}

/**
 * 基础角色实体
 */
export class BaseRoleDTO {

  constructor(data?: any) {
    // noinspection TypeScriptValidateTypes
    Object.assign(this, data);
  }


  /**
   * 编号
   */
  id: string;

  /**
   * 名称
   */
  name: string;


}


/**
 * 基础角色分页搜索参数
 */
export class BaseRoleSearchParam extends SearchParam {

  constructor(data?: any) {
    super();
    // noinspection TypeScriptValidateTypes
    Object.assign(this, data);
  }


}

/**
 * 用户与基础角色关系实体
 */
export class UserBaseRoleDTO {

  constructor(data?: any) {
    // noinspection TypeScriptValidateTypes
    Object.assign(this, data);
  }


  /**
   * 用户编号
   */
  userId: string;

  /**
   * 基础角色编号
   */
  baseRoleId: string;

  toValue(): string {
    return this.userId && this.baseRoleId ? JSON.stringify({
      userId: this.userId,
      baseRoleId: this.baseRoleId
    }) : null;
  }


}
