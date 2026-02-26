import pool from './db.js';

export const dynamic = 'force-dynamic';

const NEON_FREE_TIER_LIMIT_GB = 0.5;

// GET /api/db-storage
export async function GET(request) {
  try {
    const dbSizeResult = await pool.query(
      `SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size`
    );
    const dbSizeBytesResult = await pool.query(
      `SELECT pg_database_size(current_database()) AS db_size_bytes`
    );
    const totalBytes = parseInt(dbSizeBytesResult.rows[0].db_size_bytes);
    
    const tableSizesResult = await pool.query(`
      SELECT 
        tablename AS table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size_pretty,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);
    
    const limitBytes = NEON_FREE_TIER_LIMIT_GB * 1024 * 1024 * 1024;
    const usedPercentage = (totalBytes / limitBytes) * 100;
    const remainingBytes = Math.max(0, limitBytes - totalBytes);
    
    const avgImageSizeBytes = 500 * 1024;
    const avgPdfSizeBytes = 2 * 1024 * 1024;
    
    const estimatedImagesRemaining = Math.floor(remainingBytes / avgImageSizeBytes);
    const estimatedPdfsRemaining = Math.floor(remainingBytes / avgPdfSizeBytes);
    
    return Response.json({
      plan: 'Neon Free Tier',
      limitGB: NEON_FREE_TIER_LIMIT_GB,
      used: { bytes: totalBytes, pretty: dbSizeResult.rows[0].db_size },
      remaining: {
        bytes: remainingBytes,
        pretty: remainingBytes < 1024 * 1024 
          ? `${Math.round(remainingBytes / 1024)} KB`
          : `${(remainingBytes / (1024 * 1024)).toFixed(2)} MB`,
      },
      usagePercentage: usedPercentage.toFixed(2),
      tables: tableSizesResult.rows.map(row => ({
        name: row.table_name,
        size: row.size_pretty,
        bytes: parseInt(row.size_bytes),
      })),
      recommendations: {
        estimatedImagesRemaining,
        estimatedPdfsRemaining,
        message: usedPercentage > 80 
          ? 'Warning: Database usage above 80%! Consider cleaning up unused data or images.'
          : usedPercentage > 50
          ? 'Notice: Database usage above 50%. Monitor storage if adding more media.'
          : 'Storage usage is healthy.',
      },
    });
  } catch (error) {
    console.error('Error fetching storage info:', error);
    return Response.json({ error: 'Failed to fetch storage info' }, { status: 500 });
  }
}
