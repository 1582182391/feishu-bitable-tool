const lark = require('@larksuiteoapi/node-sdk');

class FeishuService {
  constructor() {
    this.client = new lark.Client({
      appId: process.env.FEISHU_APP_ID,
      appSecret: process.env.FEISHU_APP_SECRET,
    });
  }

  /**
   * 验证App Token有效性
   */
  async validateAppToken(appToken) {
    try {
      console.log('验证App Token:', appToken);
      
      const response = await this.client.bitable.app.get({
        path: {
          app_token: appToken,
        },
      });
      
      console.log('App Token验证响应:', JSON.stringify(response, null, 2));
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('App Token验证失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        errorCode: error.response?.data?.code,
      };
    }
  }

  /**
   * 获取表格字段信息
   */
  async getTableFields(appToken, tableId) {
    try {
      const response = await this.client.bitable.appTableField.list({
        path: {
          app_token: appToken,
          table_id: tableId,
        },
      });
      return {
        success: true,
        data: response.data.items,
      };
    } catch (error) {
      console.error('获取表格字段失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 添加表格记录
   */
  async addTableRecord(appToken, tableId, records) {
    try {
      const response = await this.client.bitable.appTableRecord.batchCreate({
        path: {
          app_token: appToken,
          table_id: tableId,
        },
        data: {
          records: records,
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('添加表格记录失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 获取表格记录
   */
  async getTableRecords(appToken, tableId, pageSize = 100) {
    try {
      const response = await this.client.bitable.appTableRecord.list({
        path: {
          app_token: appToken,
          table_id: tableId,
        },
        params: {
          page_size: pageSize,
        },
      });
      return {
        success: true,
        data: response.data.items,
      };
    } catch (error) {
      console.error('获取表格记录失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 删除表格记录
   */
  async deleteTableRecords(appToken, tableId, recordIds) {
    try {
      const response = await this.client.bitable.appTableRecord.batchDelete({
        path: {
          app_token: appToken,
          table_id: tableId,
        },
        data: {
          records: recordIds,
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('删除表格记录失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 导出表格数据
   */
  async exportTableData(appToken, tableId) {
    try {
      // 获取字段信息
      const fieldsResponse = await this.getTableFields(appToken, tableId);
      if (!fieldsResponse.success) {
        return fieldsResponse;
      }

      // 获取记录数据
      const recordsResponse = await this.getTableRecords(appToken, tableId);
      if (!recordsResponse.success) {
        return recordsResponse;
      }

      // 组合导出数据
      const exportData = {
        table_info: {
          app_token: appToken,
          table_id: tableId,
          export_time: new Date().toISOString(),
        },
        fields: fieldsResponse.data,
        records: recordsResponse.data,
        summary: {
          total_fields: fieldsResponse.data.length,
          total_records: recordsResponse.data.length,
        },
      };

      return {
        success: true,
        data: exportData,
      };
    } catch (error) {
      console.error('导出表格数据失败:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 创建新表格
   */
  async createTable(appToken, tableConfig) {
    try {
      console.log('创建表格请求参数:', { appToken, tableConfig });
      
      const response = await this.client.bitable.appTable.create({
        path: {
          app_token: appToken,
        },
        data: {
          table: tableConfig,
        },
      });
      
      console.log('飞书API原始响应:', JSON.stringify(response, null, 2));
      console.log('响应数据结构:', response.data);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('创建表格失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 创建多维表格应用
   */
  async createApp(name, folderToken = null) {
    try {
      console.log('创建应用请求参数:', { name, folderToken });
      
      const response = await this.client.bitable.app.create({
        data: {
          name,
          folder_token: folderToken,
        },
      });
      
      console.log('飞书API原始响应:', JSON.stringify(response, null, 2));
      console.log('响应数据结构:', response.data);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('创建多维表格应用失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 添加表格字段
   */
  async addTableField(appToken, tableId, fieldConfig) {
    try {
      console.log('添加字段请求参数:', { appToken, tableId, fieldConfig });
      
      const response = await this.client.bitable.appTableField.create({
        path: {
          app_token: appToken,
          table_id: tableId,
        },
        data: {
          field_name: fieldConfig.field_name,
          type: fieldConfig.type,
          property: fieldConfig.property || {},
        },
      });
      
      console.log('添加字段API响应:', JSON.stringify(response, null, 2));
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('添加字段失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
        errorCode: error.response?.data?.code,
      };
    }
  }

  /**
   * 修改表格字段
   */
  async updateTableField(appToken, tableId, fieldId, fieldConfig) {
    try {
      console.log('修改字段请求参数:', { appToken, tableId, fieldId, fieldConfig });
      
      const requestData = {
        field_name: fieldConfig.field_name,
        type: fieldConfig.type,
        property: fieldConfig.property || {},
      };
      
      console.log('发送给飞书API的数据:', requestData);
      
      const response = await this.client.bitable.appTableField.update({
        path: {
          app_token: appToken,
          table_id: tableId,
          field_id: fieldId,
        },
        data: requestData,
      });
      
      console.log('修改字段API响应:', JSON.stringify(response, null, 2));
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('修改字段失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      
      // 处理特定的飞书API错误码
      const errorCode = error.response?.data?.code;
      let errorMessage = error.message;
      
      if (errorCode === 99992402) {
        errorMessage = '字段验证失败：字段名称可能包含特殊字符或不符合飞书字段命名规范。请确保字段名称只包含中文、英文、数字和下划线，且长度不超过100个字符。';
      } else if (errorCode === 99991400) {
        errorMessage = '请求参数错误：请检查字段ID、表格ID或应用Token是否正确。';
      } else if (errorCode === 99991403) {
        errorMessage = '权限不足：当前应用没有修改此字段的权限。';
      } else if (errorCode === 99991404) {
        errorMessage = '资源不存在：指定的字段、表格或应用不存在。';
      } else if (errorCode === 99991429) {
        errorMessage = '请求过于频繁：请稍后再试。';
      } else if (error.response?.data?.msg) {
        errorMessage = `飞书API错误：${error.response.data.msg}`;
      }
      
      return {
        success: false,
        error: errorMessage,
        errorCode: errorCode,
        originalError: error.response?.data || error.message,
      };
    }
  }

  /**
   * 更新多维表格元数据（修改表格名称）
   */
  async updateAppMetadata(appToken, name, isAdvanced = false) {
    try {
      console.log('更新表格元数据请求参数:', { appToken, name, isAdvanced });
      
      const requestData = {
        name: name,
        is_advanced: isAdvanced,
      };
      
      console.log('发送给飞书API的数据:', requestData);
      
      const response = await this.client.bitable.app.update({
        path: {
          app_token: appToken,
        },
        data: requestData,
      });
      
      console.log('更新表格元数据API响应:', JSON.stringify(response, null, 2));
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('更新表格元数据失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      
      // 处理特定错误码
      if (error.response?.data?.code) {
        const errorCode = error.response.data.code;
        const errorMsg = error.response.data.msg || error.message;
        
        switch (errorCode) {
          case 91402:
            return {
              success: false,
              error: 'App Token对应的应用不存在，请检查App Token是否正确',
              errorCode,
            };
          case 91403:
            return {
              success: false,
              error: '没有权限修改此表格，请检查应用权限设置',
              errorCode,
            };
          case 91404:
            return {
              success: false,
              error: '表格不存在或已被删除',
              errorCode,
            };
          default:
            return {
              success: false,
              error: `更新失败: ${errorMsg} (错误码: ${errorCode})`,
              errorCode,
            };
        }
      }
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 更新表格名称
   */
  async updateTable(appToken, tableId, tableName) {
    try {
      console.log('更新表格名称请求参数:', { appToken, tableId, tableName });
      
      const requestData = {
        name: tableName,
      };
      
      console.log('发送给飞书API的数据:', requestData);
      
      const response = await this.client.bitable.appTable.patch({
        path: {
          app_token: appToken,
          table_id: tableId,
        },
        data: requestData,
      });
      
      console.log('更新表格名称API响应:', JSON.stringify(response, null, 2));
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('更新表格名称失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      
      // 处理特定的飞书API错误码
      const errorCode = error.response?.data?.code;
      let errorMessage = error.message;
      
      if (errorCode === 99992402) {
        errorMessage = '表格名称验证失败：表格名称可能包含特殊字符或不符合飞书命名规范。请确保表格名称只包含中文、英文、数字和下划线，且长度不超过100个字符。';
      } else if (errorCode === 99991400) {
        errorMessage = '请求参数错误：请检查表格ID或应用Token是否正确。';
      } else if (errorCode === 99991403) {
        errorMessage = '权限不足：当前应用没有修改此表格的权限。';
      } else if (errorCode === 99991404) {
        errorMessage = '资源不存在：指定的表格或应用不存在。';
      } else if (errorCode === 99991429) {
        errorMessage = '请求过于频繁：请稍后再试。';
      } else if (error.response?.data?.msg) {
        errorMessage = `飞书API错误：${error.response.data.msg}`;
      }
      
      return {
        success: false,
        error: errorMessage,
        errorCode: errorCode,
        originalError: error.response?.data || error.message,
      };
    }
  }
}

module.exports = new FeishuService(); 