import pool from './db.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Only handle /api/certifications
  if (path !== '/api/certifications') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  
  try {
    const result = await pool.query(
      'SELECT id, name, organization, issue_date, expiry_date, credential_id, credential_url, image, skills FROM certifications'
    );
    const certifications = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      organization: row.organization,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      credentialId: row.credential_id,
      credentialUrl: row.credential_url,
      image: row.image,
      skills: row.skills || [],
    }));
    return Response.json(certifications);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return Response.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, organization, issue_date, expiry_date, credential_id, credential_url, image, skills } = body;
    
    const result = await pool.query(
      `INSERT INTO certifications (name, organization, issue_date, expiry_date, credential_id, credential_url, image, skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, organization, issue_date, expiry_date, credential_id, credential_url, image, skills || []]
    );
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating certification:', error);
    return Response.json({ error: 'Failed to create certification' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const idMatch = path.match(/^\/api\/certifications\/(\d+)$/);
    
    if (!idMatch) {
      return Response.json({ error: 'Invalid certification ID' }, { status: 400 });
    }
    
    const id = idMatch[1];
    const body = await request.json();
    const { name, organization, issue_date, expiry_date, credential_id, credential_url, image, skills } = body;
    
    const result = await pool.query(
      `UPDATE certifications SET name = $1, organization = $2, issue_date = $3, expiry_date = $4, credential_id = $5, credential_url = $6, image = $7, skills = $8
       WHERE id = $9 RETURNING *`,
      [name, organization, issue_date, expiry_date, credential_id, credential_url, image, skills, id]
    );
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Certification not found' }, { status: 404 });
    }
    
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating certification:', error);
    return Response.json({ error: 'Failed to update certification' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    const idMatch = path.match(/^\/api\/certifications\/(\d+)$/);
    
    if (!idMatch) {
      return Response.json({ error: 'Invalid certification ID' }, { status: 400 });
    }
    
    const id = idMatch[1];
    await pool.query('DELETE FROM certifications WHERE id = $1', [id]);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting certification:', error);
    return Response.json({ error: 'Failed to delete certification' }, { status: 500 });
  }
}
