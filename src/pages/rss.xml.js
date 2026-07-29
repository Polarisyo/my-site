import getRssResponse from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { sortByDateDesc } from '../utils/date';

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = sortByDateDesc(posts);

  return getRssResponse({
    title: 'My Site',
    description: '个人数字花园 - 日常记录、学习笔记与作品展示',
    site: context.site ?? 'https://example.com',
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? '',
      pubDate: post.data.date,
      tags: post.data.tags,
      link: `/blog/${post.id}/`,
    })),
    customData: `<language>zh-CN</language>`,
  });
}