import {CodeTypeEnum, FieldsGenerator} from "../generator";
import {Field, FieldTypeEnum, FieldTypeMap, Model, Module, Project} from "../../model.model";
import {EnumItem} from "@shared/shared";
import {
    addImportModules,
    findNameField,
    getField,
    getFkMap,
    getFkMapOfOther,
    getModel,
    isMany2ManyOnly,
    isModelSameModule
} from "../../model.helper";
import {toCamel, toLowerLine} from "../../name.helper";

const SEARCH = 'search';
const COLUMNS = 'columns';

export class NgComponentListTsGenerator extends FieldsGenerator {

    protected splitCodeBy(): typeof Project | typeof Module | typeof Model {
        return Model;
    }

    protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
        return CodeTypeEnum.NG;
    }

    protected createFileDirectory(module?: Module, models?: Model[], model?: Model): string {
        return `${this.project.nameDirectory}-web-client/src/app/routes/${module.nameLowerLine}/${isModelSameModule(this._project, module.name) ? 'list' : model.nameLowerLine + '-list'}`;
    }

    protected createFileName(module?: Module, models?: Model[], model?: Model): string {
        return `${isModelSameModule(this.project, module.name) ? 'list' : model.nameLowerLine + '-list'}.component`;
    }

    protected createFileExtension(module?: Module, models?: Model[], model?: Model): string {
        return "ts";
    }

    protected createCode(module?: Module, models?: Model[], model?: Model): string {
        if (isMany2ManyOnly(model)) {
            return null;
        }
        return super.createCode(module, models, model);
    }

    public createCodeStart(module?: Module, models?: Model[], model?: Model): string {
        return '';
    }


    public createCodeEnd(module?: Module, models?: Model[], model?: Model): string {
        return ''
    }


    public createCodeMain(module: Module, models: Model[], model: Model, params?: any): string {


        const importModules = {};
        importModules[model.moduleName] = [`${model.name}DTO`, `${model.name}SearchParam`];

        model.fields
            .forEach((item) => {
                addImportModules(this.project.modelMap, importModules, item);
            });
        let routeParam = '';
        let routeData = '';
        let onInit = '';
        const fkItems = Object.values(getFkMap(model, this.project.modelMap));
        fkItems.filter(fkItem => fkItem.fkFields.some(f => f.search)).forEach(fkItem => {
            fkItem.fkFields.forEach(field => {
                routeParam += `
    ${field.nameCamel}: this.route.snapshot.${module.name === fkItem.model.moduleName ? 'params' : 'queryParams'}.${field.nameCamel} || "",`;
            });
            if (module.name === fkItem.model.moduleName) {
                const commentStr = fkItem.fkFields.length > 1 ? fkItem.comment + fkItem.model.comment : fkItem.fkFields[0].comment;
                const nameFieldFk = findNameField(fkItem.model.fields);
                routeData += `
    ${toCamel(fkItem.name + fkItem.model.name)}: null,`;
                onInit += `
    if (${fkItem.fkFields.map(field => `this.routeParam.${field.nameCamel}`).join(" && ")}) {
      this.${module.nameCamel}Service.get${fkItem.model.name}(${fkItem.fkFields.map(field => `this.routeParam.${field.nameCamel}`).join(", ")}).subscribe((data) => {
        this.routeData.${toCamel(fkItem.name + fkItem.model.name)} = data;
        this.routeData.subTitle = \`${commentStr}：\${data.${nameFieldFk.nameCamel}}\`
      });
    }`;
            }
        });


        let importServices = '';
        let importModels = '';
        let importPermission = '';
        let importSetM2m = '';
        let constructorServices = '';
        const className = `${isModelSameModule(this._project, module.name) ? '' : module.name}${model.name}`;
        const classPath = `${isModelSameModule(this._project, module.name) ? '' : model.nameLowerLine + '-'}`;
        const urlPath = `${isModelSameModule(this._project, module.name) ? '' : model.nameLowerLine + '/'}`;

        Object.keys(importModules).forEach((key) => {
            const importModule = this.project.moduleMap[key].module;
            if (!this.project.moduleMap[key].models.every(m => m.enum)) {
                // 服务放到业务Module目录中
//       importServices += `
// import {${importModule.name}Service} from "../${importModule.name === module.name ? '' : '../' + importModule.nameLowerLine + '/'}${importModule.nameLowerLine}.service";`;
                // 服务放到core目录中
                importServices += `
import {${importModule.name}Service} from "@core/${importModule.nameLowerLine}/${importModule.nameLowerLine}.service";`;

                constructorServices += `, private ${importModule.nameCamel}Service: ${importModule.name}Service`;
            }
            // 实体放到业务Module目录中
//       importModels = `
// import {` + importModules[key].join(', ') + `} from "../${importModule.name === module.name ? '' : '../' + importModule.nameLowerLine + '/'}${importModule.nameLowerLine}.model";`;
//     });
            // 实体放到core目录中
            importModels += `
import {` + importModules[key].join(', ') + `} from "@core/${importModule.nameLowerLine}/${importModule.nameLowerLine}.model";`;
        });

        // 常量放到业务Module目录中
        // importPermission = `import {${module.name}Permission} from "../${module.nameLowerLine}-permission.constant";`;
        // 常量放到core目录中
        importPermission = `import {${module.name}Permission} from "@core/${module.nameLowerLine}/${module.nameLowerLine}-permission.constant";`;


        const nameField = findNameField(model.fields);
        const fieldsPk = model.fields.filter(field => field.pk);
        const paramInStr = fieldsPk.map(field => `item.${field.nameCamel}`).join(", ");
        let otherLink = "";
        const fkItemsOther = getFkMapOfOther(this.project.models, model, this.project.modelMap);
        Object.values(fkItemsOther).forEach((fkItem) => {
            if (fkItem.fkFields.some(f => f.search) && !fkItem.m2mItem) {
                if (fkItem.model.moduleName === module.name) {
                    const classUrl = `/${module.nameLowerLine}${isModelSameModule(this._project, module.name) ? '' : '/' + model.nameLowerLine}`;
                    const classUrlFk = `${fkItem.model.nameLowerLine}`;
                    const paramFk = fkItem.fkFields.map(field => `\${item.${getField(model, field.typeData).nameCamel}}`).join("/");
                    otherLink += `
        {text: '管理${fkItem.comment ? fkItem.comment + '的' : ''}${fkItem.model.comment}', type: 'link', click: (item: any) => \`${classUrl}/${paramFk}/${classUrlFk}${fkItem.name ? '/' + fkItem.nameLowerLine : ''}\`,
         acl:{role: [BaseRole.SYSTEM.value], ability: [${fkItem.model.moduleName}Permission.${fkItem.model.nameConstant}_SEARCH.value], mode: 'oneOf'}},`
                } else {
                    const classUrlFk = `/${toLowerLine(fkItem.model.moduleName)}${isModelSameModule(this._project, fkItem.model.moduleName) ? '' : '/' + fkItem.model.nameLowerLine}`;
                    const paramFk = fkItem.fkFields.map(field => `${field.nameCamel}=\${item.${getField(model, field.typeData).nameCamel}}`).join("&");
                    otherLink += `
        //{text: '管理${fkItem.comment ? fkItem.comment + '的' : ''}${fkItem.model.comment}', type: 'link', click: (item: any) => \`${classUrlFk}?${paramFk}\`,
        //acl:{role: [BaseRole.SYSTEM.value], ability: [${fkItem.model.moduleName}Permission.${fkItem.model.nameConstant}_SEARCH.value], mode: 'oneOf'}},`
                }
            }
            // 如果是多对多
            if (fkItem.m2mItem && fkItem.m2mItem.model.moduleName === module.name) {
                otherLink += `
        {text: '分配${fkItem.comment ? fkItem.comment + '的' : ''}${fkItem.model.comment}', type: 'static',
         component: ${className}Set${fkItem.name}${fkItem.model.name}ListComponent, params: (item: any) => ({record: item}), click: 'reload',
         acl: {role: [BaseRole.SYSTEM.value], ability: [${module.name}Permission.${model.nameConstant}_SET_${fkItem.model.nameConstant}_LIST${fkItem.name ? '_' + fkItem.nameConstant : ''}.value], mode: 'oneOf'}},`;
                importSetM2m += `
import {${className}Set${fkItem.name}${fkItem.model.name}ListComponent} from "../${isModelSameModule(this._project, module.name) ? '' : model.nameLowerLine + '-'}set-${fkItem.model.nameLowerLine}-list${fkItem.name ? '-' + fkItem.nameLowerLine : ''}/${isModelSameModule(this._project, module.name) ? '' : model.nameLowerLine + '-'}set-${fkItem.model.nameLowerLine}-list${fkItem.name ? '-' + fkItem.nameLowerLine : ''}.component";`;
            }
        });


        let code = `import {Component, OnInit, ViewChild} from '@angular/core';
import {ModalHelper, TitleService} from '@delon/theme';
import {STChange, STColumn, STColumnBadge, STComponent} from '@delon/abc';
import {SFSchema, SFSelectWidgetSchema} from '@delon/form';${importServices}${importModels}
import {STData} from "@delon/abc/table/table.interfaces";
import {Subscription} from "rxjs";
import {finalize, map} from "rxjs/operators";
import {PageList} from "@shared/shared.model";
import {${className}EditComponent} from "../${classPath}edit/${classPath}edit.component";
import {NzMessageService, NzModalService} from "ng-zorro-antd";
import {BaseRole} from "@core/auth/base-role.constant";
${importPermission}
import {ACLCanType} from "@delon/acl";
import {ActivatedRoute} from "@angular/router";${importSetM2m}

@Component({
  selector: 'app-${module.nameLowerLine}-${classPath}list',
  templateUrl: './${classPath}list.component.html'
})
export class ${className}ListComponent implements OnInit {

  //新建操作权限
  aclAdd: ACLCanType = {role: [BaseRole.SYSTEM.value], ability: [${module.name}Permission.${model.nameConstant}_ADD.value], mode: 'oneOf'};
  //路由参数
  routeParam = new ${model.name}SearchParam({${routeParam}
  });
  //路由数据
  routeData = {
    title: this.route.snapshot.data.title || "",
    subTitle: "",${routeData}
  };
  //查询参数
  param: ${model.name}SearchParam = new ${model.name}SearchParam();
  //查询返回数据列表
  data: ${model.name}DTO[];
  //查询返回数据总数
  total: number = 0;
  //执行查询订阅（查询中）
  loading: Subscription;
    //查询参数表单定义
  searchSchema: SFSchema;
  //生成查询参数表单定义(表单定义可能根据情况调整，所以动态生成)
  createSearchSchema(): SFSchema {
    let searchSchema = {
      properties: {
  `;
        code += super.createCodeMain(module, models, model, {type: SEARCH});
        code += `
      }
    } as SFSchema;
    return searchSchema;
  };
  //列表控件
  @ViewChild('st', {static: false}) st: STComponent;
  //列表定义
  columns: STColumn[] = [`;
        code += super.createCodeMain(module, models, model, {type: COLUMNS});

        code += `
    {
      title: '',
      buttons: [
        // { text: '查看', click: (item: any) => \`/${module.nameLowerLine}/${urlPath}\${item.id}\` },${otherLink}
        {
          text: '编辑', type: 'static',
          component: ${className}EditComponent, params: (item: any) => ({record: item, routeData: this.routeData}), click: 'reload',
          acl: {role: [BaseRole.SYSTEM.value], ability: [${module.name}Permission.${model.nameConstant}_EDIT.value], mode: 'oneOf'}
        },
        {
          text: '删除', click: (item: any) => this.modalService.confirm({
            nzTitle: \`是否确认删除${model.comment}"\${item.${nameField.nameCamel}\}"?\`,
            nzOnOk: () => this.${module.nameCamel}Service.delete${model.name}(${paramInStr}).subscribe(() => {
              this.msgSrv.success('删除成功');
              this.st.reload();
            })
          }),
          acl: {role: [BaseRole.SYSTEM.value], ability: [${module.name}Permission.${model.nameConstant}_DELETE.value], mode: 'oneOf'}
        },
      ]
    }
  ];

  constructor(private route: ActivatedRoute, private modal: ModalHelper, private modalService: NzModalService,
              private msgSrv: NzMessageService${constructorServices}) {
  }

  //页面初始化
  ngOnInit() {
    //获取参数数据${onInit}
    this.searchSchema = this.createSearchSchema();
    this.search();
  }

  //查询数据（查询条件变更）
  search(values?: any) {
    this.param = new ${model.name}SearchParam(values || this.routeParam);
    this.list();
  }

  //列表发生改变
  change(e: STChange) {
    if (e.type === 'pi') {
      this.param.pageIndex = e.pi;
      this.list();
    }
  }

  //获取列表数据
  list() {
    if (this.loading) {
      this.loading.unsubscribe();
    }
    this.loading = this.${module.nameCamel}Service.search${model.name}(this.param.toParam()).pipe(
      finalize(() => (this.loading = null)),
    ).subscribe((result: PageList<${model.name}DTO>) => {
      this.data = result.list;
      this.total = this.param.count ? result.count : this.total;
    });
  }

  //新建
  add() {
    this.modal
      .createStatic(${className}EditComponent, {i: new ${model.name}DTO(), routeData: this.routeData})
      .subscribe(() => this.st.reload());
  }

}
`;
        return code;
    }


    protected createCodeFieldAny(module: Module, models: Model[], model: Model, field: Field, params?: any, typeDefault?: string): string {
        switch (params.type) {
            case SEARCH:
                return this.createCodeFieldSearch(module, models, model, field, params, typeDefault);
            case COLUMNS:
                return this.createCodeFieldColumns(module, models, model, field, params, typeDefault);
        }
    }

    protected createCodeFieldSearch(module: Module, models: Model[], model: Model, field: Field, params?: any, typeDefault?: string) {

        let schemaOther = params.schemaOther ? params.schemaOther : '';
        const fieldOld = params.fieldOld || field;

        delete params.fieldOld;
        delete params.schemaOther;

        if (!(field.search || (fieldOld && fieldOld.search))) {
            return '';
        }

        let type = FieldTypeMap[field.type].sfSchemaType;
        type = type ? type : "string";
        const schemaType = `type: '${type}', `;
        schemaOther = schemaOther || `,
          ui: {widget: 'confirm-${type === 'number' ? 'number' : 'string'}'}`;

        return `
      ${fieldOld.nameCamel}: {
        ${schemaType}title: '${fieldOld.comment}'${schemaOther}
      }, `;
    }

    protected createCodeFieldColumns(module: Module, models: Model[], model: Model, field: Field, params?: any, typeDefault?: string) {
        const schemaOther = params.schemaOther ? params.schemaOther : '';
        const fieldOld = params.fieldOld || field;
        delete params.schemaOther;
        delete params.fieldOld;

        if (['Deleted', 'Creator', 'Updater'].indexOf(field.name) > -1) {
            return "";
        }
        const type = FieldTypeMap[field.type].stSchemaType;
        const schemaType = type ? `, type: '${type}'` : '';
        let indexName = fieldOld.nameCamel;
        if (field.type === FieldTypeEnum.IMAGE.value) {
            indexName = indexName + 'ThumbUrl';
        }


        return `
    {title: '${fieldOld.comment}', index: '${indexName}'${schemaType}${schemaOther}}, `;
    }

    protected createCodeFieldUuid(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        if (params.type === COLUMNS)
            return "";
        return this.createCodeFieldAny(module, models, model, field, params);
    }


    protected createCodeFieldBoolean(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        if (params.type === SEARCH) {
            const labelTrue = ['Status', 'Available'].indexOf(field.name) >= 0 ? "启用" : "是";
            const labelFalse = ['Status', 'Available'].indexOf(field.name) >= 0 ? "停用" : "否";
            params.schemaOther = `,
          //default: true,
          enum: [{value: null, label: '全部'}, {value: true, label: '${labelTrue}'}, {value: false, label: '${labelFalse}'}],
          ui: {widget: 'radio', styleType: 'button'} as SFSelectWidgetSchema`
        }
        return this.createCodeFieldAny(module, models, model, field, params);
    }

    protected createCodeFieldTextContent(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        if (params.type === COLUMNS)
            return "";
        return this.createCodeFieldAny(module, models, model, field, params);
    }

    protected createCodeFieldForeignKey(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        if (params.type === SEARCH) {

            // 外键有可能是联合主键，而联合主键只对第一个字段产生下拉框
            const fkItem = Object.values(getFkMap(model, this.project.modelMap)).find(item => item.fkFields[0] === field);
            if (!fkItem) {
                return "";
            }

            const fkModel = fkItem.model;
            const fkModule = this.project.moduleMap[fkModel.moduleName].module;
            const valueStr = fkItem.fkFields.length > 1 ? 'toValue()' : getField(fkModel, field.typeData).nameCamel;
            const nameField = findNameField(fkModel.fields);
            const commentStr = fkItem.fkFields.length > 1 ? fkItem.comment + fkItem.model.comment : field.comment;
            const defaultStr = `this.routeParam.${fkItem.fkFields.length > 1 ? toCamel(fkItem.name + fkItem.model.name) : field.nameCamel}`;
            // 同一module下，子集管理,不再可以选择。
            const hiddenStr = fkModel.moduleName === model.moduleName ? `
            hidden: !!this.routeParam.${fkItem.fkFields.length > 1 ? toCamel(fkItem.name + fkItem.model.name) : field.nameCamel},` : "";
            const schemaOther = `,
        default: ${defaultStr},
        ui: {
          widget: 'select',${hiddenStr}
          asyncData: () => this.${fkModule.nameCamel}Service.list${fkModel.name}().pipe(map((res: ${fkModel.name}DTO[]) =>
            [{label: '全部${commentStr}', value: ''}, ...res.map(item => ({label: item.${nameField.nameCamel}, value: item.${valueStr}}))]))
        } as SFSelectWidgetSchema`;

            const fieldOld = params.fieldOld || field;
            if (fkItem.fkFields.length > 1 && (field.search || (fieldOld && fieldOld.search))) {
                return `
      ${toCamel(fkItem.name + fkItem.model.name)}: {
        type: 'string', title: '${commentStr}'${schemaOther}
      }, `;
            } else {
                params.schemaOther = schemaOther;
            }

        }
        return this.createCodeFieldAny(module, models, model, field, params);
    }


    protected createCodeFieldForeignField(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        // if (params.type === SEARCH) {
        const modelNew = getModel(this.project.modelMap, field.typeData);
        const fieldNew = getField(modelNew, field.typeData);
        const moduleItem = this.project.moduleMap[modelNew.moduleName];
        params.fieldOld = params.fieldOld || field;
        return this.createCodeField(moduleItem.module, moduleItem.models, modelNew, fieldNew, params);
        // } else {
        //   return this.createCodeFieldAny(module, models, model, field, params);
        // }
    }

    protected createCodeFieldEnum(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        const fkModel = getModel(this.project.modelMap, field.typeData);
        if (params.type === SEARCH) {
            params.schemaOther = `,
        enum: [{value: '', label: '全部${field.comment}'}, ...${fkModel.name}List],
        default: '',
        ui: {widget: 'select'} as SFSelectWidgetSchema`
        } else if (params.type === COLUMNS) {
            params.schemaOther = `, badge: <STColumnBadge>${fkModel.name}Map`
        }
        return this.createCodeFieldAny(module, models, model, field, params);
    }

    protected createCodeFieldEnumText(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        return this.createCodeFieldEnum(module, models, model, field, params);
    }

    protected createCodeFieldForeignObject(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        return "";
    }

    protected createCodeFieldForeignArray(module: Module, models: Model[], model: Model, field: Field, params?: any): string {
        return "";
    }


}
