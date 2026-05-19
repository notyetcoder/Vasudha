# 🔧 Troubleshooting Guide - Common Issues & Solutions

## 🚨 Emergency Checklist

Something broke? Try these first:

```bash
# 1. Restart dev server
npm run dev

# 2. Clear Next.js cache
rm -rf .next/

# 3. Reinstall dependencies
npm install

# 4. Rebuild project
npm run build

# 5. Clear browser cache
# In browser: Ctrl+Shift+Del → Clear everything
```

**If you still have issues**, find your specific error below.

---

## 💥 Build & Compilation Errors

### Error: "Cannot find module 'relationship-finder'"

**Symptoms:**
```
Module not found: Can't resolve '@/lib/relationship-finder'
```

**Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| File in wrong location | Must be at `src/lib/relationship-finder.ts` |
| File doesn't exist | Copy the file again |
| Typo in filename | Check spelling (all lowercase) |
| Wrong import path | Should be `@/lib/relationship-finder` |

**Debug:**
```bash
# Check file exists
ls -la src/lib/relationship-finder.ts

# Should show: relationship-finder.ts
# If not, copy it again

# Restart dev server
npm run dev
```

---

### Error: "Cannot find module '@/components/ui/card'"

**Symptoms:**
```
Module not found: Can't resolve '@/components/ui/card'
```

**Solution:**
```bash
# Check you have shadcn/ui installed
npm list @radix-ui/react-alert-dialog

# If missing:
npm install @radix-ui/react-alert-dialog
npm install @radix-ui/react-dialog
npm install @radix-ui/react-scroll-area

# Restart
npm run dev
```

---

### Error: "Syntax error: Unexpected token"

**Symptoms:**
```
SyntaxError: Unexpected token in JSON
```

**Causes:**
- Copy-pasted code incorrectly
- Missing quote or bracket
- File got corrupted during copy

**Fix:**
1. Delete the problematic file
2. Copy it again carefully
3. Make sure ALL text is copied (Ctrl+A, Ctrl+C)
4. Paste into new file (Ctrl+V)
5. Save (Ctrl+S)

---

### Error: "Type 'User' not found"

**Symptoms:**
```
Cannot find name 'User'
```

**Solution:**
```bash
# Make sure types.ts exists
test -f src/lib/types.ts && echo "✅ Found" || echo "❌ Missing"

# Check imports at top of file:
# import { User } from '@/lib/types';

# Verify spelling of User (capital U)
```

---

## 🌐 Runtime Errors

### Error: "Relationship page shows blank or loading forever"

**Symptoms:**
- Page loads
- Shows "Loading community data..."
- Never finishes loading

**Debug Steps:**
```bash
# 1. Open browser console (F12)
# 2. Look for red error messages
# 3. Check Network tab (F12 → Network)
# 4. Look for failed requests to Supabase
```

**Common Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| Supabase not connected | Check `.env.local` has correct URL & key |
| No users in database | Add some test users in Supabase |
| Wrong database URL | Paste correct one from Supabase Dashboard |
| RLS policies blocking | Check Supabase security policies |

**Test Supabase connection:**
```bash
# Go to /explore page (if that works, Supabase is fine)
# If /explore also broken, Supabase connection issue
# If /explore works but /relationships broken, it's code issue
```

---

### Error: "Uncaught TypeError: Cannot read property 'map'"

**Symptoms:**
```
TypeError: Cannot read property 'map' of undefined
```

**Cause:** Users array is undefined (Supabase not returning data)

**Fix:**
```bash
# Check Supabase connection
# 1. Go to Supabase Dashboard
# 2. Check users table has data
# 3. Check Supabase is not down

# Restart dev server
npm run dev
```

---

### Error: "No relationship found when there should be one"

**Symptoms:**
- Select two people
- Click "Find Relationship"
- See "Not Related" but they should be connected

**Debug:**
```bash
# 1. Check if parents are linked
# 2. Go to child's profile
# 3. See if "Father" and "Mother" are set
# 4. If not, link them

# The algorithm only works with linked relationships
# It doesn't infer anything - it follows explicit links
```

**Solution:**
1. Go to each person's profile
2. Click "Edit" or the pencil icon
3. In the "Family" section, set their parents/spouse
4. Save
5. Try again

---

### Error: "Search is very slow"

**Symptoms:**
- Typing in search takes 2+ seconds to filter

**Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| No database indexes | Run the SQL indexes (see DATABASE_SETUP.md) |
| 10,000+ users | Implement pagination |
| Slow computer | Try on another machine |
| Browser is slow | Clear cache, restart browser |

**Quick test:**
```sql
-- Go to Supabase SQL Editor
-- Run this:
SELECT * FROM public.users WHERE surname LIKE 'Patel%';

-- Should be <20ms
-- If slower, you need indexes
```

---

## 🎨 UI/Styling Issues

### Error: "Colors look wrong / very faint"

**Symptoms:**
- Text is barely visible
- Background colors wrong
- Different colors than in screenshots

**Causes & Fixes:**

| Cause | Fix |
|-------|-----|
| Dark mode activated | Click theme toggle (if you have one) |
| CSS not loaded | Restart dev server: `npm run dev` |
| Tailwind not compiling | Run `npm run build` |
| Browser cache | Ctrl+Shift+Del → Clear all |

**Quick fix:**
```bash
# Clear everything and restart
rm -rf .next/
npm run dev

# Then clear browser cache (Ctrl+Shift+Del)
```

---

### Error: "Layout is broken on mobile"

**Symptoms:**
- Text overlapping
- Buttons cut off
- Layout doesn't fit screen

**Debug:**
```bash
# 1. Press F12 (Developer Tools)
# 2. Click device toggle (icon that looks like phone)
# 3. Select "iPhone 12" or "Galaxy S21"
# 4. Reload page
```

**Fixes:**
- The components are responsive, so this shouldn't happen
- If it does, try clearing cache: `Ctrl+Shift+Del`
- Try in a different browser (Chrome, Firefox, Safari)

---

### Error: "Modal doesn't open or is invisible"

**Symptoms:**
- Click "Select Person A" button
- Nothing happens
- Or modal appears but is invisible

**Debug:**
```bash
# 1. Open console (F12)
# 2. Look for errors
# 3. Click the button again
# 4. Look for new errors
```

**Fixes:**
- Clear cache and restart: `npm run dev`
- Make sure all components are copied correctly
- Make sure DialogContent is imported from `@/components/ui/dialog`

---

## 🔐 Authentication & Permission Errors

### Error: "Permission denied" or "Not authenticated"

**Symptoms:**
```
Error: Permission denied (user)
Error: Not authenticated
```

**Cause:** Row-Level Security (RLS) is blocking access

**Fix:**
```bash
# Go to Supabase Dashboard
# → Authentication → Policies
# Check these policies exist:
# - Allow public read access
# - Allow public insert access
# - Allow authenticated update access

# If missing, recreate them from DATABASE_SETUP.md
```

---

### Error: "Cannot upload profile picture"

**Symptoms:**
- User tries to register with picture
- Picture upload fails

**Cause:** Storage policies not set up

**Fix:**
```bash
# Go to Supabase Dashboard
# → Storage → profile-pictures bucket
# → Policies
# Make sure you have 3 policies (see DATABASE_SETUP.md)

# If missing, create them
```

---

## 🌍 Network & API Errors

### Error: "404 Not Found" when visiting /relationships

**Symptoms:**
- URL shows: http://localhost:9002/relationships
- Page says: "404 - Page not found"

**Causes:**
- File `src/app/relationships/page.tsx` doesn't exist
- Wrong file path
- Dev server didn't restart

**Fix:**
```bash
# 1. Check file exists
test -f src/app/relationships/page.tsx && echo "✅ Found" || echo "❌ Missing"

# 2. If missing, copy it from relationships-page.tsx
# 3. Restart dev server
npm run dev

# 4. Try again
```

---

### Error: "Cannot GET /relationships"

**Symptoms:**
```
Cannot GET /relationships
```

**Solution:**
Same as 404 error above.

---

### Error: "Network request failed"

**Symptoms:**
```
TypeError: Failed to fetch
Network Error
```

**Causes:**

| Cause | Fix |
|-------|-----|
| Supabase down | Check https://status.supabase.com |
| Wrong Supabase URL | Check `.env.local` |
| Internet connection | Check WiFi/connection |
| CORS blocked | Usually not an issue with Supabase |

**Debug:**
```bash
# 1. Open browser DevTools (F12)
# 2. Go to Network tab
# 3. Reload page
# 4. Look for red requests
# 5. Click on request to see response
```

---

## 📝 Data Issues

### Issue: "Duplicate users showing in search"

**Cause:** Same person registered twice

**Fix:**
```bash
# 1. Go to Supabase Dashboard
# 2. Check the users table
# 3. Look for identical names
# 4. Delete the duplicate (keep the older one)

# Or use this SQL:
SELECT id, name, surname, COUNT(*) 
FROM public.users 
GROUP BY name, surname 
HAVING COUNT(*) > 1;
```

---

### Issue: "Relationship finds wrong person"

**Cause:** Data is inconsistent (multiple people have same ID)

**Fix:**
```bash
# In Supabase, run:
SELECT id, COUNT(*) 
FROM public.users 
GROUP BY id 
HAVING COUNT(*) > 1;

# If results show, you have data issues
# Contact support
```

---

## 📈 Performance Issues

### Issue: "App is slow with 10,000+ users"

**Symptoms:**
- Search takes 5+ seconds
- Finding relationships takes 10+ seconds

**Solution:**

1. **Add database indexes** (see DATABASE_SETUP.md)
2. **Enable lazy loading:**
   ```typescript
   // Load users in batches instead of all at once
   const [displayUsers, setDisplayUsers] = useState<User[]>([]);
   const [page, setPage] = useState(1);
   
   useEffect(() => {
     setDisplayUsers(users.slice(0, page * 100));
   }, [page, users]);
   ```
3. **Implement pagination** in the modal

---

### Issue: "High memory usage"

**Symptoms:**
- Browser tab uses lots of RAM
- Computer slows down

**Solution:**
```bash
# This is normal with 50,000+ users
# Fix: Implement pagination or lazy loading
# See ADDITIONAL_IMPROVEMENTS.md for code
```

---

## 🧪 Testing Checklist

Before saying "it's broken", test these:

- [ ] Restarted dev server
- [ ] Cleared browser cache (Ctrl+Shift+Del)
- [ ] Cleared Next.js cache (`rm -rf .next/`)
- [ ] Tried in a different browser
- [ ] Checked browser console for errors (F12)
- [ ] Verified Supabase is running
- [ ] Checked all files are copied to correct locations
- [ ] Ran database indexes

**If all pass and still broken**, there's a real issue.

---

## 🆘 Getting Help

### Where to Find Answers

1. **Browser Console** (F12 → Console)
   - Red errors are the key
   - Copy the full error message

2. **Supabase Logs** (Dashboard → Logs)
   - Shows what requests failed
   - Shows database errors

3. **This Guide**
   - Ctrl+F to search for your error

4. **Google**
   - Copy your error message
   - Usually has solutions

5. **Next.js Docs**
   - https://nextjs.org/docs
   - Search for your issue

### Creating a Minimal Test Case

If you can't find the solution:

```typescript
// Create a minimal version to isolate the issue
// Example: minimal component that just tries to load users

'use client';
import { useEffect } from 'react';
import { getUsers } from '@/actions/users';

export default function TestComponent() {
  useEffect(() => {
    const test = async () => {
      try {
        const users = await getUsers();
        console.log('Users loaded:', users.length);
      } catch (e) {
        console.error('Error:', e);
      }
    };
    test();
  }, []);
  
  return <div>Check console</div>;
}
```

Run this in a new page. If it fails, you found the issue!

---

## 📞 Still Stuck?

Check these in order:

1. **Error message** - Copy it exactly
2. **This guide** - Search for the error
3. **Google the error** - 99% are solved online
4. **Browser console** - F12, look for red text
5. **Supabase logs** - Dashboard → Logs
6. **Restart everything** - `npm run dev` from scratch

**Most issues are**:
- Files in wrong location (30%)
- Typos (25%)
- Forgot to restart (20%)
- Supabase connection (15%)
- Other (10%)

---

## ✅ Success Signs

You're good if you see:

- ✅ Page loads at `/relationships`
- ✅ No red errors in console (F12)
- ✅ Can select people from modal
- ✅ "Find Relationship" button works
- ✅ Results show relationship type
- ✅ Visual path appears

---

## 🎓 Learning Resources

- **Next.js**: https://nextjs.org/docs/app
- **React**: https://react.dev
- **Supabase**: https://supabase.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Tailwind**: https://tailwindcss.com/docs

---

**Remember: Every error has a solution. You got this! 💪**
