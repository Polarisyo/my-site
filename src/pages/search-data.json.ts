import { getCollection } from 'astro:content';

export async function GET() {
  const blogPosts = await getCollection('blog', ({ data }) => !data.draft);
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  const projects = await getCollection('projects');

  const docs = [
    ...blogPosts.map((post) => ({
      id: `blog-${post.id}`,
      title: post.data.title,
      description: post.data.description || '',
      body: post.body || '',
      url: `/blog/${post.id}/`,
      type: 'blog',
      tags: post.data.tags || [],
      date: post.data.date.toISOString(),
    })),
    ...notes.map((note) => ({
      id: `notes-${note.id}`,
      title: note.data.title,
      description: note.data.description || '',
      body: note.body || '',
      url: `/notes/${note.id}/`,
      type: 'notes',
      tags: note.data.tags || [],
      category: note.data.category,
    })),
    ...projects.map((project) => ({
      id: `projects-${project.id}`,
      title: project.data.name,
      description: project.data.description,
      body: project.body || '',
      url: `/projects/${project.id}/`,
      type: 'projects',
      tags: project.data.techStack || [],
      status: project.data.status,
    })),
  ];

  return new Response(JSON.stringify(docs), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}