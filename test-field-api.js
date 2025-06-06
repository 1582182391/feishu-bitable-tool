const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/feishu';

// 测试数据
const testData = {
  appToken: 'IFOVb0TrMaKhhyswxVmcX0m7nsh', // 使用您刚创建的有效App Token
  tableId: 'tblQ2NOMkjH2iMg3', // 使用您刚创建的有效Table ID
  testFieldId: 'fldeKWVcbk', // 刚才添加成功的字段ID
};

/**
 * 测试添加字段API
 */
async function testAddField() {
  console.log('\n🧪 测试添加字段API...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/field`, {
      appToken: testData.appToken,
      tableId: testData.tableId,
      field_name: '新测试字段',
      type: 2, // 数字类型
      property: {}
    });
    
    console.log('✅ 添加字段成功:', response.data);
    return response.data.data?.field?.field_id;
  } catch (error) {
    console.error('❌ 添加字段失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 测试修改字段API
 */
async function testUpdateField(fieldId) {
  if (!fieldId) {
    console.log('⚠️  跳过修改字段测试（没有有效的字段ID）');
    return;
  }
  
  console.log('\n🧪 测试修改字段API...');
  
  try {
    const response = await axios.put(`${API_BASE_URL}/field`, {
      appToken: testData.appToken,
      tableId: testData.tableId,
      fieldId: fieldId,
      field_name: '修改后的字段名称',
      property: {}
    });
    
    console.log('✅ 修改字段成功:', response.data);
  } catch (error) {
    console.error('❌ 修改字段失败:', error.response?.data || error.message);
  }
}

/**
 * 测试获取字段列表（验证字段是否添加成功）
 */
async function testGetFields() {
  console.log('\n🧪 测试获取字段列表...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/fields`, {
      params: {
        appToken: testData.appToken,
        tableId: testData.tableId
      }
    });
    
    console.log('✅ 获取字段列表成功:');
    response.data.data?.forEach((field, index) => {
      console.log(`  ${index + 1}. ${field.field_name} (ID: ${field.field_id}, 类型: ${field.type})`);
    });
    
    return response.data.data;
  } catch (error) {
    console.error('❌ 获取字段列表失败:', error.response?.data || error.message);
    return [];
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始测试字段管理API...');
  console.log('📋 测试配置:', testData);
  
  // 1. 先获取当前字段列表
  console.log('\n📋 当前字段列表:');
  await testGetFields();
  
  // 2. 测试修改现有字段
  await testUpdateField(testData.testFieldId);
  
  // 3. 获取字段列表，验证修改是否成功
  console.log('\n📋 修改字段后的字段列表:');
  await testGetFields();
  
  // 4. 测试添加新字段
  const newFieldId = await testAddField();
  
  // 5. 再次获取字段列表，验证添加是否成功
  if (newFieldId) {
    console.log('\n📋 添加新字段后的字段列表:');
    await testGetFields();
  }
  
  console.log('\n✨ 测试完成！');
}

// 运行测试
runTests().catch(console.error); 