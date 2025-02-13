'use client'

import DynamicFormGenerator from './DynamicForm'

export default function DynamicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* 顶部标题栏 */}
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                <span className="text-white text-lg font-bold">Z</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Zod Form Generator</h2>
                <p className="text-sm text-gray-500">使用 Zod 快速生成表单</p>
              </div>
            </div>
          </div>

          {/* 主要内容区 */}
          <div className="p-6">
            <div className="bg-gray-50 rounded-xl p-6 shadow-inner">
              <DynamicFormGenerator />
            </div>
          </div>

          {/* 底部信息 */}
          <div className="border-t border-gray-100 p-4">
            <div className="text-center text-sm text-gray-500">
              基于 Zod Schema 的动态表单生成器 • 支持实时预览
            </div>
          </div>
        </div>

        {/* 额外信息卡片 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-medium text-gray-800 mb-2">📝 使用说明</h3>
            <p className="text-gray-600">
              在左侧编辑器中输入 Zod Schema 定义，右侧将实时生成对应的表单。支持字符串、数字、枚举等多种类型。
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-medium text-gray-800 mb-2">💡 提示</h3>
            <p className="text-gray-600">
              可以使用 .optional() 创建可选字段，使用 .describe() 添加字段说明。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 