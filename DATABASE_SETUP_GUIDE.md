# 🚀 Database Setup Guide - Interview Management System

## ❗ IMPORTANT: Student Creation Not Working?

If you're experiencing issues where new students are not being saved to the database or not showing in the admission list, you need to run the following SQL scripts in your Supabase SQL editor **in this exact order**:

## 📋 Required SQL Scripts (Run in Order)

### 1. **Create the Main Table**
**File**: `create_admission_students_table.sql`
```sql
-- Run this first to create the basic table structure
-- Copy and paste the entire content of create_admission_students_table.sql
```

### 2. **Add Missing Columns**
**File**: `add_missing_columns.sql`
```sql
-- Run this second to add validation_comment and student_status columns
-- Copy and paste the entire content of add_missing_columns.sql
```

### 3. **Fix RLS Policies** ⚠️ **CRITICAL FIX**
**File**: `fix_admission_students_rls.sql`
```sql
-- Run this third to fix the authentication issues
-- Copy and paste the entire content of fix_admission_students_rls.sql
```

## 🔧 Step-by-Step Instructions

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**

### Step 2: Run Scripts in Order
1. **First**: Copy and paste `create_admission_students_table.sql` → Click **"Run"**
2. **Second**: Copy and paste `add_missing_columns.sql` → Click **"Run"**  
3. **Third**: Copy and paste `fix_admission_students_rls.sql` → Click **"Run"**

### Step 3: Verify Setup
Run this query to verify the table is set up correctly:
```sql
-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admission_students' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'admission_students';
```

## 🐛 Common Issues and Solutions

### Issue 1: "Permission denied for relation admission_students"
**Cause**: RLS policies are blocking anonymous access  
**Solution**: Make sure you ran `fix_admission_students_rls.sql`

### Issue 2: "Column 'validation_comment' does not exist"
**Cause**: Missing columns not added  
**Solution**: Run `add_missing_columns.sql`

### Issue 3: "Students not showing in list after creation"
**Cause**: Either database save failed OR date filtering issue  
**Solution**: 
1. Check browser console for errors
2. Make sure the student has an `interview_date` set
3. Make sure the date picker is set to the same date as the student's interview date

## 🔍 Debugging Tips

### Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Look for error messages when creating students
4. Common errors:
   - `permission denied` - RLS issue
   - `column does not exist` - Missing columns
   - `relation does not exist` - Table not created

### Verify Database Connection
```sql
-- Test if you can select from the table
SELECT COUNT(*) FROM admission_students;
```

### Check Sales Person ID
The app uses localStorage to store `salesId`. Make sure:
1. You're logged in as a sales user
2. The sales person ID is valid (1-7)

## 📞 Support

If you're still having issues after running all three scripts:

1. **Check the browser console** for specific error messages
2. **Verify all three SQL scripts** ran without errors
3. **Test the queries above** to verify table structure
4. **Clear browser cache** and try again

---

**Important**: The RLS fix (`fix_admission_students_rls.sql`) is the most critical script that resolves the authentication issues preventing student creation.