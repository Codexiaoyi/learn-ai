import { openDB, DBSchema } from 'idb';

interface StoryDB extends DBSchema {
  stories: {
    key: string;
    value: {
      id: string;
      type: string;
      content: string;
      date: string;
      embedding?: string;
      title: string;
      series_id?: string;
      chapter_number?: number;
      previous_id?: string | null;
    };
    indexes: { 'by-series': string };
  };
}

let db: any = null;

export async function getDB() {
  if (!db) {
    db = await openDB<StoryDB>('stories-db', 2, {
      upgrade(db, oldVersion, newVersion) {
        if (!db.objectStoreNames.contains('stories')) {
          const store = db.createObjectStore('stories', { keyPath: 'id' });
          store.createIndex('by-series', 'series_id');
        }
      },
    });
  }
  return db;
}

export async function getAllStories() {
  const db = await getDB();
  return db.getAll('stories');
}

export async function addStory(story: any) {
  const db = await getDB();
  try {
    console.log('保存到 IndexedDB:', story);
    await db.put('stories', {
      ...story,
      embedding: story.embedding || ''  // 确保 embedding 字段存在
    });
    return story;
  } catch (error) {
    console.error('保存到 IndexedDB 失败:', error);
    throw error;
  }
}

export async function getStoriesBySeries(seriesId: string) {
  const db = await getDB();
  return db.getAllFromIndex('stories', 'by-series', seriesId);
} 