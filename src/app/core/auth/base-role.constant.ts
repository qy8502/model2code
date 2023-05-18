import {createEnumArray, createEnumMap, EnumItem} from "@shared/shared.model";

export const BaseRole: { [key: string]: EnumItem } = {
  USER: {
    value: "USER", label: '注册用户'
  },
  SYSTEM: {
    value: 'SYSTEM', label: '系统管理员'
  }

};

export const BaseRoleMap: { [key: string]: EnumItem } = createEnumMap(BaseRole);

export const BaseRoleList: EnumItem[] = createEnumArray(BaseRole);


    