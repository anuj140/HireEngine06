// apps/admin/data/mockData.ts

// These types and mock objects are used for frontend development and will be
// replaced by data fetched from the backend API.

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: 'Job Seeker' | 'Recruiter';
  status: 'Active' | 'Suspended' | 'Pending';
  registrationDate: string;
  lastActive: string;
  profileCompletion: number;
  resumeUploaded: boolean;
  applicationsCount: number;
  savedJobsCount: number;
  profileViews: number;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  subscription: {
    plan: string;
    status: 'Active' | 'Expired';
    expiry: string;
  };
  loginHistory: { timestamp: string }[];
  adminNotes: string[];
  reportsCount: number;
  dob?: string;
  gender?: string;
  location: string;
  phone: string;
  pendingVerifications?: string[];
}

export interface AdminCompany {
  id: string;
  name: string;
  logo: string;
  industry: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  plan: 'Free' | 'Premium' | 'Enterprise';
  accountStatus: 'Active' | 'Inactive' | 'Suspended' | 'Banned';
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
  jobs: {
    active: number;
    pending: number;
    expired: number;
  };
  applicationsReceived: number;
  registrationDate: string;
  lastLogin: string;
  flaggedJobs: number;
  website?: string;
  location?: string;
  pendingDocuments?: string[];
}

export interface AdminJob {
  id: string;
  title: string;
  companyId: string;
  postedDate: string;
  expiryDate: string;
  applicantsCount: number;
  status: 'active' | 'pending' | 'paused' | 'closed' | 'expired' | 'rejected';
  performanceData: {
    viewsOverTime: { date: string; views: number; applications: number }[];
    recruitmentFunnel: { name: string; value: number }[];
    applicantSources: { name: string; value: number }[];
  };
  description: string;
  requiredSkills: string[];
  salaryRange: string;
  jobType: string;
  experienceRequired: string;
  educationLevel: string;
  location: string;
  industry: string;
  openings: number;
  postedBy: string;
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
  isFeatured: boolean;
  applications: {
    id: string;
    name: string;
    email: string;
    date: string;
    status: 'New' | 'Shortlisted' | 'Rejected' | 'Hired';
  }[];
  activityLogs: {
    date: string;
    action: string;
    user: string;
  }[];
  attachments: {
    name: string;
    url: string;
  }[];
}


export interface Broadcast {
  id: string;
  name: string;
  subject: string;
  body: string;
  audience: string;
  channels: ('email' | 'notification')[];
  status: 'Sent' | 'Scheduled' | 'Draft';
  sentDate: string;
  openRate: string;
  clickRate: string;
}

// In a real app, this data would come from a backend API.
export const mockUsers: User[] = [
  { id: 1, name: 'Ashish D.', email: 'ashish.d@email.com', avatar: 'https://i.pravatar.cc/150?u=ashish', role: 'Job Seeker', status: 'Active', registrationDate: '2023-01-15', lastActive: '2h ago', profileCompletion: 85, resumeUploaded: true, applicationsCount: 12, savedJobsCount: 5, profileViews: 45, isEmailVerified: true, isPhoneVerified: true, subscription: { plan: 'Free', status: 'Active', expiry: 'N/A' }, loginHistory: [{ timestamp: '2024-07-22T10:00:00Z' }], adminNotes: [], reportsCount: 0, location: 'Pune, IN', phone: '+91 98765 43210' },
  { id: 2, name: 'Priya Singh', email: 'priya.singh@email.com', avatar: 'https://i.pravatar.cc/150?u=priya', role: 'Job Seeker', status: 'Active', registrationDate: '2023-02-20', lastActive: '1d ago', profileCompletion: 100, resumeUploaded: true, applicationsCount: 25, savedJobsCount: 10, profileViews: 150, isEmailVerified: true, isPhoneVerified: true, subscription: { plan: 'Premium', status: 'Active', expiry: '2024-12-31' }, loginHistory: [{ timestamp: '2024-07-21T14:30:00Z' }], adminNotes: ["Power user, very active."], reportsCount: 0, location: 'Bengaluru, IN', phone: '+91 98765 43211' },
  { id: 3, name: 'Rohan Verma', email: 'rohan.v@email.com', avatar: 'https://i.pravatar.cc/150?u=rohan', role: 'Recruiter', status: 'Suspended', registrationDate: '2023-03-10', lastActive: '1w ago', profileCompletion: 90, resumeUploaded: false, applicationsCount: 0, savedJobsCount: 0, profileViews: 20, isEmailVerified: true, isPhoneVerified: false, subscription: { plan: 'Free', status: 'Expired', expiry: '2024-06-30' }, loginHistory: [{ timestamp: '2024-07-15T09:00:00Z' }], adminNotes: ["Suspended for ToS violation."], reportsCount: 3, location: 'Mumbai, IN', phone: '+91 98765 43212' },
];

export const mockCompanies: AdminCompany[] = [
  { id: '1', name: 'Innovate Solutions', logo: 'https://img.naukri.com/logo_images/v5/10368.gif', industry: 'IT Services', contact: { name: 'Priya Sharma', email: 'hr@innovate.com', phone: '123-456-7890' }, plan: 'Enterprise', accountStatus: 'Active', verificationStatus: 'Verified', jobs: { active: 5, pending: 0, expired: 2 }, applicationsReceived: 1250, registrationDate: '2022-01-20', lastLogin: '2024-07-22T08:00:00Z', flaggedJobs: 0 },
  { id: '2', name: 'Creative Minds Inc.', logo: 'https://img.naukri.com/logo_images/v5/398046.gif', industry: 'Marketing', contact: { name: 'Ravi Kumar', email: 'ravi@creative.com', phone: '234-567-8901' }, plan: 'Premium', accountStatus: 'Active', verificationStatus: 'Verified', jobs: { active: 2, pending: 1, expired: 0 }, applicationsReceived: 450, registrationDate: '2023-05-15', lastLogin: '2024-07-20T11:00:00Z', flaggedJobs: 1 },
];

export const mockAdminJobs: AdminJob[] = [
  { id: 'job001', title: 'Senior Frontend Developer', companyId: '1', postedDate: '2024-07-15', expiryDate: '2024-08-14', applicantsCount: 152, status: 'active', performanceData: { viewsOverTime: [], recruitmentFunnel: [], applicantSources: [] }, description: '', requiredSkills: [], salaryRange: '', jobType: '', experienceRequired: '', educationLevel: '', location: '', industry: '', openings: 0, postedBy: '', verificationStatus: 'Verified', isFeatured: false, applications: [], activityLogs: [], attachments: [] },
  { id: 'job002', title: 'UI/UX Designer', companyId: '2', postedDate: '2024-07-20', expiryDate: '2024-08-19', applicantsCount: 88, status: 'pending', performanceData: { viewsOverTime: [], recruitmentFunnel: [], applicantSources: [] }, description: '', requiredSkills: [], salaryRange: '', jobType: '', experienceRequired: '', educationLevel: '', location: '', industry: '', openings: 0, postedBy: '', verificationStatus: 'Pending', isFeatured: false, applications: [], activityLogs: [], attachments: [] },
];

export const mockBroadcasts: Broadcast[] = [
  { id: 'brd1', name: 'Q3 Product Update', subject: 'New Features Now Live!', body: '', audience: 'All Recruiters', channels: ['email', 'notification'], status: 'Sent', sentDate: '2024-07-20', openRate: '42.1%', clickRate: '12.5%' },
  { id: 'brd2', name: 'Welcome Series - Job Seekers', subject: 'Complete Your Profile for Better Matches', body: '', audience: 'All Job Seekers', channels: ['email'], status: 'Sent', sentDate: '2024-07-18', openRate: '28.9%', clickRate: '6.8%' },
];

// Mock Analytics Data for Dashboard
export const MOCK_ANALYTICS_DATA = {
  kpis: {
    totalUsers: 15420,
    totalCompanies: 840,
    activeJobs: 325,
    totalApplications: 45032,
    pendingJobs: 12,
    revenue: 125000
  },
  timeSeriesData: [
    { date: '2024-01', userSignups: 400, jobsPosted: 240 },
    { date: '2024-02', userSignups: 300, jobsPosted: 139 },
    { date: '2024-03', userSignups: 200, jobsPosted: 980 },
    { date: '2024-04', userSignups: 278, jobsPosted: 390 },
    { date: '2024-05', userSignups: 189, jobsPosted: 480 },
    { date: '2024-06', userSignups: 239, jobsPosted: 380 },
    { date: '2024-07', userSignups: 349, jobsPosted: 430 },
  ],
  userRoleData: [
    { name: 'Job Seekers', value: 12500 },
    { name: 'Recruiters', value: 2900 },
    { name: 'Admins', value: 20 },
  ],
  industryData: [
    { name: 'IT Services', value: 400 },
    { name: 'Healthcare', value: 300 },
    { name: 'Finance', value: 300 },
    { name: 'Education', value: 200 },
    { name: 'Retail', value: 150 },
  ],
  pipelineData: [
    { name: 'Applications Support', value: 45000, fill: '#8884d8' },
    { name: 'Resume Analyzed', value: 32000, fill: '#83a6ed' },
    { name: 'Shortlisted', value: 12000, fill: '#8dd1e1' },
    { name: 'Interviewed', value: 4500, fill: '#82ca9d' },
    { name: 'Hired', value: 1200, fill: '#a4de6c' },
  ],
  topCompanies: [
    { id: '1', name: 'Innovate Solutions', logo: 'https://img.naukri.com/logo_images/v5/10368.gif', activeJobs: 15, applications: 250 },
    { id: '2', name: 'Creative Minds Inc.', logo: 'https://img.naukri.com/logo_images/v5/398046.gif', activeJobs: 12, applications: 180 },
    { id: '3', name: 'Tech Giants', logo: 'https://img.naukri.com/logo_images/v5/10368.gif', activeJobs: 10, applications: 150 },
  ]
};