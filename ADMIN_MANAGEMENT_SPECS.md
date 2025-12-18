# Admin Panel Management Specifications

This document outlines the structure and functionality for the User Management and Company Management sections within the Admin Panel.

## 1. User Management

### User View Section (User Details Page)
**Objective**: To provide a comprehensive view of a user's profile, activity, and status, with administrative capabilities to edit and manage the account.

#### Layout & Tabs
*   **Header**:
    *   **User Info**: Profile Picture, Name, Headline, Role, Location.
    *   **Contact**: Email, Phone (with verification status).
    *   **Status Badges**: Active/Suspended, Email Verified, Phone Verified.
    *   **Actions**:
        *   **Edit Profile**: (New) Allows admins to modify user details.
        *   **Suspend/Activate**: Toggle account status.
        *   **Reset Password**: Send a password reset email or set a temp password.
        *   **Message User**: Send a direct message/email.
        *   **Delete User**: Permanently remove the account.

*   **Tab 1: Overview**
    *   **Key Stats**: Total Applications, Saved Jobs.
    *   **Summary**: "About" section.
    *   **Recent Activity**: List of recent job applications or interactions.

*   **Tab 2: Profile Details**
    *   **Experience**: Timeline of employment history.
    *   **Education**: Academic background.
    *   **Skills**: List of technical and soft skills.
    *   **IT Skills**: Specific software/tools proficiency.
    *   **Resume**: Link to view/download the user's resume.

*   **Tab 3: Analytics**
    *   **Application Activity**: Chart showing application trends over time.
    *   *(Removed: Profile Views section as per request)*

*   **Tab 4: Activity Log**
    *   **Timeline**: Chronological list of user actions (logins, profile updates, applications, password changes).

#### Admin Authority (Editing Capabilities)
Admins have the authority to edit the following sections via the "Edit Profile" action:
1.  **Basic Information**: Name, Email, Phone, Location, Gender, DOB.
2.  **Professional Profile**: Headline, About/Summary.
3.  **Skills**: Add or remove skills.
4.  **Employment/Education**: (Future Scope) Add/Edit/Delete specific entries.

---

## 2. Company Management

### Company View Section (Company Details Page)
**Objective**: To provide a detailed view of a company's profile, job postings, and recruitment activity, with administrative control.

#### Layout & Tabs
*   **Header**:
    *   **Company Info**: Logo, Company Name, Industry, Location, Website.
    *   **Contact**: HR/Recruiter Name, Email, Phone.
    *   **Status Badges**: Active/Pending/Suspended, Verified.
    *   **Actions**:
        *   **Edit Company**: Modify company details.
        *   **Verify/Approve**: For pending companies.
        *   **Suspend/Activate**: Toggle company access.
        *   **Delete Company**: Remove company and associated jobs.

*   **Tab 1: Overview**
    *   **Key Stats**: Active Jobs, Total Applicants, Hires.
    *   **About**: Company description and vision.
    *   **Recent Jobs**: List of recently posted jobs.

*   **Tab 2: Company Profile**
    *   **Details**: Size, Founded Year, Website, Social Links.
    *   **Culture/Perks**: Description of benefits and culture.
    *   **Locations**: List of office locations.

*   **Tab 3: Jobs & Recruitment**
    *   **Job List**: Table of all jobs (Active, Closed, Draft).
    *   **Performance**: Views and application counts per job.

*   **Tab 4: Analytics**
    *   **Hiring Funnel**: Visual representation of applicants vs. hires.
    *   **Job Views**: Trend chart of company profile/job views.

#### Admin Authority (Editing Capabilities)
Admins can edit:
1.  **Company Details**: Name, Description, Website, Industry, Size.
2.  **Contact Info**: Update primary contact details.
3.  **Job Posts**: Edit or close specific job postings if they violate policies.
