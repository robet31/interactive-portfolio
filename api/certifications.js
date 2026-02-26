import pool from './db.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const id = url.searchParams.get('id');

  try {
    // GET /api/certifications - all certifications
    if (path === '/api/certifications' && !id) {
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
    }
    
    // GET /api/certifications?id=xxx - single certification
    if (path === '/api/certifications' && id) {
      const result = await pool.query('SELECT * FROM certifications WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return Response.json({ error: 'Certification not found' }, { status: 404 });
      }
      return Response.json(result.rows[0]);
    }
    
    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return Response.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, organization, issue_date, expiry_date, credential_id, credential_url, image, skills } = body;
    
    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const result = await pool.query(
      `INSERT INTO certifications (name, organization, issue_date, expiry_date, credential_id, credential_url, image, skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, organization || '', issue_date || null, expiry_date || null, credential_id || '', credential_url || '', image || null, skills || []]
    );
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating certification:', error);
    return Response.json({ error: 'Failed to create certification: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return Response.json({ error: 'Certification ID is required (use ?id=xxx)' }, { status: 400 });
    }
    
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
    return Response.json({ error: 'Failed to update certification: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return Response.json({ error: 'Certification ID is required (use ?id=xxx)' }, { status: 400 });
    }
    
    await pool.query('DELETE FROM certifications WHERE id = $1', [id]);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting certification:', error);
    return Response.json({ error: 'Failed to delete certification' }, { status: 500 });
  }
}
