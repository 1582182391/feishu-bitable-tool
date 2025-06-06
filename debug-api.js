const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/feishu';

// 测试配置
const TEST_CONFIG = {
  // 从错误日志中看到的App Token
  appToken: 'IFOVb0TrMaKhhyswxVmcX0m7nsh',
  tableId: 'tblQ2NOMkjH2iMg3',
};

async function testAPI() {
  console.log('🚀 开始测试飞书API...\n');

  // 1. 测试App Token验证
  console.log('1️⃣ 测试App Token验证...');
  try {
    const response = await axios.post(`${BASE_URL}/validate-token`, {
      appToken: TEST_CONFIG.appToken
    });
    console.log('✅ App Token验证成功:', response.data);
  } catch (error) {
    console.log('❌ App Token验证失败:', error.response?.data || error.message);
  }
  console.log('');

  // 2. 测试获取字段信息
  console.log('2️⃣ 测试获取字段信息...');
  try {
    const response = await axios.get(`${BASE_URL}/fields`, {
      params: {
        appToken: TEST_CONFIG.appToken,
        tableId: TEST_CONFIG.tableId
      }
    });
    console.log('✅ 获取字段成功:', response.data);
  } catch (error) {
    console.log('❌ 获取字段失败:', error.response?.data || error.message);
  }
  console.log('');

  // 3. 测试创建新表格
  console.log('3️⃣ 测试创建新表格...');
  try {
    const response = await axios.post(`${BASE_URL}/table`, {
      appToken: TEST_CONFIG.appToken,
      name: '测试表格_' + Date.now(),
      fields: [
        { field_name: 'ID', type: 1 },
        { field_name: '名称', type: 1 },
        { field_name: '数量', type: 2 }
      ]
    });
    console.log('✅ 创建表格成功:', response.data);
  } catch (error) {
    console.log('❌ 创建表格失败:', error.response?.data || error.message);
  }
  console.log('');

  // 4. 测试添加字段
  console.log('4️⃣ 测试添加字段...');
  try {
    const response = await axios.post(`${BASE_URL}/field`, {
      appToken: TEST_CONFIG.appToken,
      tableId: TEST_CONFIG.tableId,
      field_name: '调试字段_' + Date.now(),
      type: 1,
      property: {}
    });
    console.log('✅ 添加字段成功:', response.data);
  } catch (error) {
    console.log('❌ 添加字段失败:', error.response?.data || error.message);
  }
  console.log('');

  console.log('🏁 API测试完成');
}

// 运行测试
testAPI().catch(console.error); 