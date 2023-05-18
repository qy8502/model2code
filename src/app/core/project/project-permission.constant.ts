import {createEnumArray, createEnumMap, EnumItem} from "@shared/shared.model";

export const ProjectPermission: { [key: string]: EnumItem } = {

  PROJECT_ADD: {
    value: 'PROJECT#ADD', label: '添加项目'
  },
  PROJECT_EDIT: {
    value: 'PROJECT#EDIT', label: '编辑项目'
  },
  PROJECT_SET_USER_LIST: {
    value: 'PROJECT#SET_USER_LIST', label: '设置项目的用户列表'
  },
  PROJECT_DELETE: {
    value: 'PROJECT#DELETE', label: '删除项目'
  },
  PROJECT_VIEW: {
    value: 'PROJECT#VIEW', label: '查看项目详情'
  },
  PROJECT_SEARCH: {
    value: 'PROJECT#SEARCH', label: '查询浏览项目列表'
  },
  PROJECT_USER_ADD: {
    value: 'PROJECT_USER#ADD', label: '添加项目用户'
  },
  PROJECT_USER_DELETE: {
    value: 'PROJECT_USER#DELETE', label: '删除项目用户'
  },
  PROJECT_USER_VIEW: {
    value: 'PROJECT_USER#VIEW', label: '查看项目用户详情'
  }
};

export const ProjectPermissionMap: { [key: string]: EnumItem } = createEnumMap(ProjectPermission);

export const ProjectPermissionList: EnumItem[] = createEnumArray(ProjectPermission);
