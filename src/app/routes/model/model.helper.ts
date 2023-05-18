import {
  Field,
  FieldTypeEnum,
  FieldTypeMap,
  FieldTypeValueForeignList,
  FkMap,
  FkMapItem,
  Model,
  ModelError,
  Module,
  Project
} from "./model.model";
import {toPascal} from "./name.helper";
import {deepClone} from "@shared/utils/deep-clone";
import {EnumItem} from "@shared/shared";


/**
 * 解析表Sql生成模型
 */
export function processTableToModel(tableSql: string): Model {
  const model = new Model();

  // 获取表名称
  const tableNameReg = /CREATE\s+TABLE\s+([\w`]+?)[\s|\(]/i;
  const tableNameResult = tableNameReg.exec(tableSql);
  let tableName = tableNameResult && tableNameResult[1] ? tableNameResult[1] : "";
  tableName = tableName.replace(/`/g, "");
  model.table = tableName;
  model.name = toPascal(tableName);

// 获取表描述
  const tableCommentReg = /COMMENT=[\s]*['"](.*)['"]/i;
  const tableCommentResult = tableCommentReg.exec(tableSql);
  model.comment = tableCommentResult && tableCommentResult[1] ? tableCommentResult[1] : "";


  // 获取表字段
  let tableFeildsReg = /\(([\s\S]*)\)[\s\S]*?COMMENT=/i; // 防止COMMENT中有括号
  let tableFeildsResult = tableFeildsReg.exec(tableSql);
  if (!tableFeildsResult) {
    tableFeildsReg = /\(([\s\S]*)\)/i; // 没有COMMENT的情况下
    tableFeildsResult = tableFeildsReg.exec(tableSql);
  }
  let tableFeildsSql = tableFeildsResult && tableFeildsResult[1] ? tableFeildsResult[1] : "";

  // 处理PRIMARY KEY
  const pkReg = /,[\s]*?PRIMARY[\s]+?KEY[\s]*?\((.*?)\)/i; // PRIMARY KEY
  let pkArray = [];
  const pkResult = pkReg.exec(tableFeildsSql);
  if (pkResult && pkResult[1]) {
    pkArray = pkResult[1].replace(/`/g, "").split(",").map(key => toPascal(key.trim()));
  }
  tableFeildsSql = tableFeildsSql.replace(pkReg, "");


  // 拆分字段
  tableFeildsSql = tableFeildsSql.replace(/COMMENT[\s]+?((['][\s\S]*?['])|["][\s\S]*?["]\))/ig, (match) => {
    return match.replace(/,/g, "#C#").replace(/[(]/g, "#LP#").replace(/[)]/g, "#RP#");
  });
  tableFeildsSql = tableFeildsSql.replace(/\([\s\S]*?\)/ig, (match) => {
    return match.replace(/,/g, "#C#");
  });
  const tableFeildsSqlArray = tableFeildsSql.split(",")
    .map((sql) => sql.replace(/\#LP\#/g, "(").replace(/\#RP\#/g, ")").replace(/\#C\#/g, ",").trim());


  // 处理字段
  const fieldNameReg = /[`]?(\w+)[`]?/i; // 字段名称
  const fieldCommentReg = /COMMENT[\s]*['"](.*)['"]/i; // 字段描述
  const fieldNnReg = /NOT[\s]+?NULL/i; // 字段NOT NULL

  tableFeildsSqlArray.forEach(fieldSql => {
    if (fieldSql) {
      const field = new Field();

      // 处理字段名称
      const fieldNameResult = fieldNameReg.exec(fieldSql);
      field.name = fieldNameResult && fieldNameResult[1] ? toPascal(fieldNameResult[1]) : "";

      // 处理是否主键
      field.pk = pkArray.indexOf(field.name) >= 0;

      // 处理字段描述
      const fieldCommentResult = fieldCommentReg.exec(fieldSql);
      field.comment = fieldCommentResult && fieldCommentResult[1] ? fieldCommentResult[1] : "";

      // 处理字段描述
      const fieldNnResult = fieldNnReg.exec(fieldSql);
      field.nn = !!fieldNnResult;

      model.fields.push(field);
    }
  });

  return model;
}


export function sortModels(models: Model[]): Model[] {
  const moduleLastModelMap = {};
  const modelsNew = [];
  models.forEach((item) => {
    if (moduleLastModelMap[item.moduleName]) {
      modelsNew.splice(modelsNew.indexOf(moduleLastModelMap[item.moduleName]) + 1, 0, item);
    } else {
      modelsNew.push(item);
    }
    moduleLastModelMap[item.moduleName] = item;
  });
  return modelsNew;
}


/**
 * 转换模型数组为Map
 * @param models 模型数组
 * @returns Key/Value模型Map
 */
export function convertModelsToMap(models: Model[]): { [key: string]: Model } {
  const modelMap = {};
  models.forEach((model) => {
    modelMap[model.name] = model;
  });
  return modelMap;
}

/**
 * 转换模型数组为Map
 * @param models 模型数组
 * @returns Key/Value模型Map
 */
export function checkModelErrorMap(project: Project) {
  const modelErrorMap: { [modelName: string]: { [fieldName: string]: ModelError } } = {};
  project.models.forEach((model) => {
    try {
      getFkMap(model, project.modelMap);
      model.fields.filter(field => FieldTypeEnum.ENUM.value === field.type || FieldTypeEnum.ENUM_TEXT.value === field.type)
        .forEach(field => getModel(project.modelMap, field.typeData))
    } catch (e) {
      console.error(e);
      if (!modelErrorMap[model.name])
        modelErrorMap[model.name] = {};
      modelErrorMap[model.name][e.field ? e.field.name : "model"] = e;
    }
  });
  project.modelErrorMap = modelErrorMap;
}


/**
 * 转换模型数组为Map
 * @param models 模型数组
 * @returns Key/Value模型Map
 */
export function convertModulesToMap(modules: Module[], models: Model[]): { [key: string]: { module: Module, models: Model[] } } {
  const moduleMap = {};
  modules.forEach((module) => {
    moduleMap[module.name] = {module, models: []};
  });
  models.forEach((model) => {
    if (!moduleMap[model.moduleName]) {
      moduleMap[model.moduleName] = {module: createModule({name: model.name, comment: model.comment}), models: []};
    }
    moduleMap[model.moduleName].models.push(model);
  });
  return moduleMap;
}


export function createProject(source: any): Project {
  if (!source) {
    return source
  }
  const project: Project = Object.assign(new Project(), source);
  project.modules = project.modules ? project.modules.map((item) => createModule(item)) : [];
  project.models = project.models ? project.models.map((item) => createModel(item)) : [];
  project.models = sortModels(project.models);
  project.modelMap = convertModelsToMap(project.models);
  project.moduleMap = convertModulesToMap(project.modules, project.models);
  checkModelErrorMap(project);
  return project;
}

export function jsonProject(project: Project): string {
  if (!project) {
    return null;
  }
  project = deepClone(project);
  delete project.modelMap;
  delete project.moduleMap;
  delete project.modelErrorMap;
  return JSON.stringify(project);
}

export function createModule(source: any): Module {
  const module: Module = Object.assign(new Module(), source);
  return module;
}

export function createModel(source: any): Model {
  const model: Model = Object.assign(new Model(), source);
  if (model.fields) {
    model.fields = model.fields.map((field) => Object.assign(new Field(), field));
  }
  return model;
}

export function updateModulesFromModels(project: Project) {
  project.models.forEach(model => {
    if (model.moduleName !== model.name && !project.modules.find(module => module.name === model.moduleName)) {
      project.modules.push(createModule({name: model.moduleName, comment: model.comment}));
    }
  });
  for (let i = project.modules.length - 1; i >= 0; i--) {
    const module = project.modules[i];
    if (!project.models.find(model => module.name === model.moduleName && model.moduleName !== model.name)) {
      project.modules.splice(i, 1);
    }
  }
  project.moduleMap = convertModulesToMap(project.modules, project.models);
}


export function updateModelsModule(project: Project, oldModule: string, newModule: string) {
  project.models.forEach(model => {
    if (model.moduleName === oldModule) {
      model.module = model.name === newModule ? '' : newModule;
    }
  });
  updateModulesFromModels(project);
}

export function toModelName(name: string): string {
  return name.split(/\./g)[0];
}

export function toFieldName(name: string): string {
  return name.split(/\./g)[1] || name;
}

export function getModel(modelMap: { [key: string]: Model }, name: string, formModel?: Model, formField?: Field): Model {
  if (!name) {
    return null;
  }
  name = toModelName(name);
  const model = modelMap[name];
  if (!model) {
    throw new ModelError(`${name}模型不存在！`, formModel, formField);
  }
  return model;
}

export function getField(model: Model, name: string, formModel?: Model, formField?: Field): Field {
  if (!model) {
    return null;
  }
  name = toFieldName(name);
  const field = model.fields.find((item) => item.name === name);
  if (!field) {
    throw new ModelError(`${model.name}模型的${name}字段不存在！`, formModel || model, formField);
  }
  return field;
}

export function getModelField(modelMap: { [key: string]: Model }, name: string, formModel?: Model, formField?: Field): Field {
  return getField(getModel(modelMap, name), name, formModel, formField);
}


export function getFieldTypeDb(field: Field, model: Model, modelMap: { [key: string]: Model }): string {
  if (!field || !model) {
    return '';
  }
  switch (field.type) {
    case FieldTypeEnum.ENUM_TEXT.value:
      const enumModel = getModel(modelMap, field.typeData);
      const enumItems = enumModel.enumItems.map(item => `'${item.value}'`).join(",");
      return `ENUM(${enumItems})`;
    case FieldTypeEnum.FOREIGN_KEY.value:
      const modelF = getModel(modelMap, field.typeData);
      return getFieldTypeDb(getField(modelF, field.typeData), modelF, modelMap);
    default:
      return field.dbType || FieldTypeMap[field.type].dbType;
  }
}


export function getFieldTypeDbDefault(field: Field, model: Model, modelMap: { [key: string]: Model }): string {
  if (!field || !model) {
    return '';
  }
  if (field.dbDefault === FieldTypeMap[field.type].dbDefault) {
    switch (field.type) {
      case FieldTypeEnum.ENUM_TEXT.value:
        const enumModel = getModel(modelMap, field.typeData);
        if (enumModel.enumItems.length > 0) {
          return ` DEFAULT '${enumModel.enumItems[0].value}'`;
        }
    }
  }
  return field.dbDefault ? " DEFAULT " + field.dbDefault + "" : "";
}

export function getFieldType(field: Field, modelMap: { [key: string]: Model }): string {
  switch (field.type) {
    case FieldTypeEnum.FOREIGN_KEY.value:
    case FieldTypeEnum.FOREIGN_FIELD.value:
      return getFieldType(getModelField(modelMap, field.typeData), modelMap);
    default:
      return field.type;
  }
}

export function getFieldTypeJava(field: Field, model: Model, modelMap: { [key: string]: Model }): string {
  switch (field.type) {
    case FieldTypeEnum.FOREIGN_KEY.value:
    case FieldTypeEnum.FOREIGN_FIELD.value:
      const modelF = getModel(modelMap, field.typeData);
      return getFieldTypeJava(getField(modelF, field.typeData), modelF, modelMap);
    case FieldTypeEnum.ENUM.value:
    case FieldTypeEnum.ENUM_TEXT.value:
      const enumModel = getModel(modelMap, field.typeData);
      return `${enumModel.name}Enum`;
    default:
      return FieldTypeMap[field.type].javaType;
  }
}

export function getFieldTypeTs(field: Field, model: Model, modelMap: { [key: string]: Model }): string {
  switch (field.type) {
    case FieldTypeEnum.FOREIGN_KEY.value:
    case FieldTypeEnum.FOREIGN_FIELD.value:
      const modelF = getModel(modelMap, field.typeData);
      return getFieldTypeTs(getField(modelF, field.typeData), modelF, modelMap);
    case FieldTypeEnum.ENUM.value:
    case FieldTypeEnum.ENUM_TEXT.value:
      const enumModel = getModel(modelMap, field.typeData);
      return enumModel.enumType;
    default:
      return FieldTypeMap[field.type].tsType;
  }
}


// 是否是其他实体外键的主键表，用于提供list方法
export function isForeignOfOther(models: Model[], model: Model): boolean {
  return model.fields.filter((field) => field.pk).some(pkField =>
    models.some((otherModel) => otherModel.fields.some(otherField =>
      FieldTypeEnum.FOREIGN_KEY.value === otherField.type && toModelName(otherField.typeData) === model.name && toFieldName(otherField.typeData) === pkField.name
    ))
  );
}

// 其他实体外键的主键表，获得所有关系模型
export function getFkMapOfOther(models: Model[], model: Model, modelMap: { [key: string]: Model }): FkMap {
  const map: FkMap = {};
  const items: FkMapItem[] = [];
  models.forEach(item => {
    Object.values(getFkMap(item, modelMap)).filter(fk => fk.model === model).forEach((fk, index) => {
      fk.model = item;
      fk.alias = item.nameAbbrLower + index;
      let fkNew = fk;
      const m2mFk = getFkMap(item, modelMap);
      // 遇见多对多取忽略关系模型另一套模型
      if (isMany2ManyOnly(item)) {
        // const other = Object.values(m2mFk).find(another => another.model !== model);
        const other = Object.values(m2mFk).find(another => another.fkFields.map(f => f.name).join(",") !== fk.fkFields.map(f => f.name).join(","));
        other.m2mItem = fk;
        fkNew = other;
      }
      map[fk.alias] = fkNew;
      items.push(fkNew);
    })
  });
  items.filter(fkItem => fkItem.m2mItem).forEach(fkItem => {
    // 判断有没有同时多对多指向同一个模型的，需要用中间表名作为关系名称，
    if (items.some(fkOther => fkOther.m2mItem && fkOther !== fkItem && fkOther.model === fkItem.model)) {
      fkItem.name = fkItem.name || fkItem.m2mItem.model.name.replace(model.name, "").replace(fkItem.model.name, "");
      fkItem.name = fkItem.name || fkItem.m2mItem.model.name;
      fkItem.comment = fkItem.comment || fkItem.m2mItem.model.comment.replace(model.comment, "").replace(fkItem.model.comment, "");
      fkItem.comment = fkItem.comment || fkItem.m2mItem.model.comment;
    } else {
      fkItem.name = "";
      fkItem.comment = "";
    }
  });
  return map;
}


export function isMany2ManyOnly(model: Model): boolean {
  return !model.fields.some(field => !field.pk || field.type !== FieldTypeEnum.FOREIGN_KEY.value);
}

export function isMany2Many(model: Model, modelMap: { [key: string]: Model }, fkMapReady?: FkMap): boolean {
  const fkMap = fkMapReady || getFkMap(model, modelMap);
  // 所有主键都是外键，并关联两个表，说明是多对多关系实体
  return model.fields.filter((field) => field.pk).every((field) =>
    FieldTypeEnum.FOREIGN_KEY.value === field.type) &&
    Object.values(fkMap).filter((item) => item.fkFields.every(field => field.pk)).length === 2;
}

// 字符串相似度
export function likeLength(s1, s2): number {
  const min = s1.length < s2.length ? s1.length : s2.length;
  for (let i = 0; i < min; i++) {
    if (s2.indexOf(s1.substring(0, i)) !== 0) {
      return i / min;
    }
  }
  return 1;
}

// 为Sql语句表连接拆出外键模型
export function getFkMap(model: Model, modelMap: { [key: string]: Model }): FkMap {
  const fkMap: FkMap = {};
  const fkArray: FkMapItem[] = [];
  const thisModelAlias = model.nameAbbrLower;
  const fields = [].concat(model.fields);
  // 如果有联合主键的外键或外键关系字段，且表关联两遍该实体，
  // 如CityId,CountyId都是Region的外键，且要显示CityName,CountyName，
  // 排序后CityName靠着CityId
  fields.sort((a, b) => a.name > b.name ? 1 : -1);
  // 先处理主键由主键建立连接
  fields.sort((a, b) => (a.pk ? 1 : 0) - (b.pk ? 1 : 0));
  fields.forEach((field) => {
    // 如果是关系键
    if (FieldTypeEnum.FOREIGN_KEY.value === field.type || FieldTypeValueForeignList.indexOf(field.type) >= 0) {
      // 获得关系模型和关系字段
      const fkModel = getModel(modelMap, field.typeData, model, field);

      // 找到已经组织出来的外键模型
      let fkItem = fkArray.find(item => {
        if (item.model === fkModel || item.model.name === fkModel.name) {
          if (field.type === FieldTypeEnum.FOREIGN_KEY.value && !item.faField &&
            !item.fkFields.some(fk => fk.typeData === field.typeData)) {
            // 如果是外键，找个还没有当前外键的Item
            return true;
          } else if (field.type === FieldTypeEnum.FOREIGN_FIELD.value && !item.faField &&
            // 如果是关系字段，找个还没有当前关系字段的Item
            !item.ffFields.some(ff => ff.typeData === field.typeData)) {
            return true;
          } else if (field.type === FieldTypeEnum.FOREIGN_OBJECT.value && !item.faField &&
            !item.foField) {
            // 如果是关系对象，找个还没有关系对象的Item
            return true;
          } else if (field.type === FieldTypeEnum.FOREIGN_ARRAY.value) {
            // 当前是主键表，被某个外键表关联，独成一套规则。
            return false;
          }
        }
        return false;
      });


      if (!fkItem) {
        fkItem = Object.assign(new FkMapItem(), {
          alias: fkModel.nameAbbrLower,
          model: fkModel,
          fkFields: [],
          ffFields: [],
          name: "",
          comment: ""
        });
        // 分配别名，如果重复加上序号
        let i = 1;
        while (fkMap[fkItem.alias] || fkItem.alias === thisModelAlias) {
          fkItem.alias = fkItem.model.nameAbbrLower + i++;
        }
        fkMap[fkItem.alias] = fkItem;
        fkArray.unshift(fkItem);
      }
      if (field.type === FieldTypeEnum.FOREIGN_KEY.value) {
        const fkField = getField(fkModel, field.typeData, model, field);
        // 计算关系名称，根据外键去掉目标实体的信息获得，比如：LiveCityId关联City.Id取得名字Live ,如果联合主键，要求前缀名称一致，LiveCityId和LiveYear联合外键，才能取到Live
        fkItem.name = fkItem.name ?
          fkItem.name = field.name.substring(0, likeLength(fkItem.name, field.name)) :
          fkItem.name = field.name.replace(new RegExp(fkField.name + "$"), "").replace(new RegExp(fkModel.name + "$"), "");

        // 说明也如此操作：居住城市 关联 城市.编号 取得说明 居住
        fkItem.comment = fkItem.comment ?
          fkItem.comment = field.comment.substring(0, likeLength(fkItem.comment, field.comment)) :
          fkItem.comment = field.comment.replace(new RegExp(fkField.comment + "$"), "").replace(new RegExp(fkModel.comment + "$"), "");

        fkItem.fkFields.push(field);
      } else if (field.type === FieldTypeEnum.FOREIGN_FIELD.value) {
        fkItem.ffFields.push(field);
      } else if (field.type === FieldTypeEnum.FOREIGN_OBJECT.value) {
        fkItem.foField = field;
      } else if (field.type === FieldTypeEnum.FOREIGN_ARRAY.value) {
        const faMapItems = Object.values(getFkMap(fkModel, modelMap))
          .filter(item => item.model === model || item.model.name === model.name);
        // 根据与field.name的相似程度排序，获得关系外键。
        // 如Region.CitySchoolList字段，会匹配School.CityRegionId外键,
        // 而不会匹配School.CountyRegionId
        if (faMapItems && faMapItems.length > 0) {
          faMapItems.sort((a, b) => likeLength(field.name, a.fkFields[0].name) > likeLength(field.name, a.fkFields[1].name) ? 1 : -1);
          fkItem.fkFields = faMapItems[0].fkFields;
        }
        fkItem.faField = field;
      }

    }
  });

  // 排序外键与目标主键顺序一致
  fkArray.filter(item => !item.faField).forEach(item => {
    const pks = item.model.fields.filter(field => field.pk);
    if (item.fkFields.length !== pks.length && !item.faField) {
      throw new ModelError(`${model.name}模型与${item.model.name}模型的外键关系不正确。联合主键必须主外键数量一致，或者同一模型的重复关系字段需要多个外键字段关联该模型。`, model, pks[0]);
    }
    const sameFks = fkArray.filter((subItem) => subItem.model === item.model || subItem.model.name === item.model.name);
    if (sameFks.length > 1) {
      if (sameFks.some((subItem) => subItem !== item && (subItem.name === item.name || subItem.comment === item.comment))) {
        throw new ModelError(`${model.name}模型与${item.model.name}模型的外键关系出现重名（${sameFks.map(s => s.name)}）或重说明（${sameFks.map(s => s.comment)}）。多个外键字段关联应该通过前缀区分开，联合外键应该有统一的前缀。如：'居住城市'和'出生城市'关系'城市'模型`, model, pks[0]);
      }
    } else {
      item.name = "";
      item.comment = "";
    }
    item.fkFields.sort((a, b) => pks.indexOf(a) - pks.indexOf(b));
  });
  return fkMap;
}

// 是否只有同名模型的模块，这种模块不需要模块前缀
export function isModelSameModule(project: Project, moduleName: string): boolean {
  const models = project.moduleMap[moduleName].models;
  return (models.length <= 1 && models[0].name === models[0].moduleName)
}


export function listModuleName(project: Project): EnumItem[] {
  const datas: EnumItem[] = [];
  Object.values(project.moduleMap).forEach(item => {
    datas.push({value: `${item.module.name}`, label: `${item.module.comment}模块`});
  });
  return datas;
}

export function listForeignKeyTypeData(project: Project): EnumItem[] {
  const datas: EnumItem[] = [];
  project.models.forEach(model => {
    model.fields.forEach(field => {
      if (field.pk) {
        datas.push({value: `${model.name}.${field.name}`, label: `${model.comment}模块的${field.comment}字段`});
      }
    });
  });
  return datas;
}

export function listForeignFieldTypeData(project: Project, fields: Field[]): EnumItem[] {
  const datas: EnumItem[] = [];
  fields.forEach(field => {
    if (field.type === FieldTypeEnum.FOREIGN_KEY.value && field.typeData) {
      const model = getModel(project.modelMap, field.typeData);
      model.fields.forEach(fieldNew => {
        if (!fieldNew.pk) {
          datas.push({value: `${model.name}.${fieldNew.name}`, label: `${model.comment}模块的${fieldNew.comment}字段`});
        }
      });
    }
  });
  return datas;
}

export function listEnumTextTypeData(project: Project): EnumItem[] {
  const datas: EnumItem[] = [];
  project.models.forEach(model => {
    if (model.enum && model.enumType === 'string') {
      datas.push({value: `${model.name}`, label: `${model.comment}枚举`});
    }
  });
  return datas;
}


export function listEnumTypeData(project: Project): EnumItem[] {
  const datas: EnumItem[] = [];
  project.models.forEach(model => {
    if (model.enum && model.enumType === 'number') {
      datas.push({value: `${model.name}`, label: `${model.comment}枚举`});
    }
  });
  return datas;
}

export function findNameField(fields: Field[]): Field {

  let nameField = fields.find(item => !item.pk && ['Name', 'Text', 'Title'].indexOf(item.name) > -1);
  if (!nameField) {
    nameField = fields.find(item => !item.pk && [FieldTypeEnum.TEXT_NAME.value].indexOf(item.type) > -1);
  }
  if (!nameField) {
    nameField = fields.find(item => !item.pk && [FieldTypeEnum.TEXT_TITLE.value].indexOf(item.type) > -1);
  }
  if (!nameField) {
    nameField = fields.find(item => item.pk);
  }
  return nameField;
}


export function addImportModules(modelMap: { [key: string]: Model }, importModules: any, field: Field) {
  switch (field.type) {
    case FieldTypeEnum.FOREIGN_KEY.value:
      const itemModel = getModel(modelMap, field.typeData);
      if (!importModules[itemModel.moduleName]) {
        importModules[itemModel.moduleName] = [];
      }
      if (importModules[itemModel.moduleName].indexOf(`${itemModel.name}DTO`) < 0) {
        importModules[itemModel.moduleName].push(`${itemModel.name}DTO`);
      }
      break;
    case FieldTypeEnum.ENUM.value:
    case FieldTypeEnum.ENUM_TEXT.value:
      const itemModelEnum = getModel(modelMap, field.typeData);
      if (!importModules[itemModelEnum.moduleName]) {
        importModules[itemModelEnum.moduleName] = [];
      }
      if (importModules[itemModelEnum.moduleName].indexOf(`${itemModelEnum.name}Enum`) < 0) {
        importModules[itemModelEnum.moduleName].push(`${itemModelEnum.name}Enum`);
      }
      if (importModules[itemModelEnum.moduleName].indexOf(`${itemModelEnum.name}List`) < 0) {
        importModules[itemModelEnum.moduleName].push(`${itemModelEnum.name}List`);
      }
      if (importModules[itemModelEnum.moduleName].indexOf(`${itemModelEnum.name}Map`) < 0) {
        importModules[itemModelEnum.moduleName].push(`${itemModelEnum.name}Map`);
      }
      break;
    case FieldTypeEnum.FOREIGN_FIELD.value:
      const fieldNew = getModelField(modelMap, field.typeData);
      addImportModules(modelMap, importModules, fieldNew);
      break;
    default:
  }
}
