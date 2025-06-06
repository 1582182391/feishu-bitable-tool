const FeishuService = require('./feishuService');

class DataAnalysisService {
  constructor() {
    this.feishuService = new FeishuService();
  }

  /**
   * 分析表格数据统计信息
   */
  async analyzeTableStatistics(appToken, tableId) {
    try {
      // 获取表格字段和记录
      const [fieldsResult, recordsResult] = await Promise.all([
        this.feishuService.getTableFields(appToken, tableId),
        this.feishuService.getTableRecords(appToken, tableId)
      ]);

      if (!fieldsResult.success || !recordsResult.success) {
        return {
          success: false,
          error: '获取表格数据失败'
        };
      }

      const fields = fieldsResult.data;
      const records = recordsResult.data;

      // 基础统计信息
      const basicStats = {
        totalFields: fields.length,
        totalRecords: records.length,
        lastModified: this.getLastModifiedTime(records),
        createdTime: this.getCreatedTime(records)
      };

      // 字段类型分析
      const fieldTypeAnalysis = this.analyzeFieldTypes(fields);

      // 数据质量分析
      const dataQualityAnalysis = this.analyzeDataQuality(fields, records);

      // 数据分布分析
      const dataDistribution = this.analyzeDataDistribution(fields, records);

      return {
        success: true,
        data: {
          basicStats,
          fieldTypeAnalysis,
          dataQualityAnalysis,
          dataDistribution,
          analysisTime: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('数据分析失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成可视化数据
   */
  async generateVisualizationData(appToken, tableId, chartType = 'overview') {
    try {
      const analysisResult = await this.analyzeTableStatistics(appToken, tableId);
      if (!analysisResult.success) {
        return analysisResult;
      }

      const { basicStats, fieldTypeAnalysis, dataDistribution } = analysisResult.data;

      let chartData = {};

      switch (chartType) {
        case 'fieldTypes':
          chartData = this.generateFieldTypeChart(fieldTypeAnalysis);
          break;
        case 'dataQuality':
          chartData = this.generateDataQualityChart(analysisResult.data.dataQualityAnalysis);
          break;
        case 'distribution':
          chartData = this.generateDistributionChart(dataDistribution);
          break;
        case 'overview':
        default:
          chartData = this.generateOverviewChart(basicStats, fieldTypeAnalysis);
          break;
      }

      return {
        success: true,
        data: {
          chartType,
          chartData,
          metadata: {
            generatedAt: new Date().toISOString(),
            totalRecords: basicStats.totalRecords,
            totalFields: basicStats.totalFields
          }
        }
      };
    } catch (error) {
      console.error('生成可视化数据失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 数据洞察生成
   */
  async generateDataInsights(appToken, tableId) {
    try {
      const analysisResult = await this.analyzeTableStatistics(appToken, tableId);
      if (!analysisResult.success) {
        return analysisResult;
      }

      const { basicStats, fieldTypeAnalysis, dataQualityAnalysis } = analysisResult.data;

      const insights = [];

      // 基础洞察
      insights.push({
        type: 'basic',
        title: '数据规模洞察',
        content: `表格包含 ${basicStats.totalFields} 个字段和 ${basicStats.totalRecords} 条记录`,
        importance: 'medium'
      });

      // 字段类型洞察
      const mostCommonFieldType = Object.entries(fieldTypeAnalysis.distribution)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (mostCommonFieldType) {
        insights.push({
          type: 'fieldType',
          title: '字段类型分析',
          content: `最常用的字段类型是 ${this.getFieldTypeName(mostCommonFieldType[0])}，占比 ${((mostCommonFieldType[1] / basicStats.totalFields) * 100).toFixed(1)}%`,
          importance: 'medium'
        });
      }

      // 数据质量洞察
      if (dataQualityAnalysis.emptyFieldsCount > 0) {
        insights.push({
          type: 'dataQuality',
          title: '数据质量提醒',
          content: `发现 ${dataQualityAnalysis.emptyFieldsCount} 个字段存在空值，建议检查数据完整性`,
          importance: 'high'
        });
      }

      // 活跃度洞察
      const daysSinceLastModified = Math.floor(
        (new Date() - new Date(basicStats.lastModified)) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastModified > 7) {
        insights.push({
          type: 'activity',
          title: '数据活跃度',
          content: `表格已 ${daysSinceLastModified} 天未更新，可能需要关注数据时效性`,
          importance: 'medium'
        });
      }

      return {
        success: true,
        data: {
          insights,
          summary: {
            totalInsights: insights.length,
            highImportance: insights.filter(i => i.importance === 'high').length,
            generatedAt: new Date().toISOString()
          }
        }
      };
    } catch (error) {
      console.error('生成数据洞察失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 私有方法：分析字段类型
  analyzeFieldTypes(fields) {
    const distribution = {};
    const typeNames = {};

    fields.forEach(field => {
      const type = field.type;
      distribution[type] = (distribution[type] || 0) + 1;
      typeNames[type] = this.getFieldTypeName(type);
    });

    return {
      distribution,
      typeNames,
      totalTypes: Object.keys(distribution).length
    };
  }

  // 私有方法：分析数据质量
  analyzeDataQuality(fields, records) {
    let emptyFieldsCount = 0;
    let totalCells = 0;
    let emptyCells = 0;

    fields.forEach(field => {
      let fieldEmptyCount = 0;
      records.forEach(record => {
        totalCells++;
        const value = record.fields[field.field_name];
        if (!value || value === '' || value === null || value === undefined) {
          emptyCells++;
          fieldEmptyCount++;
        }
      });
      
      if (fieldEmptyCount > 0) {
        emptyFieldsCount++;
      }
    });

    return {
      emptyFieldsCount,
      totalCells,
      emptyCells,
      completenessRate: totalCells > 0 ? ((totalCells - emptyCells) / totalCells * 100).toFixed(2) : 100
    };
  }

  // 私有方法：分析数据分布
  analyzeDataDistribution(fields, records) {
    const distribution = {};

    fields.forEach(field => {
      const values = records.map(record => record.fields[field.field_name])
        .filter(value => value !== null && value !== undefined && value !== '');
      
      distribution[field.field_name] = {
        fieldType: field.type,
        totalValues: values.length,
        uniqueValues: new Set(values).size,
        duplicateRate: values.length > 0 ? ((values.length - new Set(values).size) / values.length * 100).toFixed(2) : 0
      };
    });

    return distribution;
  }

  // 私有方法：生成字段类型图表数据
  generateFieldTypeChart(fieldTypeAnalysis) {
    return {
      type: 'pie',
      title: '字段类型分布',
      data: Object.entries(fieldTypeAnalysis.distribution).map(([type, count]) => ({
        name: fieldTypeAnalysis.typeNames[type] || `类型${type}`,
        value: count
      }))
    };
  }

  // 私有方法：生成数据质量图表数据
  generateDataQualityChart(dataQualityAnalysis) {
    return {
      type: 'gauge',
      title: '数据完整性',
      data: [{
        name: '完整性',
        value: parseFloat(dataQualityAnalysis.completenessRate)
      }]
    };
  }

  // 私有方法：生成分布图表数据
  generateDistributionChart(dataDistribution) {
    const chartData = Object.entries(dataDistribution)
      .slice(0, 10) // 只显示前10个字段
      .map(([fieldName, data]) => ({
        name: fieldName,
        uniqueValues: data.uniqueValues,
        totalValues: data.totalValues,
        duplicateRate: parseFloat(data.duplicateRate)
      }));

    return {
      type: 'bar',
      title: '字段数据分布',
      data: chartData
    };
  }

  // 私有方法：生成概览图表数据
  generateOverviewChart(basicStats, fieldTypeAnalysis) {
    return {
      type: 'mixed',
      title: '数据概览',
      data: {
        basicStats: {
          records: basicStats.totalRecords,
          fields: basicStats.totalFields,
          types: fieldTypeAnalysis.totalTypes
        },
        fieldTypes: Object.entries(fieldTypeAnalysis.distribution).map(([type, count]) => ({
          name: fieldTypeAnalysis.typeNames[type] || `类型${type}`,
          value: count
        }))
      }
    };
  }

  // 工具方法：获取字段类型名称
  getFieldTypeName(type) {
    const typeMap = {
      1: '多行文本',
      2: '数字',
      3: '单选',
      4: '多选',
      5: '日期',
      7: '复选框',
      11: '人员',
      13: '电话号码',
      15: '超链接',
      17: '附件',
      18: '关联',
      19: '公式',
      20: '创建时间',
      21: '最后更新时间',
      22: '创建人',
      23: '修改人'
    };
    return typeMap[type] || `未知类型(${type})`;
  }

  // 工具方法：获取最后修改时间
  getLastModifiedTime(records) {
    if (!records || records.length === 0) return new Date().toISOString();
    
    const lastModified = Math.max(...records.map(record => record.last_modified_time || 0));
    return new Date(lastModified).toISOString();
  }

  // 工具方法：获取创建时间
  getCreatedTime(records) {
    if (!records || records.length === 0) return new Date().toISOString();
    
    const firstCreated = Math.min(...records.map(record => record.created_time || Date.now()));
    return new Date(firstCreated).toISOString();
  }
}

module.exports = DataAnalysisService; 