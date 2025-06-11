import React, { useState } from 'react';
import { Layout, Card, Form, Input, Button, message, Modal, Typography, Space, Tag, Row, Col, Alert } from 'antd';
import { SearchOutlined, DatabaseOutlined } from '@ant-design/icons';
import axios from 'axios';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const API_BASE_URL = 'http://localhost:3001/api/feishu';

const App: React.FC = () => {
  const [searchWriteLoading, setSearchWriteLoading] = useState(false);
  const [searchWriteSteps, setSearchWriteSteps] = useState<string[]>([]);
  const [form] = Form.useForm();

  // 搜索+写入功能 - 完整流程
  const handleSearchWrite = async (query: string) => {
    if (!query.trim()) {
      message.error('请输入搜索内容');
      return;
    }

    setSearchWriteLoading(true);
    setSearchWriteSteps([]);
    
    try {
      // 步骤1: AI生成JSON数据（流式输出）
      setSearchWriteSteps(prev => [...prev, '🔍 步骤1: 正在调用AI生成数据...']);
      
      const prompt = `只输出json代码文件，我要粘贴到json代码文件；我现在要创建一个表格，字段有四个，"序号""文本1""文本2""文本3"，将${query}有关的信息，整理为json文件输出`;
      
      // 使用流式请求
      const response = await fetch('https://tbnx.plus7.plus/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-r4J7nzQlvqRjMpH3BHtoHTNMPKnShSgiq7KGuraPcWdmryR6',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      let aiResponse = '';
      let currentStepIndex = 0;
      
      // 添加流式输出显示步骤
      setSearchWriteSteps(prev => [...prev, '📝 AI正在生成内容...']);
      currentStepIndex = 1;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  aiResponse += content;
                  
                  // 实时更新显示内容
                  setSearchWriteSteps(prev => {
                    const newSteps = [...prev];
                    newSteps[currentStepIndex] = `📝 AI正在生成内容...\n${aiResponse.slice(-300)}${aiResponse.length > 300 ? '...' : ''}`;
                    return newSteps;
                  });
                }
              } catch (e) {
                // 忽略解析错误，继续处理下一行
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (!aiResponse) {
        throw new Error('AI响应为空');
      }
      
      // 提取JSON数据
      let extractedJson = '';
      let parsedData: any = null;
      
      try {
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          extractedJson = jsonMatch[1].trim();
        } else {
          const bracketMatch = aiResponse.match(/\[[\s\S]*\]/);
          if (bracketMatch) {
            extractedJson = bracketMatch[0];
          } else {
            extractedJson = aiResponse;
          }
        }
        
        parsedData = JSON.parse(extractedJson);
        setSearchWriteSteps(prev => [...prev, `✅ 步骤1完成: 成功生成${Array.isArray(parsedData) ? parsedData.length : 1}条数据`]);
        
      } catch (parseError) {
        throw new Error('JSON数据解析失败');
      }
      
      // 步骤2: 创建多维表格应用
      setSearchWriteSteps(prev => [...prev, '🏗️ 步骤2: 正在创建多维表格应用...']);
      
      const appResponse = await axios.post(`${API_BASE_URL}/app`, {
        name: query
      });
      
      if (!appResponse.data.success) {
        throw new Error(`创建应用失败: ${appResponse.data.error}`);
      }
      
      const appData = appResponse.data.data;
      const newAppToken = appData.app?.app_token;
      
      if (!newAppToken) {
        console.error('App响应数据结构:', appData);
        throw new Error('未能获取App Token，请检查飞书API响应');
      }
      
      setSearchWriteSteps(prev => [...prev, `✅ 步骤2完成: 应用"${query}"创建成功`]);
      
      // 步骤3: 获取默认表格ID（用于后续删除）
      setSearchWriteSteps(prev => [...prev, '📋 步骤3: 正在获取默认表格信息...']);
      
      // 获取应用中的表格列表
      const tablesResponse = await axios.get(`${API_BASE_URL}/tables`, {
        params: { appToken: newAppToken }
      });
      
      if (!tablesResponse.data.success) {
        throw new Error(`获取表格列表失败: ${tablesResponse.data.error}`);
      }
      
      const tables = tablesResponse.data.data;
      if (!tables || tables.length === 0) {
        throw new Error('应用中没有找到默认表格');
      }
      
      // 记录默认表格ID
      const defaultTable = tables[0];
      const defaultTableId = defaultTable.table_id;
      
      setSearchWriteSteps(prev => [...prev, `✅ 步骤3完成: 已获取默认表格信息`]);
      
      // 步骤4: 创建新的数据表格
      setSearchWriteSteps(prev => [...prev, '🔧 步骤4: 正在创建新的数据表格...']);
      
      const tableResponse = await axios.post(`${API_BASE_URL}/table`, {
        appToken: newAppToken,
        name: query,
        fields: [
          { field_name: "序号", type: 1 },
          { field_name: "文本1", type: 1 },
          { field_name: "文本2", type: 1 },
          { field_name: "文本3", type: 1 },
        ],
      });
      
      if (!tableResponse.data.success) {
        throw new Error(`创建表格失败: ${tableResponse.data.error}`);
      }
      
      const tableData = tableResponse.data.data;
      const newTableId = tableData.table_id;
      
      if (!newTableId) {
        console.error('Table响应数据结构:', tableData);
        throw new Error('未能获取Table ID，请检查飞书API响应');
      }
      
      setSearchWriteSteps(prev => [...prev, `✅ 步骤4完成: 新表格"${query}"创建成功`]);
      
      // 步骤5: 批量导入数据
      setSearchWriteSteps(prev => [...prev, '📝 步骤5: 正在批量导入数据...']);
      
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        const batchSize = 5;
        let successCount = 0;
        
        for (let i = 0; i < parsedData.length; i += batchSize) {
          const batch = parsedData.slice(i, i + batchSize);
          
          try {
            // 构建批量记录数据
            const records = batch.map(item => {
              const recordData: any = {};
              
              if (item.序号) recordData['序号'] = String(item.序号);
              if (item.文本1) recordData['文本1'] = String(item.文本1);
              if (item.文本2) recordData['文本2'] = String(item.文本2);
              if (item.文本3) recordData['文本3'] = String(item.文本3);
              
              return {
                fields: recordData
              };
            });
            
            const recordResponse = await axios.post(`${API_BASE_URL}/records`, {
              appToken: newAppToken,
              tableId: newTableId,
              records: records
            });
            
            if (recordResponse.data.success) {
              successCount += batch.length;
            }
            
            // 添加延迟避免API限流
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (recordError) {
            console.error('导入记录批次失败:', recordError);
            setSearchWriteSteps(prev => [...prev, `⚠️ 批次 ${Math.floor(i/batchSize) + 1} 导入失败，继续下一批次...`]);
          }
          
          setSearchWriteSteps(prev => [...prev, `📊 已处理 ${Math.min(i + batchSize, parsedData.length)}/${parsedData.length} 条数据...`]);
        }
        
        setSearchWriteSteps(prev => [...prev, `✅ 步骤5完成: 成功导入${successCount}条数据`]);
      }
      
      // 步骤6: 删除默认表格
      setSearchWriteSteps(prev => [...prev, '🗑️ 步骤6: 正在删除默认表格...']);
      
      try {
        const deleteResponse = await axios.delete(`${API_BASE_URL}/table`, {
          data: {
            appToken: newAppToken,
            tableId: defaultTableId
          }
        });
        
        if (deleteResponse.data.success) {
          setSearchWriteSteps(prev => [...prev, `✅ 步骤6完成: 默认表格已删除`]);
        } else {
          setSearchWriteSteps(prev => [...prev, `⚠️ 步骤6: 删除默认表格失败，但不影响使用`]);
        }
      } catch (deleteError) {
        console.error('删除默认表格失败:', deleteError);
        setSearchWriteSteps(prev => [...prev, `⚠️ 步骤6: 删除默认表格失败，但不影响使用`]);
      }
      
      // 步骤7: 生成访问链接
      setSearchWriteSteps(prev => [...prev, '🔗 步骤7: 正在生成访问链接...']);
      
      // 生成飞书表格链接
      const feishuUrl = `https://bytedance.feishu.cn/base/${newAppToken}`;
      
      setSearchWriteSteps(prev => [...prev, '🎉 搜索+写入流程完成！']);
      setSearchWriteSteps(prev => [...prev, `🔗 访问链接: ${feishuUrl}`]);
      
      // 显示成功弹窗
      Modal.success({
        title: `"${query}" 搜索+写入完成`,
        content: (
          <div>
            <p style={{ marginBottom: 16 }}>🎉 已成功完成完整流程：</p>
            <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
              <li>✅ AI生成了{Array.isArray(parsedData) ? parsedData.length : 1}条数据</li>
              <li>✅ 创建了多维表格应用"{query}"</li>
              <li>✅ 创建了干净的数据表格"{query}"（只有一个表格）</li>
              <li>✅ 批量导入了所有数据</li>
              <li>✅ 删除了默认表格</li>
            </ul>
            <div style={{ 
              background: '#f0f9ff', 
              padding: '12px', 
              borderRadius: '6px',
              border: '1px solid #0ea5e9'
            }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#0369a1' }}>
                🔗 飞书表格链接：
              </p>
              <a 
                href={feishuUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#0ea5e9', 
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}
              >
                {feishuUrl}
              </a>
            </div>
          </div>
        ),
        width: 600,
        okText: '确定'
      });
      
    } catch (error: any) {
      console.error('搜索+写入失败:', error);
      setSearchWriteSteps(prev => [...prev, `❌ 错误: ${error.message || '操作失败'}`]);
      message.error(`搜索+写入失败: ${error.message || '请检查网络连接'}`);
    } finally {
      setSearchWriteLoading(false);
    }
  };

  const onFinish = (values: any) => {
    handleSearchWrite(values.query);
  };

        return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="center">
              <DatabaseOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                飞书搜索+写入工具
              </Title>
                </Space>
          </Col>
          <Col>
            <Tag color="blue">精简版</Tag>
          </Col>
        </Row>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12} xl={10}>
          <Card 
            title={
              <Space>
                  <SearchOutlined />
                  搜索+写入
              </Space>
            }
              style={{ marginBottom: 24 }}
          >
                <Alert
                message="功能说明"
                description="输入任何内容，AI将自动生成相关数据，创建飞书多维表格应用和表格，并批量导入数据。完成后提供可直接访问的飞书表格链接。"
                  type="info"
                  showIcon
                style={{ marginBottom: 24 }}
                />
                
                <Form
                form={form}
                  layout="vertical"
                onFinish={onFinish}
                size="large"
                >
                  <Form.Item
                  label="搜索内容"
                  name="query"
                    rules={[
                    { required: true, message: '请输入搜索内容' },
                    { min: 2, message: '搜索内容至少需要2个字符' },
                    { max: 50, message: '搜索内容不能超过50个字符' }
                  ]}
                >
                  <Input
                    placeholder="例如：手机产品、员工信息、任务列表等"
                      autoFocus
                    />
                  </Form.Item>
                  
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                    loading={searchWriteLoading}
                  icon={<DatabaseOutlined />}
                    size="large"
                    block
                >
                    {searchWriteLoading ? '执行中...' : '开始搜索+写入'}
                </Button>
              </Form.Item>
            </Form>

              {searchWriteSteps.length > 0 && (
          <Card 
                  title="执行步骤" 
                  size="small" 
                  style={{ marginTop: 16 }}
                >
                  <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                    {searchWriteSteps.map((step, index) => (
                      <div 
                        key={index} 
                        style={{ 
                          padding: '8px 0', 
                          borderBottom: index < searchWriteSteps.length - 1 ? '1px solid #f0f0f0' : 'none',
                          color: step.includes('❌') ? '#ff4d4f' : 
                                 step.includes('✅') ? '#52c41a' : 
                                 step.includes('🔗') ? '#1890ff' : '#666'
                        }}
                      >
                        {step.includes('\n') ? (
                <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                              {step.split('\n')[0]}
                </div>
                            <div style={{ 
                              background: '#f5f5f5', 
                              padding: '8px', 
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              whiteSpace: 'pre-wrap',
                              maxHeight: '150px',
                              overflow: 'auto',
                              border: '1px solid #e8e8e8'
                            }}>
                              {step.split('\n').slice(1).join('\n')}
                </div>
              </div>
            ) : (
                          step
                        )}
              </div>
                    ))}
                          </div>
              </Card>
            )}
              </Card>

            <Card title="使用说明" size="small">
                  <Space direction="vertical" size="middle">
                    <Text>
                  <strong>🔍 搜索+写入功能：</strong>从想法到表格的完整自动化流程
                    </Text>
                    <Text>
                  <strong>📋 7个步骤：</strong>
                  <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
                    <li>AI生成结构化数据（支持流式输出）</li>
                    <li>创建飞书多维表格应用</li>
                    <li>获取默认表格ID（用于后续删除）</li>
                    <li>创建新的数据表格</li>
                    <li>批量导入生成的数据</li>
                    <li>删除默认表格</li>
                    <li>生成可访问的表格链接</li>
                  </ol>
                    </Text>
                    <Text>
                  <strong>🤖 AI模型：</strong>DeepSeek Chat (deepseek-v3)
                    </Text>
                    <Text>
                  <strong>📊 表格结构：</strong>序号、文本1、文本2、文本3
                    </Text>
                    <Text type="secondary">
                  注意：请确保后端服务已启动 (http://localhost:3001)
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Content>
    </Layout>
  );
};

export default App;