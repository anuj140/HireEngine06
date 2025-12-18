





export interface PrivacySettings {
    showFullName: boolean;
    allowResumeDownload: boolean;
    showContactInfo: boolean;
}

// DO: Add comment above each fix.
// FIX: Added RecruiterPermissions interface.
export interface RecruiterPermissions {
    canPostJobs: boolean;
    canDownloadResumes: boolean;
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Recruiter' | 'HR Manager';
    status: 'Active' | 'Pending' | 'Paused';  
    lastActive: string;
    password?: string;
    // DO: Add comment above each fix.
    // FIX: Added optional permissions property.
    permissions?: RecruiterPermissions;
}

export interface Company {
    id: string;
    name: string;
    logoUrl: string;
    description: string;
    rating: number;
    reviews: number;
    bannerUrl?: string;
    companyType?: string;
    tags?: string[];
    tagline?: string;
    followers?: number;
    foundedYear?: number;
    companySize?: string;
    website?: string;
    headquarters?: string;
    industry?: string;
    overview?: {
        about: {
            videoUrl: string;
            videoThumbnailUrl?: string;
            text: string;
        };
        corporateSocialResponsibility: {
            imageUrl: string;
            title: string;
        };
        diversityInclusion?: {
            title: string;
            imageUrl: string;
            text: string;
        };
        communityEngagement?: {
            title: string;
            images: string[];
            text: string;
        };
        lifeWithUs: {
            images: string[];
        },
        leaders?: {
            name: string;
            title: string;
            imageUrl: string;
        }[];
        departmentsHiring: {
            name: string;
            openings: number;
        }[];
    };
    whyJoinUs?: {
        leaderMessage: {
            videoUrl: string;
            text: string;
        };
        engageWithUs: {
            imageUrl: string;
            title: string;
        };
        lifeAt: {
            images: string[];
        };
        benefits: {
            icon: string;
            name: string;
        }[];
        employeeSalaries: {
            role: string;
            experience: string;
            salary: string;
        }[];
        keyHighlights: {
            icon: string;
            title: string;
            subtitle: string;
        }[];
        awards: {
            year: number;
            title: string;
        }[];
        reviewsByProfile: {
            role: string;
            rating: number;
            count: number;
        }[];
        socialLinks: {
            youtube: string;
            x: string;
            facebook: string;
            instagram: string;
            linkedin: string;
        };
        employeeSpeaks?: {
            category: string;
            rating: number;
        }[];
        ratingsInOtherAreas?: {
            category: string;
            rating: number;
        }[];
    };
    jobs?: Job[];
    interviewQuestions?: {
        role: string;
        questions: number;
    }[];
}

export interface FeaturedCompany {
    id: string;
    name: string;
    logoUrl: string;
    rating: number;
    reviews: string;
    description: string;
}

export interface Job {
    id: string;
    title: string;
    company: Company;
    location: string;
    experience: string;
    salary: string;
    description: string;
    skills: string[];
    postedDate: string;
    jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
    applicants: number;
    openings: number;
    jobHighlights: string[];
    questions?: { question: string; type: 'text' | 'boolean' }[];
    status: 'active' | 'paused' | 'closed' | 'expired' | 'pending' | 'rejected';
    views: number;
    clicks: number;
    educationalQualification: string;
    applicationDeadline: string;
    industry: string;
    department: string;
    perksAndBenefits: string[];
    workMode: 'On-site' | 'Remote' | 'Hybrid';
    shiftTimings: 'Day' | 'Night' | 'Rotational';
    noticePeriodPreference: string;
    preferredCandidateLocation: string;
    hiringType: 'Direct' | 'Agency';
    applicationInstructions: string;
    interviewProcessInfo: string;
    postedBy?: string;
    // DO: Add comment above each fix.
    // FIX: Added optional notes property.
    notes?: { by: string; role: string; text: string; date: string }[];
}

export interface CompanyJob {
    id: string;
    title: string;
    experience: string;
    salary: string;
    location: string;
    description: string;
    skills: string[];
    postedDate: string;
    department?: string;
}

export interface Education {
  educationLevel: string;
  institution: string;
  course: string;
  specialization: string;
  courseType: 'Full time' | 'Part time' | 'Correspondence/Distance learning';
  startYear: string;
  endYear: string;
  gradingSystem: string;
  projects: string[];
}

export interface OnlineProfile {
    name: string;
    url: string;
    description: string;
}

export interface Certification {
    name: string;
    completionId: string;
    url: string;
    fromMonth: string;
    fromYear: string;
    toMonth: string;
    toYear: string;
    doesNotExpire: boolean;
}

export interface Accomplishments {
    onlineProfiles: OnlineProfile[];
    certifications: Certification[];
}

export interface CareerProfile {
  currentIndustry: string;
  department: string;
  roleCategory: string;
  jobRole: string;
  desiredJobTypes: string[];
  desiredEmploymentTypes: string[];
  preferredShift: 'Day' | 'Night' | 'Flexible' | '';
  preferredLocations: string[];
  expectedSalaryCurrency: string;
  expectedSalaryAmount: string;
}

export interface Employment {
  isCurrent: boolean;
  employmentType: 'Full-time' | 'Contract' | 'Internship';
  companyName: string;
  jobTitle: string;
  joiningYear: string;
  joiningMonth: string;
  jobProfile: string;
  workedTillYear: string;
  workedTillMonth: string;
}

export interface UserProfile {
    headline: string;
    profileSummary?: string;
    resumeUrl: string;
    skills: string[];
    itSkills?: string[];
    profileCompletion: number;
    location?: string;
    employment?: Employment[];
    education: Education[];
    accomplishments: Accomplishments;
    careerProfile: CareerProfile;
    privacySettings?: PrivacySettings;
    workStatus?: 'Fresher' | 'Experienced';
    totalExperience?: { years: string; months: string };
    currentSalary?: { currency: string; amount: string; breakdown?: string };
    expectedSalary?: { currency: string; amount: string };
    dateOfBirth?: string;
    gender?: 'Male' | 'Female' | 'Other';
    maritalStatus?: 'Single' | 'Married';
    address?: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'JobSeeker' | 'Recruiter' | 'CompanyAdmin' | 'HRManager' | 'Admin' | 'user';
    profile?: UserProfile;
    phone?: string;
    // DO: Add comment above each fix.
    // FIX: Added optional profilePhoto property.
    profilePhoto?: string;
}

export interface Application {
    jobId: string;
    jobTitle: string;
    companyName: string;
    status: 'Applied' | 'Viewed' | 'Shortlisted' | 'Rejected';
    appliedDate: string;
}

export interface ApplicantProfile {
    headline: string;
    resumeUrl: string;
    skills: string[];
    privacySettings?: PrivacySettings;
}

export interface Applicant {
    id: string;
    applicationId: string;
    jobId: string;
    jobTitle: string;
    name: string;
    email: string;
    phone?: string;
    profile: ApplicantProfile;
    experience: string;
    qualification: string;
    accomplishments: { type: string; detail: string }[];
    applicationDate: string;
    status: 'New' | 'Reviewed' | 'Shortlisted' | 'Interview Scheduled' | 'Hired' | 'Rejected';
    answers: (string | boolean)[];
    expectedSalary: string;
    noticePeriod: string;
    location: string;
    coverLetter?: string;
    matchScore: number;
    notes: string[];
    applicationHistory: { jobId: string; jobTitle: string; appliedDate: string; status: string }[];
    source?: string;
}

export interface Message {
    id: string;
    from: { id: string; name: string };
    to: { id: string; name: string };
    job: { id: string; title: string };
    content: string;
    timestamp: string;
    isRead: boolean;
}

export interface Filters {
    keywords?: string;
    location?: string;
    experience?: string;
    jobType?: string[];
    salary?: string[];
    postedDate?: string;
}

export interface ApplicantFilters {
  jobTitle: string;
  applicationDate: string;
  location: string;
  qualification: string;
  status: Applicant['status'][];
  minExperience: string;
  maxExperience: string;
  skills: string;
  minSalary: string;
  maxSalary: string;
  noticePeriod: string;
  matchScoreCategory: 'any' | 'high' | 'medium' | 'low';
  hasCoverLetter: boolean;
}

export interface Notification {
    id: string;
    message: string;
    link: string;
    type: 'new_applicant' | 'status_update' | 'job_expiry' | 'new_message' | 'general';
    timestamp: string;
    isRead: boolean;
}

// DO: Add comment above each fix.
// FIX: Added missing Broadcast interface.
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

// DO: Add comment above each fix.
// FIX: Added missing JobAlert interface.
export interface JobAlert {
    id: string;
    name: string;
    keywords: string;
    location: string;
    jobTypes: Job['jobType'][];
    frequency: 'daily' | 'weekly';
    createdDate: string;
}

// DO: Add comment above each fix.
// FIX: Added missing UserActivityContextType interface.
export interface UserActivityContextType {
    viewedJobIds: Set<string>;
    savedJobIds: Set<string>;
    // DO: Add comment above each fix.
    // FIX: Add 'savedJobs' property to the context type to make the array of saved jobs available to components.
    savedJobs: Job[];
    appliedJobIds: Set<string>;
    // DO: Add comment above each fix.
    // FIX: Add 'isSavedJobsLoading' property to the context type to make loading state available.
    isSavedJobsLoading: boolean;
    viewJob: (jobId: string) => void;
    // DO: Add comment above each fix.
    // FIX: Change 'saveJob' parameter from 'jobId: string' to 'job: Job' to match its implementation and usage.
    saveJob: (job: Job) => Promise<void>;
    unsaveJob: (jobId: string) => Promise<void>;
    isJobSaved: (jobId: string) => boolean;
    applyForJob: (jobId: string, answers?: any[]) => Promise<void>;
}

// --- CMS Types ---

// DO: Add comment above each fix.
// FIX: Added missing CMS type interfaces.
export interface CmsLink {
    text: string;
    url: string;
}

export interface CmsLinkGroup {
    title: string;
    links: CmsLink[];
}

export interface CmsNavigation {
    id: string;
    name: string;
    groups: CmsLinkGroup[];
}

export interface CmsFeaturedItem {
    id: string;
    name: string;
    countLabel: string;
    logoUrls: string[];
    link: string;
}

export interface CmsBanner {
    id: string;
    name: string;
    placement: string;
    title: string;
    subtitle: string;
    mediaType: 'image' | 'video';
    mediaUrl: string;
    backgroundImageUrl?: string;
    cta: { text: string; link: string; };
    useDarkOverlay?: boolean;
    showIllustration?: boolean;
    companyId?: string;
    videoDetails?: {
        title: string;
        subtitle: string;
    };
    eyebrow?: string;
}

export interface CmsCard {
    id: string;
    template: 'standard' | 'image-background' | 'promo-banner-a' | 'split-content' | 'image-ad' | 'image-custom-size';
    placement: string;
    title: string;
    text: string;
    imageUrl: string;
    cta: { text: string; link: string; };
    colors: { background: string; text: string; };
    badge?: string;
    imagePosition?: 'left' | 'right';
    imageStyle?: 'default' | 'circle' | 'no-bg';
    width?: number;
    height?: number;
}

export type CmsContentBlock = 
    | { type: 'hero'; eyebrow?: string; title: string; features: { icon: string; text: string }[]; cta1: { text: string; url: string }; cta2?: { text: string; url: string }; backgroundImageUrl?: string; useDarkOverlay?: boolean; showIllustration?: boolean; }
    | { type: 'stats'; stats: { icon: string; value: string; label: string }[] }
    | { type: 'features'; title: string; subtitle: string; features: { icon: string; title: string; description: string }[] }
    | { type: 'testimonials'; title: string; subtitle: string; testimonials: { quote: string; author: string; title: string; company: string; logoUrl: string }[] }
    | { type: 'faq'; title: string; faqs: { question: string; answer: string }[] }
    | { type: 'cta'; title: string; subtitle: string; cta: { text: string; url: string } };

export interface CmsPage {
    title?: string;
    banners?: CmsBanner[];
    cards?: CmsCard[];
    featuredItems?: {
        title: string;
        items: CmsFeaturedItem[];
    }[];
    contentBlocks?: CmsContentBlock[];
    companyCategories?: { name: string; count: number }[];
}

export interface CmsData {
    webPublicHome: CmsPage;
    webLoggedInHome: CmsPage;
    companyLanding: CmsPage;
    webCompaniesPage: CmsPage;
    globalHeader: CmsNavigation;
    globalFooter: CmsNavigation;
}