# Website Extraction Bug Fix

## Issue Summary
The Business Profile "Analyze" button was returning "0 fields extracted with 0% confidence" instead of populating form fields with extracted website data.

## Root Cause
**Backend Route Handler Bug** - The `/organizations/:id/parse-website` endpoint was **ignoring the URL sent in the request body** and attempting to use the organization's saved `website` field from the database instead.

### Code Flow Before Fix:
```
Frontend → sends { url: "https://example.com" } in request body
Backend → ignores request.body.url
Backend → reads organization.website from database (might be null/empty)
Backend → fails with "No website configured" or uses wrong URL
```

## Changes Made

### 1. Frontend - Console Log Capture (for debugging)
**File**: `frontend/public/console-capture.js` (new file)
- Intercepts all `console.log/error/warn` calls
- Stores logs in `localStorage` under key `EXTRACTION_DEBUG`
- View logs at: **`http://localhost:5001/extraction-debug.html`**

**File**: `frontend/index.html`
- Added `<script src="/console-capture.js"></script>` to capture logs

### 2. Backend - Route Handler Fix
**File**: `backend/src/routes/organization.routes.ts:364-372`

**Before:**
```typescript
const result = await organizationService.parseWebsite(
  params.id,
  { userId: user.id, userRole: user.role }
);
```

**After:**
```typescript
const body = request.body as { url?: string };

const result = await organizationService.parseWebsite(
  params.id,
  body.url,  // ✅ Now reads URL from request body
  { userId: user.id, userRole: user.role }
);
```

### 3. Backend - Service Method Update
**File**: `backend/src/services/organization.service.ts:626-667`

**Before:**
```typescript
async parseWebsite(
  organizationId: string,
  context?: ServiceContext
)
```

**After:**
```typescript
async parseWebsite(
  organizationId: string,
  url?: string,  // ✅ New parameter
  context?: ServiceContext
)

// Use provided URL or fall back to organization's website
const websiteUrl = url || organization.website;
```

## How to Test

### Method 1: Via Frontend UI
1. Navigate to Business Profile page
2. Enter a company website URL (e.g., `https://stripe.com`)
3. Click the **"Analyze"** button
4. You should now see:
   - Success toast: "Website Analyzed Successfully"
   - Fields populated with extracted data
   - Confidence scores shown

### Method 2: Via API
```bash
# Get your organization ID and auth token first
ORG_ID="your-org-id"
TOKEN="your-jwt-token"

# Test the endpoint
curl -X POST http://localhost:3000/v1/organizations/$ORG_ID/parse-website \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://stripe.com"}'
```

Expected response:
```json
{
  "extractedData": {
    "name": { "value": "Stripe", "confidence": 0.95, ... },
    "industry": { "value": "Financial Services", "confidence": 0.90, ... },
    ...
  },
  "gaps": [],
  "confidence": { "name": 0.95, "industry": 0.90, ... },
  "metadata": {
    "extractionTime": 2500,
    "sourceUrl": "https://stripe.com",
    "avgConfidence": 0.82
  }
}
```

## Debugging Frontend Logs

If you still experience issues:

1. **Open the debug viewer**: Navigate to `/extraction-debug.html`
2. **Check localStorage**: Open DevTools → Console → Run:
   ```javascript
   localStorage.getItem('EXTRACTION_DEBUG')
   ```
3. **Clear debug logs**: Run in console:
   ```javascript
   clearDebugLogs()
   ```

## Files Changed
- ✅ `frontend/public/console-capture.js` (new)
- ✅ `frontend/public/extraction-debug.html` (existing)
- ✅ `frontend/index.html` (updated)
- ✅ `backend/src/routes/organization.routes.ts` (fixed)
- ✅ `backend/src/services/organization.service.ts` (updated)

## Expected Behavior After Fix
1. User enters website URL in Business Profile form
2. User clicks "Analyze" button
3. Frontend sends URL to backend via request body
4. Backend uses the provided URL (not database value)
5. AI extraction runs on the correct URL
6. Form fields auto-populate with extracted data
7. User sees success toast with field count and confidence

---
**Fixed**: 2025-10-17
**Issue**: Epic 2 - Website Analysis Feature
