import {Component, OnInit} from '@angular/core';
import {NzMessageService, NzModalRef} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {
  Field,
  FieldTypeEnum,
  FieldTypeForeignList,
  FieldTypeList,
  FieldTypeMap,
  FieldTypeValueForeignList,
  Model,
  Project
} from "../model.model";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {deepClone} from "@shared/utils/deep-clone";
import {
  createModel,
  getFkMap,
  getModel,
  listEnumTextTypeData,
  listEnumTypeData,
  listForeignFieldTypeData,
  listForeignKeyTypeData,
  listModuleName,
  updateModulesFromModels
} from "../model.helper";
import {toPascal} from "../name.helper";
import {EnumItem} from "@shared/shared";
import {copy} from "@delon/util";

@Component({
  selector: 'app-model-edit',
  styleUrls: ['./model-edit.component.less'],
  templateUrl: './model-edit.component.html',
})
export class ModelEditComponent implements OnInit {

  constructor(private fb: FormBuilder,
              private modal: NzModalRef,
              private msgSrv: NzMessageService,
              public http: _HttpClient,
  ) {
  }

  record: Model;
  project: Project;
  i: Model;
  FieldTypeEnum = FieldTypeEnum;
  FieldTypeList = FieldTypeList;
  FieldTypeMap = FieldTypeMap;
  FieldTypeValueForeignList = FieldTypeValueForeignList;
  selectedFieldIndex = -1;
  modelForm: FormGroup = this.fb.group({
    name: [null, [Validators.required, Validators.pattern(/^[a-zA-Z][a-zA-Z0-9]*$/),
      ((control: AbstractControl) => control.value && this.project.models.some(m => m !== this.record && m.name.toUpperCase() === control.value.trim().toUpperCase()) ? {repeated: true} : null)]],
    comment: [null, [Validators.required]],
    table: [null, [Validators.pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)]],
    module: [null, [Validators.pattern(/^[a-zA-Z][a-zA-Z0-9]*$/)]],
  });
  fieldFormList: { field: Field, form: FormGroup, active?: boolean }[] = [];


  adding = true;
  inited = false;

  moduleNameList: EnumItem[];
  foreignKeyTypeDataList: EnumItem[];
  foreignFieldTypeDataList: EnumItem[];
  enumTypeDataList: EnumItem[];
  enumTextTypeDataList: EnumItem[];

  copyedModel = createModel({fields: []});

  dbclicked = false;

  createFieldForm(field: Field): { field: Field; form: FormGroup; active?: boolean } {
    if (typeof(field.nn) === "undefined") {
      field.nn = true;
    }
    return {
      field, form:
        this.fb.group({
          name: [null, [Validators.required, Validators.pattern(/^[a-zA-Z][a-zA-Z0-9]*$/),
            ((control: AbstractControl) => control.value && this.fieldFormList.some(f => f.form !== control.parent && f.field.name.toUpperCase() === control.value.trim().toUpperCase()) ? {repeated: true} : null)]],
          comment: [null, [Validators.required]],
          type: [null, [Validators.required]],
          dbType: [null, []],
          dbDefault: [null, []],
          typeData: [null, [
            ((control) => {
              if (FieldTypeForeignList.indexOf(field.type) >= 0) {
                if (!control.value) {
                  return {required: true};
                }
                try {
                  getModel(this.project.modelMap, control.value);
                } catch (e) {
                  return {modelError: true};
                }
              }
              return null;
            })]],
        })
    };
  }

  ngOnInit(): void {

    this.moduleNameList = listModuleName(this.project);
    this.foreignKeyTypeDataList = listForeignKeyTypeData(this.project);
    this.foreignFieldTypeDataList = listForeignFieldTypeData(this.project, this.fieldFormList.map((item) => item.field));
    this.enumTypeDataList = listEnumTypeData(this.project);
    this.enumTextTypeDataList = listEnumTextTypeData(this.project);

    if (this.record && this.record.name) {
      this.adding = false;
      this.i = createModel(deepClone(this.record));
    } else if (!this.i) {
      this.i = new Model();
    } else if (this.i ! instanceof Model) {
      this.i = createModel(this.i);
    }
    this.i.fields.forEach((item) => this.fieldFormList.push(this.createFieldForm(item)));
    setTimeout(() => this.inited = true, 0)

  }

  addField(idx?: number) {
    const field = this.createFieldForm(new Field());
    if (typeof(idx) === "undefined") {
      this.fieldFormList.push(field);
    } else {
      this.fieldFormList.splice(idx, 0, field);
    }
  }

  valid(): boolean {
    let valid = this.modelForm.valid;
    this.fieldFormList.forEach((f) => {
      valid = valid && f.form.valid;
    });
    return valid;
  }

  save() {
    this.i.name = toPascal(this.i.name.trim());
    this.i.comment = this.i.comment.trim();
    this.i.fields = this.fieldFormList.map((f) => {
      f.field.name = toPascal(f.field.name.trim());
      f.field.comment = f.field.comment.trim();
      return f.field;
    });
    if (this.i.fields.findIndex((field) => field.pk) < 0) {
      this.msgSrv.error("请至少设置一个字段为主键！");
      return;
    }
    try {
      getFkMap(this.i, this.project.modelMap);
    } catch (e) {
      this.msgSrv.error(e.message);
      return;
    }
    if (this.adding) {
      this.project.models.push(this.i);
    } else {
      this.project.models[this.project.models.indexOf(this.record)] = this.i;
    }
    updateModulesFromModels(this.project);

    // this.msgSrv.success('保存成功');
    this.modal.close(true);
  }

  close() {
    this.modal.destroy();
  }

  deleteField(item: { field: Field; form: FormGroup; active?: boolean }) {
    this.fieldFormList.splice(this.fieldFormList.indexOf(item), 1);
  }

  fieldTypeChange(event, item: { field: Field; form: FormGroup; active?: boolean }) {
    if (this.inited && event) {
      item.field.dbType = FieldTypeMap[event].dbType || "";
      item.field.dbDefault = FieldTypeMap[event].dbDefault || "";
      if (FieldTypeValueForeignList.indexOf(event) >= 0) {
        item.field.pk = false;
        item.field.required = false;
      }
      item.form.patchValue({typeData: null});
    }
  }


  fieldTypeDataChange(event, field: Field) {
    setTimeout(() => {
      this.foreignFieldTypeDataList = listForeignFieldTypeData(this.project, this.fieldFormList.map((item) => item.field));
    }, 0);
  }

  copyField(field: Field, reset?: boolean) {
    if (this.dbclicked) {
      return;
    }
    if (reset) {
      console.log("dbclick")
      this.dbclicked = true;
      this.copyedModel.fields = [];
      this._copyField(field);
      setTimeout(() => {
        this.dbclicked = false;
      }, 800);
    } else {
      console.log("click")
      setTimeout(() => {
        if (!this.dbclicked) {
          this._copyField(field);
        }
      }, 300);
    }
  }

  _copyField(field: Field) {
    if (this.copyedModel.fields.indexOf(field) < 0) {
      this.copyedModel.fields.push(field);
    }
    copy(JSON.stringify(this.copyedModel)).then(() => {
      this.msgSrv.success(`已复制${this.copyedModel.fields.map((f) => f.name).join(", ")}字段，字段区域内按Ctrl+V键粘贴为新字段。`);
      this.msgSrv.info(`点击其他字段复制可以追加，双击某字段复制可以重新开始`);
    });
  }

  pasteField(data: string) {
    try {
      const model = createModel(JSON.parse(data));
      if (this.selectedFieldIndex >= this.fieldFormList.length) {
        this.selectedFieldIndex = -1
      }
      let idx = this.selectedFieldIndex;
      model.fields.forEach(field => {
        if (idx < 0) {
          this.fieldFormList.push(this.createFieldForm(field));
        } else {
          this.fieldFormList.splice(idx, 0, this.createFieldForm(field));
          idx++;
        }
      });

    } catch (e) {
      this.msgSrv.warning(`剪贴板内容不正确，无法粘贴字段。`);
    }
  }
}
