const axios = require('axios');

async function testUpdateField() {
  console.log('🧪 测试修改字段功能...');
  
  // 模拟前端发送的请求
  const testData = {
    appToken: 'test_app_token',
    tableId: 'test_table_id', 
    fieldId: 'test_field_id',
    field_name: '测试字段名称',
    type: 1, // 添加字段类型（1=文本类型）
    property: {}
  };
  
  try {
    console.log('📤 发送请求到后端...');
    console.log('请求数据:', JSON.stringify(testData, null, 2));
    
    const response = await axios.put('http://localhost:3001/api/feishu/field', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ 请求成功');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ 请求失败');
    console.log('错误类型:', error.constructor.name);
    
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('网络错误 - 没有收到响应');
      console.log('请求配置:', error.config);
    } else {
      console.log('请求配置错误:', error.message);
    }
  }
}

// 运行测试
testUpdateField().then(() => {
  console.log('🏁 测试完成');
}).catch(err => {
  console.error('💥 测试脚本错误:', err);
}); 