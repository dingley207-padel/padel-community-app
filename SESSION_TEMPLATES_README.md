# Session Templates & Recurring Sessions System

## Overview

This system allows community managers to create **recurring weekly session templates** and **bulk-publish multiple weeks of sessions** with a single click. This dramatically reduces the time needed to manage regular weekly sessions across multiple sub-community locations.

---

## Key Features

### 1. Session Templates
Define recurring weekly sessions once, reuse forever:
- **Day of week** (Monday, Tuesday, etc.)
- **Time** (e.g., 7:00 PM)
- **Location** (Sub-community)
- **Pricing & player limits**
- **Active/Inactive status**

### 2. Sub-Community Integration
Sessions are now linked to specific sub-community locations:
- Each session belongs to a sub-community (e.g., "Marina Location", "Downtown Club")
- Members see only sessions for their joined sub-communities
- Better location management and targeting

### 3. Bulk Publishing
Create multiple weeks of sessions at once:
- Select which templates to use (checkboxes)
- Choose weeks ahead (1-12 weeks)
- One-click creation of dozens of sessions
- Automatic notifications to members

---

## Architecture

### Database Schema

#### New Tables

**`session_templates`**
```sql
- id (UUID, Primary Key)
- community_id (UUID, FK to communities)
- sub_community_id (UUID, FK to communities, nullable)
- title (VARCHAR)
- description (TEXT, nullable)
- day_of_week (INTEGER 0-6, 0=Sunday)
- time_of_day (TIME, HH:MM:SS)
- duration_minutes (INTEGER, default 90)
- price (DECIMAL)
- max_players (INTEGER)
- free_cancellation_hours (INTEGER, default 24)
- allow_conditional_cancellation (BOOLEAN, default true)
- is_active (BOOLEAN, default true)
- created_by (UUID, FK to users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Modified Tables

**`sessions`** (added columns)
```sql
- sub_community_id (UUID, FK to communities, nullable)
- created_from_template_id (UUID, FK to session_templates, nullable)
```

#### Updated Views

**`available_sessions`** now includes:
- `sub_community_name`
- `sub_community_location`

---

## API Endpoints

### Session Templates

**GET `/api/session-templates/community/:community_id`**
- Get all templates for a community
- Query param: `include_inactive=true` to show inactive templates

**POST `/api/session-templates`**
- Create a new template
- Body:
  ```json
  {
    "community_id": "uuid",
    "sub_community_id": "uuid",
    "title": "Monday Night Match",
    "day_of_week": 1,
    "time_of_day": "19:00:00",
    "price": 50,
    "max_players": 8,
    "is_active": true
  }
  ```

**PUT `/api/session-templates/:id`**
- Update a template

**DELETE `/api/session-templates/:id`**
- Delete a template (doesn't affect existing sessions)

**POST `/api/session-templates/bulk-create-sessions`**
- Bulk publish sessions from templates
- Body:
  ```json
  {
    "template_ids": ["uuid1", "uuid2"],
    "weeks_ahead": 4
  }
  ```
- Response:
  ```json
  {
    "created": 24,
    "sessions": [...],
    "errors": []
  }
  ```

---

## Frontend Implementation

### New Screens

#### **SessionTemplatesManagerScreen**
Location: `/frontend/src/screens/SessionTemplatesManagerScreen.tsx`

Features:
- List all templates (active and inactive)
- Create/Edit/Delete templates
- Toggle active/inactive status
- Shows day, time, location, price, player count
- "Bulk Publish" button (navigates to BulkSessionPublishScreen)

#### **BulkSessionPublishScreen**
Location: `/frontend/src/screens/BulkSessionPublishScreen.tsx`

Features:
- Checkboxes to select templates
- "Select All" / "None" buttons
- Input for weeks ahead (1-12)
- Real-time calculation: "Total sessions to create: X"
- Confirmation dialog before publishing
- Success message with count

### Navigation Flow

```
Community Manager Dashboard
  └─> Your Communities
       ├─> 📍 Sub-Communities (existing)
       └─> 📅 Session Templates (NEW)
            └─> Bulk Publish
                 └─> (Creates sessions, goes to Manager Sessions)
```

### Updated Components

**CommunityManagerDashboard.tsx**
- Community cards now show two buttons:
  - "📍 Sub-Communities"
  - "📅 Session Templates"

**AppNavigator.tsx**
- Added `sessionTemplates` and `bulkPublish` screen states
- Routes to new screens with community context

**api.ts**
- Added 6 new API methods for template management

---

## User Workflow

### For Community Managers

#### Setting Up Templates (One-Time)

1. Go to Community Manager Dashboard
2. Select a community
3. Tap "📅 Session Templates"
4. Tap "+" to create new template
5. Fill in details:
   - Title: "Monday Night Match"
   - Location: Select sub-community
   - Day: Monday
   - Time: 19:00
   - Price: AED 50
   - Max Players: 8
6. Save template
7. Repeat for all recurring sessions

#### Weekly Publishing (Ongoing)

1. Go to Session Templates screen
2. Tap "Bulk Publish"
3. Review checkboxes (all active templates pre-selected)
4. Set weeks ahead: 4
5. Review summary: "Total sessions to create: 12"
6. Tap "Publish 12 Sessions"
7. Confirm
8. Done! 12 sessions created, members notified

### Example Calculation

**Scenario:**
- 3 active templates (Mon 7PM, Wed 2PM, Sat 9AM)
- Publishing 4 weeks ahead

**Result:**
- 3 templates × 4 weeks = **12 sessions created**
- All sessions have correct:
  - Date/time (next Monday 7PM, next Wednesday 2PM, etc.)
  - Location (from template's sub-community)
  - Pricing & limits
- All community members get push notifications

---

## Database Migration

**IMPORTANT:** The database migration must be run manually:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/hzetzzirisixofhyyobe)
2. Navigate to **SQL Editor**
3. Run the migration script at:
   `/backend/migrations/add_session_templates_and_sub_community_sessions.sql`

Or run:
```bash
cd /Users/ross/Desktop/Padel/backend
node run-session-templates-migration-simple.js
```

This will display the SQL to copy/paste into Supabase.

---

## Benefits

### Time Savings
- **Before:** Create 12 sessions manually = 20-30 minutes
- **After:** Create 12 sessions with bulk publish = 30 seconds
- **Savings:** ~95% time reduction

### Consistency
- Templates ensure pricing, timing, and details stay consistent
- No typos or forgotten fields
- Professional, reliable scheduling

### Flexibility
- Can deactivate templates temporarily
- Can edit templates without affecting past sessions
- Can adjust specific sessions individually after creation

### Scale
- Works for 1 location or 50+ locations
- Can publish weeks or months ahead
- Handles hundreds of sessions easily

---

## Technical Details

### Date Calculation Logic

The system calculates the next occurrence of each day:

```typescript
// Example: If today is Wednesday, Jan 10
// Template for "Monday 7PM"
// Next occurrence: Monday, Jan 15 at 7:00 PM

// For 4 weeks:
// Week 1: Monday, Jan 15 at 7:00 PM
// Week 2: Monday, Jan 22 at 7:00 PM
// Week 3: Monday, Jan 29 at 7:00 PM
// Week 4: Monday, Feb 5 at 7:00 PM
```

### Authorization

Three-layer security:
1. User must be authenticated
2. User must be community manager
3. User must manage the parent community

### Notifications

When sessions are bulk-created:
- Each session triggers notifications
- Members of the sub-community receive push notifications
- Announcements are created automatically

---

## Future Enhancements

Potential improvements:
- [ ] Date range selection (publish from X to Y date)
- [ ] Template scheduling (auto-publish every Sunday)
- [ ] Template groups/categories
- [ ] Copy template to another community
- [ ] Bulk edit existing sessions
- [ ] Analytics on template usage
- [ ] Template sharing between communities

---

## Troubleshooting

### "Could not find template"
- Ensure template is marked as active
- Check that template belongs to the selected community

### "No sessions created"
- Verify sub-community exists
- Check template has valid data
- Ensure weeks_ahead is between 1-12

### "Permission denied"
- Confirm user is community manager
- Verify user manages the parent community

### Sessions created but notifications didn't send
- Check member push tokens are saved
- Verify notification service is running
- Check backend logs for errors

---

## Files Modified

### Backend
- `/backend/src/types/index.ts` - Added TypeScript interfaces
- `/backend/src/services/sessionTemplateService.ts` - Template CRUD & bulk creation
- `/backend/src/controllers/sessionTemplateController.ts` - API handlers
- `/backend/src/routes/sessionTemplateRoutes.ts` - Express routes
- `/backend/src/index.ts` - Registered new routes
- `/backend/migrations/add_session_templates_and_sub_community_sessions.sql` - Database schema

### Frontend
- `/frontend/src/services/api.ts` - Added 6 API methods
- `/frontend/src/screens/SessionTemplatesManagerScreen.tsx` - Template management UI
- `/frontend/src/screens/BulkSessionPublishScreen.tsx` - Bulk publishing UI
- `/frontend/src/screens/CommunityManagerDashboard.tsx` - Added navigation buttons
- `/frontend/src/navigation/AppNavigator.tsx` - Integrated new screens

---

## Support

For questions or issues:
1. Check this README
2. Review backend logs: `tail -f backend.log`
3. Check frontend console for errors
4. Test API endpoints with curl/Postman
5. Verify database migration ran successfully

---

## License

Part of the Padel Community App project.
