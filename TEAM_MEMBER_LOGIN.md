# Team Member Login Implementation

## Summary
Added team member login functionality to the company login page with status checking and permission-based access.

## Changes Made

### 1. Frontend Changes

#### `apps/company/pages/LoginPage.tsx`
- Added login type toggle between "Company Admin" and "Team Member"
- Implemented team member-specific login flow
- Added status checking with specific error messages:
  - **Paused accounts**: "Your account has been paused. Please contact your administrator."
  - **Invited accounts**: "Please accept your invitation first to activate your account."
  - **Inactive accounts**: "Your account is not active. Please contact your administrator."
- Updated UI with toggle buttons for selecting login type
- Different descriptions for admin vs team member login

### 2. Backend Changes

#### `Job portal backend/controllers/teamController.js`
- Enhanced `teamMemberLogin` function with granular status checking
- Separated error messages for different account statuses:
  - Invalid credentials
  - Paused accounts
  - Invited (not yet activated) accounts
  - Other inactive statuses
- Security: Only checks password after verifying account status

#### `Job portal backend/server.js`
- Added direct route mount: `/api/v1/team` for cleaner public access
- Maintains existing `/api/v1/recruiter/team/login` route for compatibility

## API Endpoints

### Team Member Login
**POST** `/api/v1/recruiter/team/login`

**Request Body:**
```json
{
  "email": "team.member@company.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "teamMember": {
    "id": "member_id",
    "name": "Team Member Name",
    "email": "team.member@company.com",
    "role": "team_member",
    "permissions": {
      "canManageJobs": true,
      "canViewApplications": true,
      "canManageApplications": false,
      "canViewAnalytics": false,
      "canManageCompanyProfile": false
    },
    "recruiterId": "recruiter_id"
  }
}
```

**Response (Paused Account):**
```json
{
  "success": false,
  "message": "Your account has been paused. Please contact your administrator."
}
```

## Team Member Model

### Status Values
- `invited`: Team member has been invited but hasn't accepted yet
- `active`: Team member can log in and access assigned features
- `paused`: Team member is temporarily suspended

### Permissions
Team members can have granular permissions:
- `canManageJobs`: Create, edit, and delete job postings
- `canViewApplications`: View job applications
- `canManageApplications`: Manage application status, add notes
- `canViewAnalytics`: Access analytics dashboard
- `canManageCompanyProfile`: Edit company profile (usually false for team members)

## User Flow

1. **Team Member Login**
   - Visit company login page
   - Click "Team Member" tab
   - Enter email and password
   - System checks account status
   - If active: Login successful, redirected to dashboard
   - If paused: Error message displayed
   - If invited: Prompted to accept invitation first

2. **Permission-Based Access**
   - After login, navigation and features are filtered based on permissions
   - Team members only see pages they have permission to access
   - API endpoints verify permissions via middleware

## Testing

### Test Cases
1. **Active Team Member Login**: Should succeed
2. **Paused Account Login**: Should show paused message
3. **Invited Account Login**: Should prompt to accept invitation
4. **Invalid Credentials**: Should show invalid credentials error
5. **Permission Check**: Team member should only access permitted features

## Security Notes
- Team member accounts are linked to a recruiter (company)
- Password is only checked after account status verification
- JWT token includes role (`team_member`) for authorization
- Middleware `authorize('team_member')` protects team-specific routes
- Permissions are checked on both frontend and backend
