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
    
    // GET /api/posts/published - if (path === '/api/posts/published') {
      const result = await published only
    pool.query(
        "SELECT * FROM posts WHERE status = 'published' ORDER BY created_at DESC"
      );
      return Response.json(result.rows);
    }
 /api/posts/:    
    // GETslug - single post
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
    
    const postSlug = slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const result = await pool.query(
      `INSERT INTO posts (title, slug, content, excerpt, cover_image_url, category, status, reading_time, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [title, postSlug, content || '', excerpt || '', cover_image_url, category || 'Jurnal & Catatan', status || 'draft', reading_time || 1]
    );
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    return Response.json({ error: 'Failed to create post: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const idMatch = path.match(/^\/api\/posts\/(\d+)$/);
    
    if (!idMatch) {
      return Response.json({ error: 'Invalid post ID' }, { status: 400 });
    }
    
    const id = idMatch[1];
    const body = await request.json();
    const { title, slug, content, excerpt, cover_image_url, category, status, reading_time } = body;
    
    const postSlug = slug || (title ? title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : null);
    
    const result = await pool.query(
      `UPDATE posts SET title = $1, slug = $2, content = $3, excerpt = $4, cover_image_url = $5, category = $6, status = $7, reading_time = $8, updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [title, postSlug, content || '', excerpt || '', cover_image_url, category, status, reading_time, id]
    );
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }
    
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating post:', error);
    return Response.json({ error: 'Failed to update post: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const idMatch = path.match(/^\/api\/posts\/(\d+)$/);
    
    if (!idMatch) {
      return Response.json({ error: 'Invalid post ID' }, { status: 400 });
    }
    
    const id = idMatch[1];
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return Response.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
