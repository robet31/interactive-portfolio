import pool from './db.js';

export const dynamic = 'force-dynamic';

// GET /api/settings
export async function GET(request) {
  try {
    const result = await pool.query('SELECT key, value FROM settings ORDER BY key');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return Response.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST /api/settings/bulk
export async function POST(request) {
  try {
    const { settings } = await request.json();
    
    if (!settings || typeof settings !== 'object') {
      return Response.json({ error: 'Settings object is required' }, { status: 400 });
    }
    
    const keys = Object.keys(settings);
    const values = Object.values(settings).map(v => v || '');
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i].slice(0, 255);
      const value = String(values[i]).slice(0, 10000);
      await pool.query(
        `INSERT INTO settings (key, value, updated_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, value]
      );
    }
    
    return Response.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return Response.json({ error: 'Failed to save settings: ' + error.message }, { status: 500 });
  }
}
