# 📝 Test Management System Guide

## 🎯 Overview
The Test Management system allows staff to manage entrance tests for students on their interview day. Tests have a **2-hour duration** and include timing management with adjustable start times.

## 🚀 Features

### ✅ **Test Timer & Status Tracking**
- **Real-time countdown timer** showing remaining time (HH:MM:SS format)
- **Automatic expiration detection** when 2 hours are reached
- **4 test status states**: Not Started, In Progress, Completed, Absent
- **4 interview status states**: Not Registered, In Queue, Interviewing, Interview Done
- **Dual status indicators** with color-coded badges and icons

### ⏰ **Flexible Time Management**
- **Start test button** to begin the 2-hour timer
- **Adjustable start time** using time picker for late arrivals
- **Complete test button** to end test early or when expired
- **Reset functionality** to restart tests if needed

### 📊 **Dashboard & Statistics**
- **Real-time statistics** showing test progress overview
- **Interview progress tracking** showing students in queue, interviewing, and completed
- **Student filtering** by test requirements and interview date
- **Duration tracking** for completed tests
- **Current time display** for reference

### 👥 **Access Control**
- **Sales staff**: Manage tests for their assigned students
- **Receptionist**: Monitor all test progress  
- **Superadmin**: Full access to all test management

## 🔧 Database Setup

### Required SQL Script
Run this script in your Supabase SQL editor:

```sql
-- File: add_test_management_columns.sql
-- Add test management columns to admission_students table

ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS test_start_time TIMESTAMPTZ;

ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS test_end_time TIMESTAMPTZ;

ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS test_status VARCHAR(20) DEFAULT 'not_started';

ALTER TABLE admission_students 
ADD COLUMN IF NOT EXISTS test_duration INTEGER;

-- Add constraint for valid test status values
ALTER TABLE admission_students 
ADD CONSTRAINT admission_students_test_status_check 
CHECK (test_status IN ('not_started', 'in_progress', 'completed', 'absent'));

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_admission_students_test_status 
ON admission_students(test_status);

CREATE INDEX IF NOT EXISTS idx_admission_students_test_start_time 
ON admission_students(test_start_time);
```

## 🎮 How to Use

### **1. Access Test Management**
- Login as Sales, Receptionist, or Superadmin
- Click the **"Test Management"** tab (orange button with timer icon)
- Select the interview date to view students requiring tests

### **2. Start a Test**
- Find student in the list who needs testing
- Click **"Start Test"** to begin the 2-hour countdown
- Timer immediately begins showing remaining time

### **3. Handle Late Arrivals**
- If student arrives late, use the **time picker** next to the timer
- Adjust the start time to when they actually began
- Timer automatically recalculates remaining time

### **4. Complete Tests**
- Click **"Complete Test"** when student finishes
- System records actual duration and completion time
- Status changes to "Completed" with green indicator

### **5. Handle Absences**  
- Click **"Mark Absent"** for no-show students
- Status changes to "Absent" with red indicator
- Removes student from active test queue

### **6. Reset Tests**
- Use **"Reset"** button to restart a test if needed
- Clears all timing data and returns to "Not Started"
- Useful for retakes or corrections

## 📱 User Interface

### **Statistics Dashboard**

#### **Test Status**
- **Total**: Number of students requiring tests today
- **Not Started**: Students who haven't begun testing
- **In Progress**: Currently testing (with live countdown)
- **Completed**: Finished tests with duration info
- **Absent**: No-show students

#### **Interview Status**
- **Interviewing**: Students currently in interview sessions
- **Interview Done**: Students who completed their interviews
- **In Queue**: Students waiting for interview
- **Not Registered**: Students not yet added to interview system

### **Student List Display**
Each student shows:
- **Name & Contact**: Full name, speciality, phone number
- **Dual Status Badges**: 
  - **Test Status**: Color-coded test progress (gray/blue/green/red)
  - **Interview Status**: Color-coded interview progress (gray/blue/purple/green)
- **Timer**: Live countdown for in-progress tests (HH:MM:SS)
- **Start Time**: When test began
- **Action Buttons**: Context-appropriate controls
- **Duration**: For completed tests, shows actual time taken

### **Timer Display**
- **Blue text**: Normal countdown in progress
- **Red text**: Test has expired (over 2 hours)
- **Format**: `HH:MM:SS` (Hours:Minutes:Seconds)
- **Updates**: Every second in real-time

## 🔔 Status Meanings

### **Test Status**
| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| **Not Started** | ⏱️ | Gray | Student hasn't begun test |
| **In Progress** | ▶️ | Blue | Test is currently running |
| **Completed** | ✅ | Green | Test finished successfully |
| **Absent** | ⚠️ | Red | Student didn't show up |

### **Interview Status**
| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| **Not Registered** | 👤 | Gray | Student not in interview system |
| **In Queue** | 👥 | Blue | Student waiting for interview |
| **Interviewing** | 👁️ | Purple | Student currently in interview |
| **Interview Done** | ✓ | Green | Student completed interview |

## 📈 Benefits

### **For Staff**
- **Real-time monitoring** of all test progress
- **Flexible timing** to handle real-world scenarios
- **Clear status tracking** prevents confusion
- **Automatic calculations** reduce manual work

### **For Students**
- **Fair timing** regardless of arrival delays
- **Clear status** for all staff interactions
- **Proper documentation** of test completion

### **For Administration**
- **Complete audit trail** of test sessions
- **Performance metrics** and duration tracking
- **Date-based organization** aligned with interviews

## 🛠️ Technical Implementation

### **Component Structure**
- `TestManagement.tsx`: Main component with timer logic
- Real-time updates every second using `useEffect`
- Memoized calculations for performance
- Responsive design for all screen sizes

### **Database Integration**
- Uses existing `admission_students` table
- Adds 4 new columns for test management
- Maintains referential integrity
- Includes performance indexes

### **Timer Logic**
- Calculates remaining time from start timestamp
- Handles timezone considerations automatically
- Detects expiration (over 2 hours)
- Updates display every second

## 🔧 Troubleshooting

### **Test not starting?**
- Check that database columns have been added
- Verify user has proper permissions
- Ensure student has `testRequired: true`

### **Timer not updating?**
- Check browser JavaScript is enabled
- Verify component is receiving live data
- Confirm start time was saved properly

### **Wrong time calculations?**
- Check system timezone settings
- Verify start time adjustment worked
- Confirm 2-hour duration constant

## 🚀 Future Enhancements

### **Planned Features**
- **Audio alerts** for test expiration
- **Bulk operations** for multiple students
- **Test room assignments** 
- **Progress notifications** to interview staff
- **Test score integration** with evaluation forms

### **Reporting Capabilities**
- **Daily test reports** with completion rates
- **Duration analytics** and performance metrics
- **Absence tracking** and follow-up workflows

---

## 📞 Support

For issues or questions about the Test Management system:
1. Check this guide first
2. Verify database setup is complete
3. Test with a small group before full deployment
4. Monitor console logs for any errors

**Remember**: Test timing is critical for fair evaluation - always verify the timer is working correctly before student testing begins!