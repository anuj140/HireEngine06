
import { Job, Application, JobAlert, UserActivityContextType } from '../../packages/types';

export enum WorkStatus {
    Fresher = 'fresher',
    Experienced = 'experienced'
}

export interface PrivacySettings {
    showFullName: boolean;
    allowResumeDownload: boolean;
    showContactInfo: boolean;
}

export interface UserProfile {
    headline: string;
    resumeUrl: string;
    skills: string[];
    profileCompletion: number;
    location?: string;
    workStatus?: WorkStatus;
    experience?: string;
    salary?: string;
    noticePeriod?: string;
    privacySettings?: PrivacySettings;
    // Add other profile fields as needed from packages/types if strict type checking is enforced in web app
    itSkills?: string[];
    employment?: any[];
    education?: any[];
    accomplishments?: any;
    careerProfile?: any;
    totalExperience?: any;
    currentSalary?: any;
    currentLocation?: any;
    expectedSalary?: any;
    dateOfBirth?: string;
    gender?: any;
    maritalStatus?: any;
    address?: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'JobSeeker' | 'Recruiter' | 'CompanyAdmin' | 'HRManager' | 'Admin' | 'user';
    profile?: UserProfile;
    phone?: string;
    profilePhoto?: string;
    isPhoneVerified?: boolean;
    isEmailVerified?: boolean;
    updatedAt?: string;
}

export interface Company {
    id: string;
    name: string;
    logoUrl: string;
    description: string;
    rating: number;
    reviews: number;
}
