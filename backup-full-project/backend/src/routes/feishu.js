const express = require('express');
const Joi = require('joi');
const feishuService = require('../services/feishuService');

const router = express.Router();

// 数据验证模式
const schemas = {
  getFields: Joi.object({
    appToken: Joi.string().required(),
    tableId: Joi.string().required(),
  }),
  addRecord: Joi.object({
    appToken: Joi.string().required(),
    tableId: Joi.string().required(),
    records: Joi.array().items(
      Joi.object({
        fields: Joi.object().required(),
      })
    ).required(),
  }),
  createTable: Joi.object({
    appToken: Joi.string().required(),
    name: Joi.string().required(),
    fields: Joi.array().items(
      Joi.object({
        field_name: Joi.string().required(),
        type: Joi.number().required(),
      })
    ).required(),
  }),
  createApp: Joi.object({
    name: Joi.string().required(),
    folderToken: Joi.string().optional(),
  }),
  addField: Joi.object({
    appToken: Joi.string().required(),
    tableId: Joi.string().required(),
    field_name: Joi.string().required(),
    type: Joi.number().required(),
    property: Joi.object().optional(),
  }),
  updateField: Joi.object({
    appToken: Joi.string().required(),
    tableId: Joi.string().required(),
    fieldId: Joi.string().required(),
    field_name: Joi.string().required(),
    type: Joi.number().required(),
    property: Joi.object().optional(),
  }),
  updateApp: Joi.object({
    appToken: Joi.string().required(),
    name: Joi.string().required(),
    isAdvanced: Joi.boolean().optional(),
  }),
  updateTable: Joi.object({
    appToken: Joi.string().required(),
    tableId: Joi.string().required(),
    tableName: Joi.string().required(),
  }),
};

/**
 * 获取表格字段信息
 */
router.get('/fields', async (req, res) => {
  try {
    const { error, value } = schemas.getFields.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { appToken, tableId } = value;
    const result = await feishuService.getTableFields(appToken, tableId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

/**
 * 添加表格记录
 */
router.post('/records', async (req, res) => {
  try {
    const { error, value } = schemas.addRecord.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { appToken, tableId, records } = value;
    const result = await feishuService.addTableRecord(appToken, tableId, records);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

/**
 * 获取表格记录
 */
router.get('/records', async (req, res) => {
  try {
    const { error, value } = schemas.getFields.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { appToken, tableId } = value;
    const result = await feishuService.getTableRecords(appToken, tableId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

/**
 * 创建新表格
 */
router.post('/table', async (req, res) => {
  try {
    const { error, value } = schemas.createTable.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { appToken, name, fields } = value;
    const tableConfig = {
      name,
      default_view_name: name,
      fields,
    };
    
    const result = await feishuService.createTable(appToken, tableConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

/**
 * 创建多维表格应用
 */
router.post('/app', async (req, res) => {
  try {
    const { error, value } = schemas.createApp.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { name, folderToken } = value;
    const result = await feishuService.createApp(name, folderToken);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

/**
 * 删除表格记录
 */
router.delete('/records', async (req, res) => {
  try {
    const deleteSchema = Joi.object({
      appToken: Joi.string().required(),
      tableId: Joi.string().required(),
      recordIds: Joi.array().items(Joi.string()).required(),
    });

    const { error, value } = deleteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { appToken, tableId, recordIds } = value;
    const result = await feishuService.deleteTableRecords(appToken, tableId, recordIds);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

/**
 * 导出表格数据
 */
router.get('/export', async (req, res) => {
  try {
    const { error, value } = schemas.getFields.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { appToken, tableId } = value;
    const result = await feishuService.exportTableData(appToken, tableId);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

/**
 * 验证App Token有效性
 */
router.get('/validate-app', async (req, res) => {
  try {
    const validateSchema = Joi.object({
      appToken: Joi.string().required(),
    });

    const { error, value } = validateSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { appToken } = value;
    const result = await feishuService.validateAppToken(appToken);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

/**
 * 添加表格字段
 */
router.post('/field', async (req, res) => {
  try {
    const { error, value } = schemas.addField.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { appToken, tableId, field_name, type, property } = value;
    const fieldConfig = {
      field_name,
      type,
      property,
    };
    
    const result = await feishuService.addTableField(appToken, tableId, fieldConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

/**
 * 修改表格字段
 */
router.put('/field', async (req, res) => {
  try {
    console.log('收到修改字段请求:', req.body);
    
    const { error, value } = schemas.updateField.validate(req.body);
    if (error) {
      console.log('参数验证失败:', error.details[0].message);
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { appToken, tableId, fieldId, field_name, type, property } = value;
    console.log('验证通过，调用服务:', { appToken: appToken.substring(0, 10) + '...', tableId, fieldId, field_name, type, property });
    
    const fieldConfig = {
      field_name,
      type,
      property,
    };
    
    const result = await feishuService.updateTableField(appToken, tableId, fieldId, fieldConfig);
    console.log('服务返回结果:', result);
    
    res.json(result);
  } catch (error) {
    console.error('修改字段路由错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

/**
 * 验证App Token
 */
router.post('/validate-token', async (req, res) => {
  try {
    const validateTokenSchema = Joi.object({
      appToken: Joi.string().required(),
    });

    const { error, value } = validateTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { appToken } = value;
    const result = await feishuService.validateAppToken(appToken);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

/**
 * 修改表格名称
 */
router.put('/table', async (req, res) => {
  try {
    console.log('收到修改表格名称请求:', req.body);
    
    const { error, value } = schemas.updateTable.validate(req.body);
    if (error) {
      console.log('参数验证失败:', error.details[0].message);
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { appToken, tableId, tableName } = value;
    console.log('验证通过，调用服务:', { appToken: appToken.substring(0, 10) + '...', tableId, tableName });
    
    const result = await feishuService.updateTable(appToken, tableId, tableName);
    console.log('服务返回结果:', result);
    
    res.json(result);
  } catch (error) {
    console.error('修改表格名称路由错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

/**
 * 更新多维表格元数据（修改表格名称）
 */
router.put('/app', async (req, res) => {
  try {
    console.log('收到更新表格元数据请求:', req.body);
    
    const { error, value } = schemas.updateApp.validate(req.body);
    if (error) {
      console.log('参数验证失败:', error.details[0].message);
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { appToken, name, isAdvanced } = value;
    console.log('验证通过，调用服务:', { appToken: appToken.substring(0, 10) + '...', name, isAdvanced });
    
    const result = await feishuService.updateAppMetadata(appToken, name, isAdvanced);
    console.log('服务返回结果:', result);
    
    res.json(result);
  } catch (error) {
    console.error('更新表格元数据路由错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
    });
  }
});

module.exports = router; 