# Database Query Optimizations

## Current Issues
- Multiple separate API calls for dashboard data
- No pagination for large result sets
- Favicon fetching happens for every render
- Image CDN URLs fetched individually

## Recommended Optimizations

### 1. Create Combined Dashboard Endpoint
```typescript
// /api/dashboard - Single endpoint for all dashboard data
export async function GET() {
  const [count, todayEntries, recentLog] = await Promise.all([
    db.select({ count: sql`count(*)` }).from(entries),
    db.select().from(entries).where(eq(entries.createdAt, today)),
    db.select().from(entries).orderBy(desc(entries.updatedAt)).limit(20)
  ]);
  
  return { count, todayEntries, recentLog };
}
```

### 2. Add Database Indexes
```sql
-- For faster log queries
CREATE INDEX idx_entries_updated_at ON entries(updated_at DESC);

-- For daily queries  
CREATE INDEX idx_entries_created_date ON entries(DATE(created_at));

-- For metadata searches
CREATE INDEX idx_entries_metadata_gin ON entries USING gin(metadata);
```

### 3. Implement Cursor-Based Pagination
```typescript
// Instead of OFFSET/LIMIT, use cursor pagination
const entries = await db
  .select()
  .from(entries)
  .where(lt(entries.createdAt, cursor))
  .orderBy(desc(entries.createdAt))
  .limit(20);
```

### 4. Batch Similar Operations
```typescript
// Batch favicon fetches
export async function POST /api/batch-favicons {
  const urls = await request.json();
  const favicons = await Promise.all(
    urls.map(url => fetchFavicon(url))
  );
  return { favicons };
}
```

### 5. Add Redis Caching Layer
```typescript
// Cache frequent queries in Redis
const cacheKey = `dashboard:${userId}:${date}`;
let data = await redis.get(cacheKey);

if (!data) {
  data = await fetchDashboardData();
  await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5min cache
}
```

### 6. Optimize Metadata Queries
```typescript
// Use PostgreSQL JSON operators for faster metadata searches
const entries = await db
  .select()
  .from(entries)
  .where(sql`metadata->>'type' = 'image'`)
  .where(sql`metadata->>'author' LIKE '%youtube%'`);
```