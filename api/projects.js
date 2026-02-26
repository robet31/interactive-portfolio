import pool from './db.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const id = url.searchParams.get('id');

  try {
    // GET /api/projects - all projects
    if (path === '/api/projects' && !id) {
      const result = await pool.query(
        'SELECT id, title, description, image, tags, link, category FROM projects'
      );
      const projects = result.rows.map(row => ({
        ...row,
        tags: row.tags || [],
      }));
      return Response.json(projects);
    }
    
    // GET /api/projects?id=xxx - single project
    if (path === '/api/projects' && id) {
      const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }
      return Response.json(result.rows[0]);
    }
    
    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return Response.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, image, tags, link, category } = body;
    
    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }
    
    const result = await pool.query(
      `INSERT INTO projects (title, description, image, tags, link, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description || '', image || null, tags || [], link || '', category || 'Web Development']
    );
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    return Response.json({ error: 'Failed to create project: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return Response.json({ error: 'Project ID is required (use ?id=xxx)' }, { status: 400 });
    }
    
    const body = await request.json();
    const { title, description, image, tags, link, category } = body;
    
    const result = await pool.query(
      `UPDATE projects SET title = $1, description = $2, image = $3, tags = $4, link = $5, category = $6
       WHERE id = $7 RETURNING *`,
      [title, description, image, tags, link, category, id]
    );
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    return Response.json({ error: 'Failed to update project: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return Response.json({ error: 'Project ID is required (use ?id=xxx)' }, { status: 400 });
    }
    
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return Response.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
