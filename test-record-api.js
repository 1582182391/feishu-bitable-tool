const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/feishu';

// 测试配置
const TEST_CONFIG = {
  appToken: 'IFOVb0TrMaKhhyswxVmcX0m7nsh',
  tableId: 'tblQ2NOMkjH2iMg3',
};

async function testRecordOperations() {
  console.log('🚀 开始测试记录操作...\n');

  // 1. 测试添加记录
  console.log('1️⃣ 测试添加记录...');
  try {
    const testData = {
      appToken: TEST_CONFIG.appToken,
      tableId: TEST_CONFIG.tableId,
      records: [
        {
          fields: {
            'ID': '测试ID_' + Date.now(),
            '名称': '测试记录',
            '类型': '自动化测试',
            '描述': '这是一个通过API创建的测试记录',
            '地址': 'http://test.example.com'
          }
        }
      ]
    };

    const response = await axios.post(`${BASE_URL}/records`, testData);
    console.log('✅ 添加记录成功:', response.data);
    
    // 保存记录ID用于后续测试
    if (response.data.success && response.data.data.records) {
      const recordId = response.data.data.records[0].record_id;
      console.log('📝 新记录ID:', recordId);
    }
  } catch (error) {
    console.log('❌ 添加记录失败:', error.response?.data || error.message);
  }
  console.log('');

  // 2. 测试获取记录
  console.log('2️⃣ 测试获取记录...');
  try {
    const response = await axios.get(`${BASE_URL}/records`, {
      params: {
        appToken: TEST_CONFIG.appToken,
        tableId: TEST_CONFIG.tableId
      }
    });
    console.log('✅ 获取记录成功，记录数量:', response.data.data?.length || 0);
    
    // 显示前3条记录的概要
    if (response.data.data && response.data.data.length > 0) {
      console.log('📋 记录概要:');
      response.data.data.slice(0, 3).forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.fields?.ID || 'N/A'}, 名称: ${record.fields?.名称 || 'N/A'}`);
      });
    }
  } catch (error) {
    console.log('❌ 获取记录失败:', error.response?.data || error.message);
  }
  console.log('');

  // 3. 测试导出功能
  console.log('3️⃣ 测试导出功能...');
  try {
    const response = await axios.get(`${BASE_URL}/export`, {
      params: {
        appToken: TEST_CONFIG.appToken,
        tableId: TEST_CONFIG.tableId
      }
    });
    console.log('✅ 导出成功:');
    console.log('   - 字段数量:', response.data.data?.summary?.total_fields || 0);
    console.log('   - 记录数量:', response.data.data?.summary?.total_records || 0);
    console.log('   - 导出时间:', response.data.data?.table_info?.export_time || 'N/A');
  } catch (error) {
    console.log('❌ 导出失败:', error.response?.data || error.message);
  }
  console.log('');

  console.log('🏁 记录操作测试完成');
}

// 运行测试
testRecordOperations().catch(console.error); 