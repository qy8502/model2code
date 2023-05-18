import {createEnumArray, createEnumMap, EnumItem} from "@shared/shared";
import {nameToColor, nameToLightColor, toAbbrLower, toCamel, toLowerLine, toUpperUnderline} from "./name.helper";

export class Field {
  name: string;
  comment: string;
  type: string;
  typeData: any;
  required: boolean;
  pk: boolean;
  nn: boolean;
  search: boolean;
  dbType: string;
  dbDefault: string;

  get nameCamel() {
    return toCamel(this.name);
  }
}

export class Model {
  name: string;

  table?: string;
  comment: string;
  fields: Field[] = [];
  module?: string;
  enum?: boolean;
  enumType?: 'number' | 'string';
  enumItems?: EnumItem[];


  // set color(value: string) {
  // }

  get color(): string {
    return nameToColor(this.name);
  }

  get enumJavaType() {
    return this.enumType === 'number' ? 'Integer' : 'String';
  }

  get nameCamel(): string {
    return toCamel(this.name);
  }

  get nameLowerLine(): string {
    return toLowerLine(this.name);
  }

  get nameConstant(): string {
    return toUpperUnderline(this.name);
  }

  get nameAbbrLower(): string {
    return toAbbrLower(this.name);
  }

  get tableName(): string {
    return this.table || toCamel(this.name);
  }

  get moduleName(): string {
    return (this.module || this.name);

  }

  get modulePackage(): string {
    return this.moduleName.toLowerCase();

  }
}

export class Module {
  name: string;
  comment: string;

  get package() {
    return (this.name).toLowerCase();
  }

  get color(): string {
    return nameToLightColor(this.name);
  }

  get nameCamel(): string {
    return toCamel(this.name);
  }

  get nameLowerLine(): string {
    return toLowerLine(this.name);
  }
}

export class Project {
  name: string;
  author?: string;

  get authorName() {
    return this.author || 'model2code';
  }

  comment: string;
  package: string;
  domain: string;
  models: Model[];
  modules: Module[];
  packageCommon: string;

  modelMap?: { [key: string]: Model };
  moduleMap?: { [key: string]: { module: Module, models: Model[] } };

  modelErrorMap?: { [modelName: string]: { [fieldName: string]: ModelError } };

  // _modelMap?: { [key: string]: Model };
  // get modelMap(): { [key: string]: Model } {
  //   if (!this._modelMap) {
  //     this._modelMap = convertModelsToMap(this.models);
  //   }
  //   return this._modelMap;
  // }

  // get modelMap(): { [key: string]: Model } {
  //   return convertModelsToMap(this.models);
  // }

  // _moduleMap?: { [key: string]: { module: Module, models: Model[] } };
  // get moduleMap(): { [key: string]: { module: Module, models: Model[] } } {
  //   if (!this._moduleMap) {
  //     this._moduleMap = convertModulesToMap(this.modules, this.models);
  //   }
  //   return this._moduleMap;
  // }


  // get moduleMap(): { [key: string]: { module: Module, models: Model[] } } {
  //   return convertModulesToMap(this.modules, this.models);
  // }

  get nameDirectory(): string {
    return toLowerLine(this.name);
  }

  get packageDirectory() {
    return this.package.replace(/\./g, "/");
  }
}

export interface FieldType extends EnumItem {
  desc?: string;
  dbType?: string;
  javaType?: string;
  tsType?: string;
  dbDefault?: string;
  sfSchemaType?: string;
  stSchemaType?: string;
}

export const FieldTypeEnum = {
  UUID: {
    value: "uuid", label: 'UUID', desc: '24位UUID的文本类型，适用于系统生成ID',
    javaType: 'String', javaDefault: '""', dbType: 'VARCHAR(24)', dbDefault: "''", tsType: 'string'
  },

  TEXT_NAME: {
    value: 'text_name', label: '名称文本', desc: '100字符内的文本类型，适用于名称等',
    javaType: 'String', javaDefault: '""', dbType: 'VARCHAR(100)', dbDefault: "''", tsType: 'string'
  },

  TEXT_TITLE: {
    value: 'text_title', label: '标题文本', desc: '200字符内的文本类型，适用于标题等',
    javaType: 'String', javaDefault: '""', dbType: 'VARCHAR(200)', dbDefault: "''", tsType: 'string'
  },

  TEXT_SUMMARY: {
    value: 'text_summary', label: '摘要文本', desc: '500字符内的文本类型，适用于摘要等',
    javaType: 'String', javaDefault: '""', dbType: 'VARCHAR(500)', dbDefault: "''", tsType: 'string'
  },

  TEXT_CONTENT: {
    value: 'text_content', label: '内容文本', desc: '大量内容的文本类型，适用于正文等',
    javaType: 'String', javaDefault: '""', dbType: 'LONGTEXT', dbDefault: "", tsType: 'string'
  },

  BOOLEAN: {
    value: 'boolean',
    label: '布尔',
    desc: '布尔类型',
    javaType: 'Boolean', javaDefault: 'false',
    dbType: 'INT(1)',
    dbDefault: "'0'",
    tsType: 'boolean',
    sfSchemaType: 'boolean',
    stSchemaType: 'yn'
  },

  INT: {
    value: 'int',
    label: '整型数字',
    desc: '整型数字类型，适用于年度、月份、整数评分等',
    javaType: 'Integer', javaDefault: '0',
    dbType: 'INT(4)',
    dbDefault: "'0'",
    tsType: 'number',
    sfSchemaType: 'number',
    stSchemaType: 'number'
  },

  LONG: {
    value: 'long',
    label: '长整型数字',
    desc: '长整型数字类型，适用于年度、月份、整数评分等',
    javaType: 'Long', javaDefault: '0L',
    dbType: 'BIGINT(20)',
    dbDefault: "'0'",
    tsType: 'number',
    sfSchemaType: 'number',
    stSchemaType: 'number'
  },

  DECIMAL: {
    value: 'decimal',
    label: '小数数字',
    desc: '小数数字（保留2位小数）类型，适用于金额、小数评分等',
    javaType: 'BigDecimal', javaDefault: 'BigDecimal.ZERO',
    dbType: 'DECIMAL(10,2)',
    dbDefault: "'0.00'",
    tsType: 'number',
    sfSchemaType: 'number',
    stSchemaType: 'currency'
  },

  DATE: {
    value: 'date',
    label: '日期',
    desc: '日期类型，精确到天',
    javaType: 'Date', javaDefault: 'new Date()',
    dbType: 'TIMESTAMP',
    dbDefault: "CURRENT_TIMESTAMP",
    tsType: 'Date',
    sfSchemaType: 'number',
    stSchemaType: 'date'
  },

  DATE_RANGE: {
    value: 'date_range',
    label: '日期范围',
    desc: '日期类型，精确到天，字段名称必须以StartDate或EndDate结尾，并且成对出现',
    javaType: 'Date', javaDefault: 'new Date()',
    dbType: 'TIMESTAMP',
    dbDefault: "CURRENT_TIMESTAMP",
    tsType: 'Date',
    sfSchemaType: 'number',
    stSchemaType: 'date'
  },

  TIME: {
    value: 'time',
    label: '时间',
    desc: '时间类型，精确到分钟',
    javaType: 'Date', javaDefault: 'new Date()',
    dbType: 'TIMESTAMP',
    dbDefault: "CURRENT_TIMESTAMP",
    tsType: 'Date',
    sfSchemaType: 'number',
    stSchemaType: 'date'
  },

  TIME_RANGE: {
    value: 'time_range',
    label: '时间范围',
    desc: '时间类型，精确到分钟，字段名称必须以StartTime或EndTime结尾，并且成对出现',
    javaType: 'Date', javaDefault: 'new Date()',
    dbType: 'TIMESTAMP',
    dbDefault: "CURRENT_TIMESTAMP",
    tsType: 'Date',
    sfSchemaType: 'number',
    stSchemaType: 'date'
  },

  IMAGE: {
    value: 'image',
    label: '图片',
    desc: '图片类型，存储路径信息',
    javaType: 'String',
    javaDefault: '""',
    dbType: 'VARCHAR(200)',
    dbDefault: "''",
    tsType: 'string',
    stSchemaType: 'img'
  },

  OBJECT: {
    value: 'object', label: '对象', desc: '对象类型，JSON数据存储，适用于配置信息等',
    javaType: 'String', dbType: 'JSON', dbDefault: "", tsType: 'any'
  },

  ARRAY_OBJECT: {
    value: 'array_object', label: '对象数组', desc: '对象数组类型，JSON数据存储，适用于子信息等',
    javaType: 'String', dbType: 'JSON', dbDefault: "", tsType: 'any[]'
  },

  ARRAY_TEXT: {
    value: 'array_text', label: '文本数组', desc: '文本数组类型，JSON数据存储，适用于标签、多选状态等',
    javaType: 'String[]', dbType: 'JSON', dbDefault: "", tsType: 'string[]'
  },

  ENUM: {
    value: 'enum_int',
    label: '整数枚举',
    desc: '整数枚举类型，适用于逻辑固定极少选项的状态或类型',
    javaType: 'Enum', javaDefault: '0',
    dbType: 'INT(4)',
    dbDefault: "'0'",
    tsType: 'Type',
    typeData: true,
    sfSchemaType: 'number',
    stSchemaType: 'badge'
  },

  ENUM_TEXT: {
    value: 'enum_text',
    label: '文本枚举',
    desc: '整数枚举类型，适用于逻辑固定稍多选项的状态或类型',
    javaType: 'Enum',
    javaDefault: '0',
    dbType: 'ENUM',
    dbDefault: "''",
    tsType: 'Type',
    typeData: true,
    stSchemaType: 'badge'
  },

  FOREIGN_KEY: {
    value: 'foreign_key', label: '外键', desc: '外键类型，指定其他模型的主键，联合主键需要有多个外键对应',
    typeData: true
  },

  FOREIGN_OBJECT: {
    value: 'foreign_object', label: '关系对象', desc: '关系对象类型，用于级联加载依赖对象，当前模型必须具备相应模型的外键',
    typeData: true
  },

  FOREIGN_ARRAY: {
    value: 'foreign_array', label: '关系集合', desc: '关系集合类型，用于级联加载关系对象集合，关系模型必须具备当前模型的外键',
    typeData: true
  },

  FOREIGN_FIELD: {
    value: "foreign_field", label: '关系字段', desc: '关系字段类型，用于显示、查询或排序关系字段，当前模型必须具备相应模型的外键',
    typeData: true
  },
};

export const FieldTypeMap: { [key: string]: FieldType } = createEnumMap(FieldTypeEnum);
export const FieldTypeList: FieldType[] = createEnumArray(FieldTypeEnum);
export const FieldTypeValueForeignList: string[] = [FieldTypeEnum.FOREIGN_OBJECT.value, FieldTypeEnum.FOREIGN_ARRAY.value, FieldTypeEnum.FOREIGN_FIELD.value];
export const FieldTypeLikeList: string[] = [FieldTypeEnum.TEXT_TITLE.value, FieldTypeEnum.TEXT_NAME.value, FieldTypeEnum.TEXT_SUMMARY.value, FieldTypeEnum.TEXT_CONTENT.value];
export const FieldTypeForeignList: string[] = [FieldTypeEnum.FOREIGN_KEY.value, FieldTypeEnum.FOREIGN_ARRAY.value, FieldTypeEnum.FOREIGN_FIELD.value, FieldTypeEnum.FOREIGN_OBJECT.value, FieldTypeEnum.ENUM_TEXT.value, FieldTypeEnum.ENUM.value]

export interface FkMap {
  [alias: string]: FkMapItem
}

export class FkMapItem {
  alias: string;
  model: Model;
  m2mItem?: FkMapItem;
  fkFields: Field[];
  ffFields: Field[];
  foField?: Field;
  faField?: Field;
  name: string;
  comment: string;

  get nameLowerLine(): string {
    return toLowerLine(this.name);
  }

  get nameConstant(): string {
    return toUpperUnderline(this.name);
  }
}

export class ModelError extends Error {

  constructor(msg, model?: Model, field?: Field) {
    super(msg);
    this.message = msg;
    this.model = model;
    this.field = field;
  }

  model?: Model;
  field?: Field;
  message: string
}
