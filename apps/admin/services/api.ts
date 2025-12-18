
import type { AdminUser } from '../contexts/AuthContext';
import { CmsData, Job, Company, User } from '../../../packages/types';
import { Broadcast } from '../data/mockData';
import {
    adminLogin as apiAdminLogin,
    adminGetProfile as apiGetAdminProfile,
    adminFetchAllUsers as apiFetchAllUsers,
    adminFetchUserById as apiFetchUserById,
    adminUpdateUserStatus as apiUpdateUserStatus,
    adminFetchAllCompanies as apiFetchAllCompanies,
    adminFetchAllJobs as apiFetchAllJobs,
    adminUpdateJob as apiUpdateJob,
    adminFetchPendingRecruiters as apiFetchPendingRecruiters,
    adminApproveRecruiter as apiApproveRecruiter,
    adminRejectRecruiter as apiRejectRecruiter,
    adminFetchBroadcasts as apiFetchBroadcasts,
    adminCreateBroadcast as apiCreateBroadcast
} from '../../../packages/api-client';

const API_BASE_URL = '/api/v1/admin';

// --- Auth Service ---
export const loginAdmin = (data: any): Promise<{ token: string; user: AdminUser }> => apiAdminLogin(data);
export const getAdminProfile = (): Promise<any> => apiGetAdminProfile();

// --- Data Fetching ---
export const fetchAllUsers = (range: string = 'all'): Promise<{ users: any[] }> => api.request(`/users/list?range=${range}`);
export const fetchUserById = (userId: string): Promise<{ user: User }> => apiFetchUserById(userId);
export const updateUserDetails = (userId: string, updates: Partial<User>): Promise<{ user: User }> => api.request(`/users/${userId}/details`, { method: 'PUT', body: JSON.stringify(updates) });
export const updateUserStatus = (userId: string, action: 'block' | 'unblock'): Promise<any> => apiUpdateUserStatus(userId, action);

export const fetchAllCompanies = (): Promise<{ companies: Company[] }> => apiFetchAllCompanies();
export const adminFetchAllJobs = (): Promise<{ jobs: Job[] }> => apiFetchAllJobs();
export const fetchAllJobs = (): Promise<{ jobs: Job[] }> => apiFetchAllJobs();
export const updateJob = (jobId: string, data: Partial<Job>): Promise<Job> => apiUpdateJob(jobId, data);

// --- Recruiter Approvals ---
// Explicitly export these to fix "Module does not export..." error
export const adminFetchPendingRecruiters = apiFetchPendingRecruiters;
export const adminApproveRecruiter = apiApproveRecruiter;
export const adminRejectRecruiter = apiRejectRecruiter;

// --- CMS Service ---
// DO: Add comment above each fix.
// FIX: Imported MOCK_CMS_CONTENT to provide mock data for the CMS page.
import { MOCK_CMS_CONTENT } from '../../../packages/api-client/cms-data';

export const fetchCmsContent = (): Promise<CmsData> => {
    // DO: Add comment above each fix.
    // FIX: Returning mock data directly since backend CMS endpoint is not ready.
    return Promise.resolve(MOCK_CMS_CONTENT);
};

export const updateCmsContent = (newContent: CmsData): Promise<CmsData> => {
    window.dispatchEvent(new CustomEvent('cms_updated'));
    // DO: Add comment above each fix.
    // FIX: Simulated successful save for mock CMS data.
    return Promise.resolve(newContent);
};

// --- Communications ---
export const fetchBroadcasts = (): Promise<Broadcast[]> => apiFetchBroadcasts();
export const createBroadcast = (broadcast: any): Promise<Broadcast> => apiCreateBroadcast(broadcast);


// --- Analytics Service ---
// --- Analytics Service ---
export const fetchAnalyticsData = (filter: string, startDate?: string, endDate?: string): Promise<any> => {
    let url = `/analytics?filter=${filter}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    return api.request(url);
};

export const fetchDashboardStats = (range: string = 'all'): Promise<any> => api.request(`/dashboard/stats?range=${range}`);


export const fetchUserDetails = (userId: string): Promise<any> => api.request(`/users/${userId}/details`);

export const fetchCompanyDetails = (companyId: string): Promise<any> => api.request(`/companies/${companyId}/details`);
export const verifyCompany = (companyId: string): Promise<any> => api.request(`/companies/${companyId}/verify`, { method: 'PUT' });
export const suspendCompany = (companyId: string): Promise<any> => api.request(`/companies/${companyId}/suspend`, { method: 'PUT' });

const getAuthToken = () => sessionStorage.getItem('admin_token');

// Generic request wrapper if needed elsewhere
export const api = {
    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = { ...options.headers as Record<string, string> };

        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const responseData = await response.json();

        if (!response.ok || responseData.success === false) {
            const message = responseData.msg || responseData.message || 'An admin API error occurred';
            throw new Error(message);
        }

        return responseData;
    }
};
