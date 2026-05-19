# Installation Guide - Relationship Finder

Complete step-by-step instructions for integrating the Relationship Finder into your Kutumb project.

## Prerequisites

Ensure you have:
- Node.js >= 18.0.0
- npm or yarn
- An existing Kutumb/Vasudha Connect project with:
  - Next.js 14+
  - React 18+
  - Supabase database
  - Tailwind CSS
  - shadcn/ui components

## Installation Steps

### Step 1: Copy Source Files (5 minutes)

Copy the source files from this repository to your Kutumb project:

```bash
# Copy the core algorithm
cp src/lib/relationship-finder.ts /path/to/kutumb-main/src/lib/

# Create the relationships directory
mkdir -p /path/to/kutumb-main/src/app/relationships/_components

# Copy the page component
cp src/app/relationships/page.tsx /path/to/kutumb-main/src/app/relationships/

# Copy the React components
cp src/app/relationships/_components/RelationshipFinderClient.tsx \
   /path/to/kutumb-main/src/app/relationships/_components/

cp src/app/relationships/_components/RelationshipPathVisualization.tsx \
   /path/to/kutumb-main/src/app/relationships/_components/

cp src/app/relationships/_components/UserSelectionModal.tsx \
   /path/to/kutumb-main/src/app/relationships/_components/
```

### Step 2: Update Navigation (2 minutes)

Edit your `src/components/MainHeader.tsx`:

```typescript
// Find the navigation section and add:
<Link href="/relationships" className="flex items-center gap-2 hover:text-purple-600 transition-colors">
  🌳 Relationships
</Link>
```

### Step 3: Create Database Indexes (3 minutes)

Go to your **Supabase Dashboard**:

1. Navigate to: **SQL Editor**
2. Copy and paste the entire SQL block below
3. Click the blue **Run** button
4. Wait for "Execution successful" message

```sql
-- Create performance indexes for relationship finder
CREATE INDEX IF NOT EXISTS idx_users_surname 
ON public.users(surname);

CREATE INDEX IF NOT EXISTS idx_users_family 
ON public.users(family);

CREATE INDEX IF NOT EXISTS idx_users_fatherId 
ON public.users(fatherId);

CREATE INDEX IF NOT EXISTS idx_users_motherId 
ON public.users(motherId);

CREATE INDEX IF NOT EXISTS idx_users_spouseId 
ON public.users(spouseId);

CREATE INDEX IF NOT EXISTS idx_users_name_surname 
ON public.users(name, surname);

CREATE INDEX IF NOT EXISTS idx_users_isDeleted 
ON public.users(isDeleted);

CREATE INDEX IF NOT EXISTS idx_users_active 
ON public.users(isDeleted, isDeceased);
```

### Step 4: Verify Installation (5 minutes)

```bash
# Navigate to your Kutumb project
cd /path/to/kutumb-main

# Check files are in correct locations
test -f src/lib/relationship-finder.ts && echo "✅ relationship-finder.ts found"
test -f src/app/relationships/page.tsx && echo "✅ relationships/page.tsx found"
test -d src/app/relationships/_components && echo "✅ _components folder found"

# Type check
npm run typecheck

# Should show no errors
```

### Step 5: Test Locally (5 minutes)

```bash
# Start dev server
npm run dev

# Visit in browser
open http://localhost:9002/relationships

# You should see:
# - Purple/blue gradient header
# - "Relationship Finder" title
# - Two person selection cards
# - "Find Relationship" button
```

### Step 6: Deploy (1 minute)

```bash
# Commit your changes
git add .
git commit -m "Add relationship finder feature"

# Push to GitHub
git push origin main

# Vercel auto-deploys (2-3 minutes)
# Your live site now has the feature!
```

---

## Troubleshooting Installation

### Issue: "Cannot find module 'relationship-finder'"

**Solution:**
```bash
# Verify file path
ls -la src/lib/relationship-finder.ts

# If not there, copy again
cp path/to/relationship-finder.ts src/lib/

# Restart dev server
npm run dev
```

### Issue: Database indexes not created

**Solution:**
1. Go back to Supabase SQL Editor
2. Verify the SQL ran (check for success message)
3. If missing, run this verification:

```sql
SELECT * FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE 'idx_users%';
```

Should show 8 indexes.

### Issue: Navigation link doesn't appear

**Solution:**
1. Verify you edited `src/components/MainHeader.tsx`
2. Check the link syntax is correct
3. Restart dev server: `npm run dev`
4. Clear browser cache: Ctrl+Shift+Del

### Issue: Page loads but shows "Loading forever"

**Solution:**
1. Check browser console (F12)
2. Look for red error messages
3. Verify Supabase credentials in `.env.local`
4. Restart dev server

---

## Post-Installation

### Verify It's Working

Test with these steps:

1. Go to `/relationships` page
2. Click "Select Person A"
3. Search for a user (e.g., "Smith")
4. Click to select
5. Click "Select Person B"
6. Select a different user
7. Click "Find Relationship"
8. Should see relationship type and path

### Performance Testing

Test searches with 100+ users to verify performance:

1. Go to the Relationship Finder
2. Select two people
3. Click "Find Relationship"
4. Check that result appears in <500ms

If slower:
- Verify database indexes exist
- Check Supabase performance logs
- See docs/TROUBLESHOOTING.md for solutions

---

## Next Steps

### Documentation
- Read `docs/README_START_HERE.md` for overview
- Read `docs/IMPLEMENTATION_GUIDE.md` for detailed explanation
- Keep `docs/TROUBLESHOOTING.md` handy if issues arise

### Customization
- Change colors in `/src/app/relationships/page.tsx`
- Adjust relationship names in `/src/lib/relationship-finder.ts`
- Modify UI components as needed

### Additional Features
- See `docs/ADDITIONAL_IMPROVEMENTS.md` for 10+ ready-to-code features
- See `docs/IMPROVEMENT_GUIDE.md` for long-term strategy

---

## Getting Help

1. **Check Documentation**: Look in `/docs/` folder
2. **Search Troubleshooting**: `docs/TROUBLESHOOTING.md` has 30+ solutions
3. **Browser Console**: Press F12 and check for errors
4. **Supabase Logs**: Check Dashboard → Logs for database errors

---

## Success Checklist

After installation, verify:

- [ ] Files copied to correct locations
- [ ] Navigation link appears on website
- [ ] Database indexes created (8 total)
- [ ] `/relationships` page loads
- [ ] Can select two people
- [ ] Relationship finder works
- [ ] Results display correctly
- [ ] No console errors
- [ ] Mobile view looks good
- [ ] Feature deployed to production

---

**Installation complete! Your Relationship Finder is ready to use! 🎉**

For more information, see the README.md and documentation in `/docs/` folder.
