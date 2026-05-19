# 🗄️ Database Setup & Optimization Guide

## ⚡ CRITICAL: Database Indexes

### Why Indexes Matter

**Without indexes:**
- Search for a user: ~500ms (1000 users) → 5000ms (10,000 users)
- Find relationships: Exponentially slower
- App feels slow and sluggish

**With indexes:**
- Same searches: ~50ms (1000 users) → 500ms (10,000 users)
- 10-50x faster ⚡

---

## 🔧 Setup Instructions

### Step 1: Open Supabase Dashboard

```
1. Go to https://app.supabase.com
2. Click on your project
3. Navigate to: SQL Editor (left sidebar)
```

### Step 2: Create the Indexes

**Copy the entire SQL block below:**

```sql
-- RELATIONSHIP FINDER INDEXES
-- Run these to optimize relationship queries

-- Index for finding users by surname (used in search)
CREATE INDEX IF NOT EXISTS idx_users_surname 
ON public.users(surname);

-- Index for filtering by family group
CREATE INDEX IF NOT EXISTS idx_users_family 
ON public.users(family);

-- Indexes for relationship traversal (most important!)
CREATE INDEX IF NOT EXISTS idx_users_fatherId 
ON public.users(fatherId);

CREATE INDEX IF NOT EXISTS idx_users_motherId 
ON public.users(motherId);

CREATE INDEX IF NOT EXISTS idx_users_spouseId 
ON public.users(spouseId);

-- Composite index for full name search
CREATE INDEX IF NOT EXISTS idx_users_name_surname 
ON public.users(name, surname);

-- Index for filtering deleted users
CREATE INDEX IF NOT EXISTS idx_users_isDeleted 
ON public.users(isDeleted);

-- Composite index for common active user queries
CREATE INDEX IF NOT EXISTS idx_users_active 
ON public.users(isDeleted, isDeceased);
```

### Step 3: Paste & Run

1. **Paste** the SQL block into the Supabase SQL Editor
2. **Click the blue "Run" button** (bottom right of editor)
3. **Wait for confirmation** - should say "Execution successful" in green

---

## ✅ Verify Indexes Were Created

**Run this SQL to check:**

```sql
-- See all indexes on users table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users'
ORDER BY indexname;
```

**You should see output like:**
```
idx_users_surname          | CREATE INDEX idx_users_surname ...
idx_users_family           | CREATE INDEX idx_users_family ...
idx_users_fatherId         | CREATE INDEX idx_users_fatherId ...
idx_users_motherId         | CREATE INDEX idx_users_motherId ...
idx_users_spouseId         | CREATE INDEX idx_users_spouseId ...
idx_users_name_surname     | CREATE INDEX idx_users_name_surname ...
idx_users_isDeleted        | CREATE INDEX idx_users_isDeleted ...
idx_users_active           | CREATE INDEX idx_users_active ...
```

**If you see these, you're good! ✅**

---

## 📊 Current Database Schema

Your `public.users` table should already have:

```sql
CREATE TABLE public.users (
  id                 text PRIMARY KEY,
  name              text NOT NULL,
  surname           text NOT NULL,
  maidenName        text,
  family            text,
  gender            text NOT NULL,
  maritalStatus     text NOT NULL,
  fatherId          text,
  motherId          text,
  spouseId          text,
  birthMonth        text,
  birthYear         text,
  profilePictureUrl text NOT NULL,
  description       text,
  isDeceased        boolean DEFAULT false,
  deathDate         text,
  created_at        timestamp DEFAULT now(),
  isDeleted         boolean DEFAULT false
);
```

**If your table looks different**, let us know - the algorithm adapts to your schema.

---

## 🔐 Storage Policies (Already Set Up)

Your Supabase should already have storage policies for the `profile-pictures` bucket:

```sql
-- Policy 1: Allow public read access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'profile-pictures' );

-- Policy 2: Allow anonymous upload
CREATE POLICY "Anonymous Insert Access"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'profile-pictures' );

-- Policy 3: Allow authenticated admin access
CREATE POLICY "Admin Full Access"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'profile-pictures' )
WITH CHECK ( bucket_id = 'profile-pictures' );
```

**No action needed** - these are already in place.

---

## 📈 Performance Testing

### Test Query 1: Find User by Surname

```sql
-- Without index: 150ms+ (1000 users)
-- With index: <5ms
SELECT * FROM public.users 
WHERE surname = 'Patel' 
LIMIT 10;
```

### Test Query 2: Find Children of User

```sql
-- Without index: 300ms+ 
-- With index: <10ms
SELECT * FROM public.users 
WHERE fatherId = 'user123' OR motherId = 'user123';
```

### Test Query 3: Find Spouse

```sql
-- Without index: 200ms+
-- With index: <5ms
SELECT * FROM public.users 
WHERE spouseId = 'user456';
```

**Test these** (run in SQL Editor) - they should all be very fast now!

---

## 🚀 Optional: Advanced Optimization

### If you have 50,000+ users, add these:

```sql
-- Partitioning by surname (advanced)
-- This splits the table into smaller pieces for faster queries
-- Requires table recreation - only do if needed

-- For now, the indexes above are sufficient
-- Only add this if you experience slowdowns with 50k+ users
```

### Caching Strategy

The relationship finder includes built-in caching:
- Results are cached for 5 minutes
- Same relationship lookup = instant response
- Cache clears when users are updated

**No setup needed** - it's automatic!

---

## 📊 Database Statistics

### Monitor Query Performance

**In Supabase Dashboard → Database → Query Performance:**

You'll see:
- How many times each query runs
- Average execution time
- Cache hit rate

**After adding indexes:**
- All relationship queries should show <100ms
- Cache hit rates should improve

---

## 🔍 Common Database Issues & Fixes

### Issue: Queries still slow after adding indexes

**Check:** Did you run the SQL?
```sql
-- Verify index exists
SELECT * FROM pg_indexes 
WHERE tablename = 'users' AND indexname LIKE 'idx_users%';
```

**Fix:** If not there, run the SQL again in Supabase.

### Issue: "Index already exists" error

**This is fine!** It just means the index was already created.
- The `IF NOT EXISTS` clause prevents re-creation
- Just means you're all set!

### Issue: Relationship finder still says "No relationship found"

**This is NOT a database issue** - it's data issue.
- Check if parents/spouses are linked in the profiles
- Go to a profile page
- Manually link the relationships
- Then try again

---

## 💾 Backup Your Data

### Automatic Backups (Supabase Free)

Supabase automatically backs up your data daily.
- **No action needed**
- You can restore from the Dashboard if needed

### Manual Backup (Recommended)

```bash
# Export your data (from Supabase Dashboard)
1. Go to Database → Tables
2. Click "users" table
3. Click "..." menu → "Download as CSV"
4. Save the file

# This backs up all your user data
# Keep this file safe!
```

---

## 🧪 Test Your Setup

### Quick Test

```sql
-- This should be very fast (<10ms)
SELECT COUNT(*) FROM public.users;

-- This should be very fast (<5ms)
SELECT * FROM public.users 
WHERE surname = 'Smith' LIMIT 1;

-- This should be very fast (<5ms)
SELECT * FROM public.users 
WHERE fatherId IS NOT NULL LIMIT 5;
```

**If all are fast:** Your database is optimized! ✅

---

## 📝 SQL Commands Reference

### Monitor Indexes

```sql
-- See all indexes on users table
SELECT * FROM pg_indexes WHERE tablename = 'users';

-- Check index size
SELECT schemaname, tablename, indexname, 
       pg_size_pretty(pg_relation_size(indexrelid)) 
FROM pg_indexes 
WHERE tablename = 'users';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'users'
ORDER BY idx_scan DESC;
```

### Database Health

```sql
-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('public.users'));

-- Count users
SELECT COUNT(*) FROM public.users;

-- Find duplicate names (data quality check)
SELECT name, surname, COUNT(*) 
FROM public.users 
GROUP BY name, surname 
HAVING COUNT(*) > 1;

-- Find orphaned records (users with invalid parent IDs)
SELECT u.id, u.name, u.fatherId 
FROM public.users u
LEFT JOIN public.users p ON u.fatherId = p.id
WHERE u.fatherId IS NOT NULL AND p.id IS NULL;
```

---

## 🔄 Data Cleanup (Optional)

### Remove Duplicate Users

```sql
-- Find near-duplicates (same name, similar dates)
SELECT id, name, surname, birthYear, COUNT(*) as count
FROM public.users
GROUP BY name, surname, birthYear
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Manually delete duplicates:
-- Delete the newer one (higher created_at)
-- Keep the older one (lower created_at)
DELETE FROM public.users 
WHERE id = 'duplicate_id_here';
```

### Fix Missing Relationships

```sql
-- Find married people without spouses linked
SELECT id, name, surname, maritalStatus, spouseId
FROM public.users
WHERE maritalStatus = 'married' AND spouseId IS NULL
ORDER BY surname;

-- Update spouse relationship (do this in app UI, not SQL)
-- Go to profile and link them
```

---

## 📈 Scaling for Growth

### Current Limits (Free Tier)
- **Database size:** 500 MB
- **Can store:** ~50,000 users (10KB per user)
- **Query speed:** <500ms even with 10,000 users

### If You Outgrow Free Tier

```
50,000 users → Need more than 500MB
Upgrade path: Supabase Pro ($25/month)
- 8 GB database
- 250,000+ users supported
```

**Not a problem now** - think about it when you have thousands of users!

---

## 🎯 Best Practices

### DO ✅
- Run indexes once and forget about them
- Keep data clean (no duplicate names)
- Back up your data monthly
- Monitor slow queries in Supabase Dashboard
- Update user profiles through the app (not SQL)

### DON'T ❌
- Delete indexes manually (they help!)
- Run large delete queries on users table
- Store sensitive info in description field
- Access database directly in production (use app)

---

## 🔗 Resource Links

- Supabase Docs: https://supabase.com/docs
- PostgreSQL Indexes: https://www.postgresql.org/docs/current/indexes.html
- Query Optimization: https://supabase.com/docs/guides/database/best-practices

---

## ✅ Final Checklist

Before considering setup done:

- [ ] Opened Supabase Dashboard
- [ ] Navigated to SQL Editor
- [ ] Copied all index creation SQL
- [ ] Ran the SQL (got "Execution successful")
- [ ] Verified indexes exist (ran verification query)
- [ ] Ran performance test queries (all fast)
- [ ] Checked no errors in output

**You're ready!** Your database is now optimized for the relationship finder. 🚀

---

**Questions?** All index creation is idempotent - you can run the SQL multiple times with no harm. Safe to experiment!
