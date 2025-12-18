

import { Job, Company, User, Application, JobAlert, Filters, CmsData, UserProfile, Applicant, TeamMember, Message, Broadcast } from '../types';
import { AdminUser } from '../../apps/admin/contexts/AuthContext';


const API_BASE_URL = '/api/v1';

const getAuthToken = (appType: 'web' | 'company' | 'admin' = 'web') => {
    const key = appType === 'web' ? 'token' : `${appType}_token`;
    return sessionStorage.getItem(key);
};

async function request<T>(endpoint: string, options: RequestInit = {}, appType: 'web' | 'company' | 'admin' = 'web'): Promise<T> {
    const headers: Record<string, string> = {
        ...options.headers as Record<string, string>,
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const token = getAuthToken(appType);
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    let responseData;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
    } else {
        responseData = { success: response.ok, message: await response.text() };
    }


    if (!response.ok || responseData.success === false) {
        const message = responseData.msg || responseData.message || 'An API error occurred';
        throw new Error(message);
    }

    return responseData;
}

// --- Auth (Job Seeker) ---
export const loginUser = (data: any): Promise<{ token: string, user: User }> => request('/auth/login', { method: 'POST', body: JSON.stringify({ ...data, role: 'user' }) });
export const registerUser = (name: string, email: string, password: string, phone: string): Promise<{ user: User, token: string }> => request('/auth/register/user', { method: 'POST', body: JSON.stringify({ name, email, password, phone }) });
export const getProfileFromToken = (): Promise<{ success: boolean; user: User }> => request('/user/profile');
export const sendRegistrationOtp = (phone: string): Promise<{ success: boolean, message: string }> => request('/auth/verify/phone/send', { method: 'POST', body: JSON.stringify({ phone }) });
export const verifyRegistrationOtp = (phone: string, otp: string): Promise<{ success: boolean; message: string }> => request('/auth/verify/phone/check', { method: 'POST', body: JSON.stringify({ phone, otp }) });
// DO: Add comment above each fix.
// FIX: Added forgotPassword and resetPassword API functions.
export const forgotPassword = (email: string): Promise<{ message: string }> => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
export const resetPassword = (token: string, password: string): Promise<{ message: string }> => request(`/auth/reset-password/${token}`, { method: 'POST', body: JSON.stringify({ password }) });


// --- Profile (Job Seeker) ---
export const updateUserProfile = (updates: Partial<User>): Promise<User> => request('/user/profile', { method: 'PUT', body: JSON.stringify(updates) });

// For file uploads, we don't stringify the body and need a different header
async function uploadFileRequest<T>(endpoint: string, formData: FormData): Promise<T> {
    const headers: Record<string, string> = {};
    const token = getAuthToken('web');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
        headers,
    });

    const responseData = await response.json();

    if (!response.ok || responseData.success === false) {
        const message = responseData.msg || responseData.message || 'File upload failed';
        throw new Error(message);
    }

    return responseData;
}

export const uploadResume = (formData: FormData): Promise<{ resumeUrl: string }> => uploadFileRequest('/user/profile/resume', formData);
export const uploadProfilePhoto = (formData: FormData): Promise<{ profilePhoto: string }> => uploadFileRequest('/user/profile/photo', formData);
export const deleteResumeApi = (): Promise<{ msg: string }> => request('/user/profile/resume', { method: 'DELETE' });

// --- Jobs (Public/Job Seeker) ---
// Updated interface to handle both standard and company-search results
export interface FetchJobsResponse {
    jobs: Job[];
    totalJobs: number;
    isCompanySearch?: boolean;
    companyProfile?: Company;
    companyJobs?: Job[];
    relatedJobs?: Job[];
}

export const fetchJobs = async (filters: Partial<Filters>): Promise<FetchJobsResponse> => {
    const params = new URLSearchParams();
    if (filters.keywords) params.set('keywords', filters.keywords);
    if (filters.location) params.set('location', filters.location);
    if (filters.experience) params.set('experience', filters.experience);
    if (filters.jobType && filters.jobType.length > 0) params.set('jobType', filters.jobType.join(','));
    if (filters.postedDate) params.set('postedDate', filters.postedDate);

    if (filters.salary && filters.salary.length > 0) {
        const salaryRanges = filters.salary.map(range => {
            if (range.includes('+')) {
                return { min: parseInt(range, 10) * 100000, max: Infinity };
            }
            const [min, max] = range.split('-').map(s => parseInt(s, 10) * 100000);
            return { min, max };
        });

        const minSalary = Math.min(...salaryRanges.map(r => r.min));
        if (minSalary > 0) {
            params.set('minSalary', minSalary.toString());
        }

        const finiteMaxSalaries = salaryRanges.filter(r => r.max !== Infinity).map(r => r.max);
        if (finiteMaxSalaries.length > 0) {
            const maxSalary = Math.max(...finiteMaxSalaries);
            if (maxSalary > 0) {
                params.set('maxSalary', maxSalary.toString());
            }
        }
    }

    return await request(`/jobs?${params.toString()}`);
};

export const fetchJobById = async (id: string): Promise<Job | null> => {
    try {
        const response: any = await request(`/jobs/${id}`);
        return response.job || response;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const fetchRecommendedJobs = async (): Promise<Job[]> => {
    try {
        // This will succeed for logged-in users and return an array of jobs.
        const response: any = await request(`/jobs/recommended`);
        // The recommended endpoint returns an array directly.
        return Array.isArray(response) ? response : response.jobs || [];
    } catch (error) {
        console.error("Failed to fetch recommended jobs, falling back to latest jobs:", error);
        // This runs for non-logged-in users. fetchJobs returns an object { jobs: [], totalJobs: X }.
        const allJobsData = await fetchJobs({});
        // FIX: Correctly access the .jobs property on the response object.
        return allJobsData.jobs ? allJobsData.jobs.slice(0, 20) : [];
    }
};


// --- Applications (Job Seeker) ---
export const applyForJobApi = (jobId: string, answers: any[]): Promise<{ msg: string }> => request(`/user/apply`, { method: 'POST', body: JSON.stringify({ jobId, answers }) });
// DO: Add comment above each fix.
// FIX: Added withdrawApplicationApi function.
export const withdrawApplicationApi = (jobId: string): Promise<{ message: string }> => request(`/user/applications/${jobId}`, { method: 'DELETE' });

export const fetchAppliedJobs = async (): Promise<Application[]> => {
    const response: { applications: Application[] } = await request('/user/applications');
    return response.applications || [];
};

// --- Bookmarks/Saved Jobs (Job Seeker) ---
export const fetchSavedJobs = async (): Promise<Job[]> => {
    const response: { bookmarks: Job[] } = await request('/user/bookmarks');
    return response.bookmarks || [];
};
export const saveJobApi = (jobId: string): Promise<void> => request('/user/bookmarks', { method: 'POST', body: JSON.stringify({ jobId }) });
export const unsaveJobApi = (jobId: string): Promise<void> => request(`/user/bookmarks/${jobId}`, { method: 'DELETE' });

// --- Job Alerts (Job Seeker) ---
export const fetchJobAlerts = async (): Promise<JobAlert[]> => {
    const response: { data: JobAlert[] } = await request('/user/alerts');
    return response.data || [];
};
export const createJobAlert = async (alertData: any): Promise<JobAlert> => {
    const response: { data: JobAlert } = await request('/user/alerts', { method: 'POST', body: JSON.stringify(alertData) });
    return response.data;
};
export const updateJobAlert = async (alertId: string, alertData: any): Promise<JobAlert> => {
    const response: { data: JobAlert } = await request(`/user/alerts/${alertId}`, { method: 'PUT', body: JSON.stringify(alertData) });
    return response.data;
};
export const deleteJobAlert = (alertId: string): Promise<void> => request(`/user/alerts/${alertId}`, { method: 'DELETE' });

// --- Companies (Public) ---
export const fetchCompanies = async (): Promise<Company[]> => {
    const data: { companies: Company[] } = await request('/recruiter/companies');
    return data.companies || [];
};
export const fetchCompanyById = async (id: string): Promise<Company | null> => {
    const data: { company: Company } = await request(`/recruiter/company/${id}`);
    return data.company || null;
};

// --- Messages ---
export const fetchMessages = (appType: 'web' | 'company' | 'admin' = 'web'): Promise<Message[]> => request('/messages', {}, appType);
export const sendMessageApi = (recipientId: string, content: string, jobId: string, appType: 'web' | 'company' | 'admin' = 'web'): Promise<Message> => request('/messages', { method: 'POST', body: JSON.stringify({ recipientId, content, jobId }) }, appType);

// --- CMS ---
export const fetchCmsContent = async (): Promise<CmsData> => {
    const response: { data: CmsData } = await request('/cms');
    if (!response || !response.data) {
        throw new Error("CMS data is empty");
    }
    return response.data;
};


// ======================================================
// --- Company Portal APIs ---
// ======================================================
export const loginCompanyUser = (data: any): Promise<{ token: string, user: TeamMember }> => request('/auth/login', { method: 'POST', body: JSON.stringify({ ...data, role: 'recruiter' }) }, 'company');
export const getCompanyProfileFromToken = (): Promise<TeamMember> => request('/recruiter/profile', {}, 'company');
export const registerCompanyUser = (data: any): Promise<{ success: boolean, requestId: string }> => request('/recruiter-request', { method: 'POST', body: JSON.stringify(data) }, 'company');
export const sendRecruiterPhoneOtp = (requestId: string, phone: string): Promise<{ success: boolean, message: string }> => request('/recruiter-request/verify/phone/send', { method: 'POST', body: JSON.stringify({ requestId, phone }) }, 'company');
export const verifyRecruiterPhoneOtp = (requestId: string, phone: string, otp: string): Promise<{ success: boolean, message: string }> => request('/recruiter-request/verify/phone/check', { method: 'POST', body: JSON.stringify({ requestId, phone, otp }) }, 'company');
export const sendRecruiterEmailVerification = (requestId: string, email: string): Promise<{ success: boolean, message: string }> => request('/recruiter-request/email/send', { method: 'POST', body: JSON.stringify({ requestId, email }) }, 'company');
export const uploadRecruiterDocuments = (requestId: string, formData: FormData): Promise<{ success: boolean, message: string, documents: string[] }> => uploadFileRequest('/recruiter-request/documents/upload', formData);

export const fetchRecruiterJobs = async (): Promise<Job[]> => {
    const response: { jobs: Job[] } = await request('/recruiter/jobs', {}, 'company');
    return response.jobs || [];
};
export const fetchRecruiterJobById = async (jobId: string): Promise<{ job: Job }> => request(`/recruiter/jobs/${jobId}`, {}, 'company');
export const postNewJob = (jobData: any): Promise<Job> => request('/recruiter/jobs/post-job', { method: 'POST', body: JSON.stringify(jobData) }, 'company');
export const updateRecruiterJob = (jobId: string, jobData: any): Promise<Job> => request(`/recruiter/jobs/${jobId}`, { method: 'PUT', body: JSON.stringify(jobData) }, 'company');
export const updateJobStatus = (jobId: string, status: Job['status']): Promise<Job> => request(`/recruiter/jobs/status`, { method: 'PATCH', body: JSON.stringify({ jobId, status }) }, 'company');
export const fetchAllApplicants = async (): Promise<Applicant[]> => {
    const response: { applicants: Applicant[] } = await request('/recruiter/applicants/all', {}, 'company');
    return response.applicants || [];
};
export const fetchApplicantsForJob = async (jobId: string): Promise<Applicant[]> => {
    const response: { applicants: Applicant[] } = await request(`/recruiter/applicants/job/${jobId}`, {}, 'company');
    return response.applicants || [];
};
export const updateApplicantStatus = (applicationId: string, status: Applicant['status']): Promise<Applicant> => request(`/recruiter/application-status`, { method: 'PUT', body: JSON.stringify({ applicationId, status }) }, 'company');
// DO: Add comment above each fix.
// FIX: Added bulkUpdateApplicantStatus API function.
export const bulkUpdateApplicantStatus = (applicationIds: string[], status: Applicant['status']): Promise<{ message: string }> => request('/recruiter/applicants/bulk-update', { method: 'POST', body: JSON.stringify({ applicationIds, status }) }, 'company');
export const addApplicantNote = (applicationId: string, note: string): Promise<{ message: string, notes: any[] }> => request('/recruiter/applicants/note', { method: 'POST', body: JSON.stringify({ applicationId, note }) }, 'company');


export const fetchPendingJobs = async (): Promise<Job[]> => {
    const response: { pendingJobs: Job[] } = await request('/recruiter/jobs/pending', {}, 'company');
    return response.pendingJobs || [];
};
export const approveJob = (jobId: string): Promise<Job> => request(`/recruiter/jobs/pending/${jobId}/approve`, { method: 'PATCH' }, 'company');
export const rejectJob = (jobId: string, reason: string): Promise<Job> => request(`/recruiter/jobs/pending/${jobId}/reject`, { method: 'PATCH', body: JSON.stringify({ rejectionReason: reason }) }, 'company');

export const fetchRecruiterAnalytics = (): Promise<any> => request('/recruiter/analytics', {}, 'company');

export const fetchCompanyProfile = (): Promise<Company> => request('/recruiter/profile', {}, 'company');
// DO: Add comment above each fix.
// FIX: Changed HTTP method from PUT to POST to match backend API for company profile updates.
export const updateCompanyProfile = (profileData: Partial<Company>): Promise<Company> => request('/recruiter/profile', { method: 'POST', body: JSON.stringify(profileData) }, 'company');
export const fetchTeamMembers = async (): Promise<TeamMember[]> => {
    const response: { teamMembers: TeamMember[] } = await request('/recruiter/team/members', {}, 'company');
    return response.teamMembers || [];
};
export const inviteTeamMember = async (memberData: any): Promise<TeamMember> => {
    const response: { teamMember: TeamMember } = await request('/recruiter/team/invite', { method: 'POST', body: JSON.stringify(memberData) }, 'company');
    return response.teamMember;
};
export const updateTeamMember = async (memberId: string, memberData: Partial<TeamMember>): Promise<TeamMember> => {
    const response: { teamMember: TeamMember } = await request(`/recruiter/team/members/${memberId}/role`, { method: 'PUT', body: JSON.stringify(memberData) }, 'company');
    return response.teamMember;
};
export const updateTeamMemberStatus = async (memberId: string, status: 'active' | 'paused' | 'invited'): Promise<TeamMember> => {
    const response: { teamMember: TeamMember } = await request(`/recruiter/team/members/${memberId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, 'company');
    return response.teamMember;
};
export const removeTeamMember = (memberId: string): Promise<void> => request(`/recruiter/team/members/${memberId}`, { method: 'DELETE' }, 'company');

// --- Subscriptions (Company) ---
export const fetchSubscriptionPlans = async (): Promise<any[]> => {
    const response: { plans: any[] } = await request('/subscriptions/plans', {}, 'company');
    return response.plans || [];
};
export const fetchCurrentSubscription = async (): Promise<any> => {
    const response: { subscription: any } = await request('/subscriptions/current', {}, 'company');
    return response.subscription;
};
export const purchaseSubscription = (planId: string): Promise<any> => request('/subscriptions/purchase', { method: 'POST', body: JSON.stringify({ planId }) }, 'company');
export const verifyPayment = (paymentData: any): Promise<any> => request('/subscriptions/verify-payment', { method: 'POST', body: JSON.stringify(paymentData) }, 'company');

// --- Admin ---
// DO: Add comment above each fix.
// FIX: Point to the correct shared auth login endpoint and explicitly send the 'admin' role in the body.
export const adminLogin = (data: any): Promise<{ token: string; user: AdminUser }> => request('/auth/login', { method: 'POST', body: JSON.stringify({ ...data, role: 'admin' }) }, 'admin');
// DO: Add comment above each fix.
// FIX: Update admin profile endpoint to point to the new '/admin/me' route.
export const adminGetProfile = (): Promise<any> => request('/admin/me', {}, 'admin');

export const adminFetchAllUsers = (): Promise<{ users: any[] }> => request('/admin/users/list', {}, 'admin');
export const adminFetchUserById = (userId: string): Promise<{ user: User }> => request(`/admin/users/${userId}/details`, {}, 'admin');
export const adminUpdateUserDetails = (userId: string, updates: Partial<User>): Promise<{ user: User }> => request(`/admin/users/${userId}/details`, { method: 'PUT', body: JSON.stringify(updates) }, 'admin');
export const adminUpdateUserStatus = (userId: string, action: 'block' | 'unblock'): Promise<any> => request(`/admin/users/${userId}/block`, { method: 'PATCH', body: JSON.stringify({ action }) }, 'admin');

export const adminFetchAllCompanies = (): Promise<any> => request('/admin/companies', {}, 'admin');
export const adminFetchAllJobs = (): Promise<any> => request('/admin/jobs', {}, 'admin');
export const adminUpdateJob = (jobId: string, data: Partial<Job>): Promise<Job> => request(`/admin/jobs/${jobId}/status`, { method: 'PUT', body: JSON.stringify(data) }, 'admin');

export const adminFetchPendingRecruiters = (): Promise<any[]> => request('/admin/recruiter-requests/pending', {}, 'admin');
export const adminApproveRecruiter = (requestId: string): Promise<any> => request('/admin/approve', { method: 'PUT', body: JSON.stringify({ requestId }) }, 'admin');
export const adminRejectRecruiter = (requestId: string, adminNotes: string): Promise<any> => request('/admin/reject', { method: 'PUT', body: JSON.stringify({ requestId, adminNotes }) }, 'admin');

export const adminFetchBroadcasts = (): Promise<Broadcast[]> => request('/admin/communications/broadcasts', {}, 'admin');
export const adminCreateBroadcast = (broadcast: any): Promise<Broadcast> => request('/admin/communications/broadcasts', { method: 'POST', body: JSON.stringify(broadcast) }, 'admin');

export const adminFetchRecruiterRequestStats = (): Promise<any> => request('/admin/recruiter-requests/stats', {}, 'admin');

export const adminCreateEmailTemplate = (templateData: any): Promise<any> => request('/admin/email-templates', { method: 'POST', body: JSON.stringify(templateData) }, 'admin');

export const adminFetchDashboardStats = (): Promise<any> => request('/admin/dashboard/stats', {}, 'admin');
