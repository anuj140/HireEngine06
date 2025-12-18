# Hire Engine API Documentation

This document outlines the available API endpoints for the Hire Engine platform, categorized by user type and functionality. All endpoints are prefixed with `/api/v1`.

---

## Public & Job Seeker API

Endpoints accessible to the public and authenticated job seekers.

### Authentication & Verification

-   **Register Job Seeker**
    -   **Method:** `POST`
    -   **Endpoint:** `/auth/register/user`

-   **Login (User, Recruiter, Admin)**
    -   **Method:** `POST`
    -   **Endpoint:** `/auth/login`
    -   **Note:** The user's role must be specified in the request body.

-   **Forgot Password**
    -   **Method:** `POST`
    -   **Endpoint:** `/auth/forgot-password`

-   **Reset Password**
    -   **Method:** `POST`
    -   **Endpoint:** `/auth/reset-password/:token`

-   **Send Phone Verification OTP**
 
    -   **Method:** `POST`
    -   **Endpoint:** `/auth/verify/phone/send`

-   **Verify Phone OTP**
    -   **Method:** `POST`
    -   **Endpoint:** `/auth/verify/phone/check`

### Job & Company Browsing

-   **Get All Jobs (with filters)**
    -   **Method:** `GET`
    -   **Endpoint:** `/jobs`

-   **Get Single Job Details**
    -   **Method:** `GET`
    -   **Endpoint:** `/jobs/:id`

-   **Get Recommended Jobs**
    -   **Method:** `GET`
    -   **Endpoint:** `/jobs/recommended`

### User Profile & Activity

-   **Get User Profile**
    -   **Method:** `GET`
    -   **Endpoint:** `/user/profile`

-   **Update User Profile**
    -   **Method:** `PUT`
    -   **Endpoint:** `/user/profile`

-   **Upload Resume**
    -   **Method:** `POST`
    -   **Endpoint:** `/user/profile/resume`

-   **Upload Profile Photo**
    -   **Method:** `POST`
    -   **Endpoint:** `/user/profile/photo`

-   **Apply for a Job**
    -   **Method:** `POST`
    -   **Endpoint:** `/user/apply`

-   **Create Bookmark (Save Job)**
    -   **Method:** `POST`
    -   **Endpoint:** `/user/bookmarks`

-   **Get All Bookmarked Jobs**
    -   **Method:** `GET`
    -   **Endpoint:** `/user/bookmarks`

-   **Delete Bookmark (Unsave Job)**
    -   **Method:** `DELETE`
    -   **Endpoint:** `/user/bookmarks/:id`

### Notifications & Messaging

-   **Get Notifications**
    -   **Method:** `GET`
    -   **Endpoint:** `/notifications`

---

## Recruiter / Company API

Endpoints for company representatives (Recruiters, HR Managers, Admins).

### Registration & Team Management

-   **Request Recruiter Account**
    -   **Method:** `POST`
    -   **Endpoint:** `/recruiter-request`

-   **Send Phone OTP for Recruiter Verification**
    -   **Method:** `POST`
    -   **Endpoint:** `/recruiter-request/verify/phone/send`

-   **Verify Phone OTP for Recruiter**
    -   **Method:** `POST`
    -   **Endpoint:** `/recruiter-request/verify/phone/check`

-   **Send Email Verification for Recruiter**
    -   **Method:** `POST`
    -   **Endpoint:** `/recruiter-request/email/send`

-   **Verify Recruiter Email**
    -   **Method:** `GET`
    -   **Endpoint:** `/recruiter-request/email/check`

-   **Upload Recruiter Documents**
    -   **Method:** `POST`
    -   **Endpoint:** `/recruiter-request/documents/upload`

-   **Invite Team Member**
    -   **Method:** `POST`
    -   **Endpoint:** `/recruiter/team/invite`

-   **Get All Team Members**
    -   **Method:** `GET`
    -   **Endpoint:** `/recruiter/team/members`

-   **Accept Team Invitation**
    -   **Method:** `POST`
    -   **Endpoint:** `/recruiter/team/accept-invitation`

-   **Team Member Login**
    -   **Method:** `POST`
    -   **Endpoint:** `/recruiter/team/login`

-   **Update Team Member Role/Permissions**
    -   **Method:** `PUT`
    -   **Endpoint:** `/recruiter/team/members/:id/role`

-   **Update Team Member Status (Pause/Activate)**
    -   **Method:** `PATCH`
    -   **Endpoint:** `/recruiter/team/members/:id/status`

-   **Change Team Member Password**
    -   **Method:** `PUT`
    -   **Endpoint:** `/recruiter/team/members/:id/password`

### Job Management

-   **Post a Job**
    -   **Method:** `POST`
    -   **Endpoint:** `/recruiter/add-job` (or `/recruiter/jobs/post-job` for HR Managers)

-   **Get All Posted Jobs**
    -   **Method:** `GET`
    -   **Endpoint:** `/recruiter/jobs`

-   **Update a Job Post**
    -   **Method:** `PUT`
    -   **Endpoint:** `/recruiter/jobs/:id`

-   **Control Job Visibility (Status)**
    -   **Method:** `PATCH`
    -   **Endpoint:** `/recruiter/jobs/status`

-   **Get Pending Jobs for Approval**
    -   **Method:** `GET`
    -   **Endpoint:** `/recruiter/jobs/pending/:id`

-   **Approve a Pending Job**
    -   **Method:** `PATCH`
    -   **Endpoint:** `/recruiter/jobs/pending/:id/approve`

-   **Reject a Pending Job**
    -   **Method:** `PATCH`
    -   **Endpoint:** `/recruiter/jobs/pending/:id/reject`

### Applicant Management

-   **Get All Applicants (All Jobs)**
    -   **Method:** `GET`
    -   **Endpoint:** `/recruiter/applicants/all`

-   **Search Applicants**
    -   **Method:** `GET`
    -   **Endpoint:** `/recruiter/applicants/search`

-   **Change Application Status**
    -   **Method:** `PUT`
    -   **Endpoint:** `/recruiter/application-status`

-   **Bulk Update Application Status**
    -   **Method:** `POST`
    -   **Endpoint:** `/recruiter/applicants/bulk-update`

-   **Bulk Download Applicant Resumes**
    -   **Method:** `POST`
    -   **Endpoint:** `/recruiter/applicants/download-resumes`

### Analytics & Profile

-   **Get Recruiter Analytics**
    -   **Method:** `GET`
    -   **Endpoint:** `/recruiter/analytics`

-   **Get 5 Recent Applicants**
    -   **Method:** `GET`
    -   **Endpoint:** `/recruiter/recent-applicants`

-   **Get Top Performing Jobs**
    -   **Method:** `GET`
    -   **Endpoint:** `/recruiter/top-performing-jobs/with-views`

-   **Get Advanced Analytics**
    -   **Method:** `GET`
    -   **Endpoint:** `/recruiter-dashboard/analytics/advanced`

-   **Get Application Trends**
    -   **Method:** `GET`
    -   **Endpoint:** `/recruiter-dashboard/analytics/trends`

-   **Create/Update Company Profile**
    -   **Method:** `POST`
    -   **Endpoint:** `/recruiter/profile`

---

## Admin API

Endpoints for platform administrators.

<!-- -   **Register Admin (Initial Setup)**
    -   **Method:** `POST`
    -   **Endpoint:** `/admin/register-admin` -->

-   **Admin Login**
    -   **Method:** `POST`
    -   **Endpoint:** `/auth/login` (with `role: "admin"`)

-   **Block User/Recruiter Account**
    -   **Method:** `POST`
    -   **Endpoint:** `/admin/block`

-   **Get Pending Recruiter Requests**
    -   **Method:** `GET`
    -   **Endpoint:** `/admin/recruiter-requests/pending`

-   **Get Recruiter Request Stats**
    -   **Method:** `GET`
    -   **Endpoint:** `/admin/recruiter-requests/stats`

-   **Approve Recruiter Request**
    -   **Method:** `PUT`
    -   **Endpoint:** `/admin/approve`

-   **Create/Update Email Template**
    -   **Method:** `POST`
    -   **Endpoint:** `/admin/email-templates`