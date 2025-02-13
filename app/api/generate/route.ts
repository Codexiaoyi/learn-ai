import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import https from 'https';
import { findSimilarStories } from '@/lib/rag';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

interface Chapter {
  content: string;
}

export async function POST(req: Request) {
  try {
    const { prompt, style, length, tone, continueFrom, storyId } = await req.json();

    let context = '';
    if (continueFrom) {
      const { previousChapters, similarStories } = await findSimilarStories(continueFrom, storyId);
      
      // 构建上下文，包含所有前序章节和相似故事
      context = `
前序章节：
${previousChapters.map((chapter: Chapter, index: number) => 
  `第${index + 1}章：${chapter.content}`
).join('\n\n')}

参考相似故事：
${similarStories.map((s: Chapter) => s.content).join('\n\n')}

请基于以上内容继续写作，保持情节连贯性：
${continueFrom}
`;
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是一个专业的${style}小说作家。${
              continueFrom ? '请基于上下文继续写作故事。' : '请创作一个新故事。'
            }`
          },
          {
            role: "user",
            content: context + prompt
          }
        ],
        temperature: 0.8,
        max_tokens: parseInt(length) * 2
      }),
      // @ts-ignore
      agent: httpsAgent
    });

    const data = await response.json() as any;
    if (!response.ok) {
      console.error('HTTP Error:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(
        `HTTP ${response.status}: ${data.error || response.statusText || 'API request failed'}`
      );
    }
    return NextResponse.json({ content: data.choices[0].message.content });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: '生成失败：' + (error as Error).message }, { status: 500 });
  }
} 