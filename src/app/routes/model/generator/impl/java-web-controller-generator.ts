import {CodeTypeEnum, CrudGenerator} from "../generator";
import {EnumItem} from "@shared/shared";
import {FieldTypeEnum, FieldTypeForeignList, Model, Module} from "../../model.model";
import * as format from 'date-fns/format';
import {
  getFieldTypeJava,
  getFkMap,
  getFkMapOfOther,
  getModel,
  isForeignOfOther,
  isMany2ManyOnly,
  isModelSameModule
} from "../../model.helper";

export class JavaWebControllerGenerator extends CrudGenerator {

  protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
    return CodeTypeEnum.JAVA_WEB;
  }

  protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
    return `${this.project.nameDirectory}-web/src/main/java/${this.project.packageDirectory}` +
      `/web/controller/${module.package}/`;
  }

  protected createFileName(module?: Module, models?: Model[], model?: Model): string {
    return `${module.name}Controller`;
  }

  protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
    return "java";
  }

  public createCodeStart(module?: Module, models?: Model[], model?: Model): string {

    const requestMappingStr = isModelSameModule(this._project, module.name) ? '' : `
@RequestMapping("${module.nameLowerLine}")`;
    return `package ${this.project.package}.web.controller.${module.package};

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.annotations.*;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import ${this.project.packageCommon}.domain.id.IdGeneratorUtils;
import ${this.project.packageCommon}.domain.PageList;
import ${this.project.packageCommon}.audit.AuditLoggable;
import ${this.project.packageCommon}.security.utils.SimpleSecurityContext;
import ${this.project.package}.service.${module.package}.${module.name}Service;
import ${this.project.package}.constant.BaseRole;
import ${this.project.package}.constant.${module.package}.${module.name}Permission;
${this.createCodeImportDTO(models)}

import java.util.List;
import java.util.Date;

/**
 * ${module.comment}WebApi
 *
 * @author ${this.project.authorName}
 * @date ${format(new Date(), 'YYYY-MM-DD HH:mm:ss')}
 */
@RestController${requestMappingStr}
@Api(tags = "${module.comment}WebApi", produces = "application/json")
public class ${module.name}Controller {

    @Autowired
    ${module.name}Service ${module.nameCamel}Service;

`;
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


  public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
    return `

}
`;
  }

  protected createCodeCreate(module?: Module, models?: Model[], model?: Model): string {
    let setValues = model.fields.filter(item => item.pk && item.type === FieldTypeEnum.UUID.value)
      .map((field) => `
        ${model.nameCamel}.set${field.name}(IdGeneratorUtils.generateId());`).join('');
    setValues += model.fields.filter(item => item.name === "CreatedTime" || item.name === "UpdatedTime").map((field) => `
        ${model.nameCamel}.set${field.name}(new Date());`).join('');
    setValues += model.fields.filter(item => item.name === "Creator" || item.name === "Updater").map((field) => `
        ${model.nameCamel}.set${field.name}(SimpleSecurityContext.getPrincipal().getId());`).join('');
    setValues += model.fields.filter(item => item.name === "CreatorName" || item.name === "UpdaterName").map((field) => `
        ${model.nameCamel}.set${field.name}(SimpleSecurityContext.getPrincipal().getName());`).join('');

    return `
    /**
     * 添加${model.comment}
     *
     * @param ${model.nameCamel} ${model.comment}对象
     */
    @PostMapping("/${model.nameLowerLine}")
    @ApiOperation(value = "添加${model.comment}")
    @ApiImplicitParams({
            @ApiImplicitParam(paramType = "body", dataType = "${model.name}DTO", name = "${model.nameCamel}", value = "${model.comment}对象", required = true)
    })
    @ApiResponses({
            @ApiResponse(code = HttpServletResponse.SC_OK, message = "添加${model.comment}成功")
    })
    @PreAuthorize("hasRole('" + BaseRole.SYSTEM + "') OR hasAuthority('" + ${module.name}Permission.${model.nameConstant}_ADD + "')")
    @AuditLoggable(message = "#principal.name + #api")
    public void add${model.name}(@Valid @RequestBody ${model.name}DTO ${model.nameCamel}){
        ${setValues}
        ${module.nameCamel}Service.add${model.name}(${model.nameCamel});
    }
`;
  }

  protected createCodeUpdate(module?: Module, models?: Model[], model?: Model): string {
    if (isMany2ManyOnly(model)) {
      return "";
    }

    const fields = model.fields.filter((field) => field.pk);
    const paramStr = fields.map((field) => `@PathVariable ${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
    const paramMappingStr = fields.map((field) => `{${field.nameCamel}}`).join("/");
    const paramValueStr = fields.map((field) => `        ${model.nameCamel}.set${field.name}(${field.nameCamel});`).join("\n");

    let setValues = model.fields.filter(item => item.name === "UpdatedTime").map((field) => `
        ${model.nameCamel}.set${field.name}(new Date());`).join('');
    setValues += model.fields.filter(item => item.name === "Updater").map((field) => `
        ${model.nameCamel}.set${field.name}(SimpleSecurityContext.getPrincipal().getId());`).join('');
    setValues += model.fields.filter(item => item.name === "UpdaterName").map((field) => `
        ${model.nameCamel}.set${field.name}(SimpleSecurityContext.getPrincipal().getName());`).join('');

    const noteStr = fields.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");
    const apiStr = fields.map((field) => `
            @ApiImplicitParam(paramType = "path", dataType = "${getFieldTypeJava(field, model, this.project.modelMap)}", name = "${field.nameCamel}", value = "${field.comment}", required = true)`).join(",");
    return `
    /**
     * 更新${model.comment}
     *
${noteStr}
     * @param ${model.nameCamel} ${model.comment}对象
     */
    @PutMapping("/${model.nameLowerLine}/${paramMappingStr}")
    @ApiOperation(value = "更新${model.comment}")
    @ApiImplicitParams({${apiStr},
            @ApiImplicitParam(paramType = "body", dataType = "${model.name}DTO", name = "${model.nameCamel}", value = "${model.comment}对象", required = true)
    })
    @ApiResponses({
            @ApiResponse(code = HttpServletResponse.SC_OK, message = "更新${model.comment}成功")
    })
    @PreAuthorize("hasRole('" + BaseRole.SYSTEM + "') OR hasAuthority('" + ${module.name}Permission.${model.nameConstant}_EDIT + "')")
    @AuditLoggable(message = "#principal.name + #api")
    public void update${model.name}(${paramStr},@Valid @RequestBody ${model.name}DTO ${model.nameCamel}){
${paramValueStr}${setValues}
        ${module.nameCamel}Service.update${model.name}(${model.nameCamel});
    }
`;
  }

  protected createCodeDelete(module?: Module, models?: Model[], model?: Model): string {
    const fields = model.fields.filter((field) => field.pk);
    const paramStr = fields.map((field) => `@PathVariable ${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
    const paramMappingStr = fields.map((field) => `{${field.nameCamel}}`).join("/");
    const paramInStr = fields.map((field) => `${field.nameCamel}`).join(", ");
    const noteStr = fields.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");
    const apiStr = fields.map((field) => `
            @ApiImplicitParam(paramType = "path", dataType = "${getFieldTypeJava(field, model, this.project.modelMap)}", name = "${field.nameCamel}", value = "${field.comment}", required = true)`).join(",");

    return `
    /**
     * 删除${model.comment}
     *
${noteStr}
     */
    @DeleteMapping("/${model.nameLowerLine}/${paramMappingStr}")
    @ApiOperation(value = "删除${model.comment}")
    @ApiImplicitParams({${apiStr}
    })
    @ApiResponses({
            @ApiResponse(code = HttpServletResponse.SC_OK, message = "删除${model.comment}成功")
    })
    @PreAuthorize("hasRole('" + BaseRole.SYSTEM + "') OR hasAuthority('" + ${module.name}Permission.${model.nameConstant}_DELETE + "')")
    @AuditLoggable(message = "#principal.name + #api")
    public void delete${model.name}(${paramStr}){
        ${module.nameCamel}Service.delete${model.name}(${paramInStr});
    }
`;
  }

  protected createCodeReadGet(module?: Module, models?: Model[], model?: Model): string {
    const fieldsPk = model.fields.filter((field) => field.pk);
    const paramStr = fieldsPk.map((field) => `@PathVariable ${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
    const paramMappingStr = fieldsPk.map((field) => `{${field.nameCamel}}`).join("/");
    const paramInStr = fieldsPk.map((field) => `${field.nameCamel}`).join(", ");
    const noteStr = fieldsPk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");
    const apiStr = fieldsPk.map((field) => `
            @ApiImplicitParam(paramType = "path", dataType = "${getFieldTypeJava(field, model, this.project.modelMap)}", name = "${field.nameCamel}", value = "${field.comment}", required = true)`).join(",");

    return `
     /**
     * 获取${model.comment}对象
     *
${noteStr}
     * @return ${model.comment}对象
     */
    @GetMapping("/${model.nameLowerLine}/${paramMappingStr}")
    @ApiOperation(value = "获取${model.comment}对象")
    @ApiImplicitParams({${apiStr}
    })
    @ApiResponses({
            @ApiResponse(code = HttpServletResponse.SC_OK, message = "获取${model.comment}对象成功", response = ${model.name}DTO.class)
    })
    //@PreAuthorize("hasRole('" + BaseRole.SYSTEM + "') OR hasAuthority('" + ${module.name}Permission.${model.nameConstant}_VIEW + "')")
    public ${model.name}DTO get${model.name}(${paramStr}){
        return ${module.nameCamel}Service.get${model.name}(${paramInStr});
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
    @GetMapping("/${model.nameLowerLine}/search")
    @ApiOperation(value = "分页搜索${model.comment}对象集合")
    @ApiImplicitParams({
            @ApiImplicitParam(paramType = "query", dataType = "${model.name}SearchParam", name = "param", value = "${model.comment}分页搜索参数", required = true)
    })
    @ApiResponses({
            @ApiResponse(code = HttpServletResponse.SC_OK, message = "获取${model.comment}对象分页集合", response = PageList.class)
    })
    @PreAuthorize("hasRole('" + BaseRole.SYSTEM + "') OR hasAuthority('" + ${module.name}Permission.${model.nameConstant}_SEARCH + "')")
    PageList<${model.name}DTO> search${model.name}(${model.name}SearchParam param) {
        return ${module.nameCamel}Service.search${model.name}(param);
    }
`;
  }


  protected createCodeReadList(module?: Module, models?: Model[], model?: Model): string {
    if (!isForeignOfOther(this.project.models, model)) {
      return '';
    }
    // 用于选择，用在任何地方，不应该设置权限，暂时取消输出。
    const permissionStr = `
    //@PreAuthorize("hasRole('" + BaseRole.SYSTEM + "') OR hasAuthority('" + ${module.name}Permission.${model.nameConstant}_LIST + "')")`;

    return `
     /**
     * 列出${model.comment}对象集合(用于选择)
     *
     * @return ${model.comment}对象集合
     */
    @GetMapping("/${model.nameLowerLine}/list")
    @ApiOperation(value = "列出${model.comment}对象集合")
    @ApiResponses({
            @ApiResponse(code = HttpServletResponse.SC_OK, message = "获取${model.comment}对象集合", response = ${model.name}DTO.class, responseContainer = "List")
    })
    public List<${model.name}DTO> list${model.name}() {
        return ${module.nameCamel}Service.list${model.name}();
    }
`;
  }


  protected createCodeReadListByFk(module?: Module, models?: Model[], model?: Model): string {

    if (isMany2ManyOnly(model) || !isForeignOfOther(this.project.models, model)) {
      return "";
    }
    const methods = [];
    const fkMap = getFkMap(model, this.project.modelMap);
    Object.values(fkMap).filter(fkItem => fkItem.model.moduleName === module.name).forEach(fkItem => {

      const fieldsFk = fkItem.fkFields;
      const modelFk = fkItem.model;
      const paramStr = fieldsFk.map((field) => `@PathVariable ${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
      const paramMappingStr = fieldsFk.map((field) => `{${field.nameCamel}}`).join("/");
      const paramInStr = fieldsFk.map((field) => `${field.nameCamel}`).join(", ");
      const noteStr = fieldsFk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");
      const apiStr = fieldsFk.map((field) => `
            @ApiImplicitParam(paramType = "path", dataType = "${getFieldTypeJava(field, model, this.project.modelMap)}", name = "${field.nameCamel}", value = "${field.comment}", required = true)`).join(",");


      // 用于级联选择，用在任何地方，不应该设置权限，暂时取消输出。
      const permissionStr = `
    //@PreAuthorize("hasRole('" + BaseRole.SYSTEM + "') OR hasAuthority('" + ${module.name}Permission.${modelFk.nameConstant}_LIST_${model.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} + "')")`

      methods.push(`
     /**
     * 列出${modelFk.comment}的${model.comment}对象集合${fkItem.name ? `(${fkItem.comment})` : ''}(用于级联选择)
     *
${noteStr}
     * @return ${model.comment}对象集合
     */
    @GetMapping(value = "/${modelFk.nameLowerLine}/${paramMappingStr}/${model.nameLowerLine}/list${fkItem.name ? '/' + fkItem.nameLowerLine : ''}")
    @ApiOperation(value = "列出${modelFk.comment}的${model.comment}对象集合${fkItem.name ? `(${fkItem.comment})` : ''}(用于级联选择)")
    @ApiImplicitParams({${apiStr}
    })
    @ApiResponses({
            @ApiResponse(code = HttpServletResponse.SC_OK, message = "获取${model.comment}对象集合", response = ${model.name}DTO.class, responseContainer = "List")
    })
    public List<${model.name}DTO> list${model.name}For${modelFk.name}${fkItem.name}(${paramStr}) {
        return ${module.nameCamel}Service.list${model.name}For${modelFk.name}${fkItem.name}(${paramInStr});
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
    Object.values(fkMap).filter(fkItem => fkItem.m2mItem && fkItem.m2mItem.model.moduleName === module.name).forEach(fkItem => {

      const fieldsFk = fkItem.fkFields;
      const fieldsPk = model.fields.filter(field => field.pk);
      const modelFk = fkItem.model;
      const paramStr = fieldsPk.map((field) => `@PathVariable ${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
      const paramMappingStr = fieldsPk.map((field) => `{${field.nameCamel}}`).join("/");
      const paramInStr = fieldsPk.map((field) => `${field.nameCamel}`).join(", ");
      const noteStr = fieldsPk.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");
      const apiStr = fieldsPk.map((field) => `
            @ApiImplicitParam(paramType = "path", dataType = "${getFieldTypeJava(field, model, this.project.modelMap)}", name = "${field.nameCamel}", value = "${field.comment}", required = true)`).join(",");


      // 用于级联选择，用在任何地方，不应该设置权限，暂时取消输出。
      const permissionStr = `
    //@PreAuthorize("hasRole('" + BaseRole.SYSTEM + "') OR hasAuthority('" + ${module.name}Permission.${model.nameConstant}_LIST_${modelFk.nameConstant}${fkItem.name ? '_' + fkItem.nameConstant : ''} + "')")`

      if (model.moduleName === module.name) {
        methods.push(`
     /**
     * 列出${model.comment}的${modelFk.comment}对象集合${fkItem.name ? `(${fkItem.comment})` : ''}(用于级联选择)
     *
${noteStr}
     * @return ${modelFk.comment}对象集合
     */
    @GetMapping(value = "/${model.nameLowerLine}/${paramMappingStr}/${modelFk.nameLowerLine}/list${fkItem.name ? '/' + fkItem.nameLowerLine : ''}")
    @ApiOperation(value = "列出${model.comment}的${modelFk.comment}对象集合${fkItem.name ? `(${fkItem.comment})` : ''}(用于级联选择)")
    @ApiImplicitParams({${apiStr}
    })
    @ApiResponses({
            @ApiResponse(code = HttpServletResponse.SC_OK, message = "获取${modelFk.comment}对象集合", response = ${modelFk.name}DTO.class, responseContainer = "List")
    })
    public List<${modelFk.name}DTO> list${modelFk.name}For${model.name}${fkItem.name}(${paramStr}) {
        return ${module.nameCamel}Service.list${modelFk.name}For${model.name}${fkItem.name}(${paramInStr});
    }
`);
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
      const fkModel = fkItem.model;
      const setFields = model.fields.filter((field) => field.pk);
      const paramMappingStr = setFields.map((field) => `{${field.nameCamel}}`).join("/");
      const paramStr = setFields.map((field) => `@PathVariable ${getFieldTypeJava(field, model, this.project.modelMap)} ${field.nameCamel}`).join(", ");
      const noteStr = setFields.map((field) => `     * @param ${field.nameCamel} ${field.comment}`).join("\n");

      code += `

    /**
     * 设置${model.comment}的${fkModel.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}
     *
${noteStr}
     * @param ${fkModel.nameCamel}List ${fkModel.comment}列表
     */
    @PutMapping("/${model.nameLowerLine}/${paramMappingStr}/${fkModel.nameLowerLine}-list${fkItem.name ? '/' + fkItem.nameLowerLine : ''}")
    @ApiOperation(value = "设置${model.comment}的${fkModel.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}")
    @ApiImplicitParams({
            @ApiImplicitParam(paramType = "body", dataType = "List<${fkModel.name}DTO>", name = "${fkModel.nameCamel}List", value = "${fkModel.comment}列表", required = true)
    })
    @ApiResponses({
            @ApiResponse(code = HttpServletResponse.SC_OK, message = "设置${model.comment}的${fkModel.comment}列表${fkItem.name ? `(${fkItem.comment})` : ''}成功")
    })
    @PreAuthorize("hasRole('" + BaseRole.SYSTEM + "') OR hasAuthority('" + ${module.name}Permission.${model.nameConstant}_SET_${fkModel.nameConstant}_LIST${fkItem.name ? '_' + fkItem.nameConstant : ''} + "')")
    @AuditLoggable(message = "#principal.name + #api")
    public void set${fkModel.name}ListFor${model.name}${fkItem.name}(${paramStr}, @RequestBody List<${fkModel.name}DTO> ${fkModel.nameCamel}List) {
        ${module.nameCamel}Service.set${fkModel.name}ListFor${model.name}${fkItem.name}(id, ${fkModel.nameCamel}List);
    }
`;

    });
    return code;

  }


}
