import {CodeTypeEnum, FkItemGenerator} from "../generator";
import {FkMapItem, Model, Module} from "../../model.model";
import {EnumItem} from "@shared/shared";
import {findNameField, getFkMapOfOther, isModelSameModule} from "../../model.helper";

export class NgComponentSetM2mTsGenerator extends FkItemGenerator {


    protected getType(module?: Module, models?: Model[], model?: Model): EnumItem {
        return CodeTypeEnum.NG;
    }

    protected splitFkItem(module?: Module, models?: Model[], model?: Model): FkMapItem[] {
        return Object.values(getFkMapOfOther(this.project.models, model, this.project.modelMap)).filter(fkItem => fkItem.m2mItem && fkItem.m2mItem.model.moduleName === module.name);
    }

    protected createFkFileDirectory(module?: Module, models?: Model[], model?: Model, fkItem?: FkMapItem): string {
        return `${this.project.nameDirectory}-web-client/src/app/routes/${module.nameLowerLine}/${isModelSameModule(this._project, module.name) ? '' : model.nameLowerLine + '-'}set-${fkItem.model.nameLowerLine}-list${fkItem.name ? '-' + fkItem.nameLowerLine : ''}`;
    }

    protected createFkFileExtension(module?: Module, models?: Model[], model?: Model, fkItem?: FkMapItem): string {
        return "ts";
    }

    protected createFkFileName(module?: Module, models?: Model[], model?: Model, fkItem?: FkMapItem): string {
        return `${isModelSameModule(this.project, module.name) ? '' : model.nameLowerLine + '-'}set-${fkItem.model.nameLowerLine}-list${fkItem.name ? '-' + fkItem.nameLowerLine : ''}.component`;
    }

    protected createFkCode(module?: Module, models?: Model[], model?: Model, fkItem?: FkMapItem): string {

        const fkModel = fkItem.model;
        const otherModule = fkModel.moduleName !== module.name ? this.project.moduleMap[fkModel.moduleName].module : null;
        const fkModule = otherModule || module;
        const fieldPk = model.fields.filter(field => field.pk);
        const fkFieldPk = fkModel.fields.filter(field => field.pk);
        const fkNameField = findNameField(fkModel.fields);
        const otherModuleDTO = otherModule ? `
import {${fkModel.name}DTO} from "@core/${otherModule.nameLowerLine}/${otherModule.nameLowerLine}.model";` : '';
        return `import {Component, OnInit} from '@angular/core';
import {NzModalRef, NzMessageService} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {SFSchema, SFTransferWidgetSchema, SFUISchema} from '@delon/form';
import {${module.name}Service} from "@core/${module.nameLowerLine}/${module.nameLowerLine}.service";${otherModule ? `
import {${otherModule.name}Service} from "@core/${otherModule.nameLowerLine}/${otherModule.nameLowerLine}.service";` : ''}
import {${model.name}DTO${otherModule ? '' : `, ${fkModel.name}DTO`}} from "@core/${module.nameLowerLine}/${module.nameLowerLine}.model";${otherModuleDTO}
import {map} from "rxjs/operators";

@Component({
  selector: 'app-${module.nameLowerLine}-${isModelSameModule(this._project, module.name) ? '' : model.nameLowerLine + '-'}set-${fkModel.nameLowerLine}-list${fkItem.name ? '-' + fkItem.nameLowerLine : ''}',
  templateUrl: './${isModelSameModule(this._project, module.name) ? '' : model.nameLowerLine + '-'}set-${fkModel.nameLowerLine}-list${fkItem.name ? '-' + fkItem.nameLowerLine : ''}.component.html',
})
export class ${module.name}${isModelSameModule(this._project, module.name) ? '' : model.name}Set${fkItem.name}${fkModel.name}ListComponent implements OnInit {
  record: any = {};
  i: { ${fkModel.nameCamel}List: ${fkModel.name}DTO[] };
  schema: SFSchema;
  buildSchema = () => {
    this.schema = {
      properties: {
        ${fkModel.nameCamel}List: {
          type: 'string',
          title: '${fkModel.comment}',
          ui: {
            widget: 'transfer',
            asyncData: () =>
              this.${fkModule.nameCamel}Service.list${fkModel.name}()
                .pipe(map((all) => all.map(item => ({
                  title: item.${fkNameField.nameCamel}, value: item,
                  direction: this.i.${fkModel.nameCamel}List.some(selected => ${fkFieldPk.map(field => `item.${field.nameCamel} === selected.${field.nameCamel}`).join(" && ")}) ? 'right' : 'left'
                })))),
            titles: ['未分配', '已分配'],
            showSearch: true,
            listStyle: { 'width.px': 350, 'height.px': 500 }
          } as SFTransferWidgetSchema,
        }

      },
      required: [],
    };
  };
  ui: SFUISchema = {
    '*': {
      spanLabelFixed: 100,
      grid: {span: 24},
    },
  };

  constructor(
    private modal: NzModalRef, private msgSrv: NzMessageService, public http: _HttpClient,
    private ${module.nameCamel}Service: ${module.name}Service${otherModule ? `, private ${otherModule.nameCamel}Service: ${otherModule.name}Service` : ''}
  ) {
  }

  ngOnInit(): void {
    this.${module.nameCamel}Service.list${fkModel.name}For${model.name}${fkItem.name}(${fieldPk.map(field => `this.record.${field.nameCamel}`).join(", ")})
      .subscribe((owned) => {
        this.buildSchema();
        this.i = {
          ${fkModel.nameCamel}List: owned
        }
      });
  }

  save(value: any) {
    const ${fkModel.nameCamel}List = value.${fkModel.nameCamel}List.map((item) => new ${fkModel.name}DTO({${fkFieldPk.map(field => `${field.nameCamel}: item.${field.nameCamel}`).join(", ")}}));
    this.${module.nameCamel}Service.set${fkModel.name}ListFor${model.name}${fkItem.name}(${fieldPk.map(field => `this.record.${field.nameCamel}`).join(", ")}, ${fkModel.nameCamel}List)
      .subscribe(() => {
        this.msgSrv.success(\`设置${model.comment}的${fkModel.comment}成功\`);
        this.modal.close(value);
      });
  }

  close() {
    this.modal.destroy();
  }
}
`;
    }

}
