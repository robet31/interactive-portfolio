import pool from './db.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Only handle /api/experiences
  if (path !== '/api/experiences') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  
  try {
    const result = await pool.query(
      'SELECT id, title, organization, period, description, type, image, start_date FROM experiences ORDER BY start_date DESC'
    );
    const experiences = result.rows.map(row => ({
      ...row,
      tags: row.tags || [],
      startDate: row.start_date,
    }));
    return Response.json(experiences);
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return Response.json({ error: 'Failed to fetch experiences' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, organization, period, description, type, image, start_date, tags } = body;
    
    const result = await pool.query(
      `INSERT INTO experiences (title, organization, period, description, type, image, start_date, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, organization, period, description, type || 'work', image, start_date, tags || []]
    );
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating experience:', error);
    return Response.json({ error: 'Failed to create experience' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const idMatch = path.match(/^\/api\/experiences\/(\d+)$/);
    
    if (!idMatch) {
      return Response.json({ error: 'Invalid experience ID' }, { status: 400 });
    }
    
    const id = idMatch[1];
    const body = await request.json();
    const { title, organization, period, description, type, image, start_date, tags } = body;
    
    const result = await pool.query(
      `UPDATE experiences SET title = $1, organization = $2, period = $3, description = $4, type = $5, image = $6, start_date = $7, tags = $8
       WHERE id = $9 RETURNING *`,
      [title, organization, period, description, type, image, start_date, tags, id]
    );
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Experience not found' }, { status: 404 });
    }
    
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating experience:', error);
    return Response.json({ error: 'Failed to update experience' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const idMatch = path.match(/^\/api\/experiences\/(\d+)$/);
    
    if (!idMatch) {
      return Response.json({ error: 'Invalid experience ID' }, { status: 400 });
    }
    
    const id = idMatch[1];
    await pool.query('DELETE FROM experiences WHERE id = $1', [id]);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting experience:', error);
    return Response.json({ error: 'Failed to delete experience' }, { status: 500 });
  }
}
