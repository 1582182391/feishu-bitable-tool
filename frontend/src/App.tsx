import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Form,
  Input,
  Button,
  message,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Spin,
  Alert,
  Tag,
  Menu,
  Modal,
  Table,
  Popconfirm,
  Select,
  Checkbox,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  SendOutlined,
  ReloadOutlined,
  TableOutlined,
  AppstoreAddOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  MenuOutlined,
  StarOutlined,
  SettingOutlined,
  EditOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  UploadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

interface TableField {
  field_id: string;
  field_name: string;
  type: number;
  property?: any;
}

interface FormData {
  [key: string]: string;
}

interface TableRecord {
  record_id: string;
  fields: any;
  created_time: number;
  last_modified_time: number;
}

interface SavedTableRecord {
  id: string;
  appName: string;
  tableName: string;
  appToken: string;
  tableId: string;
  createdAt: number;
  lastUsed: number;
}

const API_BASE_URL = 'http://localhost:3001/api/feishu';
const STORAGE_KEY = 'feishu_table_records';

const App: React.FC = () => {
  const [form] = Form.useForm();
  const [configForm] = Form.useForm();
  const [createAppForm] = Form.useForm();
  const [createTableForm] = Form.useForm();
  const [updateFieldForm] = Form.useForm();
  const [updateTableNameForm] = Form.useForm();
  const [oneClickCreateForm] = Form.useForm();
  const [aiGenerateForm] = Form.useForm();
  const [importJsonForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [tableFields, setTableFields] = useState<TableField[]>([]);
  const [tableRecords, setTableRecords] = useState<TableRecord[]>([]);
  const [savedTableRecords, setSavedTableRecords] = useState<SavedTableRecord[]>([]);
  const [appToken, setAppToken] = useState('');
  const [tableId, setTableId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [currentFunction, setCurrentFunction] = useState('addRecord');
  const [collapsed, setCollapsed] = useState(false);
  const [aiGenerateModalVisible, setAiGenerateModalVisible] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [jsonData, setJsonData] = useState<any[]>([]);
  const [jsonImporting, setJsonImporting] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchWriteQuery, setSearchWriteQuery] = useState('');
  const [searchWriteLoading, setSearchWriteLoading] = useState(false);
  const [searchWriteSteps, setSearchWriteSteps] = useState<string[]>([]);

  // 功能菜单项
  const menuItems = [
    {
      key: 'allTables',
      icon: <UnorderedListOutlined />,
      label: '全部表格',
    },
    {
      key: 'search',
      icon: <SearchOutlined />,
      label: '搜索',
    },
    {
      key: 'searchWrite',
      icon: <DatabaseOutlined />,
      label: '搜索+写入',
    },
    {
      key: 'oneClickCreate',
      icon: <StarOutlined />,
      label: '一键创建表格',
    },
    {
      key: 'aiGenerate',
      icon: <StarOutlined />,
      label: 'AI智能填充',
    },
    {
      key: 'importJson',
      icon: <UploadOutlined />,
      label: 'JSON文件导入',
    },
    {
      key: 'aiChat',
      icon: <StarOutlined />,
      label: 'AI实时对话',
    },
    {
      key: 'manualGroup',
      icon: <SettingOutlined />,
      label: '手动修改',
      children: [
        {
          key: 'createApp',
          icon: <AppstoreAddOutlined />,
          label: '创建多维表格',
        },
        {
          key: 'createTable',
          icon: <DatabaseOutlined />,
          label: '添加一张表',
        },
        {
          key: 'updateTableName',
          icon: <EditOutlined />,
          label: '修改表格名称',
        },
        {
          key: 'updateField',
          icon: <EditOutlined />,
          label: '修改字段',
        },
        {
          key: 'exportTable',
          icon: <DownloadOutlined />,
          label: '导出多维表格',
        },
        {
          key: 'addRecord',
          icon: <PlusOutlined />,
          label: '添加表记录',
        },
        {
          key: 'deleteRecord',
          icon: <DeleteOutlined />,
          label: '删除表记录',
        },
      ],
    },
  ];

  // 初始化时加载保存的表格记录
  useEffect(() => {
    loadSavedTableRecords();
  }, []);

  // 表格记录存储工具函数
  const saveTableRecord = (record: Omit<SavedTableRecord, 'id' | 'createdAt' | 'lastUsed'>) => {
    try {
      const existingRecords = getSavedTableRecords();
      
      // 检查是否已存在相同的记录
      const existingIndex = existingRecords.findIndex(
        r => r.appToken === record.appToken && r.tableId === record.tableId
      );
      
      if (existingIndex !== -1) {
        // 更新现有记录
        existingRecords[existingIndex] = {
          ...existingRecords[existingIndex],
          ...record,
          lastUsed: Date.now(),
        };
      } else {
        // 添加新记录
        const newRecord: SavedTableRecord = {
          ...record,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          lastUsed: Date.now(),
        };
        existingRecords.unshift(newRecord);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingRecords));
      setSavedTableRecords(existingRecords);
      return true;
    } catch (error) {
      console.error('保存表格记录失败:', error);
      return false;
    }
  };

  const getSavedTableRecords = (): SavedTableRecord[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('读取表格记录失败:', error);
      return [];
    }
  };

  const loadSavedTableRecords = () => {
    const records = getSavedTableRecords();
    setSavedTableRecords(records);
  };

  const deleteSavedTableRecord = (id: string) => {
    try {
      const existingRecords = getSavedTableRecords();
      const filteredRecords = existingRecords.filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));
      setSavedTableRecords(filteredRecords);
      message.success('表格记录已删除');
    } catch (error) {
      console.error('删除表格记录失败:', error);
      message.error('删除失败');
    }
  };

  // 更新最后使用时间
  const updateLastUsed = (appToken: string, tableId: string) => {
    try {
      const savedTables = JSON.parse(localStorage.getItem('savedTables') || '[]');
      const updatedTables = savedTables.map((table: any) => {
        if (table.appToken === appToken && table.tableId === tableId) {
          return {
            ...table,
            lastUsed: Date.now()
          };
        }
        return table;
      });
      localStorage.setItem('savedTables', JSON.stringify(updatedTables));
      setSavedTableRecords(updatedTables);
    } catch (error) {
      console.error('更新最后使用时间失败:', error);
    }
  };

  // 快速连接表格
  const handleQuickConnect = async (record: SavedTableRecord) => {
    configForm.setFieldsValue({
      appToken: record.appToken,
      tableId: record.tableId,
    });
    setAppToken(record.appToken);
    setTableId(record.tableId);
    
    // 更新最后使用时间
    updateLastUsed(record.appToken, record.tableId);
    
    // 获取字段信息
    await fetchTableFields(record.appToken, record.tableId);
    
    // 如果当前功能需要记录数据，也获取记录
    if (currentFunction === 'deleteRecord' || currentFunction === 'exportTable') {
      await fetchTableRecords(record.appToken, record.tableId);
    }
    
    message.success(`已连接到表格: ${record.tableName}`);
  };

  // 获取表格字段信息
  const fetchTableFields = async (appToken: string, tableId: string) => {
    setFieldsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/fields`, {
        params: { appToken, tableId },
      });

      if (response.data.success) {
        console.log('🔍 飞书API返回的原始字段顺序:', response.data.data.map((field: TableField, index: number) => ({
          index: index + 1,
          field_name: field.field_name,
          field_id: field.field_id,
          type: field.type
        })));
        setTableFields(response.data.data || []);
        setIsConfigured(true);
        message.success('表格字段加载成功！');
      } else {
        message.error(`加载失败: ${response.data.error}`);
        setTableFields([]);
        setIsConfigured(false);
      }
    } catch (error: any) {
      console.error('获取字段失败:', error);
      message.error('网络错误，请检查后端服务是否启动');
      setTableFields([]);
      setIsConfigured(false);
    } finally {
      setFieldsLoading(false);
    }
  };

  // 获取表格记录
  const fetchTableRecords = async (appToken: string, tableId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/records`, {
        params: { appToken, tableId },
      });

      if (response.data.success) {
        setTableRecords(response.data.data || []);
        message.success('表格记录加载成功！');
      } else {
        message.error(`加载失败: ${response.data.error}`);
        setTableRecords([]);
      }
    } catch (error: any) {
      console.error('获取记录失败:', error);
      message.error('网络错误，请检查后端服务是否启动');
      setTableRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // 配置表格连接
  const handleConfigSubmit = async (values: any) => {
    const { appToken, tableId } = values;
    setAppToken(appToken);
    setTableId(tableId);
    
    // 只有当appToken和tableId都存在时才获取字段信息
    if (appToken && tableId) {
      await fetchTableFields(appToken, tableId);
      if (currentFunction === 'deleteRecord' || currentFunction === 'exportTable') {
        await fetchTableRecords(appToken, tableId);
      }
    } else if (appToken && !tableId) {
      // 只有appToken，没有tableId的情况（比如刚创建应用）
      message.info('App Token已设置，请输入Table ID后连接表格');
      setIsConfigured(false);
      setTableFields([]);
    } else {
      message.error('请输入完整的配置信息');
      setIsConfigured(false);
      setTableFields([]);
    }
  };

  // 验证App Token有效性
  const validateAppToken = async (appToken: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/validate-app`, {
        params: { appToken },
      });
      return response.data;
    } catch (error: any) {
      console.error('验证App Token失败:', error);
      return { success: false, error: '验证失败' };
    }
  };

  // 创建多维表格应用
  const handleCreateApp = async (values: any) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/app`, values);

      console.log('创建应用响应:', response.data); // 添加调试信息

      if (response.data.success) {
        message.success('多维表格应用创建成功！');
        
        // 获取返回的数据
        const responseData = response.data.data;
        console.log('返回数据:', responseData); // 调试信息
        
        // 尝试从不同可能的字段中提取app_token
        let appToken = null;
        if (responseData) {
          appToken = responseData.app_token || 
                    responseData.appToken || 
                    responseData.token ||
                    responseData.app?.app_token ||
                    responseData.app?.token;
        }
        
        console.log('提取的App Token:', appToken); // 调试信息
        
        // 构建显示内容
        const displayContent = (
          <div>
            <p><strong>应用名称:</strong> {values.name}</p>
            {appToken && (
              <p><strong>App Token:</strong> <span style={{color: '#1890ff', fontWeight: 'bold'}}>{appToken}</span></p>
            )}
            {responseData?.url && (
              <p><strong>应用URL:</strong> <a href={responseData.url} target="_blank" rel="noopener noreferrer">{responseData.url}</a></p>
            )}
            {!appToken && (
              <div style={{ marginTop: 16, padding: 12, background: '#fff2e8', border: '1px solid #ffbb96', borderRadius: 4 }}>
                <p style={{ color: '#d46b08', margin: 0 }}>
                  <strong>注意:</strong> 未能自动提取App Token，请从下方完整数据中手动复制
                </p>
              </div>
            )}
            {responseData && (
              <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <p><strong>完整返回数据:</strong></p>
                <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );

        Modal.success({
          title: '应用创建成功',
          content: displayContent,
          width: 600,
        });
        
        createAppForm.resetFields();
        
        // 如果有app_token，自动设置到配置中
        if (appToken) {
          configForm.setFieldsValue({
            appToken: appToken,
            tableId: ''
          });
          setAppToken(appToken);
          setTableId('');
          setIsConfigured(false);
          setTableFields([]);
          message.info('已自动填入新创建的App Token，请输入Table ID后连接表格');
        } else {
          message.warning('请从弹窗中手动复制App Token到配置区域');
        }
      } else {
        message.error(`创建失败: ${response.data.error}`);
      }
    } catch (error: any) {
      console.error('创建应用失败:', error);
      message.error('创建失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 创建表格
  const handleCreateTable = async (values: any) => {
    if (!appToken) {
      message.error('请先配置App Token');
      return;
    }

    setLoading(true);
    try {
      // 先验证App Token有效性
      message.info('正在验证App Token...');
      const validateResult = await validateAppToken(appToken);
      
      if (!validateResult.success) {
        message.error(`App Token验证失败: ${validateResult.error}`);
        if (validateResult.errorCode === 91402) {
          message.error('App Token对应的应用不存在，请检查App Token是否正确');
        }
        return;
      }
      
      message.success('App Token验证成功，正在创建表格...');
      
      const tableData = {
        appToken,
        name: values.tableName,
        fields: [
          { field_name: "序号", type: 1 },
          { field_name: "文本1", type: 1 },
          { field_name: "文本2", type: 1 },
          { field_name: "文本3", type: 1 },
        ],
      };

      const response = await axios.post(`${API_BASE_URL}/table`, tableData);

      console.log('创建表格响应:', response.data); // 添加调试信息

      if (response.data.success) {
        message.success('表格创建成功！');
        
        // 获取返回的数据
        const responseData = response.data.data;
        console.log('返回数据:', responseData); // 调试信息
        
        // 尝试从不同可能的字段中提取table_id
        let tableId = null;
        if (responseData) {
          tableId = responseData.table_id || 
                   responseData.tableId || 
                   responseData.id ||
                   responseData.table?.table_id ||
                   responseData.table?.id;
        }
        
        console.log('提取的Table ID:', tableId); // 调试信息
        
        // 保存表格记录到localStorage
        if (tableId) {
          const saved = saveTableRecord({
            appName: '未知应用', // 这里可以从应用信息中获取，暂时使用默认值
            tableName: values.tableName,
            appToken: appToken,
            tableId: tableId,
          });
          
          if (saved) {
            console.log('表格记录已保存到本地存储');
          }
        }
        
        // 构建显示内容
        const displayContent = (
          <div>
            <p><strong>表格名称:</strong> {values.tableName}</p>
            {tableId && (
              <p><strong>Table ID:</strong> <span style={{color: '#1890ff', fontWeight: 'bold'}}>{tableId}</span></p>
            )}
            {responseData?.app_token && (
              <p><strong>App Token:</strong> {responseData.app_token}</p>
            )}
            {responseData?.url && (
              <p><strong>表格URL:</strong> <a href={responseData.url} target="_blank" rel="noopener noreferrer">{responseData.url}</a></p>
            )}
            {!tableId && (
              <div style={{ marginTop: 16, padding: 12, background: '#fff2e8', border: '1px solid #ffbb96', borderRadius: 4 }}>
                <p style={{ color: '#d46b08', margin: 0 }}>
                  <strong>注意:</strong> 未能自动提取Table ID，请从下方完整数据中手动复制
                </p>
              </div>
            )}
            {responseData && (
              <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <p><strong>完整返回数据:</strong></p>
                <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );

        Modal.success({
          title: '表格创建成功',
          content: displayContent,
          width: 600,
        });
        
        createTableForm.resetFields();
        
        // 如果有table_id，自动设置到配置中
        if (tableId) {
          configForm.setFieldsValue({
            appToken: appToken,
            tableId: tableId
          });
          setAppToken(appToken);
          setTableId(tableId);
          message.info('已自动填入新创建的Table ID，正在连接表格...');
          // 自动获取字段信息
          await fetchTableFields(appToken, tableId);
        } else {
          message.warning('请从弹窗中手动复制Table ID到配置区域');
        }
      } else {
        message.error(`创建失败: ${response.data.error}`);
      }
    } catch (error: any) {
      console.error('创建表格失败:', error);
      if (error.response?.data?.code === 91402) {
        message.error('App Token对应的应用不存在，请检查App Token是否正确');
      } else {
        message.error('创建失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  // 一键创建表格（应用+表格）
  const handleOneClickCreate = async (values: any) => {
    setLoading(true);
    try {
      const { name } = values;
      
      // 第一步：创建应用
      message.info('正在创建多维表格应用...');
      const appResponse = await axios.post(`${API_BASE_URL}/app`, { name });

      if (!appResponse.data.success) {
        message.error(`创建应用失败: ${appResponse.data.error}`);
        return;
      }

      // 提取app_token
      const appData = appResponse.data.data;
      const newAppToken = appData?.app_token || 
                         appData?.appToken || 
                         appData?.token ||
                         appData?.app?.app_token ||
                         appData?.app?.token;

      if (!newAppToken) {
        message.error('创建应用成功，但未能获取App Token，请手动创建表格');
        Modal.error({
          title: '应用创建成功，但需要手动操作',
          content: (
            <div>
              <p>应用已创建成功，但系统未能自动提取App Token。</p>
              <p>请从以下数据中手动复制App Token：</p>
              <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto', background: '#f5f5f5', padding: '12px' }}>
                {JSON.stringify(appData, null, 2)}
              </pre>
            </div>
          ),
          width: 600,
        });
        return;
      }

      message.success('应用创建成功，正在创建表格...');

      // 第二步：在新应用中创建表格
      const tableData = {
        appToken: newAppToken,
        name: name, // 使用相同的名称
        fields: [
          { field_name: "序号", type: 1 },
          { field_name: "文本1", type: 1 },
          { field_name: "文本2", type: 1 },
          { field_name: "文本3", type: 1 },
        ],
      };

      const tableResponse = await axios.post(`${API_BASE_URL}/table`, tableData);

      if (!tableResponse.data.success) {
        message.error(`创建表格失败: ${tableResponse.data.error}`);
        // 即使表格创建失败，也显示应用信息
        Modal.warning({
          title: '应用创建成功，表格创建失败',
          content: (
            <div>
              <p><strong>应用名称:</strong> {name}</p>
              <p><strong>App Token:</strong> <span style={{color: '#1890ff', fontWeight: 'bold'}}>{newAppToken}</span></p>
              <p style={{color: '#d46b08'}}>请手动在此应用中创建表格。</p>
            </div>
          ),
          width: 600,
        });
        return;
      }

      // 提取table_id
      const tableData_response = tableResponse.data.data;
      const newTableId = tableData_response?.table_id || 
                        tableData_response?.tableId || 
                        tableData_response?.id ||
                        tableData_response?.table?.table_id ||
                        tableData_response?.table?.id;

      // 保存表格记录到localStorage
      if (newTableId) {
        const saved = saveTableRecord({
          appName: name,
          tableName: name,
          appToken: newAppToken,
          tableId: newTableId,
        });
        
        if (saved) {
          console.log('表格记录已保存到本地存储');
        }
      }

      // 成功创建应用和表格
      message.success('一键创建完成！应用和表格已创建成功');
      
      // 显示成功信息
      const displayContent = (
        <div>
          <p><strong>应用名称:</strong> {name}</p>
          <p><strong>表格名称:</strong> {name}</p>
          <p><strong>App Token:</strong> <span style={{color: '#1890ff', fontWeight: 'bold'}}>{newAppToken}</span></p>
          {newTableId && (
            <p><strong>Table ID:</strong> <span style={{color: '#1890ff', fontWeight: 'bold'}}>{newTableId}</span></p>
          )}
          <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
            <p style={{ color: '#52c41a', margin: 0 }}>
              ✅ 已自动连接到新创建的表格，可以直接开始使用！
            </p>
          </div>
        </div>
      );

      Modal.success({
        title: '一键创建成功',
        content: displayContent,
        width: 600,
      });

      oneClickCreateForm.resetFields();

      // 自动设置配置并连接表格
      if (newTableId) {
        configForm.setFieldsValue({
          appToken: newAppToken,
          tableId: newTableId
        });
        setAppToken(newAppToken);
        setTableId(newTableId);
        
        // 自动获取字段信息并连接
        await fetchTableFields(newAppToken, newTableId);
        message.success('已自动连接到新创建的表格，可以开始添加数据！');
      } else {
        // 即使没有tableId，也设置appToken
        configForm.setFieldsValue({
          appToken: newAppToken,
          tableId: ''
        });
        setAppToken(newAppToken);
        setTableId('');
        setIsConfigured(false);
        setTableFields([]);
        message.warning('请从弹窗中手动复制Table ID到配置区域');
      }

    } catch (error: any) {
      console.error('一键创建失败:', error);
      message.error('一键创建失败，请检查网络连接或手动创建');
    } finally {
      setLoading(false);
    }
  };

  // 提交数据到飞书表格
  const handleSubmit = async (values: FormData) => {
    if (!appToken || !tableId) {
      message.error('请先配置表格信息');
      return;
    }

    setLoading(true);
    try {
      const records = [
        {
          fields: values,
        },
      ];

      const response = await axios.post(`${API_BASE_URL}/records`, {
        appToken,
        tableId,
        records,
      });

      if (response.data.success) {
        message.success('数据写入成功！');
        form.resetFields();
      } else {
        message.error(`写入失败: ${response.data.error}`);
      }
    } catch (error: any) {
      console.error('提交失败:', error);
      message.error('提交失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 删除记录
  const handleDeleteRecord = async (recordId: string) => {
    if (!appToken || !tableId) {
      message.error('请先配置表格信息');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/records`, {
        data: {
          appToken,
          tableId,
          recordIds: [recordId],
        },
      });

      if (response.data.success) {
        message.success('记录删除成功！');
        await fetchTableRecords(appToken, tableId);
      } else {
        message.error(`删除失败: ${response.data.error}`);
      }
    } catch (error: any) {
      console.error('删除失败:', error);
      message.error('删除失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 导出表格
  const handleExportTable = async () => {
    if (!appToken || !tableId) {
      message.error('请先配置表格信息');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/export`, {
        params: { appToken, tableId },
      });

      if (response.data.success) {
        // 创建下载链接
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `table_${tableId}_export.json`;
        link.click();
        URL.revokeObjectURL(url);
        message.success('表格导出成功！');
      } else {
        message.error(`导出失败: ${response.data.error}`);
      }
    } catch (error: any) {
      console.error('导出失败:', error);
      message.error('导出失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 重新加载字段
  const handleReloadFields = () => {
    if (appToken && tableId) {
      fetchTableFields(appToken, tableId);
      if (currentFunction === 'deleteRecord' || currentFunction === 'exportTable') {
        fetchTableRecords(appToken, tableId);
      }
    }
  };

  // 获取字段类型显示名称
  const getFieldTypeName = (type: number) => {
    const typeMap: { [key: number]: string } = {
      1: '文本',
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
      21: '修改时间',
      22: '创建人',
      23: '修改人',
    };
    return typeMap[type] || `类型${type}`;
  };

  // 字段重要性排序
  const sortFieldsByImportance = (fields: TableField[]) => {
    const importantFields = ['序号', '文本1', '文本2', '文本3'];
    const sorted = [...fields].sort((a, b) => {
      const aIndex = importantFields.indexOf(a.field_name);
      const bIndex = importantFields.indexOf(b.field_name);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      } else if (aIndex !== -1) {
        return -1;
      } else if (bIndex !== -1) {
        return 1;
      } else {
        return a.field_name.localeCompare(b.field_name);
      }
    });
    return sorted;
  };

  // 判断字段是否为必填
  const isRequiredField = (fieldName: string) => {
    const requiredFields = ['序号', '文本1'];
    return requiredFields.includes(fieldName);
  };

  // 渲染字段输入组件
  const renderFieldInput = (field: TableField) => {
    const placeholder = `请输入${field.field_name}`;
    
    switch (field.type) {
      case 1: // 文本
        return <Input placeholder={placeholder} showCount maxLength={200} />;
      case 2: // 数字
        return <Input type="number" placeholder={placeholder} />;
      case 5: // 日期
        return <Input type="date" placeholder={`请选择${field.field_name}`} />;
      case 13: // 电话号码
        return <Input placeholder={placeholder} maxLength={20} />;
      case 15: // 超链接
        return <Input placeholder="请输入完整的URL地址" type="url" />;
      default:
        return <TextArea rows={2} placeholder={placeholder} showCount maxLength={500} />;
    }
  };

  // 字段分组
  const groupFields = (fields: TableField[]) => {
    const coreFields = ['序号', '文本1', '文本2', '文本3'];
    const core: TableField[] = [];
    const others: TableField[] = [];
    
    sortFieldsByImportance(fields).forEach(field => {
      if (coreFields.includes(field.field_name)) {
        core.push(field);
      } else {
        others.push(field);
      }
    });
    
    return { core, others };
  };

  // 修改字段
  const handleUpdateField = async (values: any) => {
    if (!appToken || !tableId) {
      message.error('请先配置表格信息');
      return;
    }

    setLoading(true);
    try {
      const { fieldId, field_name, property } = values;
      
      // 获取选中字段的完整信息
      const selectedField = tableFields.find(field => field.field_id === fieldId);
      if (!selectedField) {
        message.error('未找到选中的字段信息');
        return;
      }
      
      // 处理property字段 - 如果是字符串则解析为JSON
      let parsedProperty = {};
      if (property) {
        try {
          parsedProperty = typeof property === 'string' ? JSON.parse(property) : property;
        } catch (error) {
          message.error('字段属性格式错误，请输入有效的JSON格式');
          return;
        }
      }
      
      const response = await axios.put(`${API_BASE_URL}/field`, {
        appToken,
        tableId,
        fieldId,
        field_name,
        type: selectedField.type, // 添加字段类型
        property: parsedProperty,
      });

      if (response.data.success) {
        message.success('字段修改成功！');
        updateFieldForm.resetFields();
        // 重新获取字段信息
        await fetchTableFields(appToken, tableId);
      } else {
        message.error(`修改失败: ${response.data.error}`);
      }
    } catch (error: any) {
      console.error('修改字段失败:', error);
      if (error.response?.data?.error) {
        message.error(`修改失败: ${error.response.data.error}`);
      } else {
        message.error('修改失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  // 修改表格名称
  const handleUpdateTableName = async (values: any) => {
    if (!appToken || !tableId) {
      message.error('请先配置表格信息');
      return;
    }

    setLoading(true);
    try {
      const { tableName } = values;
      
      const response = await axios.put(`${API_BASE_URL}/table`, {
        appToken,
        tableId,
        tableName,
      });

      if (response.data.success) {
        message.success('表格名称修改成功！');
        updateTableNameForm.resetFields();
        
        // 更新本地保存的表格记录中的表格名称
        const savedRecords = getSavedTableRecords();
        const updatedRecords = savedRecords.map(record => {
          if (record.appToken === appToken && record.tableId === tableId) {
            return { ...record, tableName };
          }
          return record;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
        setSavedTableRecords(updatedRecords);
      } else {
        message.error(`修改失败: ${response.data.error}`);
      }
    } catch (error: any) {
      console.error('修改表格名称失败:', error);
      if (error.response?.data?.error) {
        message.error(`修改失败: ${error.response.data.error}`);
      } else {
        message.error('修改失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  // AI生成内容
  const handleAIGenerate = async (values: any) => {
    setAiGenerating(true);
    try {
      const { prompt, autoSubmit } = values;
      
      // 模拟AI生成延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟AI生成内容 - 这里可以替换为真正的AI API调用
      const generateContent = (prompt: string) => {
        const templates = {
          '产品': {
            序号: () => Math.floor(Math.random() * 1000) + 1,
            文本1: () => {
              const products = ['智能手机', '笔记本电脑', '无线耳机', '智能手表', '平板电脑', '游戏手柄', '智能音箱', '数码相机'];
              return products[Math.floor(Math.random() * products.length)];
            }
          },
          '人员': {
            序号: () => Math.floor(Math.random() * 100) + 1,
            文本1: () => {
              const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
              return names[Math.floor(Math.random() * names.length)];
            }
          },
          '任务': {
            序号: () => Math.floor(Math.random() * 50) + 1,
            文本1: () => {
              const tasks = ['完成项目文档', '代码审查', '测试功能', '部署上线', '需求分析', '设计原型', '数据分析', '用户调研'];
              return tasks[Math.floor(Math.random() * tasks.length)];
            }
          },
          '城市': {
            序号: () => Math.floor(Math.random() * 200) + 1,
            文本1: () => {
              const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉'];
              return cities[Math.floor(Math.random() * cities.length)];
            }
          }
        };
        
        // 根据prompt关键词选择模板
        let selectedTemplate = templates['产品']; // 默认模板
        
        for (const [key, template] of Object.entries(templates)) {
          if (prompt.includes(key)) {
            selectedTemplate = template;
            break;
          }
        }
        
        return {
          序号: selectedTemplate.序号().toString(),
          文本1: selectedTemplate.文本1()
        };
      };
      
      const generatedContent = generateContent(prompt);
      
      // 将生成的内容填充到主表单
      form.setFieldsValue(generatedContent);
      
      if (autoSubmit) {
        // 如果选择了自动提交，直接提交到飞书表格
        message.success('AI内容生成成功！正在提交到飞书表格...');
        setAiGenerateModalVisible(false);
        aiGenerateForm.resetFields();
        
        // 直接调用提交函数
        await handleSubmit(generatedContent);
      } else {
        // 仅填充表单
        message.success('AI内容生成成功！已填充到表单中');
        setAiGenerateModalVisible(false);
        aiGenerateForm.resetFields();
      }
      
    } catch (error: any) {
      console.error('AI生成失败:', error);
      message.error('AI生成失败，请重试');
    } finally {
      setAiGenerating(false);
    }
  };

  // JSON文件导入处理
  const handleJsonFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // 验证JSON数据格式
        if (!Array.isArray(data)) {
          message.error('JSON文件格式错误：根元素必须是数组');
          return;
        }
        
        // 验证每个对象是否包含必要字段
        const requiredFields = ['序号', '文本1', '文本2', '文本3'];
        const validData = data.filter((item, index) => {
          if (typeof item !== 'object' || item === null) {
            console.warn(`第${index + 1}行数据不是有效对象，已跳过`);
            return false;
          }
          
          const hasRequiredFields = requiredFields.some(field => 
            item.hasOwnProperty(field) && item[field] !== null && item[field] !== undefined
          );
          
          if (!hasRequiredFields) {
            console.warn(`第${index + 1}行数据缺少必要字段，已跳过`);
            return false;
          }
          
          return true;
        });
        
        if (validData.length === 0) {
          message.error('JSON文件中没有有效数据。请确保数据包含"序号"、"文本1"、"文本2"、"文本3"字段');
          return;
        }
        
        setJsonData(validData);
        message.success(`成功解析JSON文件，共${validData.length}条有效数据${data.length > validData.length ? `（跳过${data.length - validData.length}条无效数据）` : ''}`);
        
      } catch (error) {
        console.error('JSON解析失败:', error);
        message.error('JSON文件格式错误，请检查文件内容');
      }
    };
    
    reader.onerror = () => {
      message.error('文件读取失败');
    };
    
    reader.readAsText(file, 'UTF-8');
    return false; // 阻止默认上传行为
  };

  // 批量导入JSON数据到飞书表格
  const handleBatchImportJson = async () => {
    if (!isConfigured) {
      message.error('请先配置并连接表格');
      return;
    }
    
    if (jsonData.length === 0) {
      message.error('请先上传并解析JSON文件');
      return;
    }
    
    setJsonImporting(true);
    let successCount = 0;
    let failCount = 0;
    
    try {
      message.info(`开始批量导入${jsonData.length}条数据...`);
      
      // 分批处理，每批5条数据
      const batchSize = 5;
      for (let i = 0; i < jsonData.length; i += batchSize) {
        const batch = jsonData.slice(i, i + batchSize);
        
        try {
          // 构建批量记录数据
          const records = batch.map(item => ({
            fields: {
              序号: item.序号?.toString() || '',
              文本1: item.文本1?.toString() || '',
              文本2: item.文本2?.toString() || '',
              文本3: item.文本3?.toString() || '',
            }
          }));
          
          const response = await axios.post(`${API_BASE_URL}/records`, {
            appToken,
            tableId,
            records,
          });
          
          if (response.data.success) {
            successCount += batch.length;
            message.success(`批次${Math.floor(i / batchSize) + 1}导入成功（${batch.length}条）`);
          } else {
            failCount += batch.length;
            console.error(`批次${Math.floor(i / batchSize) + 1}导入失败:`, response.data.error);
          }
          
          // 批次间延迟，避免API限流
          if (i + batchSize < jsonData.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          failCount += batch.length;
          console.error(`批次${Math.floor(i / batchSize) + 1}导入失败:`, error);
        }
      }
      
      // 显示最终结果
      if (successCount > 0) {
        message.success(`批量导入完成！成功：${successCount}条${failCount > 0 ? `，失败：${failCount}条` : ''}`);
        
        // 清空已导入的数据
        setJsonData([]);
        importJsonForm.resetFields();
        
        // 如果当前在删除记录页面，刷新记录列表
        if (currentFunction === 'deleteRecord') {
          await fetchTableRecords(appToken, tableId);
        }
      } else {
        message.error(`批量导入失败！所有${failCount}条数据都导入失败`);
      }
      
    } catch (error: any) {
      console.error('批量导入过程中出现错误:', error);
      message.error('批量导入过程中出现错误');
    } finally {
      setJsonImporting(false);
    }
  };

  // AI聊天功能
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const response = await axios.post('https://tbnx.plus7.plus/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          ...chatMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': 'Bearer sk-r4J7nzQlvqRjMpH3BHtoHTNMPKnShSgiq7KGuraPcWdmryR6',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      if (response.data.choices && response.data.choices[0]) {
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.choices[0].message.content,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setChatMessages(prev => [...prev, aiMessage]);
      }
      
    } catch (error: any) {
      console.error('AI聊天失败:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '抱歉，我现在无法回复。请稍后再试。',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setChatMessages(prev => [...prev, errorMessage]);
             // message.error('AI聊天失败，请检查网络连接');
    } finally {
      setChatLoading(false);
    }
  };

  // 清空聊天记录
  const handleClearChat = () => {
    setChatMessages([]);
    message.success('聊天记录已清空');
  };

  // 处理修改字段表单验证失败
  const handleUpdateFieldFailed = (errorInfo: any) => {
    console.log('修改字段表单验证失败:', errorInfo);
    const missingFields = errorInfo.errorFields.map((field: any) => field.name[0]).join('、');
    message.error(`请填写必填字段: ${missingFields}`);
  };

  // 通用表单验证失败处理
  const handleFormValidationFailed = (errorInfo: any, formName: string) => {
    console.log(`${formName}表单验证失败:`, errorInfo);
    
    // 为修改表格名称功能添加专门的错误提示
    if (formName === '修改表格名称') {
      message.error('请在输入框中输入新的表格名称');
      return;
    }
    
    const missingFields = errorInfo.errorFields.map((field: any) => {
      const fieldName = field.name[0];
      const fieldLabel = field.errors[0] || fieldName;
      return fieldLabel.replace('请输入', '').replace('请选择', '');
    }).join('、');
    message.error(`请检查表单: ${missingFields}`);
  };

  // 渲染不同功能的内容
  const renderFunctionContent = () => {
    switch (currentFunction) {
      case 'oneClickCreate':
        return (
          <Card title="一键创建表格">
            <Alert
              message="一键创建说明"
              description="输入一个名称，系统将自动创建多维表格应用和表格，应用名称和表格名称将使用相同的名字，创建完成后自动连接。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form
              form={oneClickCreateForm}
              layout="vertical"
              onFinish={handleOneClickCreate}
              onFinishFailed={(errorInfo) => handleFormValidationFailed(errorInfo, '一键创建表格')}
            >
              <Form.Item
                label="应用和表格名称"
                name="name"
                rules={[
                  { required: true, message: '请输入名称' },
                  { max: 100, message: '名称不能超过100个字符' },
                  { min: 1, message: '名称不能为空' }
                ]}
                hasFeedback
              >
                <Input 
                  placeholder="请输入应用和表格的名称（将使用相同名称）" 
                  showCount
                  maxLength={100}
                  autoFocus
                />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<StarOutlined />}
                    size="large"
                  >
                    一键创建
                  </Button>
                  <Button
                    onClick={() => oneClickCreateForm.resetFields()}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
            
            <Divider />
            
            <Alert
              message="功能特点"
              description={
                <div>
                  <p>• <strong>一步到位：</strong>同时创建应用和表格，无需分别操作</p>
                  <p>• <strong>统一命名：</strong>应用和表格使用相同名称，便于管理</p>
                  <p>• <strong>自动连接：</strong>创建完成后自动连接到新表格</p>
                  <p>• <strong>即用即创：</strong>创建完成即可开始添加数据</p>
                  <p>• <strong>默认字段：</strong>自动创建序号、文本1、文本2、文本3四个字段</p>
                </div>
              }
              type="success"
              showIcon
            />
          </Card>
        );

      case 'aiGenerate':
        return (
          <Card 
            title={
              <Space>
                <StarOutlined />
                AI智能填充
                {isConfigured && <Tag color="green">已连接表格</Tag>}
              </Space>
            }
          >
            {isConfigured ? (
              <div>
                <Alert
                  message="AI智能填充说明"
                  description={
                    <div>
                      <p>使用AI根据提示词自动生成内容并直接提交到飞书表格。支持多种内容类型：产品、人员、任务、城市等。</p>
                      <p><strong>当前连接表格：</strong>{tableFields.length} 个字段可用于填充</p>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                <Form
                  form={aiGenerateForm}
                  layout="vertical"
                  onFinish={handleAIGenerate}
                  onFinishFailed={(errorInfo) => handleFormValidationFailed(errorInfo, 'AI智能填充')}
                >
                  <Form.Item
                    label="提示词 (Prompt)"
                    name="prompt"
                    rules={[
                      { required: true, message: '请输入提示词' },
                      { min: 2, message: '提示词至少需要2个字符' },
                      { max: 200, message: '提示词不能超过200个字符' }
                    ]}
                    hasFeedback
                  >
                    <TextArea
                      placeholder="请输入描述性的提示词，例如：&#10;• 生成产品信息&#10;• 生成人员名单&#10;• 生成任务列表&#10;• 生成城市数据"
                      rows={4}
                      showCount
                      maxLength={200}
                      autoFocus
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="autoSubmit"
                    valuePropName="checked"
                    initialValue={true}
                    style={{ marginBottom: 16 }}
                  >
                    <Checkbox>
                      <div>
                        <strong>生成后直接提交到飞书表格</strong>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          推荐选项：AI生成内容后自动提交到飞书表格，无需手动操作
                        </div>
                      </div>
                    </Checkbox>
                  </Form.Item>
                  
                  <Form.Item style={{ marginBottom: 16 }}>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={aiGenerating}
                        icon={<StarOutlined />}
                        size="large"
                      >
                        {aiGenerating ? 'AI生成中...' : '开始AI生成'}
                      </Button>
                      <Button
                        onClick={() => aiGenerateForm.resetFields()}
                      >
                        重置表单
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
                
                <Divider />
                
                <Alert
                  message="支持的AI生成类型"
                  description={
                    <div>
                      <p>• <strong>产品：</strong>生成产品相关信息（智能手机、笔记本电脑等）</p>
                      <p>• <strong>人员：</strong>生成人员姓名信息</p>
                      <p>• <strong>任务：</strong>生成任务相关内容</p>
                      <p>• <strong>城市：</strong>生成城市相关数据</p>
                      <p>• <strong>其他：</strong>系统将使用默认的产品模板</p>
                      <Divider style={{ margin: '12px 0' }} />
                      <p style={{ color: '#1890ff', fontWeight: 'bold' }}>
                        💡 <strong>智能填充：</strong>AI将自动填充到"序号"和"文本1"字段，其他字段可手动补充
                      </p>
                    </div>
                  }
                  type="success"
                  showIcon
                />
                
                {/* 显示当前表格字段信息 */}
                <Divider />
                <div>
                  <Text strong>当前表格字段：</Text>
                  <div style={{ marginTop: 8 }}>
                    {tableFields.slice(0, 6).map((field, index) => (
                      <Tag key={field.field_id} color={index < 2 ? 'blue' : 'default'}>
                        {field.field_name} {index < 2 && '(AI填充)'}
                      </Tag>
                    ))}
                    {tableFields.length > 6 && <Tag>...等{tableFields.length}个字段</Tag>}
                  </div>
                </div>
              </div>
            ) : (
              <Alert
                message="请先配置表格连接"
                description="在上方配置区域输入App Token和Table ID，然后点击连接表格后即可使用AI智能填充功能"
                type="info"
                showIcon
              />
            )}
          </Card>
        );

      case 'importJson':
        return (
          <Card 
            title={
              <Space>
                <UploadOutlined />
                JSON文件导入
                {isConfigured && <Tag color="green">已连接表格</Tag>}
              </Space>
            }
          >
            {isConfigured ? (
              <div>
                <Alert
                  message="JSON文件导入说明"
                  description={
                    <div>
                      <p>上传包含"序号"、"文本1"、"文本2"、"文本3"字段的JSON文件，系统将批量导入数据到飞书表格。</p>
                      <p><strong>当前连接表格：</strong>{tableFields.length} 个字段可用于导入</p>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                <Form
                  form={importJsonForm}
                  layout="vertical"
                >
                  <Form.Item
                    label="选择JSON文件"
                    name="jsonFile"
                  >
                    <Upload
                      accept=".json"
                      beforeUpload={handleJsonFileUpload}
                      showUploadList={false}
                      maxCount={1}
                    >
                      <Button icon={<UploadOutlined />} size="large">
                        选择JSON文件
                      </Button>
                    </Upload>
                  </Form.Item>
                  
                  {jsonData.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <Alert
                        message={`已解析JSON文件，共${jsonData.length}条数据`}
                        description={
                          <div>
                            <p>数据预览（前3条）：</p>
                            <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>
                              {jsonData.slice(0, 3).map((item, index) => (
                                <div key={index} style={{ marginBottom: '4px' }}>
                                  <strong>第{index + 1}条：</strong>
                                  序号: {item.序号}, 文本1: {item.文本1}, 文本2: {item.文本2}, 文本3: {item.文本3}
                                </div>
                              ))}
                              {jsonData.length > 3 && <div>...还有{jsonData.length - 3}条数据</div>}
                            </div>
                          </div>
                        }
                        type="success"
                        showIcon
                      />
                    </div>
                  )}
                  
                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        icon={<DatabaseOutlined />}
                        size="large"
                        loading={jsonImporting}
                        disabled={jsonData.length === 0}
                        onClick={handleBatchImportJson}
                      >
                        {jsonImporting ? '批量导入中...' : `批量导入${jsonData.length}条数据`}
                      </Button>
                      <Button
                        onClick={() => {
                          setJsonData([]);
                          importJsonForm.resetFields();
                        }}
                        disabled={jsonData.length === 0}
                      >
                        清空数据
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
                
                <Divider />
                
                <Alert
                  message="JSON文件格式要求"
                  description={
                    <div>
                      <p><strong>文件格式：</strong>JSON数组，每个对象包含以下字段</p>
                      <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', marginTop: '8px' }}>
                        <pre style={{ margin: 0, fontSize: '12px' }}>{`[
  {
    "序号": "1",
    "文本1": "示例文本1",
    "文本2": "示例文本2", 
    "文本3": "示例文本3"
  },
  {
    "序号": "2",
    "文本1": "示例文本1-2",
    "文本2": "示例文本2-2",
    "文本3": "示例文本3-2"
  }
]`}</pre>
                      </div>
                      <Divider style={{ margin: '12px 0' }} />
                      <p>• <strong>必需字段：</strong>至少包含"序号"、"文本1"、"文本2"、"文本3"中的一个</p>
                      <p>• <strong>数据类型：</strong>所有字段值都会转换为文本格式</p>
                      <p>• <strong>批量处理：</strong>每批处理5条数据，避免API限流</p>
                      <p>• <strong>错误处理：</strong>无效数据会自动跳过，不影响其他数据导入</p>
                    </div>
                  }
                  type="warning"
                  showIcon
                />
                
                {/* 显示当前表格字段信息 */}
                <Divider />
                <div>
                  <Text strong>当前表格字段：</Text>
                  <div style={{ marginTop: 8 }}>
                    {tableFields.slice(0, 8).map((field, index) => {
                      const isTargetField = ['序号', '文本1', '文本2', '文本3'].includes(field.field_name);
                      return (
                        <Tag key={field.field_id} color={isTargetField ? 'blue' : 'default'}>
                          {field.field_name} {isTargetField && '(导入目标)'}
                        </Tag>
                      );
                    })}
                    {tableFields.length > 8 && <Tag>...等{tableFields.length}个字段</Tag>}
                  </div>
                </div>
              </div>
            ) : (
              <Alert
                message="请先配置表格连接"
                description="在上方配置区域输入App Token和Table ID，然后点击连接表格后即可使用JSON文件导入功能"
                type="info"
                showIcon
              />
            )}
          </Card>
        );

      case 'search':
        return (
          <Card 
            title={
              <Space>
                <SearchOutlined />
                搜索
                <Tag color="orange">AI生成JSON</Tag>
              </Space>
            }
          >
            <Alert
              message="搜索功能说明"
              description="输入任何内容，AI将生成包含'序号'、'文本1'、'文本2'、'文本3'字段的JSON数据，可用于创建表格或导入数据。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <div style={{ marginBottom: 16 }}>
              <Input.Search
                placeholder="请输入搜索内容，例如：手机产品、员工信息、城市数据等..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
                loading={searchLoading}
                enterButton={
                  <Button type="primary" icon={<SearchOutlined />}>
                    搜索生成
                  </Button>
                }
                size="large"
                style={{ width: '100%' }}
              />
            </div>
            
            <Divider />
            
            <Alert
              message="使用说明"
              description={
                <div>
                  <p>• <strong>输入内容：</strong>描述你想要的数据类型，如"手机产品"、"员工信息"等</p>
                  <p>• <strong>AI生成：</strong>系统会调用AI生成符合表格格式的JSON数据</p>
                  <p>• <strong>数据格式：</strong>生成的JSON包含"序号"、"文本1"、"文本2"、"文本3"四个字段</p>
                  <p>• <strong>后续使用：</strong>可复制生成的JSON数据，保存为文件后使用"JSON文件导入"功能</p>
                </div>
              }
              type="success"
              showIcon
            />
          </Card>
        );

      case 'searchWrite':
        return (
          <Card 
            title={
              <Space>
                <DatabaseOutlined />
                搜索+写入
                <Tag color="purple">一站式流程</Tag>
              </Space>
            }
          >
            <Alert
              message="搜索+写入功能说明"
              description="输入搜索内容，AI将自动生成数据，创建同名多维表格应用和数据表，并将数据批量导入，最后提供飞书表格访问链接。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <div style={{ marginBottom: 16 }}>
              <Input.Search
                placeholder="请输入搜索内容，将创建同名的多维表格应用..."
                value={searchWriteQuery}
                onChange={(e) => setSearchWriteQuery(e.target.value)}
                onSearch={handleSearchWrite}
                loading={searchWriteLoading}
                enterButton={
                  <Button type="primary" icon={<DatabaseOutlined />}>
                    搜索+写入
                  </Button>
                }
                size="large"
                style={{ width: '100%' }}
                disabled={searchWriteLoading}
              />
            </div>
            
            {/* 步骤输出区域 */}
            {searchWriteSteps.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  background: '#fafafa', 
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  padding: '16px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '12px',
                    color: '#1890ff'
                  }}>
                    📋 执行步骤：
                  </div>
                  {searchWriteSteps.map((step, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        marginBottom: '8px',
                        padding: '8px 12px',
                        background: step.includes('❌') ? '#fff2f0' : 
                                   step.includes('✅') ? '#f6ffed' : 
                                   step.includes('🔗') ? '#f0f9ff' : '#fff',
                        border: step.includes('❌') ? '1px solid #ffccc7' :
                               step.includes('✅') ? '1px solid #b7eb8f' :
                               step.includes('🔗') ? '1px solid #91d5ff' : '1px solid #f0f0f0',
                        borderRadius: '4px',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}
                    >
                      {step.includes('🔗 访问链接:') ? (
                        <div>
                          <span style={{ fontWeight: 'bold', color: '#0369a1' }}>
                            🔗 飞书表格链接：
                          </span>
                          <br />
                          <a 
                            href={step.split('🔗 访问链接: ')[1]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              color: '#0ea5e9', 
                              textDecoration: 'none',
                              fontWeight: 'bold'
                            }}
                          >
                            {step.split('🔗 访问链接: ')[1]}
                          </a>
                        </div>
                      ) : (
                        step
                      )}
                    </div>
                  ))}
                  
                  {searchWriteLoading && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px 12px',
                      background: '#fff7e6',
                      border: '1px solid #ffd591',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      <Spin size="small" />
                      <span>正在执行中，请稍候...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Divider />
            
            <Alert
              message="功能特点"
              description={
                <div>
                  <p>• <strong>一站式流程：</strong>从搜索到表格创建，一键完成所有步骤</p>
                  <p>• <strong>实时反馈：</strong>每个步骤都有详细的执行状态显示</p>
                  <p>• <strong>自动命名：</strong>应用和表格都使用搜索内容作为名称</p>
                  <p>• <strong>批量导入：</strong>AI生成的数据自动批量导入到表格</p>
                  <p>• <strong>直接访问：</strong>完成后提供蓝色的飞书表格访问链接</p>
                </div>
              }
              type="success"
              showIcon
            />
            
            <Divider />
            
            <Alert
              message="执行步骤说明"
              description={
                <div>
                  <p><strong>步骤1：</strong>🔍 调用AI生成相关数据的JSON格式</p>
                  <p><strong>步骤2：</strong>🏗️ 创建以搜索内容命名的多维表格应用</p>
                  <p><strong>步骤3：</strong>📋 在应用中创建同名数据表格</p>
                  <p><strong>步骤4：</strong>📝 将AI生成的数据批量导入表格</p>
                  <p><strong>步骤5：</strong>🔗 生成飞书表格访问链接并保存记录</p>
                </div>
              }
              type="warning"
              showIcon
            />
          </Card>
        );

      case 'aiChat':
        return (
          <Card 
            title={
              <Space>
                <StarOutlined />
                AI实时对话
                <Tag color="blue">DeepSeek Chat</Tag>
              </Space>
            }
            extra={
              <Button
                icon={<DeleteOutlined />}
                onClick={handleClearChat}
                disabled={chatMessages.length === 0}
              >
                清空对话
              </Button>
            }
          >
            <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
              {/* 聊天消息区域 */}
              <div 
                style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  padding: '16px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px',
                  marginBottom: '16px',
                  backgroundColor: '#fafafa'
                }}
              >
                {chatMessages.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#999', 
                    marginTop: '100px',
                    fontSize: '16px'
                  }}>
                    <StarOutlined style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }} />
                    开始与AI对话吧！
                    <div style={{ fontSize: '14px', marginTop: '8px' }}>
                      支持上下文对话，AI会记住之前的聊天内容
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      style={{ 
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{ maxWidth: '70%' }}>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#666', 
                          marginBottom: '4px',
                          textAlign: msg.role === 'user' ? 'right' : 'left'
                        }}>
                          {msg.role === 'user' ? '我' : 'AI'} · {msg.timestamp}
                        </div>
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          backgroundColor: msg.role === 'user' ? '#1890ff' : (msg.isError ? '#ff4d4f' : '#fff'),
                          color: msg.role === 'user' ? '#fff' : (msg.isError ? '#fff' : '#000'),
                          border: msg.role === 'assistant' && !msg.isError ? '1px solid #d9d9d9' : 'none',
                          wordBreak: 'break-word',
                          lineHeight: '1.5'
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {/* 加载指示器 */}
                {chatLoading && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-start',
                    marginBottom: '16px'
                  }}>
                    <div style={{ maxWidth: '70%' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginBottom: '4px'
                      }}>
                        AI · 正在思考...
                      </div>
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#fff',
                        border: '1px solid #d9d9d9',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Spin size="small" />
                        <span style={{ color: '#666' }}>AI正在思考中...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 输入区域 */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input.TextArea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="输入你想问的问题..."
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(chatInput);
                    }
                  }}
                  disabled={chatLoading}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => handleSendMessage(chatInput)}
                  loading={chatLoading}
                  disabled={!chatInput.trim()}
                  style={{ height: 'auto' }}
                >
                  发送
                </Button>
              </div>
              
              <div style={{ 
                fontSize: '12px', 
                color: '#999', 
                marginTop: '8px',
                textAlign: 'center'
              }}>
                按 Enter 发送消息，Shift + Enter 换行
              </div>
            </div>
            
            <Divider />
            
            <Alert
              message="AI对话功能说明"
              description={
                <div>
                  <p>• <strong>智能对话：</strong>基于DeepSeek Chat模型，支持自然语言交流</p>
                  <p>• <strong>上下文记忆：</strong>AI会记住本次对话的所有内容</p>
                  <p>• <strong>多轮对话：</strong>支持连续提问和深入讨论</p>
                  <p>• <strong>实时响应：</strong>通常在几秒内获得AI回复</p>
                  <p>• <strong>使用建议：</strong>可以询问编程、学习、工作等各类问题</p>
                </div>
              }
              type="info"
              showIcon
            />
          </Card>
        );

      case 'createApp':
        return (
          <Card title="创建多维表格应用">
            <Form
              form={createAppForm}
              layout="vertical"
              onFinish={handleCreateApp}
              onFinishFailed={(errorInfo) => handleFormValidationFailed(errorInfo, '创建应用')}
            >
              <Form.Item
                label="应用名称"
                name="name"
                rules={[{ required: true, message: '请输入应用名称' }]}
              >
                <Input placeholder="请输入多维表格应用名称" />
              </Form.Item>
              <Form.Item
                label="文件夹Token（可选）"
                name="folderToken"
              >
                <Input placeholder="请输入文件夹Token（可选）" />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<AppstoreAddOutlined />}
                >
                  创建应用
                </Button>
              </Form.Item>
            </Form>
          </Card>
        );

      case 'createTable':
        return (
          <Card title="添加一张表">
            <Alert
              message="注意"
              description="请先在上方配置区域输入App Token，然后在此创建新表格"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form
              form={createTableForm}
              layout="vertical"
              onFinish={handleCreateTable}
              onFinishFailed={(errorInfo) => handleFormValidationFailed(errorInfo, '创建表格')}
            >
              <Form.Item
                label="表格名称"
                name="tableName"
                rules={[{ required: true, message: '请输入表格名称' }]}
              >
                <Input placeholder="请输入表格名称" />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<DatabaseOutlined />}
                  disabled={!appToken}
                >
                  创建表格
                </Button>
              </Form.Item>
            </Form>
          </Card>
        );

      case 'allTables':
        return (
          <Card 
            title={
              <Space>
                <UnorderedListOutlined />
                全部表格
                <Tag color="blue">{savedTableRecords.length} 个表格</Tag>
              </Space>
            }
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={loadSavedTableRecords}
              >
                刷新列表
              </Button>
            }
          >
            {savedTableRecords.length > 0 ? (
              <Table
                dataSource={savedTableRecords}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 个表格`,
                }}
                columns={[
                  {
                    title: '表格名称',
                    dataIndex: 'tableName',
                    key: 'tableName',
                    width: 150,
                    ellipsis: true,
                    render: (text) => (
                      <Text strong style={{ color: '#1890ff' }}>{text}</Text>
                    ),
                  },
                  {
                    title: 'App Token',
                    dataIndex: 'appToken',
                    key: 'appToken',
                    width: 200,
                    ellipsis: true,
                    render: (text) => (
                      <Text 
                        code 
                        style={{ fontSize: '11px', cursor: 'pointer' }}
                        onClick={() => {
                          navigator.clipboard.writeText(text);
                          message.success('App Token已复制到剪贴板');
                        }}
                        title="点击复制完整Token"
                      >
                        {text.substring(0, 15)}...
                      </Text>
                    ),
                  },
                  {
                    title: 'Table ID',
                    dataIndex: 'tableId',
                    key: 'tableId',
                    width: 200,
                    ellipsis: true,
                    render: (text) => (
                      <Text 
                        code 
                        style={{ fontSize: '11px', cursor: 'pointer' }}
                        onClick={() => {
                          navigator.clipboard.writeText(text);
                          message.success('Table ID已复制到剪贴板');
                        }}
                        title="点击复制完整ID"
                      >
                        {text.substring(0, 15)}...
                      </Text>
                    ),
                  },
                  {
                    title: '创建时间',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    width: 130,
                    render: (timestamp) => (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(timestamp).toLocaleDateString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    ),
                    sorter: (a, b) => a.createdAt - b.createdAt,
                  },
                  {
                    title: '最后使用',
                    dataIndex: 'lastUsed',
                    key: 'lastUsed',
                    width: 130,
                    render: (timestamp) => (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(timestamp).toLocaleDateString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    ),
                    sorter: (a, b) => a.lastUsed - b.lastUsed,
                    defaultSortOrder: 'descend',
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 180,
                    render: (_, record) => (
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          icon={<LinkOutlined />}
                          onClick={() => {
                            // 构建飞书表格URL
                            const feishuUrl = `https://feishu.cn/base/${record.appToken}?table=${record.tableId}`;
                            window.open(feishuUrl, '_blank');
                            // 更新最后使用时间
                            updateLastUsed(record.appToken, record.tableId);
                            message.success('已打开飞书表格');
                          }}
                          title="在新窗口打开飞书表格"
                        >
                          打开表格
                        </Button>
                        <Button
                          size="small"
                          icon={<DatabaseOutlined />}
                          onClick={() => handleQuickConnect(record)}
                          title="快速连接到此表格"
                        >
                          连接
                        </Button>
                        <Popconfirm
                          title="确定要删除这个表格记录吗？"
                          description="删除后无法恢复，但不会影响飞书中的实际表格"
                          onConfirm={() => deleteSavedTableRecord(record.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
                            type="primary"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                          >
                            删除
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <UnorderedListOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <div>
                  <Text type="secondary" style={{ fontSize: '16px' }}>
                    暂无保存的表格记录
                  </Text>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">
                    创建新的应用和表格后，会自动保存到这里
                  </Text>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<AppstoreAddOutlined />}
                      onClick={() => setCurrentFunction('createApp')}
                    >
                      创建多维表格
                    </Button>
                    <Button
                      icon={<DatabaseOutlined />}
                      onClick={() => setCurrentFunction('createTable')}
                    >
                      添加一张表
                    </Button>
                  </Space>
                </div>
              </div>
            )}
            
            <Divider />
            
            <Alert
              message="使用说明"
              description={
                <div>
                  <p>• <strong>连接：</strong>快速连接到选中的表格，自动填入配置信息</p>
                  <p>• <strong>删除：</strong>删除本地保存的记录，不会影响飞书中的实际表格</p>
                  <p>• <strong>自动保存：</strong>每次创建新表格时会自动保存记录</p>
                  <p>• <strong>数据存储：</strong>记录保存在浏览器本地存储中</p>
                </div>
              }
              type="info"
              showIcon
            />
          </Card>
        );

      case 'updateField':
        return (
          <Card title="修改字段">
            {isConfigured ? (
              <div>
                <Alert
                  message="修改字段说明"
                  description="选择要修改的字段，然后输入新的字段名称。注意：修改字段可能会影响现有数据。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Form
                  form={updateFieldForm}
                  layout="vertical"
                  onFinish={handleUpdateField}
                  onFinishFailed={handleUpdateFieldFailed}
                >
                  <Form.Item
                    label="选择要修改的字段"
                    name="fieldId"
                    rules={[{ required: true, message: '请选择要修改的字段' }]}
                  >
                    <Select placeholder="请选择字段">
                      {tableFields.map(field => (
                        <Select.Option key={field.field_id} value={field.field_id}>
                          <Space>
                            <span>{field.field_name}</span>
                            <Tag color="blue">{getFieldTypeName(field.type)}</Tag>
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  
                  <Form.Item
                    label="新字段名称"
                    name="field_name"
                    rules={[
                      { required: true, message: '请输入新的字段名称' },
                      { max: 100, message: '字段名称不能超过100个字符' }
                    ]}
                  >
                    <Input placeholder="请输入新的字段名称" />
                  </Form.Item>

                  <Form.Item
                    label="字段属性（可选）"
                    name="property"
                    tooltip='高级用户可以设置字段的特殊属性，如选项列表等。例如：{"options":[{"name":"选项1"},{"name":"选项2"}]}'
                    rules={[
                      {
                        validator: (_: any, value: any) => {
                          if (!value || value.trim() === '') {
                            return Promise.resolve();
                          }
                          try {
                            JSON.parse(value);
                            return Promise.resolve();
                          } catch (error) {
                            return Promise.reject(new Error('请输入有效的JSON格式'));
                          }
                        },
                      },
                    ]}
                  >
                    <Input.TextArea 
                      placeholder='请输入JSON格式的字段属性（可选），例如：{"options":[{"name":"选项1"},{"name":"选项2"}]}'
                      rows={4}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<EditOutlined />}
                      >
                        修改字段
                      </Button>
                      <Button
                        onClick={() => updateFieldForm.resetFields()}
                      >
                        重置
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>

                <Divider />
                
                <div>
                  <Text strong>当前字段列表：</Text>
                  <div style={{ marginTop: 8 }}>
                    {tableFields.map(field => (
                      <Tag key={field.field_id} style={{ margin: '4px' }}>
                        {field.field_name} ({getFieldTypeName(field.type)})
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Alert
                message="请先配置表格连接"
                description="在上方配置区域输入App Token和Table ID，然后点击连接表格"
                type="info"
                showIcon
              />
            )}
          </Card>
        );

      case 'updateTableName':
        return (
          <Card title="修改表格名称">
            {isConfigured ? (
              <div>
                <Alert
                  message="修改表格名称说明"
                  description="输入新的表格名称来修改当前表格的名称。修改成功后，本地保存的表格记录也会自动更新。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Form
                  form={updateTableNameForm}
                  layout="vertical"
                  onFinish={handleUpdateTableName}
                  onFinishFailed={(errorInfo) => handleFormValidationFailed(errorInfo, '修改表格名称')}
                >
                  <Form.Item
                    label="新表格名称"
                    name="tableName"
                    rules={[
                      { required: true, message: '请输入新的表格名称' },
                      { max: 100, message: '表格名称不能超过100个字符' },
                      { min: 1, message: '表格名称不能为空' }
                    ]}
                    hasFeedback
                  >
                    <Input 
                      placeholder="请输入新的表格名称" 
                      showCount
                      maxLength={100}
                      autoFocus
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<EditOutlined />}
                      >
                        修改表格名称
                      </Button>
                      <Button
                        onClick={() => updateTableNameForm.resetFields()}
                      >
                        重置
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </div>
            ) : (
              <Alert
                message="请先配置表格连接"
                description="在上方配置区域输入App Token和Table ID，然后点击连接表格"
                type="info"
                showIcon
              />
            )}
          </Card>
        );

      case 'deleteRecord':
        return (
          <Card title="删除表记录">
            {isConfigured ? (
              <div>
                <Alert
                  message="危险操作"
                  description="删除记录后无法恢复，请谨慎操作"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table
                  dataSource={tableRecords}
                  loading={loading}
                  rowKey="record_id"
                  scroll={{ x: true }}
                  columns={[
                    {
                      title: '记录ID',
                      dataIndex: 'record_id',
                      key: 'record_id',
                      width: 200,
                      ellipsis: true,
                    },
                    ...tableFields.map(field => ({
                      title: field.field_name,
                      dataIndex: ['fields', field.field_name],
                      key: field.field_id,
                      ellipsis: true,
                    })),
                    {
                      title: '操作',
                      key: 'action',
                      width: 100,
                      render: (_, record) => (
                        <Popconfirm
                          title="确定要删除这条记录吗？"
                          description="删除后无法恢复"
                          onConfirm={() => handleDeleteRecord(record.record_id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
                            type="primary"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                          >
                            删除
                          </Button>
                        </Popconfirm>
                      ),
                    },
                  ]}
                />
              </div>
            ) : (
              <Alert
                message="请先配置表格连接"
                description="在上方配置区域输入App Token和Table ID，然后点击连接表格"
                type="info"
                showIcon
              />
            )}
          </Card>
        );

      case 'exportTable':
        return (
          <Card title="导出多维表格">
            {isConfigured ? (
              <div>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Alert
                    message="导出说明"
                    description="将表格数据导出为JSON格式文件，包含所有记录和字段信息"
                    type="info"
                    showIcon
                  />
                  <div>
                    <Text strong>表格信息：</Text>
                    <div style={{ marginTop: 8 }}>
                      <Tag>字段数量: {tableFields.length}</Tag>
                      <Tag>记录数量: {tableRecords.length}</Tag>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    icon={<DownloadOutlined />}
                    onClick={handleExportTable}
                    loading={loading}
                  >
                    导出表格数据
                  </Button>
                </Space>
              </div>
            ) : (
              <Alert
                message="请先配置表格连接"
                description="在上方配置区域输入App Token和Table ID，然后点击连接表格"
                type="info"
                showIcon
              />
            )}
          </Card>
        );

      default: // addRecord
        return (
          <>
            {/* 数据输入区域 */}
            {isConfigured && (
              <Card
                title={
                  <Space>
                    <SendOutlined />
                    数据输入
                    <Tag color="blue">{tableFields.length} 个字段</Tag>
                  </Space>
                }
              >
                <Spin spinning={loading}>
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    onFinishFailed={(errorInfo) => handleFormValidationFailed(errorInfo, '添加记录')}
                    autoComplete="off"
                    className="field-form-container"
                  >
                    {(() => {
                      const { core, others } = groupFields(tableFields);
                      return (
                        <>
                          {/* 核心字段组 */}
                          <div className="field-group">
                            <div className="field-group-title">
                              <Space>
                                <StarOutlined />
                                核心字段
                              </Space>
                            </div>
                            <Row gutter={[16, 16]}>
                              {core.map((field) => (
                                <Col span={8} className="field-col-large" key={field.field_id}>
                                  <Form.Item
                                    label={
                                      <Space>
                                        <span style={{ fontWeight: isRequiredField(field.field_name) ? 'bold' : 'normal' }}>
                                          {field.field_name}
                                          {isRequiredField(field.field_name) && <span style={{ color: 'red' }}>*</span>}
                                        </span>
                                        <Tag color="blue" className="field-type-tag">
                                          {getFieldTypeName(field.type)}
                                        </Tag>
                                      </Space>
                                    }
                                    name={field.field_name}
                                    rules={[
                                      {
                                        required: isRequiredField(field.field_name),
                                        message: `请输入${field.field_name}`,
                                      },
                                      ...(field.type === 15 ? [{
                                        type: 'url' as const,
                                        message: '请输入有效的URL地址',
                                      }] : []),
                                    ]}
                                  >
                                    {renderFieldInput(field)}
                                  </Form.Item>
                                </Col>
                              ))}
                            </Row>
                          </div>

                          {/* 其他字段组 */}
                          {others.length > 0 && (
                            <div className="field-group">
                              <div className="field-group-title">
                                <Space>
                                  <SettingOutlined />
                                  其他字段
                                  <Tag color="orange">{others.length} 个</Tag>
                                </Space>
                              </div>
                              <Row gutter={[16, 16]}>
                                {others.map((field) => (
                                  <Col span={8} className="field-col-large" key={field.field_id}>
                                    <Form.Item
                                      label={
                                        <Space>
                                          <span>{field.field_name}</span>
                                          <Tag color="green" className="field-type-tag">
                                            {getFieldTypeName(field.type)}
                                          </Tag>
                                        </Space>
                                      }
                                      name={field.field_name}
                                    >
                                      {renderFieldInput(field)}
                                    </Form.Item>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    <Divider />

                    <Form.Item>
                      <Space>
                        <Button
                          type="default"
                          icon={<StarOutlined />}
                          onClick={() => setAiGenerateModalVisible(true)}
                          style={{ marginBottom: 8 }}
                        >
                          AI生成内容
                        </Button>
                      </Space>
                    </Form.Item>

                    <Form.Item>
                      <Space>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading}
                          icon={<SendOutlined />}
                          size="large"
                        >
                          写入飞书表格
                        </Button>
                        <Button onClick={() => form.resetFields()}>
                          重置表单
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Spin>
              </Card>
            )}

            {!isConfigured && (
              <Card>
                <Alert
                  message="请先配置表格连接"
                  description="在上方配置区域输入App Token和Table ID，然后点击连接表格"
                  type="info"
                  showIcon
                />
              </Card>
            )}
          </>
        );
    }
  };

  // 搜索功能 - 调用AI生成JSON数据
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      message.error('请输入搜索内容');
      return;
    }

    setSearchLoading(true);
    
    try {
      const prompt = `只输出json代码文件，我要粘贴到json代码文件；我现在要创建一个表格，字段有四个，"序号""文本1""文本2""文本3"，将${query}有关的信息，整理为json文件输出`;
      
      const response = await axios.post('https://tbnx.plus7.plus/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': 'Bearer sk-r4J7nzQlvqRjMpH3BHtoHTNMPKnShSgiq7KGuraPcWdmryR6',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      if (response.data.choices && response.data.choices[0]) {
        const aiResponse = response.data.choices[0].message.content;
        
        // 提取JSON数据
        let extractedJson = '';
        let parsedData: any = null;
        
        try {
          // 尝试提取```json和```之间的内容
          const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            extractedJson = jsonMatch[1].trim();
          } else {
            // 如果没有找到```json标记，尝试提取方括号内的内容
            const bracketMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (bracketMatch) {
              extractedJson = bracketMatch[0];
            } else {
              extractedJson = aiResponse;
            }
          }
          
          // 验证JSON格式
          parsedData = JSON.parse(extractedJson);
          
          // 生成文件名
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const fileName = `search_${query.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${timestamp}.json`;
          
          // 创建下载链接
          const blob = new Blob([JSON.stringify(parsedData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          
          // 显示结果弹窗
          Modal.success({
            title: `搜索结果：${query}`,
            content: (
              <div>
                <p style={{ marginBottom: 16 }}>✅ 已成功提取JSON数据（共{Array.isArray(parsedData) ? parsedData.length : 1}条记录）</p>
                
                <div style={{ marginBottom: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      link.click();
                      URL.revokeObjectURL(url);
                      message.success(`文件已下载：${fileName}`);
                    }}
                    style={{ marginRight: 8 }}
                  >
                    下载JSON文件
                  </Button>
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(parsedData, null, 2));
                      message.success('JSON数据已复制到剪贴板');
                    }}
                  >
                    复制JSON
                  </Button>
                </div>
                
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {JSON.stringify(parsedData, null, 2)}
                </div>
                
                <p style={{ marginTop: 16, color: '#666', fontSize: '12px' }}>
                  💡 提示：点击"下载JSON文件"按钮将文件保存到本地，或使用"JSON文件导入"功能直接导入到表格中
                </p>
              </div>
            ),
            width: 700,
            okText: '确定'
          });
          
        } catch (parseError) {
          console.error('JSON解析失败:', parseError);
          
          // 如果JSON解析失败，显示原始内容
          Modal.warning({
            title: `搜索结果：${query}`,
            content: (
              <div>
                <p style={{ marginBottom: 16, color: '#fa8c16' }}>⚠️ JSON格式解析失败，显示原始内容：</p>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px',
                  maxHeight: '400px',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {aiResponse}
                </div>
                <p style={{ marginTop: 16, color: '#666', fontSize: '12px' }}>
                  💡 提示：请手动复制并修正JSON格式，然后保存为.json文件
                </p>
              </div>
            ),
            width: 600,
            okText: '确定'
          });
        }
      }
      
    } catch (error: any) {
      console.error('搜索失败:', error);
      message.error('搜索失败，请检查网络连接');
    } finally {
      setSearchLoading(false);
    }
  };

  // 搜索+写入功能 - 完整流程
  const handleSearchWrite = async (query: string) => {
    if (!query.trim()) {
      message.error('请输入搜索内容');
      return;
    }

    setSearchWriteLoading(true);
    setSearchWriteSteps([]);
    
    try {
      // 步骤1: AI生成JSON数据
      setSearchWriteSteps(prev => [...prev, '🔍 步骤1: 正在调用AI生成数据...']);
      
      const prompt = `只输出json代码文件，我要粘贴到json代码文件；我现在要创建一个表格，字段有四个，"序号""文本1""文本2""文本3"，将${query}有关的信息，整理为json文件输出`;
      
      const response = await axios.post('https://tbnx.plus7.plus/v1/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': 'Bearer sk-r4J7nzQlvqRjMpH3BHtoHTNMPKnShSgiq7KGuraPcWdmryR6',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      if (!response.data.choices || !response.data.choices[0]) {
        throw new Error('AI响应格式错误');
      }
      
      const aiResponse = response.data.choices[0].message.content;
      
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
      
      // 步骤3: 创建表格
      setSearchWriteSteps(prev => [...prev, '📋 步骤3: 正在创建数据表格...']);
      
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
      
      setSearchWriteSteps(prev => [...prev, `✅ 步骤3完成: 表格"${query}"创建成功`]);
      
      // 步骤4: 批量导入数据
      setSearchWriteSteps(prev => [...prev, '📝 步骤4: 正在批量导入数据...']);
      
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
        
        setSearchWriteSteps(prev => [...prev, `✅ 步骤4完成: 成功导入${successCount}条数据`]);
      }
      
      // 步骤5: 保存表格记录并生成链接
      setSearchWriteSteps(prev => [...prev, '🔗 步骤5: 正在生成访问链接...']);
      
      // 保存到本地存储
      const saved = saveTableRecord({
        appName: query,
        tableName: query,
        appToken: newAppToken,
        tableId: newTableId,
      });
      
      if (saved) {
        setSearchWriteSteps(prev => [...prev, '💾 表格记录已保存到本地']);
      }
      
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
              <li>✅ 创建了数据表格"{query}"</li>
              <li>✅ 批量导入了所有数据</li>
              <li>✅ 保存了表格记录</li>
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="center">
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px' }}
              />
              <TableOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                飞书多维表格管理工具 v2.0
              </Title>
            </Space>
          </Col>
          <Col>
            <Tag color="blue">完整版</Tag>
          </Col>
        </Row>
      </Header>

      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
          width={250}
          style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.1)' }}
        >
          <Menu
            mode="inline"
            selectedKeys={[currentFunction]}
            items={menuItems}
            onClick={({ key }) => setCurrentFunction(key)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>

        <Layout style={{ padding: '0 24px 24px' }}>
          <Content style={{ padding: '24px', background: '#f0f2f5' }}>
            <Row gutter={[24, 24]}>
              {/* 配置区域 */}
              {(currentFunction === 'addRecord' || currentFunction === 'deleteRecord' || currentFunction === 'exportTable' || currentFunction === 'createTable') && (
                <Col span={24}>
                  <Card
                    title={
                      <Space>
                        <TableOutlined />
                        表格配置
                      </Space>
                    }
                    extra={
                      isConfigured && (
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={handleReloadFields}
                          loading={fieldsLoading}
                        >
                          重新加载
                        </Button>
                      )
                    }
                  >
                    <Form
                      form={configForm}
                      layout="vertical"
                      onFinish={handleConfigSubmit}
                      onFinishFailed={(errorInfo) => handleFormValidationFailed(errorInfo, '表格配置')}
                      initialValues={{
                        appToken: '',
                        tableId: '',
                      }}
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label="App Token"
                            name="appToken"
                            rules={[{ required: true, message: '请输入App Token' }]}
                          >
                            <Input placeholder="请输入飞书多维表格的App Token" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            label="Table ID"
                            name="tableId"
                            rules={[{ required: currentFunction !== 'createTable', message: '请输入Table ID' }]}
                          >
                            <Input 
                              placeholder="请输入表格ID" 
                              disabled={currentFunction === 'createTable'}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={fieldsLoading}
                          icon={<ReloadOutlined />}
                        >
                          {currentFunction === 'createTable' ? '设置App Token' : '连接表格'}
                        </Button>
                      </Form.Item>
                    </Form>

                    {isConfigured && (
                      <Alert
                        message="表格连接成功"
                        description={`已连接到表格，共找到 ${tableFields.length} 个字段${tableRecords.length > 0 ? `，${tableRecords.length} 条记录` : ''}`}
                        type="success"
                        showIcon
                        style={{ marginTop: 16 }}
                      />
                    )}
                  </Card>
                </Col>
              )}

              {/* 功能内容区域 */}
              <Col span={24}>
                {renderFunctionContent()}
              </Col>

              {/* 使用说明 */}
              <Col span={24}>
                <Card title="功能说明">
                  <Space direction="vertical" size="middle">
                    <Text>
                      <strong>⭐ 一键创建表格:</strong> 同时创建多维表格应用和表格，使用相同名称，一步到位
                    </Text>
                    <Text>
                      <strong>🤖 AI生成内容:</strong> 在添加记录时，使用AI根据提示词自动生成内容填充表格
                    </Text>
                    <Text>
                      <strong>🏗️ 创建多维表格:</strong> 创建新的飞书多维表格应用
                    </Text>
                    <Text>
                      <strong>📊 添加一张表:</strong> 在现有应用中添加新的数据表
                    </Text>
                    <Text>
                      <strong>📋 全部表格:</strong> 查看和管理所有创建过的表格，支持快速连接
                    </Text>
                    <Text>
                      <strong>➕ 添加表记录:</strong> 向表格中添加新的数据记录
                    </Text>
                    <Text>
                      <strong>✏️ 修改字段:</strong> 修改表格字段的名称和属性
                    </Text>
                    <Text>
                      <strong>✏️ 修改表格名称:</strong> 修改表格的名称
                    </Text>
                    <Text>
                      <strong>🗑️ 删除表记录:</strong> 删除表格中的指定记录
                    </Text>
                    <Text>
                      <strong>📤 导出多维表格:</strong> 将表格数据导出为JSON文件
                    </Text>
                    <Divider />
                    <Text type="secondary">
                      注意：请确保后端服务已启动 (http://localhost:3001)，并且您有相应的操作权限。
                    </Text>
                    <Text type="secondary">
                      AI生成功能：支持产品、人员、任务、城市等类型的内容生成，可根据提示词智能匹配模板。
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Content>
        </Layout>
      </Layout>

      {/* AI生成内容模态框 */}
      <Modal
        title="AI生成内容"
        open={aiGenerateModalVisible}
        onCancel={() => {
          setAiGenerateModalVisible(false);
          aiGenerateForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Alert
          message="AI生成说明"
          description="输入描述性的提示词，AI将为您生成相应的内容。您可以选择仅填充到表单中进行编辑，或者直接提交到飞书表格。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form
          form={aiGenerateForm}
          layout="vertical"
          onFinish={handleAIGenerate}
          onFinishFailed={(errorInfo) => handleFormValidationFailed(errorInfo, 'AI生成')}
        >
          <Form.Item
            label="提示词 (Prompt)"
            name="prompt"
            rules={[
              { required: true, message: '请输入提示词' },
              { min: 2, message: '提示词至少需要2个字符' },
              { max: 200, message: '提示词不能超过200个字符' }
            ]}
            hasFeedback
          >
            <TextArea
              placeholder="请输入描述性的提示词，例如：&#10;• 生成产品信息&#10;• 生成人员名单&#10;• 生成任务列表&#10;• 生成城市数据"
              rows={4}
              showCount
              maxLength={200}
              autoFocus
            />
          </Form.Item>
          
          <Form.Item
            name="autoSubmit"
            valuePropName="checked"
            style={{ marginBottom: 16 }}
          >
            <Checkbox>
              <div>
                <strong>生成后直接提交到飞书表格</strong>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  勾选此选项将跳过表单填充步骤，直接将生成的内容提交到飞书表格
                </div>
              </div>
            </Checkbox>
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={aiGenerating}
                icon={<StarOutlined />}
              >
                {aiGenerating ? '生成中...' : '生成内容'}
              </Button>
              <Button
                onClick={() => {
                  setAiGenerateModalVisible(false);
                  aiGenerateForm.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
        
        <Divider />
        
        <Alert
          message="支持的提示词类型"
          description={
            <div>
              <p>• <strong>产品：</strong>生成产品相关信息（智能手机、笔记本电脑等）</p>
              <p>• <strong>人员：</strong>生成人员姓名信息</p>
              <p>• <strong>任务：</strong>生成任务相关内容</p>
              <p>• <strong>城市：</strong>生成城市相关数据</p>
              <p>• <strong>其他：</strong>系统将使用默认的产品模板</p>
              <Divider style={{ margin: '12px 0' }} />
              <p style={{ color: '#1890ff', fontWeight: 'bold' }}>
                💡 <strong>直接提交模式：</strong>勾选"生成后直接提交到飞书表格"可跳过手动操作，AI生成内容后自动提交
              </p>
            </div>
          }
          type="success"
          showIcon
        />
      </Modal>
    </Layout>
  );
};

export default App;
