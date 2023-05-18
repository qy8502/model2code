import {CodeTypeEnum, CrudGenerator} from "../generator";
import {EnumItem} from "@shared/shared";
import {
  FieldTypeEnum,
  FieldTypeForeignList,
  FieldTypeMap,
  FieldTypeValueForeignList,
  Model,
  Module
} from "../../model.model";
import * as format from 'date-fns/format';
import {
  getFieldTypeJava,
  getFkMap,
  getFkMapOfOther,
  getModel,
  getModelField,
  isForeignOfOther,
  isMany2ManyOnly
} from "../../model.helper";
import {toCamel} from "../../name.helper";

export class JavaServiceImplGenerator extends CrudGenerator {

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
    const fkModuleMap: { [name: string]: { module: Module, lazy?: boolean } } = {};
    models.forEach(item => {

      const fkMap = getFkMap(item, this.project.modelMap);
      Object.values(fkMap).forEach(fk => {
        const name = fk.model.moduleName;
        fkModuleMap[name] = {module: this.project.moduleMap[name].module};
      });
      const fkMapOfOther = getFkMapOfOther(this.project.models, item, this.project.modelMap);
      Object.values(fkMapOfOther).forEach(otherFk => {
        const name = otherFk.model.moduleName;
        fkModuleMap[name] = {module: this.project.moduleMap[name].module, lazy: true};
      });
    });

    // this.project.models.forEach(item => {
    //   item.fields.forEach(field => {
    //     if (FieldTypeForeignList.indexOf(field.type) > -1) {
    //       const name = getModel(this.project.modelMap, field.typeData).moduleName;
    //       fkModuleMap[name] = this.project.moduleMap[name].module;
    //     }
    //   })
    // });
    let importServiceStr = "";
    let autowiredServiceStr = "";
    Object.values(fkModuleMap).forEach(item => {
      if (item.module.name !== module.name && !this.project.moduleMap[item.module.name].models.every(m => m.enum)) {
        importServiceStr += `
import ${this.project.package}.constant.${item.module.package}.${item.module.name}CacheKey;
import ${this.project.package}.service.${item.module.package}.${item.module.name}Service;`;
        if (item.lazy) {
          autowiredServiceStr += `
    //在此可能是主键实体引用外键实体检查是否存在数据的方法，避免循环引用应加上@Lazy
    @Lazy`;
        }
        autowiredServiceStr += `
    @Autowired
    ${item.module.name}Service ${item.module.nameCamel}Service;`
      }
    });


    return `package ${this.project.package}.service.${module.package}.impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.jarvis.cache.annotation.Cache;
import com.jarvis.cache.annotation.CacheDelete;
import com.jarvis.cache.annotation.CacheDeleteKey;
import org.springframework.context.annotation.Lazy;
import org.springframework.util.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ${this.project.packageCommon}.domain.PageList;
import ${this.project.packageCommon}.exception.BusinessException;
import ${this.project.packageCommon}.exception.NotFoundException;
import ${this.project.packageCommon}.exception.ParameterException;
import ${this.project.packageCommon}.cache.util.CacheKey;
import static ${this.project.packageCommon}.cache.util.CacheKey.*;
import ${this.project.package}.constant.${module.package}.${module.name}CacheKey;
import ${this.project.package}.dao.read.${module.package}.${module.name}ReadDAO;
import ${this.project.package}.dao.write.${module.package}.${module.name}DAO;
import ${this.project.package}.service.${module.package}.${module.name}Service;
${this.createCodeImportDTO(models)}${importServiceStr}

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;


/**
 * ${module.comment}服务
 *
 * @author ${this.project.authorName}
 * @date ${format(new Date(), 'YYYY-MM-DD HH:mm:ss')}
 */
@Service
public class ${module.name}ServiceImpl implements ${module.name}Service {

    @Autowired
    ${module.name}ReadDAO ${module.nameCamel}ReadDAO;
    @Autowired
    ${module.name}DAO ${module.nameCamel}DAO;

    @Lazy
    @Autowired
    ${module.name}Service ${module.nameCamel}Service;
${autowiredServiceStr}
`;
  }

  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    return `

}
`;
  }

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.JAVA_SERVICE;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return `${this.project.nameDirectory}-web/src/main/java/${this.project.packageDirectory}` +
      `/service/${module.package}/impl/`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `${module.name}ServiceImpl`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "java";
  }

  protected createCodeImportDTO(models?: Model[], model?: Model) {
    const map = {};
    models.forEach((item) => {
      const module = this.project.moduleMap[item.moduleName].module;
      map[`${item.name}${item.enum ? 'Enum' : 'DTO'}`] = `import ${this.project.package}.dto.${module.package}.${item.name}${item.enum ? 'Enum' : 'DTO'};
`;
      if (!isMany2ManyOnly(item)) {
        map[`${item.name}SearchParam`] = `import ${this.project.package}.dto.${module.package}.${item.name}SearchParam;
`;
      }
      item.fields.filter(field => FieldTypeForeignList.indexOf(field.type) > -1).forEach(field => {
        const fModel = getModel(this.project.modelMap, field.typeData);
        const fModule = this.project.moduleMap[fModel.moduleName].module;
        map[`${fModel.name}${fModel.enum ? 'Enum' : 'DTO'}`] = `import ${this.project.package}.dto.${fModule.package}.${fModel.name}${fModel.enum ? 'Enum' : 'DTO'};
`;
      });
    });
    return Object.values(map).join("");
  }

  protected createCodeCreate(module?: Module, models?: Model[], model?: Model): string {
    // 处理主键不能为空
    const fieldsPk = model.fields.filter((field) => field.pk);
    let pkCheckStr = `
        //服务层可能提供RPC，服务层参数需要校验出现参数异常抛出IllegalArgumentException（属于程序错误，表示调用代码不严谨或错误，记录堆栈信息并记录错误日志，方便开发人员纠错改正）。
        //业务逻辑允许的错误（如:用户名密码不正确,培训尚未开始）需要抛出基于BusinessException的异常，此类异常不记录堆栈信息，不输出错误日志，但会将友好的信息传递给前端。`;
    pkCheckStr += "\n        //对数据库主键字段进行验证，主键除非有特殊逻辑应该在服务层之前赋值，根据业务需要酌情修改。";
    pkCheckStr += fieldsPk.map((field) => {
      const type = getFieldTypeJava(field, model, this.project.modelMap);
      const check = type === 'String' ? `StringUtils.isEmpty(${model.nameCamel}.get${field.name}())` :
        `${model.nameCamel}.${getFieldTypeJava(field, model, this.project.modelMap) === 'boolean' ? 'is' : 'get'}${field.name}() == null`;
      return `
        if (${check}) {
            throw new IllegalArgumentException(String.format("%s${model.comment}不允许${model.comment}的${field.comment}为空！", adding ? "添加" : "更新"));
        }`;
    }).join("");

    // 处理数据库not null的枚举和外键
    const fields = model.fields.filter((field) => FieldTypeValueForeignList.indexOf(field.type) < 0 && ['Deleted'].indexOf(field.name) < 0);
    pkCheckStr += "\n        //对数据库外键和枚举字段进行验证，Null和空字符串可能引发数据库错误和数据一致性问题，酌情修改或赋予默认值。";
    pkCheckStr += fields.filter((field) => ([FieldTypeEnum.ENUM.value, FieldTypeEnum.ENUM_TEXT.value, FieldTypeEnum.FOREIGN_KEY.value].indexOf(field.type) > -1 && !field.pk))
      .map((field) => {
        const type = getFieldTypeJava(field, model, this.project.modelMap);
        const check = type === 'String' ? `StringUtils.isEmpty(${model.nameCamel}.get${field.name}())` :
          `${model.nameCamel}.${type === 'boolean' ? 'is' : 'get'}${field.name}() == null`;
        return `
        if (${check}) {
            throw new IllegalArgumentException(String.format("%s${model.comment}不允许${model.comment}的${field.comment}为空！", adding ? "添加" : "更新"));
        }`;
      }).join("");


    const fkMap = getFkMap(model, this.project.modelMap);
    pkCheckStr += "\n        //对外键进行数据有效性验证，根据性能和数据一致性权衡，酌情修改";
    // 处理外键字段,检查数据有效性，主要允许为Null字段放行
    pkCheckStr += Object.values(fkMap).map(fkItem => {
      const setModel = fkItem.model;
      const fkSetModule = this.project.moduleMap[setModel.moduleName].module;
      const paramSetInStr = fkItem.fkFields.map(field => `${model.nameCamel}.${getFieldTypeJava(field, setModel, this.project.modelMap) === 'boolean' ? 'is' : 'get'}${field.name}()`).join(', ');

      return `
        ${setModel.name}DTO ${setModel.nameCamel}${fkItem.fkFields[0].name} = ${fkSetModule.nameCamel}Service.get${setModel.name}(${paramSetInStr});
        if (${setModel.nameCamel}${fkItem.fkFields[0].name} == null) {
            throw new ParameterException("设置的${fkItem.fkFields[0].comment}不存在或已删除！");
        }`;
    }).join("");


    pkCheckStr += "\n        //防止对Not Null字段赋Null值，开发人员酌情修改";
    // 处理除了（枚举和外键以及必须填写的字段）以外的数据库not null的字段如果为null,要赋值默认值
    pkCheckStr += fields.filter((field) => ([FieldTypeEnum.ENUM.value, FieldTypeEnum.ENUM_TEXT.value, FieldTypeEnum.FOREIGN_KEY.value].indexOf(field.type) < 0) && field.nn)
      .map((field) => {
        const check = `${model.nameCamel}.${getFieldTypeJava(field, model, this.project.modelMap) === 'boolean' ? 'is' : 'get'}${field.name}() == null`;
        return `
        // ${field.comment}赋默认值。
        if (${['CreatedTime', 'Creator', 'CreatorName'].indexOf(field.name) > -1 ? 'adding && ' : ''}${check}) {
            ${model.nameCamel}.set${field.name}(${FieldTypeMap[field.type].javaDefault});
        }`;
      }).join("");

    const validateMethod = `
    /**
     * 校验${model.comment}对象（添加或效果前）
     *
     * @param ${model.nameCamel} ${model.comment}对象
     */
    protected void validate${model.name}DTO(${model.name}DTO ${model.nameCamel}, boolean adding){${pkCheckStr}
    }

    `;

    const cacheDelete = this.createCodeCacheDelete('add', module, models, model);

    return `${validateMethod}
    /**
     * 添加${model.comment}
     *
     * @param ${model.nameCamel} ${model.comment}对象
     */
    @Override
    //@Transactional(rollbackFor = Exception.class)
    ${cacheDelete}
    public void add${model.name}(${model.name}DTO ${model.nameCamel}){
        //校验${model.comment}对象
        validate${model.name}DTO(${model.nameCamel}, true);
        ${module.nameCamel}DAO.add${model.name}(${model.nameCamel});
    }
`;
  }

  protected createCodeUpdate(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }

    const fieldsPk = model.fields.filter((field) => field.pk);

    const paramPkInStr = fieldsPk.map(field => `${model.nameCamel}.${getFieldTypeJava(field, model, this.project.modelMap) === 'boolean' ? 'is' : 'get'}${field.name}()`).join(", ");

    const cacheDelete = this.createCodeCacheDelete('update', module, models, model);

    return `
    /**
     * 更新${model.comment}
     *
     * @param ${model.nameCamel} ${model.comment}对象
     */
    @Override
    //@Transactional(rollbackFor = Exception.class)
    ${cacheDelete}
    public void update${model.name}(${model.name}DTO ${model.nameCamel}){
        ${model.name}DTO ${model.nameCamel}Original = ${module.nameCamel}Service.get${model.name}(${paramPkInStr});
        if (${model.nameCamel}Original == null) {
            throw new NotFoundException("当前${model.comment}不存在或已删除！");
        }
        //为缓存表达式提供原版数据放置线程中，用于根据关系清除缓存
        CacheKey.setOriginal(${model.nameCamel}Original);
        //校验${model.comment}对象
        validate${model.name}DTO(${model.nameCamel}, false);
        ${module.nameCamel}DAO.update${model.name}(${model.nameCamel});
    }
`;
  }

  protected createCodeDelete(module?: Module, models?: Model[], model?: Model): string {
    const fields = model.fields.filter((field) => field.pk);
    const paramStr = fields.map((field) => `${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
    const paramInStr = fields.map((field) => `${field.nameCamel}`).join(", ");
    const noteStr = fields.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");


    const paramCheckStr = fields.map((field) => {
      const type = getFieldTypeJava(field, model, this.project.modelMap);
      const check = type === 'String' ? `StringUtils.isEmpty(${field.nameCamel})` : `${field.nameCamel} == null`;
      return `
        if (${check}) {
            throw new IllegalArgumentException("删除${model.comment}不允许${field.comment}为空！");
        }`;
    }).join("");

    const fkMapOfOther = getFkMapOfOther(this.project.models, model, this.project.modelMap);
    const markDelete = model.fields.some(field => field.name === 'Deleted');
    const deleteCheckHas = Object.values(fkMapOfOther).map(otherFk => `
        ${markDelete ? '//' : ''}if (Boolean.TRUE.equals(${toCamel(otherFk.m2mItem ? otherFk.m2mItem.model.moduleName : otherFk.model.moduleName)}Service.has${otherFk.model.name}For${model.name}${otherFk.name}(${paramInStr}))) {
        ${markDelete ? '//' : ''}     throw new BusinessException("当前${model.comment}已经存在${otherFk.model.comment}的数据，无法进行删除！");
        ${markDelete ? '//' : ''}}`).join("");


    const cacheDelete = this.createCodeCacheDelete('delete', module, models, model);

    return `
    /**
     * 删除${model.comment}
     *
${noteStr}
     */
    @Override
    //@Transactional(rollbackFor = Exception.class)
    ${cacheDelete}
    public void delete${model.name}(${paramStr}){
        ${paramCheckStr}
        ${model.name}DTO ${model.nameCamel}Original = ${module.nameCamel}Service.get${model.name}(${paramInStr});
        if (${model.nameCamel}Original == null) {
            throw new NotFoundException("当前${model.comment}不存在或已删除！");
        }
        //为缓存表达式提供原版数据放置线程中，用于根据关系清除缓存
        CacheKey.setOriginal(${model.nameCamel}Original);
        ${deleteCheckHas}
        ${module.nameCamel}DAO.delete${model.name}(${paramInStr});
    }
`;
  }

  protected createCodeCacheDelete(mode: 'add' | 'update' | 'delete', module?: Module, models?: Model[], model?: Model): string {
    const fieldsPk = model.fields.filter(field => field.pk);
    let params;

    let code = `@CacheDelete({`;

    params = (mode === 'add' || mode === 'update') ?
      fieldsPk.map((field) => `, #args[0].${field.nameCamel}`).join("") :
      fieldsPk.map((field, index) => `, #args[${index}]`).join("");

    const methods = [];
    methods.push(`
            @CacheDeleteKey("#key('" + ${model.moduleName}CacheKey.${model.nameConstant} + "'${params})")`);

    if (isForeignOfOther(this.project.models, model)) {
      methods.push(`
            @CacheDeleteKey("#key('" + ${model.moduleName}CacheKey.${model.nameConstant}_LIST + "')")`);
      const fkMap = getFkMap(model, this.project.modelMap);
      // 遍历FK，如果isM2M，返回另外一个FK的实体
      Object.values(fkMap).forEach(fkItem => {
        const modelFk = fkItem.model;
        const fieldsFk = fkItem.fkFields;
        if (modelFk.moduleName === module.name) {
          if (mode === 'add' || mode === 'update') {
            params = fieldsFk.map((field) => `, #args[0].${field.nameCamel}`).join("");
            methods.push(`
            @CacheDeleteKey("#key('" + ${model.moduleName}CacheKey.${model.nameConstant}_LIST_FOR_${modelFk.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} + "'${params})")`);
          }
          if (mode === 'delete' || mode === 'update') {
            params = fieldsFk.map((field) => `, #original().${field.nameCamel}`).join("");
            methods.push(`
            @CacheDeleteKey("#key('" + ${model.moduleName}CacheKey.${model.nameConstant}_LIST_FOR_${modelFk.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} + "'${params})")`);
          }
        }

      });
      if (mode === 'delete' || mode === 'update') {
        // 多对多关系
        methods.push(Object.values(getFkMapOfOther(this.project.models, model, this.project.modelMap))
          .filter(item => item.m2mItem && item.m2mItem.model.moduleName === item.model.moduleName).map(fkItem => `
            @CacheDeleteKey("#keys('" + ${fkItem.model.moduleName}CacheKey.${model.nameConstant}_LIST_FOR_${fkItem.model.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} + "')")`));
      }

    }

    code += methods.join(",");
    code += `
    })`;
    return code;
  }


  protected createCodeReadGet(module?: Module, models?: Model[], model?: Model): string {
    const fieldsPk = model.fields.filter((field) => field.pk);
    const paramStr = fieldsPk.map((field) => `${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
    const paramInStr = fieldsPk.map((field) => `${field.nameCamel}`).join(", ");
    const paramCacheArgsStr = fieldsPk.map((field, index) => `, #args[${index}]`).join("");
    const noteStr = fieldsPk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");

    const paramCheckStr = fieldsPk.map((field) => {
      const type = getFieldTypeJava(field, model, this.project.modelMap);
      const check = type === 'String' ? `StringUtils.isEmpty(${field.nameCamel})` : `${field.nameCamel} == null`;
      return `
        if (${check}) {
            throw new IllegalArgumentException("获取${model.comment}不允许${field.comment}为空！");
        }`;
    }).join("");

    return `
     /**
     * 获取${model.comment}对象
     *
${noteStr}
     * @return ${model.comment}对象
     */
    @Override
    @Cache(key = "#key('" + ${model.moduleName}CacheKey.${model.nameConstant} + "'${paramCacheArgsStr})", expireExpression = "#expire('" + ${model.moduleName}CacheKey.${model.nameConstant} + "')", expire = EXPIRE_ONE_HOUR)
    public ${model.name}DTO get${model.name}(${paramStr}){
        ${paramCheckStr}
        return ${module.nameCamel}DAO.get${model.name}(${paramInStr});
    }
`;
  }


  protected createCodeReadSearch(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }

    return `
     /**
     * 分页搜索${model.comment}对象集合
     *
     * @param param ${model.comment}分页搜索参数
     * @return ${model.comment}对象分页集合
     */
    @Override
    public PageList<${model.name}DTO> search${model.name}(${model.name}SearchParam param){
        if (param == null) {
            throw new IllegalArgumentException("分页搜索${model.comment}不允许搜索参数为空！");
        }
        PageHelper.startPage(param.getPageIndex(), param.getPageSize(), param.isCount());
        Page<${model.name}DTO> list = (Page<${model.name}DTO>) ${module.nameCamel}ReadDAO.search${model.name}(param);
        return param.isCount() ? new PageList<${model.name}DTO>(list, list.getTotal()) :
                 new PageList<${model.name}DTO>(list);
    }
`;
  }

  protected createCodeReadList(module?: Module, models?: Model[], model?: Model): string {
    if (!isForeignOfOther(this.project.models, model)) {
      return '';
    }

    return `
     /**
     * 列出${model.comment}对象集合(用于选择)
     *
     * @return ${model.comment}对象集合
     */
    @Override
    @Cache(key = "#key('" + ${model.moduleName}CacheKey.${model.nameConstant}_LIST + "')", expireExpression = "#expire('" + ${model.moduleName}CacheKey.${model.nameConstant}_LIST + "')", expire = EXPIRE_ONE_HOUR)
    public List<${model.name}DTO> list${model.name}() {
        return ${module.nameCamel}DAO.list${model.name}();
    }
`;
  }


  protected createCodeReadListByFk(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }

    const needList = isForeignOfOther(this.project.models, model);
    const methods = [];
    const fkMap = getFkMap(model, this.project.modelMap);
    Object.values(fkMap).forEach(fkItem => {

      const fieldsFk = fkItem.fkFields;
      const modelFk = fkItem.model;
      const paramStr = fieldsFk.map((field) => `${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
      const paramInStr = fieldsFk.map((field) => `${field.nameCamel}`).join(", ");
      const noteStr = fieldsFk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");
      const paramCacheArgsStr = fieldsFk.map((field, index) => `, #args[${index}]`).join("");

      const paramCheckStr = fieldsFk.map((field) => {
        const type = getFieldTypeJava(field, modelFk, this.project.modelMap);
        const check = type === 'String' ? `StringUtils.isEmpty(${field.nameCamel})` : `${field.nameCamel} == null`;
        return `
        if (${check}) {
            throw new IllegalArgumentException("列出${modelFk.comment}的${model.comment}对象${fkItem.name ? `(${fkItem.comment})` : ''}集合不允许${field.comment}为空！");
        }`;
      }).join("");

      const paramCheckHasStr = fieldsFk.map((field) => {
        const type = getFieldTypeJava(field, modelFk, this.project.modelMap);
        const check = type === 'String' ? `StringUtils.isEmpty(${field.nameCamel})` : `${field.nameCamel} == null`;
        return `
        if (${check}) {
            throw new IllegalArgumentException("检查${modelFk.comment}是否存在${model.comment}对象${fkItem.name ? `(${fkItem.comment})` : ''}不允许${field.comment}为空！");
        }`;
      }).join("");

      if (needList && fkItem.model.moduleName === module.name) {
        methods.push(`
     /**
     * 列出${modelFk.comment}的${model.comment}对象集合${fkItem.name ? `(${fkItem.comment})` : ''}(用于级联选择)
     *
${noteStr}
     * @return ${model.comment}对象集合
     */
    @Override
    @Cache(key = "#key('" + ${model.moduleName}CacheKey.${model.nameConstant}_LIST_FOR_${modelFk.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} + "'${paramCacheArgsStr})", expireExpression = "#expire('" + ${model.moduleName}CacheKey.${model.nameConstant}_LIST_FOR_${modelFk.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} + "')", expire = EXPIRE_ONE_HOUR)
    public List<${model.name}DTO> list${model.name}For${modelFk.name}${fkItem.name}(${paramStr}) {
        ${paramCheckStr}
        return ${module.nameCamel}DAO.list${model.name}For${modelFk.name}${fkItem.name}(${paramInStr});
    }

    `);
      }

      methods.push(`
     /**
     * 检查${modelFk.comment}是否存在${model.comment}对象${fkItem.name ? `(${fkItem.comment})` : ''}
     *
${noteStr}
     * @return 是否存在${model.comment}对象
     */
    @Override
    public Boolean has${model.name}For${modelFk.name}${fkItem.name}(${paramStr}) {
        ${paramCheckHasStr}
        return ${module.nameCamel}DAO.has${model.name}For${modelFk.name}${fkItem.name}(${paramInStr});
    }
`);

    });


    return methods.join("\n");
  }

  protected createCodeReadListByM2m(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }

    const methods = [];

    const fkMap = getFkMapOfOther(this.project.models, model, this.project.modelMap);
    Object.values(fkMap).filter(fkItem => !!fkItem.m2mItem).forEach(fkItem => {

      const fieldsFk = fkItem.fkFields;
      const fieldsPk = model.fields.filter(field => field.pk);
      const modelFk = fkItem.model;
      const paramStr = fieldsPk.map((field) => `${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
      const paramInStr = fieldsPk.map((field) => `${field.nameCamel}`).join(", ");
      const noteStr = fieldsPk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");
      const paramCacheArgsStr = fieldsPk.map((field, index) => `, #args[${index}]`).join("");

      const paramCheckStr = fieldsPk.map((field) => {
        const type = getFieldTypeJava(field, modelFk, this.project.modelMap);
        const check = type === 'String' ? `StringUtils.isEmpty(${field.nameCamel})` : `${field.nameCamel} == null`;
        return `
        if (${check}) {
            throw new IllegalArgumentException("列出${model.comment}的${modelFk.comment}对象集合不允许${field.comment}为空！");
        }`;
      }).join("");

      const paramCheckHasStr = fieldsPk.map((field) => {
        const type = getFieldTypeJava(field, modelFk, this.project.modelMap);
        const check = type === 'String' ? `StringUtils.isEmpty(${field.nameCamel})` : `${field.nameCamel} == null`;
        return `
        if (${check}) {
            throw new IllegalArgumentException("检查${model.comment}是否存在${modelFk.comment}对象${fkItem.name ? `(${fkItem.comment})` : ''}不允许${field.comment}为空！");
        }`;
      }).join("");

      if (fkItem.m2mItem.model.moduleName === module.name) {
        methods.push(`
     /**
     * 列出${model.comment}的${modelFk.comment}对象集合${fkItem.name ? `(${fkItem.comment})` : ''}(用于级联选择)
     *
${noteStr}
     * @return ${modelFk.comment}对象集合
     */
    @Override
    @Cache(key = "#key('" + ${model.moduleName}CacheKey.${modelFk.nameConstant}_LIST_FOR_${model.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} + "'${paramCacheArgsStr})", expireExpression = "#expire('" + ${model.moduleName}CacheKey.${modelFk.nameConstant}_LIST_FOR_${model.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} + "')", expire = EXPIRE_ONE_HOUR)
    public List<${modelFk.name}DTO> list${modelFk.name}For${model.name}${fkItem.name}(${paramStr}) {
        ${paramCheckStr}
        return ${module.nameCamel}DAO.list${modelFk.name}For${model.name}${fkItem.name}(${paramInStr});
    }

    `);

        methods.push(`
     /**
     * 检查${model.comment}是否存在${modelFk.comment}对象${fkItem.name ? `(${fkItem.comment})` : ''}
     *
${noteStr}
     * @return 是否存在${modelFk.comment}对象
     */
    @Override
    public Boolean has${modelFk.name}For${model.name}${fkItem.name}(${paramStr}) {
        ${paramCheckHasStr}
        return ${module.nameCamel}DAO.has${modelFk.name}For${model.name}${fkItem.name}(${paramInStr});
    }
`);

        // 多对多对面的模型，如果不在同一个模块内，将在多对多关系模型所在的模块内生成检验存在的代码
        if (fkItem.m2mItem.model.moduleName !== modelFk.moduleName) {
          const fieldsFkPk = model.fields.filter(field => field.pk);
          const paramStrHas2 = fieldsFkPk.map((field) => `${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
          const paramInStrHas2 = fieldsFkPk.map((field) => `${field.nameCamel}`).join(", ");
          const noteStrHas2 = fieldsFkPk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");
          const paramCheckHasStr2 = fieldsFkPk.map((field) => {
            const type = getFieldTypeJava(field, modelFk, this.project.modelMap);
            const check = type === 'String' ? `StringUtils.isEmpty(${field.nameCamel})` : `${field.nameCamel} == null`;
            return `
        if (${check}) {
            throw new IllegalArgumentException("检查${model.comment}是否存在${modelFk.comment}对象${fkItem.name ? `(${fkItem.comment})` : ''}不允许${field.comment}为空！");
        }`;

          }).join("");

          methods.push(`
     /**
     * 检查${modelFk.comment}是否存在${model.comment}对象${fkItem.name ? `(${fkItem.comment})` : ''}
     *
${noteStrHas2}
     * @return 是否存在${model.comment}对象
     */
    @Override
    public Boolean has${model.name}For${modelFk.name}${fkItem.name}(${paramStrHas2}) {
        ${paramCheckHasStr2}
        return ${module.nameCamel}DAO.has${model.name}For${modelFk.name}${fkItem.name}(${paramInStrHas2});
    }
`);
        }
      }
    });


    return methods.join("\n");
  }

  protected createCodeSetM2m(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return '';
    }

    let code = "";
    const fkMap = getFkMapOfOther(this.project.models, model, this.project.modelMap);

    Object.values(fkMap).filter(fkItem => fkItem.m2mItem && fkItem.m2mItem.model.moduleName === module.name).forEach(fkItem => {
      const fieldsFk = fkItem.fkFields;
      const fieldsPk = model.fields.filter((field) => field.pk);
      const paramStr = fieldsPk.map((field) => `${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
      const paramInStr = fieldsPk.map((field) => `${field.nameCamel}`).join(", ");
      const paramFkName = fkItem.m2mItem.fkFields.map((field) => `${field.name}`).join("And");
      const fkModel = fkItem.model;
      const modelM2m = fkItem.m2mItem.model;
      const fkModelPkFields = fkModel.fields.filter(field => field.pk);
      const fkModelParamInSetStr = fkModelPkFields.map(field => `${fkModel.nameCamel}Param.${getFieldTypeJava(field, model, this.project.modelMap) === 'boolean' ? 'is' : 'get'}${field.name}()`).join(", ");
      const paramCacheArgsStr = fieldsFk.map((field, index) => `, #args[${index}]`).join("");

      let paramCheckStr = fieldsPk.map((field) => {
        const type = getFieldTypeJava(field, model, this.project.modelMap);
        const check = type === 'String' ? `StringUtils.isEmpty(${field.nameCamel})` : `${field.nameCamel} == null`;
        return `
        if (${check}) {
            throw new IllegalArgumentException("设置${model.comment}的${fkModel.comment}列表不允许${field.comment}为空！");
        }`;
      }).join("");
      paramCheckStr += `
        if (${fkModel.nameCamel}List == null) {
            throw new IllegalArgumentException("设置${model.comment}的${fkModel.comment}列表不允许${fkModel.comment}列表为空！");
        }`;

      const valueSetStr = fkItem.m2mItem.model.fields.map((field) => `
                ${modelM2m.nameCamel}.set${field.name}(${getModel(this.project.modelMap, field.typeData).nameCamel}${fkItem.m2mItem.name && fkItem.m2mItem.fkFields.indexOf(field) > -1 ? fkItem.m2mItem.name : ""}.get${getModelField(this.project.modelMap, field.typeData).name}());`).join("");
      const noteStr = fieldsPk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");
      const fkSetModule = this.project.moduleMap[model.moduleName].module;
      const fkParamModule = this.project.moduleMap[fkModel.moduleName].module;


      code += `

    /**
     * 设置${model.comment}的${fkModel.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}
     *
${noteStr}
     * @param ${fkModel.nameCamel}List ${fkModel.comment}列表
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    @CacheDelete({
        @CacheDeleteKey("#key('" + ${module.name}CacheKey.${fkModel.nameConstant}_LIST_FOR_${model.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} + "'${paramCacheArgsStr})")
    })
    public void set${fkModel.name}ListFor${model.name}${fkItem.name}(${paramStr}, List<${fkModel.name}DTO> ${fkModel.nameCamel}List) {
        //验证参数有效性
        ${paramCheckStr}
        ${model.name}DTO ${model.nameCamel}${fkItem.m2mItem.name ? fkItem.m2mItem.name : ""} = ${fkSetModule.nameCamel}Service.get${model.name}(${paramInStr});
        if (${model.nameCamel}${fkItem.m2mItem.name ? fkItem.m2mItem.name : ""} == null) {
            throw new NotFoundException("当前${model.comment}不存在或已删除！");
        }
        List<${modelM2m.name}DTO> list = new ArrayList<>();
        for (${fkModel.name}DTO ${fkModel.nameCamel}Param : ${fkModel.nameCamel}List) {
            ${fkModel.name}DTO ${fkModel.nameCamel} = ${fkParamModule.nameCamel}Service.get${fkModel.name}(${fkModelParamInSetStr});
            if (${fkModel.nameCamel} == null) {
                throw new ParameterException("设置的${fkModel.comment}不存在或已删除！");
            }
            ${modelM2m.name}DTO ${modelM2m.nameCamel} = new ${modelM2m.name}DTO();${valueSetStr}
            list.add(${modelM2m.nameCamel});
        }

        ${module.nameCamel}DAO.delete${modelM2m.name}By${paramFkName}(${paramInStr});
        if (!list.isEmpty()) {
            ${module.nameCamel}DAO.add${modelM2m.name}Batch(list);
        }
    }
`;

    });
    return code;
  }


}
