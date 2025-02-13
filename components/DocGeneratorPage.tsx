'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Space, Select, Button, message, Drawer, Tabs } from 'antd'
import { TextField } from '@mui/material'
import ReactMarkdown from 'react-markdown'
import { MenuOutlined, SoundOutlined, PauseOutlined, CaretRightOutlined, StopOutlined } from '@ant-design/icons'
import { saveChapter, getAllStories } from '@/lib/rag'
import { getAllStories as getAllStoriesFromDB } from '@/lib/db'

const STORY_TYPES = [
  { value: 'xianxia', label: '仙侠' },
  { value: 'xuanhuan', label: '玄幻' },
  { value: 'dushi', label: '都市' },
  { value: 'kehuan', label: '科幻' },
  { value: 'wuxia', label: '武侠' },
  { value: 'yanqing', label: '言情' },
  { value: 'lishi', label: '历史' },
  { value: 'xuanyi', label: '悬疑' },
  { value: 'kongbu', label: '恐怖' },
  { value: 'qihuan', label: '奇幻' }
]

const STORY_LENGTH = [
  { value: '1000', label: '短篇(1000字)' },
  { value: '3000', label: '中篇(3000字)' },
  { value: '5000', label: '长篇(5000字)' }
]

const STORY_TONE = [
  { value: '轻松', label: '轻松欢快' },
  { value: '严肃', label: '严肃正经' },
  { value: '幽默', label: '幽默诙谐' },
  { value: '悲情', label: '悲情感人' }
]

type StoryType = 'xianxia' | 'xuanhuan' | 'dushi' | 'kehuan' | 'wuxia' | 'yanqing' | 'lishi' | 'xuanyi' | 'kongbu' | 'qihuan';

const PROMPT_TEMPLATES: Record<StoryType, string> = {
  xianxia: '创作一个修仙世界的故事，主角从凡人到仙人的历程',
  xuanhuan: '创作一个充满神秘力量的玄幻世界故事',
  dushi: '创作一个现代都市生活中的传奇故事',
  kehuan: '创作一个未来科技世界的故事',
  wuxia: '创作一个武林世界的江湖故事',
  yanqing: '创作一个浪漫的爱情故事',
  lishi: '创作一个历史背景的故事',
  xuanyi: '创作一个悬疑推理故事',
  kongbu: '创作一个恐怖惊悚故事',
  qihuan: '创作一个奇幻世界的故事'
};

// 添加朗读控制组件
function VoiceControl({
  rate,
  setRate,
  volume,
  setVolume,
  voice,
  setVoice,
  isReading,
  isPaused,
  onRead,
  onStop,
}: {
  rate: number;
  setRate: (rate: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  voice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  isReading: boolean;
  isPaused: boolean;
  onRead: () => void;
  onStop: () => void;
}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const chineseVoices = availableVoices.filter(voice => 
        voice.lang.includes('zh') || voice.lang.includes('cmn')
      );
      setVoices(chineseVoices);
      if (chineseVoices.length > 0 && !voice) {
        setVoice(chineseVoices[0]);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [setVoice, voice]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          {isReading ? (
            <>
              <Button
                icon={isPaused ? <CaretRightOutlined /> : <PauseOutlined />}
                onClick={onRead}
                type="primary"
              >
                {isPaused ? '继续' : '暂停'}
              </Button>
              <Button
                icon={<StopOutlined />}
                onClick={onStop}
              >
                停止
              </Button>
            </>
          ) : (
            <Button
              icon={<SoundOutlined />}
              onClick={onRead}
            >
              朗读故事
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">语速:</span>
          <Select
            value={rate}
            onChange={setRate}
            style={{ width: 100 }}
            options={[
              { value: 0.5, label: '较慢' },
              { value: 0.75, label: '稍慢' },
              { value: 1, label: '正常' },
              { value: 1.25, label: '稍快' },
              { value: 1.5, label: '较快' }
            ]}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">音量:</span>
          <Select
            value={volume}
            onChange={setVolume}
            style={{ width: 100 }}
            options={[
              { value: 0.2, label: '很轻' },
              { value: 0.4, label: '较轻' },
              { value: 0.6, label: '适中' },
              { value: 0.8, label: '较大' },
              { value: 1, label: '最大' }
            ]}
          />
        </div>

        {voices.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm">声音:</span>
            <Select
              value={voice?.name}
              onChange={(name) => {
                const selectedVoice = voices.find(v => v.name === name);
                if (selectedVoice) setVoice(selectedVoice);
              }}
              style={{ width: 150 }}
              options={voices.map(voice => ({
                value: voice.name,
                label: `${voice.name} (${voice.lang})`
              }))}
            />
          </div>
        )}
      </div>
      
      {isReading && (
        <div className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <p>💡 在会议中分享声音的方法：</p>
          <ul className="list-disc ml-4 mt-1">
            <li>Zoom：选择"共享屏幕" → "高级" → "仅电脑声音"</li>
            <li>Teams：选择"共享" → 勾选"包含系统音频"</li>
            <li>腾讯会议：选择"共享屏幕" → 勾选"分享电脑声音"</li>
          </ul>
        </div>
      )}
    </div>
  );
}

interface ChapterView {
  id: string;
  type: StoryType;
  content: string;
  date: string;
  title: string;
  chapter_number: number;
  series_id?: string;
}

// 在组件顶部添加接口定义
interface SeriesGroup {
  id: string;
  type: StoryType;
  preview: string;
  chapters: Array<{
    id: string;
    type: StoryType;
    content: string;
    date: string;
    series_id?: string;
    chapter_number?: number;
    title?: string;
  }>;
  lastUpdate: string;
}

export default function DocGeneratorPage() {
  const [storyType, setStoryType] = useState<StoryType>('xianxia')
  const [prompt, setPrompt] = useState(PROMPT_TEMPLATES.xianxia)
  const [length, setLength] = useState('1000')
  const [tone, setTone] = useState('轻松')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [savedStories, setSavedStories] = useState<Array<{
    id: string;
    type: StoryType;
    content: string;
    date: string;
    series_id?: string;
    chapter_number?: number;
    title?: string;
  }>>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isReading, setIsReading] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSeries, setCurrentSeries] = useState<ChapterView[]>([]);
  const [isSeriesView, setIsSeriesView] = useState(false);

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          style: storyType,
          length,
          tone
        })
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      setGeneratedContent(data.content)
      message.success('生成成功！')
    } catch (error) {
      message.error('生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }, [prompt, storyType, length, tone])

  const handleSave = useCallback(() => {
    if (!generatedContent) return;
    
    const newStory = {
      id: Date.now().toString(),
      type: storyType,
      content: generatedContent,
      date: new Date().toLocaleString(),
      title: `第${currentSeries.length + 1}章`,
      series_id: currentSeries.length > 0 ? currentSeries[0].series_id : Date.now().toString(),
      chapter_number: currentSeries.length + 1,
      previous_id: currentSeries.length > 0 ? currentSeries[currentSeries.length - 1].id : null
    } as const;

    console.log('保存新故事:', newStory);

    saveChapter(newStory).then(() => {
      const updatedStories = [newStory, ...savedStories];
      setSavedStories(updatedStories);
      setCurrentSeries([...currentSeries, newStory]);
      // 同时更新到 localStorage 作为备份
      localStorage.setItem('saved_stories', JSON.stringify(updatedStories));
      message.success('保存成功！');
    }).catch(error => {
      console.error('保存失败:', error);
      message.error('保存失败，请重试');
    });
  }, [generatedContent, storyType, savedStories, currentSeries]);

  // 修改加载逻辑
  useEffect(() => {
    const loadStories = async () => {
      try {
        // 先尝试从 localStorage 加载
        const saved = localStorage.getItem('saved_stories');
        if (saved) {
          const parsedStories = JSON.parse(saved);
          console.log('localStorage中的故事:', parsedStories);
          
          if (Array.isArray(parsedStories) && parsedStories.length > 0) {
            // 直接使用 localStorage 中的数据
            setSavedStories(parsedStories.map(story => ({
              ...story,
              series_id: story.series_id || story.id,
              chapter_number: story.chapter_number || 1,
              title: story.title || '第1章',
              type: story.type as StoryType
            })));

            // 异步迁移到 IndexedDB
            Promise.all(parsedStories.map(story => 
              saveChapter({
                ...story,
                series_id: story.series_id || story.id,
                chapter_number: story.chapter_number || 1,
                title: story.title || '第1章',
                type: story.type as StoryType
              })
            )).then(() => {
              console.log('数据已成功迁移到 IndexedDB');
            }).catch(error => {
              console.error('迁移到 IndexedDB 失败:', error);
            });
          }
        } else {
          // 如果 localStorage 为空，尝试从 IndexedDB 加载
          const dbStories = await getAllStoriesFromDB();
          if (dbStories && dbStories.length > 0) {
            console.log('从 IndexedDB 加载的故事:', dbStories);
            setSavedStories(dbStories);
          }
        }
      } catch (error) {
        console.error('加载故事失败:', error);
        setSavedStories([]);
      }
    };

    loadStories();
  }, []);

  // 修改朗读功能
  const handleRead = useCallback(() => {
    if (!generatedContent) return;

    if (isReading) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(generatedContent);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    utterance.volume = volume;
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      setIsReading(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsReading(false);
      setIsPaused(false);
      message.error('朗读出错，请重试');
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
    setIsPaused(false);
  }, [generatedContent, isReading, isPaused, rate, volume, voice]);

  // 添加停止功能
  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
  }, []);

  // 组件卸载时停止朗读
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // 添加阅读系列功能
  const handleReadSeries = useCallback((seriesId: string) => {
    const chapters = savedStories
      .filter(story => story.series_id === seriesId)
      .sort((a, b) => (a.chapter_number || 0) - (b.chapter_number || 0))
      .map(story => ({
        ...story,
        title: story.title || `第${story.chapter_number}章`,
        chapter_number: story.chapter_number || 0
      }));
    setCurrentSeries(chapters);
    setIsSeriesView(true);
  }, [savedStories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* 顶部标题栏 */}
          <div className="border-b border-gray-100 p-4 md:p-6 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                <span className="text-white text-lg font-bold">A</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">AI 故事生成器</h2>
                <p className="text-sm text-gray-500">快速生成精彩故事</p>
              </div>
            </div>
            <Button
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
              className="md:hidden"
            >
              设置
            </Button>
          </div>

          {/* 主要内容区 */}
          <div className="flex">
            {/* 左侧控制面板 - 在大屏幕上显示 */}
            <div className="hidden md:block w-80 border-r border-gray-100 p-6 space-y-6">
              <ControlPanel
                storyType={storyType}
                setStoryType={setStoryType}
                length={length}
                setLength={setLength}
                tone={tone}
                setTone={setTone}
                prompt={prompt}
                setPrompt={setPrompt}
                generating={generating}
                handleGenerate={handleGenerate}
                handleSave={handleSave}
                generatedContent={generatedContent}
              />
            </div>

            {/* 右侧内容区 */}
            <div className="flex-1 p-4 md:p-6">
              <Tabs
                defaultActiveKey="content"
                items={[
                  {
                    key: 'content',
                    label: '生成内容',
                    children: (
                      <div className="bg-gray-50 rounded-xl p-6 min-h-[calc(100vh-200px)] shadow-inner">
                        {generating ? (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <div className="mb-4">正在创作精彩故事...</div>
                              <div className="text-sm text-gray-400">预计需要 10-20 秒</div>
                            </div>
                          </div>
                        ) : generatedContent ? (
                          <div className="prose prose-lg max-w-none">
                            <VoiceControl
                              rate={rate}
                              setRate={setRate}
                              volume={volume}
                              setVolume={setVolume}
                              voice={voice}
                              setVoice={setVoice}
                              isReading={isReading}
                              isPaused={isPaused}
                              onRead={handleRead}
                              onStop={handleStop}
                            />
                            <ReactMarkdown>{generatedContent}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <div className="mb-2">点击生成按钮开始创作</div>
                              <div className="text-sm text-gray-400">AI 将为您创作一个精彩的故事</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'saved',
                    label: '已保存故事',
                    children: (
                      <div className="bg-gray-50 rounded-xl p-6 min-h-[calc(100vh-200px)] shadow-inner">
                        {isSeriesView ? (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-medium">
                                {STORY_TYPES.find(t => t.value === currentSeries[0]?.type)?.label}系列
                              </h3>
                              <div className="flex gap-2">
                                <Button onClick={() => setIsSeriesView(false)}>返回列表</Button>
                                <Button
                                  type="primary"
                                  onClick={() => {
                                    setPrompt(`继续写作这个故事：\n${currentSeries[currentSeries.length - 1].content.slice(-200)}`);
                                    message.success('已设置为续写模式');
                                  }}
                                >
                                  续写本章
                                </Button>
                              </div>
                            </div>
                            <div className="prose prose-lg max-w-none">
                              {currentSeries.map((chapter) => (
                                <div key={chapter.id} className="mb-8">
                                  {chapter.content}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {savedStories.reduce((acc: SeriesGroup[], story) => {
                              const seriesIndex = acc.findIndex(s => s.id === (story.series_id || story.id));
                              if (seriesIndex === -1) {
                                acc.push({
                                  id: story.series_id || story.id,
                                  type: story.type,
                                  preview: story.content.substring(0, 100),
                                  chapters: [story],
                                  lastUpdate: story.date
                                });
                              } else {
                                acc[seriesIndex].chapters.push(story);
                                if (new Date(story.date) > new Date(acc[seriesIndex].lastUpdate)) {
                                  acc[seriesIndex].lastUpdate = story.date;
                                  acc[seriesIndex].preview = story.content.substring(0, 100);
                                }
                              }
                              return acc;
                            }, [] as SeriesGroup[])
                            .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
                            .map(series => (
                              <div key={series.id} className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-lg font-medium">
                                    {STORY_TYPES.find(t => t.value === series.type)?.label}系列
                                  </h4>
                                  <span className="text-sm text-gray-500">
                                    {series.chapters.length}章
                                  </span>
                                </div>
                                <div className="text-gray-600 mb-4">
                                  {series.preview}...
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={() => handleReadSeries(series.id)}>
                                    阅读全文
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 移动端抽屉 */}
      <Drawer
        title="故事设置"
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={320}
      >
        <ControlPanel
          storyType={storyType}
          setStoryType={setStoryType}
          length={length}
          setLength={setLength}
          tone={tone}
          setTone={setTone}
          prompt={prompt}
          setPrompt={setPrompt}
          generating={generating}
          handleGenerate={handleGenerate}
          handleSave={handleSave}
          generatedContent={generatedContent}
        />
      </Drawer>
    </div>
  )
}

// 添加类型定义
interface ControlPanelProps {
  storyType: StoryType;
  setStoryType: (type: StoryType) => void;
  length: string;
  setLength: (length: string) => void;
  tone: string;
  setTone: (tone: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  generating: boolean;
  handleGenerate: () => void;
  handleSave: () => void;
  generatedContent: string;
}

function ControlPanel({
  storyType,
  setStoryType,
  length,
  setLength,
  tone,
  setTone,
  prompt,
  setPrompt,
  generating,
  handleGenerate,
  handleSave,
  generatedContent
}: ControlPanelProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择类型
        </label>
        <Select
          className="w-full"
          options={STORY_TYPES}
          value={storyType}
          onChange={(value) => {
            setStoryType(value)
            setPrompt(PROMPT_TEMPLATES[value])
          }}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          字数
        </label>
        <Select
          className="w-full"
          options={STORY_LENGTH}
          value={length}
          onChange={setLength}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          语气风格
        </label>
        <Select
          className="w-full"
          options={STORY_TONE}
          value={tone}
          onChange={setTone}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          提示词
        </label>
        <TextField
          multiline
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full"
          placeholder="输入详细的提示词来指导 AI 生成内容..."
        />
      </div>
      <div className="flex flex-col space-y-3">
        <Button
          type="primary"
          onClick={handleGenerate}
          loading={generating}
          className="h-12 bg-gradient-to-r from-pink-500 to-purple-500 border-0"
        >
          开始生成
        </Button>
        <Button
          onClick={handleSave}
          disabled={!generatedContent}
          className="h-12"
        >
          保存故事
        </Button>
      </div>
    </>
  )
} 