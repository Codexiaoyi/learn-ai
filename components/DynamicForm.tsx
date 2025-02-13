'use client'

import React, { useState, useMemo, useCallback } from 'react';
import { Space, message, Tabs } from 'antd';
import { z } from 'zod';
import { AutoForm } from "@autoform/mui";
import { ZodProvider } from "@autoform/zod";
import { TextField, Select, MenuItem } from '@mui/material';
import { debounce } from 'lodash';  // 需要安装: npm install lodash @types/lodash

// 自定义字段组件
const CustomTextField = React.forwardRef((props: any, ref) => {
  const { options, ...rest } = props;
  return <TextField {...rest} ref={ref} />;
});

CustomTextField.displayName = 'CustomTextField';

const CustomSelect = React.forwardRef((props: any, ref) => {
  const { options, ...rest } = props;
  return (
    <Select {...rest} ref={ref}>
      {options?.map((option: string) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </Select>
  );
});

CustomSelect.displayName = 'CustomSelect';

const CustomDateField = React.forwardRef((props: any, ref) => {
  return <TextField type="date" {...props} ref={ref} />;
});

CustomDateField.displayName = 'CustomDateField';

// 创建一个基础的 schema 作为后备方案
const fallbackSchema = z.object({
  name: z.string().describe('用户名'),
  email: z.string().email().optional().describe('邮箱'),
});

export default function DynamicFormGenerator() {
  const [activeTab, setActiveTab] = useState<string>('openapi');
  const [schemaCode, setSchemaCode] = useState(`z.object({
  // 字符串类型
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字和下划线')
    .describe('用户名'),

  // 邮箱（带验证）
  email: z.string()
    .email('请输入有效的邮箱地址')
    .min(5, '邮箱长度不能小于5')
    .max(50, '邮箱长度不能超过50')
    .optional()
    .describe('邮箱'),

  // 数字类型
  age: z.number()
    .int('年龄必须是整数')
    .min(18, '年龄必须大于18岁')
    .max(100, '年龄必须小于100岁')
    .optional()
    .describe('年龄'),

  // 枚举类型
  role: z.enum(['user', 'admin', 'guest'])
    .default('user')
    .describe('角色'),

  // 日期类型
  birthday: z.coerce.date()
    .min(new Date('1900-01-01'), '日期不能早于1900年')
    .max(new Date(), '日期不能晚于今天')
    .describe('生日'),

  // 布尔类型
  newsletter: z.boolean()
    .default(false)
    .describe('订阅新闻'),

  // 数组类型
  interests: z.array(z.string())
    .min(1, '至少选择一个兴趣')
    .max(5, '最多选择5个兴趣')
    .describe('兴趣爱好'),

  // 嵌套对象
  address: z.object({
    street: z.string().min(5, '街道地址至少5个字符').describe('街道'),
    city: z.string().min(2, '城市名至少2个字符').describe('城市'),
    zipCode: z.string().regex(/^\\d{6}$/, '请输入6位邮编').describe('邮编')
  }).describe('地址'),

  // URL类型
  website: z.string()
    .url('请输入有效的URL地址')
    .optional()
    .describe('个人网站'),

  // 密码（带确认）
  password: z.string()
    .min(8, '密码至少8个字符')
    .regex(/[A-Z]/, '必须包含大写字母')
    .regex(/[a-z]/, '必须包含小写字母')
    .regex(/[0-9]/, '必须包含数字')
    .describe('密码'),
  
  confirmPassword: z.string()
    .describe('确认密码')
}).refine(data => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"]
})`);
  
  // 修改初始 schema
  const [currentSchema, setCurrentSchema] = useState<z.ZodObject<any>>(() => {
    try {
      // 尝试使用初始的 schemaCode 创建 schema
      const schemaFn = new Function('z', `return ${schemaCode}`);
      return schemaFn(z);
    } catch {
      // 如果失败则使用 fallbackSchema
      return fallbackSchema;
    }
  });

  // 使用防抖来更新 schema，只在有效时更新
  const updateSchema = useCallback(
    debounce((code: string) => {
      try {
        const schemaFn = new Function('z', `return ${code}`);
        const schema = schemaFn(z);
        if (schema && schema._def) {
          setCurrentSchema(schema);
        }
      } catch {
        // 忽略错误，保持上一个有效的 schema
      }
    }, 500),
    []
  );

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSchemaCode(e.target.value);
    updateSchema(e.target.value);
  };

  const schemaProvider = useMemo(() => {
    return new ZodProvider(currentSchema);
  }, [currentSchema]);

  const onSubmit = useCallback((data: any) => {
    try {
      message.success('表单提交成功：' + JSON.stringify(data, null, 2));
    } catch (e) {
      message.error('提交失败');
    }
  }, []);

  const [openApiSchema, setOpenApiSchema] = useState('');

  const defaultOpenApiSchema = `{
    "openapi": "3.0.0",
    "info": {
      "title": "用户表单",
      "version": "1.0.0"
    },
    "components": {
      "schemas": {
        "UserForm": {
          "type": "object",
          "required": ["username", "email"],
          "properties": {
            "username": {
              "type": "string",
              "minLength": 3,
              "maxLength": 20,
              "description": "用户名"
            },
            "email": {
              "type": "string",
              "format": "email",
              "description": "邮箱"
            },
            "age": {
              "type": "integer",
              "minimum": 18,
              "maximum": 100,
              "description": "年龄"
            }
          }
        }
      }
    }
  }`;

  const handleOpenApiChange = useCallback(
    debounce(async (apiSchema: string) => {
      try {
        const parsedSchema = JSON.parse(apiSchema);
        // 直接从 components.schemas.UserForm 构建 Zod schema
        const userFormSchema = parsedSchema.components.schemas.UserForm;
        
        // 构建基本的 Zod schema 字符串
        let zodSchemaStr = 'z.object({\n';
        
        Object.entries(userFormSchema.properties).forEach(([key, value]: [string, any]) => {
          zodSchemaStr += `  ${key}: z.`;
          
          switch (value.type) {
            case 'string':
              zodSchemaStr += 'string()';
              if (value.minLength) zodSchemaStr += `.min(${value.minLength})`;
              if (value.maxLength) zodSchemaStr += `.max(${value.maxLength})`;
              if (value.format === 'email') zodSchemaStr += '.email()';
              break;
            case 'integer':
            case 'number':
              zodSchemaStr += 'number()';
              if (value.minimum) zodSchemaStr += `.min(${value.minimum})`;
              if (value.maximum) zodSchemaStr += `.max(${value.maximum})`;
              if (value.type === 'integer') zodSchemaStr += '.int()';
              break;
          }
          
          if (value.description) {
            zodSchemaStr += `.describe('${value.description}')`;
          }
          
          if (!userFormSchema.required?.includes(key)) {
            zodSchemaStr += '.optional()';
          }
          
          zodSchemaStr += ',\n';
        });
        
        zodSchemaStr += '})';
        
        setSchemaCode(zodSchemaStr);
        updateSchema(zodSchemaStr);
      } catch (error) {
        console.error('OpenAPI schema 解析失败:', error);
        message.error('OpenAPI schema 解析失败');
      }
    }, 500),
    []
  );

  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1920px] mx-auto">
      {/* 标题和说明 */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-gray-800">Schema 转换器</h2>
        <p className="text-gray-600 mt-3 text-lg">OpenAPI → Zod → 动态表单</p>
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* OpenAPI Schema */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-xl font-medium text-gray-800">OpenAPI Schema</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setOpenApiSchema(defaultOpenApiSchema);
                  handleOpenApiChange(defaultOpenApiSchema);
                }}
                className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                使用示例
              </button>
              <span className="text-sm text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full font-medium">输入</span>
            </div>
          </div>
          <textarea
            value={openApiSchema}
            onChange={(e) => {
              setOpenApiSchema(e.target.value);
              handleOpenApiChange(e.target.value);
            }}
            className="w-full h-[600px] p-5 font-mono text-sm bg-gray-50 border border-gray-200 
              rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent
              transition-all duration-200 resize-none shadow-inner"
            placeholder="在此输入您的 OpenAPI Schema..."
          />
        </div>

        {/* Zod Schema */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-xl font-medium text-gray-800">Zod Schema</h3>
            <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full font-medium">自动生成</span>
          </div>
          <textarea
            value={schemaCode}
            readOnly
            className="w-full h-[600px] p-5 font-mono text-sm bg-gray-50 border border-gray-200 
              rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200 resize-none shadow-inner
              placeholder:text-gray-400 placeholder:opacity-50"
          />
        </div>

        {/* 表单预览 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-xl font-medium text-gray-800">表单预览</h3>
            <span className="text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full font-medium">实时预览</span>
          </div>
          <div className="bg-gray-50 p-6 rounded-xl h-[600px] overflow-auto shadow-inner">
            {schemaProvider && (
              <AutoForm
                key={schemaCode}
                schema={schemaProvider}
                onSubmit={onSubmit}
                withSubmit
                formComponents={{
                  string: CustomTextField,
                  number: CustomTextField,
                  enum: CustomSelect,
                  date: CustomDateField,
                  boolean: CustomTextField,
                  array: CustomSelect,
                }}
                formProps={{
                  style: { width: '100%' },
                  className: 'space-y-6'
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 