import {createEnumArray, createEnumMap, EnumItem} from "@shared/shared.model";

export const UserPermission: { [key: string]: EnumItem } = {

  USER_ADD: {
    value: 'USER#ADD', label: '添加用户'
  },
  USER_EDIT: {
    value: 'USER#EDIT', label: '编辑用户'
  },
  USER_SET_BASE_ROLE_LIST: {
    value: 'USER#SET_BASE_ROLE_LIST', label: '设置用户的基础角色列表'
  },
  USER_DELETE: {
    value: 'USER#DELETE', label: '删除用户'
  },
  USER_VIEW: {
    value: 'USER#VIEW', label: '查看用户详情'
  },
  USER_SEARCH: {
    value: 'USER#SEARCH', label: '查询浏览用户列表'
  },
  BASE_ROLE_ADD: {
    value: 'BASE_ROLE#ADD', label: '添加基础角色'
  },
  BASE_ROLE_EDIT: {
    value: 'BASE_ROLE#EDIT', label: '编辑基础角色'
  },
  BASE_ROLE_SET_USER_LIST: {
    value: 'BASE_ROLE#SET_USER_LIST', label: '设置基础角色的用户列表'
  },
  BASE_ROLE_DELETE: {
    value: 'BASE_ROLE#DELETE', label: '删除基础角色'
  },
  BASE_ROLE_VIEW: {
    value: 'BASE_ROLE#VIEW', label: '查看基础角色详情'
  },
  BASE_ROLE_SEARCH: {
    value: 'BASE_ROLE#SEARCH', label: '查询浏览基础角色列表'
  },
  USER_BASE_ROLE_ADD: {
    value: 'USER_BASE_ROLE#ADD', label: '添加用户与基础角色关系'
  },
  USER_BASE_ROLE_DELETE: {
    value: 'USER_BASE_ROLE#DELETE', label: '删除用户与基础角色关系'
  },
  USER_BASE_ROLE_VIEW: {
    value: 'USER_BASE_ROLE#VIEW', label: '查看用户与基础角色关系详情'
  }
};

export const UserPermissionMap: { [key: string]: EnumItem } = createEnumMap(UserPermission);

export const UserPermissionList: EnumItem[] = createEnumArray(UserPermission);
