# Safe Database Seeding Instructions

## ⚠️ IMPORTANT: Preserving Your Data

The main seed script (`npm run db:seed`) **DELETES ALL DATA** before seeding.

To add the Trade Compliance v3.0 template **WITHOUT destroying your existing data**, use the safe script below.

---

## ✅ Safe Method: Add v3.0 Template Only

### Option 1: Using npm script (Recommended)

```bash
cd backend
npm run db:seed:trade-v3
```

This will:
- ✅ Check if the template already exists
- ✅ Add ONLY the Trade Compliance v3.0 template
- ✅ Preserve ALL your existing data (users, organizations, assessments, etc.)
- ✅ Show you a summary of what was created

### Option 2: Using the standalone script directly

```bash
cd backend
npx tsx prisma/seed-trade-v3-only.ts
```

### Option 3: Using the shell script (with confirmation prompt)

```bash
cd backend
./scripts/seed-trade-v3.sh
```

---

## 📊 What Gets Created

The safe seed will add:

**1 Template:**
- Name: "Trade Compliance Assessment v3.0"
- Slug: `trade-compliance-assessment-v3`
- Version: 3.0

**10 Sections:**
1. Governance & Regulatory Readiness (9 questions)
2. Trade Risk Assessment Framework (10 questions)
3. Sanctions & Export Control Management (9 questions)
4. Trade Finance for Banks (10 questions)
5. Customs & Documentation for Corporates (8 questions)
6. Supply Chain & End-Use Controls (9 questions)
7. Data, Technology & Recordkeeping (10 questions)
8. Training & Culture (10 questions)
9. Monitoring, Audit & Continuous Improvement (10 questions)
10. AI Readiness & Responsible Use (10 questions)

**105 Questions total** (33 foundational)

---

## 🔍 Verification

After running the safe seed, verify the template was added:

```bash
# Option 1: Using Prisma Studio
npm run db:studio

# Then navigate to the Template table and look for:
# slug = "trade-compliance-assessment-v3"

# Option 2: Using psql (if you have direct database access)
psql -d your_database -c "SELECT id, name, version, slug FROM \"Template\" WHERE slug = 'trade-compliance-assessment-v3';"
```

---

## ⚠️ What NOT to Do

**DO NOT RUN:**
```bash
npm run db:seed        # ❌ DELETES ALL DATA!
npm run db:reset       # ❌ DELETES ALL DATA AND MIGRATIONS!
```

These commands will wipe your database clean!

---

## 🔄 If Template Already Exists

If you've already added the template, the script will detect it and show:

```
⚠️  Trade Compliance v3.0 template already exists!
   Template ID: xxx
   Name: Trade Compliance Assessment v3.0
   Version: 3.0

✅ No changes needed - template already in database.
```

No duplicate templates will be created.

---

## 🐛 Troubleshooting

### Error: "Template already exists"
**Solution:** The template is already in your database. Check your UI - it should be available.

### Error: "Database connection failed"
**Solution:** Ensure your database is running:
```bash
# Check if PostgreSQL is running
docker-compose ps
# or
npm run docker:up
```

### Template not showing in UI
**Solution:**
1. Check the template is active: `isActive = true` in database
2. Refresh your browser
3. Clear browser cache
4. Check browser console for errors

---

## 📝 Created Files

- `backend/prisma/seed-trade-v3-only.ts` - Safe standalone seed script
- `backend/scripts/seed-trade-v3.sh` - Shell script with confirmation prompt
- `backend/package.json` - Added `db:seed:trade-v3` npm script

---

**Ready to proceed?** Run the command:

```bash
npm run db:seed:trade-v3
```
