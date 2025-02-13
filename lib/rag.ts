import { getDB, getAllStories, addStory, getStoriesBySeries } from './db';
import { cosineSimilarity } from './utils';

export { getAllStories } from './db';

interface Story {
  id: string;
  type: string;
  content: string;
  date: string;
  embedding: string;
  title: string;
  series_id?: string;
  chapter_number?: number;
  previous_id?: string | null;
}

interface StoryWithSimilarity extends Story {
  similarity: number;
}

export async function findSimilarStories(query: string, storyId?: string, limit: number = 3) {
  // 1. 获取所有故事
  const allStories = await getAllStories();
  
  // 2. 如果有 storyId，获取该系列的所有章节并按章节号排序
  const seriesChapters = storyId ? 
    allStories
      .filter((story: Story) => story.series_id === storyId)
      .sort((a: Story, b: Story) => (a.chapter_number || 0) - (b.chapter_number || 0)) : 
    [];

  // 3. 构建上下文（包含所有前序章节）
  const context = seriesChapters.map((chapter: Story) => chapter.content).join('\n\n');

  // 4. 获取查询的嵌入向量
  const queryEmbedding = await getEmbedding(query + '\n' + context);

  // 5. 找出相似故事（排除当前系列的故事）
  const otherStories = allStories.filter((story: Story) => 
    !seriesChapters.some((chapter: Story) => chapter.series_id === story.series_id)
  );

  const similarStories = otherStories
    .map((story: Story) => ({
      ...story,
      similarity: cosineSimilarity(
        JSON.parse(story.embedding),
        queryEmbedding
      )
    }))
    .sort((a: StoryWithSimilarity, b: StoryWithSimilarity) => b.similarity - a.similarity)
    .slice(0, limit);

  return {
    previousChapters: seriesChapters,
    similarStories
  };
}

async function getEmbedding(text: string) {
  const response = await fetch('https://api.deepseek.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: text,
      model: "deepseek-embedding"
    })
  });

  const data = await response.json();
  return data.data[0].embedding;
}

export async function saveChapter(story: Omit<Story, 'embedding'>) {
  const embedding = await getEmbedding(story.content);
  return addStory({
    ...story,
    embedding: JSON.stringify(embedding)
  });
} 