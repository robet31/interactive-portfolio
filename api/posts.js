import pool from './db.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // GET /api/posts - all posts
    if (path === '/api/posts') {
      const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
      return Response.json(result.rows);
    }
    
    // GET /api/posts/published - published only
    if (path === '/api/posts/published') {
      const result = await pool.query(
        "SELECT * FROM posts WHERE status = 'published' ORDER BY created_at DESC"
      );
      return Response.json(result.rows);
    }
    
    // GET /api/posts/:slug - single post
    const slugMatch = path.match(/^\/api\/posts\/(.+)$/);
    if (slugMatch) {
      const slug = slugMatch[1];
      const result = await pool.query('SELECT * FROM posts WHERE slug = $1', [slug]);
      if (result.rows.length === 0) {
        return Response.json({ error: 'Post not found' }, { status: 404 });
      }
      return Response.json(result.rows[0]);
    }
    
    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return Response.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, slug, content, excerpt, cover_image_url, category, status, reading_time } = body;
    
    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }
    
    const result = await pool.query(
      `INSERT INTO posts (title, slug, content, excerpt, cover_image_url, category, status, reading_time, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [title, slug || title.toLowerCase().replace(/\s+/g, '-'), content || '', excerpt || '', cover_image_url, category || 'Jurnal & Catatan', status || 'draft', reading_time || 1]
    );
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    return Response.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
