import pool from './db.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Only handle /api/projects
  if (path !== '/api/projects') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  
  try {
    const result = await pool.query(
      'SELECT id, title, description, image, tags, link, category FROM projects'
    );
    const projects = result.rows.map(row => ({
      ...row,
      tags: row.tags || [],
    }));
    return Response.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return Response.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, image, tags, link, category } = body;
    
    const result = await pool.query(
      `INSERT INTO projects (title, description, image, tags, link, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, image, tags || [], link, category || 'Web Development']
    );
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    return Response.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const idMatch = path.match(/^\/api\/projects\/(\d+)$/);
    
    if (!idMatch) {
      return Response.json({ error: 'Invalid project ID' }, { status: 400 });
    }
    
    const id = idMatch[1];
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
    return Response.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const idMatch = path.match(/^\/api\/projects\/(\d+)$/);
    
    if (!idMatch) {
      return Response.json({ error: 'Invalid project ID' }, { status: 400 });
    }
    
    const id = idMatch[1];
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return Response.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
