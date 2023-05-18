import {Component, OnInit} from '@angular/core';
import {NzMessageService, NzModalRef} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {Model, Project} from "../model.model";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {deepClone} from "@shared/utils/deep-clone";
import {listModuleName, updateModulesFromModels} from "../model.helper";
import {toPascal, toUpperUnderline} from "../name.helper";
import {EnumItem} from "@shared/shared";
import {isNumber} from "util";

@Component({
  selector: 'app-model-enum-edit',
  styleUrls: ['./model-enum-edit.component.less'],
  templateUrl: './model-enum-edit.component.html',
})
export class ModelEnumEditComponent implements OnInit {

  constructor(private fb: FormBuilder,
              private modal: NzModalRef,
              private msgSrv: NzMessageService,
              public http: _HttpClient,
  ) {
  }

  record: Model;
  project: Project;
  i: Model;

  modelForm: FormGroup = this.fb.group({
    name: [null, [Validators.required, Validators.pattern(/^[a-zA-Z][a-zA-Z0-9]*$/),
      ((control: AbstractControl) => control.value && this.project.models.some(m => m !== this.record && m.name.toUpperCase() === control.value.trim().toUpperCase()) ? {repeated: true} : null)]],
    comment: [null, [Validators.required]],
    enumType: [null, [Validators.required]],
    module: [null, [Validators.pattern(/^[a-zA-Z][a-zA-Z0-9]*$/),
      ((control: AbstractControl) => !this.project || this.project.moduleMap[control.value || this.i.moduleName] && this.project.moduleMap[control.value || this.i.moduleName].models.some(model => !model.enum) ? null : {noModel: true})]],
  });
  enumItemFormList: { enumItem: EnumItem, form: FormGroup, active?: boolean }[] = [];


  adding = true;
  inited = false;

  moduleNameList: EnumItem[];

  createEnumItemForm(enumItem: EnumItem): { enumItem: EnumItem; form: FormGroup; active?: boolean } {
    return {
      enumItem, form:
        this.fb.group({
          key: [null, [Validators.required, Validators.pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/),
            ((control: AbstractControl) => control.value && this.enumItemFormList.some(f => f.form !== control.parent && f.enumItem.key.toUpperCase() === control.value.trim().toUpperCase()) ? {repeated: true} : null)]],
          value: [null, [Validators.required]],
          label: [null, [Validators.required]]
        })
    };
  }

  ngOnInit(): void {
    this.moduleNameList = listModuleName(this.project);
    if (this.record && this.record.name) {
      this.adding = false;
      this.i = deepClone(this.record);
      this.i.enumItems.forEach((item) => this.enumItemFormList.push(this.createEnumItemForm(item)));
    } else if (!this.i) {
      this.i = new Model();
      this.i.enum = true;
      this.i.enumType = 'number';
      this.i.enumItems = [];
    }
    setTimeout(() => this.inited = true, 0)

  }

  addEnumItem() {
    this.enumItemFormList.push(this.createEnumItemForm({value: '', label: '', key: ''}));
  }

  valid(): boolean {
    let valid = this.modelForm.valid;
    this.enumItemFormList.forEach((item) => {
      valid = valid && item.form.valid;
    });
    return valid;
  }

  save() {
    this.i.name = toPascal(this.i.name).trim();
    this.i.comment = this.i.comment.trim();
    this.i.enumItems = this.enumItemFormList.map((item) => {
      item.enumItem.key = toUpperUnderline(item.enumItem.key).trim();
      if (this.i.enumType === 'string' && item.enumItem.value.trim) {
        item.enumItem.value = item.enumItem.value.trim();
      }
      item.enumItem.label = item.enumItem.label.trim();
      return item.enumItem;
    });
    if (this.i.enumItems.length < 1) {
      this.msgSrv.error("请至少设置一个枚举项！");
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

  deleteEnumItem(item: { enumItem: EnumItem; form: FormGroup; active?: boolean }) {
    this.enumItemFormList.splice(this.enumItemFormList.indexOf(item), 1);
  }

  enumTypeChange(event) {
    if (event === 'number') {
      this.enumItemFormList.forEach((item) =>
        isNumber(item.enumItem.value) ? null : item.enumItem.value = "");
    }
  }
}
