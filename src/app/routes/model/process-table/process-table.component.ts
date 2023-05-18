import {Component, OnInit, ViewChild} from '@angular/core';
import {NzModalRef, NzMessageService} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {SFSchema, SFUISchema} from '@delon/form';
import {processTableToModel} from "../model.helper";

@Component({
  selector: 'app-model-process-table',
  templateUrl: './process-table.component.html',
})
export class ModelProcessTableComponent implements OnInit {
  i: any = {
    sql: "CREaTE TABLE \n `archive` (\n" +
      "  `id` varchar(45) NOT NULL,\n" +
      "  `typeId` varchar(45) NOT NULL DEFAULT '' COMMENT '档案类型',\n" +
      "  `nameId` varchar(45) NOT NULL COMMENT ' 档案名称编号',\n" +
      "  `name` varchar(200) NOT NULL DEFAULT '' COMMENT '副名称',\n" +
      "  `number` int(11) NOT NULL DEFAULT '0' COMMENT '会计凭证类 副名称 编号 sum',\n" +
      "  `statRate` enum('month','year','second') NOT NULL COMMENT '统计频率',\n" +
      "  `duration` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '所属期间',\n" +
      "  `cnt` int(11) NOT NULL COMMENT '数量',\n" +
      "  `archiveTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '审核确认日期',\n" +
      "  `store` varchar(200) NOT NULL DEFAULT '' COMMENT '现存放地点',\n" +
      "  `keeper` varchar(100) NOT NULL DEFAULT '' COMMENT '现保管人员',\n" +
      "  `handoverTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '移交时间',\n" +
      "  `handover` int(1) NOT NULL DEFAULT '0' COMMENT '是否接收',\n" +
      "  `sourceTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '原始时间',\n" +
      "  `unitId` varchar(45) NOT NULL DEFAULT '' COMMENT '所在单位',\n" +
      "  `remark` varchar(500) NOT NULL DEFAULT '',\n" +
      "  `createdTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,\n" +
      "  `creater` varchar(45) NOT NULL DEFAULT '',\n" +
      "  `updatedTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,\n" +
      "  `updater` varchar(45) NOT NULL DEFAULT '',\n" +
      "  `auditStatus` int(1) NOT NULL DEFAULT '0' COMMENT '审核状态（0 未审核 1 审核通过 2 审核不通过）',\n" +
      "  `auditTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,\n" +
      "  `auditer` varchar(45) NOT NULL DEFAULT '',\n" +
      "  `auditReson` varchar(500) NOT NULL DEFAULT '' COMMENT '审核不通过理由',\n" +
      "  `deleted` int(1) NOT NULL DEFAULT '0' COMMENT '是否删除(0 未删除, 1 删除)',\n" +
      "  PRIMARY KEY (`id`)\n" +
      ") ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='档案(主要)';\n"
  };

  schema = {
    properties: {
      sql: {type: 'string', title: 'SQL语句'},
    },
    required: ['sql'],
  };

  ui: SFUISchema = {
    '*': {
      spanLabelFixed: 100,
      grid: {span: 12},
    },
    $sql: {
      widget: 'textarea',
      grid: {span: 24},
      autosize: {minRows: 12, maxRows: 24},
      placeholder: "请输入完整的CREAT TABLE SQL语句（仅支持MySQL）"
    },
  };

  constructor(
    private modal: NzModalRef,
    private msgSrv: NzMessageService,
    public http: _HttpClient,
  ) {
  }

  ngOnInit(): void {

  }

  process(value: any) {
    const model = processTableToModel(value.sql);
    this.msgSrv.success('解析SQL语句成功');
    this.modal.close(model);
  }

  close() {
    this.modal.destroy();
  }
}
