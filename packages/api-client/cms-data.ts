

import { Job, Company, User, Application, Message, CmsData, JobAlert, Applicant, TeamMember } from '../types';

// This file contains mock data for features where the backend is not yet available,
// such as the Content Management System (CMS).

export const MOCK_HIRING_COMPANIES: Company[] = [
    { 
      id: 'c1', 
      name: 'BHS Corrugated India', 
      logoUrl: 'https://i.imgur.com/vHq143D.png', 
      description: 'World leading solutions provider for the corrugated industry.', 
      rating: 4.4, 
      reviews: 9, 
      bannerUrl: 'https://i.imgur.com/KzU0A2p.png', 
      companyType: 'Foreign MNC', 
      tags: ['Industrial Equipment / Machinery', 'Private', 'Foreign MNC', 'B2B', 'SaaS'], 
      tagline: 'Better — across the Board!', 
      followers: 4700, 
      foundedYear: 1717, 
      companySize: '1,001-5,000 employees', 
      website: 'https://www.bhs-world.com/', 
      headquarters: 'Weiherhammer, Bavaria, Germany', 
      industry: 'Industrial Machinery',
      overview: {
        about: {
            videoUrl: '_2g_bQ2a2s', // YouTube video ID
            text: "Around the world, infrastructure professionals rely on software from Bentley Systems to help them design, build, and operate better and more resilient infrastructure for transportation, water, energy, cities, and more. Founded in 1984."
        },
        diversityInclusion: {
            title: "Diversity, equity, and inclusion",
            imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800",
            text: "As a global company operating in 195 countries, we have colleagues from many different cultures and backgrounds. This internationality is an asset that we cultivate and develop. Our commitment to diversity, equity and inclusion is what makes us successful, and allows each colleague to contribute to their teams, to reach their highest performance and potential, and to pursue and achieve their individual personal goals."
        },
        communityEngagement: {
            title: "Community Engagement",
            images: [
                "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800",
                "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=800",
                "https://images.unsplash.com/photo-1470240731273-7821a6eeb685?q=80&w=800",
                "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=800"
            ],
            text: "At Bentley, we use our resources, talents, and influence to impact the environment and quality of life responsibly and positively around the world. The Bentley family has always led by being an example of... read more"
        },
        leaders: [
            { name: "Greg Bentley", title: "CEO and Chairperson of the Board", imageUrl: "https://i.imgur.com/CoQHRhY.jpg" },
            { name: "Keith A. Bentley", title: "EVP, CTO, and Board Director", imageUrl: "https://i.imgur.com/3f4wefS.jpg" },
            { name: "Gus Bergsma", title: "Chief Revenue Officer", imageUrl: "https://i.imgur.com/sC52a6T.jpg" },
            { name: "Claire Rutkowski", title: "SVP, CIO Champion", imageUrl: "https://i.imgur.com/kS9T2us.jpg" }
        ],
        // Dummy data for other sections
        corporateSocialResponsibility: { imageUrl: '', title: '' },
        lifeWithUs: { images: []},
        departmentsHiring: [],
      },
      whyJoinUs: {
        keyHighlights: [
            { icon: 'WorkLifeIcon', title: 'Work Life', subtitle: 'Highly rated' },
            { icon: 'CompanyCultureIcon', title: 'Company Culture', subtitle: 'Highly rated' },
            { icon: 'JobSecurityIcon', title: 'Job Security', subtitle: 'Highly rated' },
        ],
        employeeSpeaks: [
            { category: 'Work Life', rating: 4.4 },
            { category: 'Company Culture', rating: 4.2 },
            { category: 'Work Satisfaction', rating: 4.0 },
            { category: 'Job Security', rating: 4.0 },
        ],
        ratingsInOtherAreas: [
            { category: 'Skill Development', rating: 3.9 },
            { category: 'Salary & Benefits', rating: 3.8 },
            { category: 'Career Growth', rating: 3.5 },
        ],
        awards: [
            { year: 2022, title: 'Going Digital Awards' },
            { year: 2021, title: 'Going Digital Awards' },
        ],
        socialLinks: {
            youtube: '#', x: '#', facebook: '#', instagram: '#', linkedin: '#'
        },
        // Dummy data for other sections
        leaderMessage: { videoUrl: '', text: '' },
        engageWithUs: { imageUrl: '', title: '' },
        lifeAt: { images: [] },
        benefits: [],
        employeeSalaries: [],
        reviewsByProfile: [],
      }
    },
    { id: 'c2', name: 'Creative Minds Inc.', logoUrl: 'https://img.naukri.com/logo_images/v5/398046.gif', description: 'A creative agency specializing in branding and digital marketing.', rating: 4.8, reviews: 89, tags: ['Marketing', 'Design'], bannerUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop' },
];

export const MOCK_JOBS: Job[] = [
    // DO: Add comment above each fix.
    // FIX: Added sample questions to this job to demonstrate the application question feature.
    { id: 'j1', title: 'Senior Frontend Developer', company: MOCK_HIRING_COMPANIES[0], location: 'Remote', experience: '5-8 Yrs', salary: 'Not Disclosed', description: 'Join our team to build next-gen web applications with React and TypeScript.', skills: ['React', 'TypeScript', 'Node.js', 'AWS'], postedDate: '2 days ago', jobType: 'Full-time', applicants: 250, openings: 2, jobHighlights: ['5 days working'], status: 'active', views: 1200, clicks: 300, educationalQualification: 'B.Tech/B.E. in Computer Science', applicationDeadline: '2024-09-01', industry: 'Software Product', department: 'Engineering', perksAndBenefits: ['Health Insurance', 'WFH Setup'], workMode: 'Remote', shiftTimings: 'Day', noticePeriodPreference: '30 days', preferredCandidateLocation: 'Any', hiringType: 'Direct', applicationInstructions: '', interviewProcessInfo: '', questions: [{ question: 'What is your expected CTC in INR?', type: 'text' }, { question: 'Are you available to join within 30 days?', type: 'boolean' }] },
    // DO: Add comment above each fix.
    // FIX: Added missing `educationalQualification` property to satisfy the Job interface.
    { id: 'j2', title: 'UX/UI Designer', company: MOCK_HIRING_COMPANIES[1], location: 'Mumbai', experience: '2-4 Yrs', salary: '₹8,00,000 - ₹12,00,000 P.A.', description: 'Design intuitive and beautiful user interfaces for our mobile and web products.', skills: ['Figma', 'Adobe XD', 'User Research'], postedDate: '5 days ago', jobType: 'Full-time', applicants: 180, openings: 1, jobHighlights: [], status: 'active', views: 950, clicks: 210, educationalQualification: 'Any Degree in Design', applicationDeadline: '2024-08-25', industry: 'Design', department: 'Product', perksAndBenefits: [], workMode: 'On-site', shiftTimings: 'Day', noticePeriodPreference: 'Immediate', preferredCandidateLocation: 'Mumbai', hiringType: 'Direct', applicationInstructions: '', interviewProcessInfo: '' },
];

export const MOCK_APPLICATIONS: Application[] = [
    { jobId: 'j1', jobTitle: 'Senior Frontend Developer', companyName: 'Innovate Solutions', status: 'Shortlisted', appliedDate: '2024-07-15T10:00:00Z' }
];

export const MOCK_MESSAGES: Message[] = [
    { id: 'msg1', from: { id: 'recruiter1', name: 'Priya Sharma' }, to: { id: 'user1', name: 'Ashish D.' }, job: { id: 'j1', title: 'Senior Frontend Developer' }, content: 'Hi Ashish, we were impressed with your profile and would like to schedule an interview.', timestamp: '2024-07-20T11:00:00Z', isRead: false }
];

export const RECRUITER_POSTED_JOBS: Job[] = MOCK_JOBS;
export const ALL_RECRUITER_APPLICANTS: Applicant[] = [];

export const COMPANY_FILTERS_DATA = {
  companyType: [{ name: 'MNC', count: 150 }],
  industry: [{ name: 'Software Product', count: 200 }],
};

// DO: Add comment above each fix.
// FIX: Added MOCK_TEAM_MEMBERS to provide mock data for the team management page.
export const MOCK_TEAM_MEMBERS: TeamMember[] = [
    { id: 'tm1', name: 'Priya Sharma', email: 'hr@innovate.com', role: 'Admin', status: 'Active', lastActive: '2 hours ago' },
    { id: 'tm2', name: 'Ravi Kumar', email: 'ravi@creative.com', role: 'Recruiter', status: 'Active', lastActive: '1 day ago', permissions: { canPostJobs: true, canDownloadResumes: true } },
    { id: 'tm3', name: 'Anjali Mehta', email: 'anjali.m@innovate.com', role: 'HR Manager', status: 'Paused', lastActive: '1 week ago', permissions: { canPostJobs: false, canDownloadResumes: true } },
    { id: 'tm4', name: 'Sameer Singh', email: 'sameer@creative.com', role: 'Recruiter', status: 'Pending', lastActive: 'Never', permissions: { canPostJobs: true, canDownloadResumes: false } },
];

export const MOCK_CMS_CONTENT: CmsData = {
  webPublicHome: {
    banners: [
      {
        id: 'banner-hero-1',
        name: "Public Homepage Hero",
        placement: 'web-public-home',
        title: "Find your dream job now",
        subtitle: "2 Lakh+ jobs for you to explore",
        mediaType: 'image',
        mediaUrl: '',
        backgroundImageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070',
        cta: { text: "Search Jobs", link: "/jobs" },
        useDarkOverlay: false,
        showIllustration: true,
      },
    ],
    cards: [
      {
        id: 'card-1',
        template: 'standard',
        placement: 'web-public-home',
        title: 'Build Your Profile',
        text: 'Create a professional profile that stands out to recruiters and showcases your skills.',
        imageUrl: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=800',
        cta: { text: 'Get Started', link: '/profile' },
        colors: { background: '#ffffff', text: '#333333' }
      },
      {
        id: 'card-2',
        template: 'image-background',
        placement: 'web-public-home',
        title: 'Top Companies are Hiring',
        text: 'Explore opportunities at leading companies and find your perfect fit.',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800',
        cta: { text: 'View Companies', link: '/companies' },
        colors: { background: '#005f94', text: '#ffffff' }
      }
    ],
    featuredItems: [
      {
        title: 'Top hiring categories',
        items: [
          { id: 'feat-cat-1', name: 'IT', countLabel: '1200 Jobs', logoUrls: ['https://img.naukri.com/logo_images/v5/10368.gif', 'https://img.naukri.com/logo_images/v5/398046.gif'], link: '/jobs?keywords=IT' },
          { id: 'feat-cat-2', name: 'Sales', countLabel: '800 Jobs', logoUrls: ['https://img.naukri.com/logo_images/v5/218362.gif', 'https://img.naukri.com/logo_images/v5/264.gif'], link: '/jobs?keywords=Sales' },
        ]
      },
      {
        title: 'Featured companies',
        items: [
            { id: 'feat-comp-c1', name: 'Innovate Solutions', countLabel: '4.5 ★ | 125 Reviews', logoUrls: ['https://img.naukri.com/logo_images/v5/10368.gif'], link: '/company/c1' },
            { id: 'feat-comp-c2', name: 'Creative Minds Inc.', countLabel: '4.8 ★ | 89 Reviews', logoUrls: ['https://img.naukri.com/logo_images/v5/398046.gif'], link: '/company/c2' },
        ]
      }
    ]
  },
  webLoggedInHome: {
     banners: [
        {
          id: 'banner-promo-1',
          name: "Logged-in Promo Banner",
          placement: 'web-loggedin-home',
          title: "progress with purpose",
          subtitle: "",
          mediaType: 'video',
          mediaUrl: 'I7hK1Ofd2_4', // YouTube ID
          cta: { text: "Learn More", link: "/company/c1"},
          companyId: 'c1',
          videoDetails: {
            title: 'Navya Shree',
            subtitle: 'UX Lead'
          }
        }
      ]
  },
  companyLanding: {
    contentBlocks: [
      { 
        type: 'hero', 
        eyebrow: 'TALENT DECODED',
        title: "Decode India's largest talent pool with the power of ✨ <strong>AI</strong>",
        features: [
            { icon: 'UsersIcon', text: '10 crore+ registered jobseekers for all your talent needs' },
            { icon: 'SparklesIcon', text: 'Most advanced recruitment AI' }
        ],
        cta1: { text: 'Explore our products', url: '/register'},
        backgroundImageUrl: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=2070&auto=format&fit=crop',
        useDarkOverlay: true,
        showIllustration: false,
      },
       { type: 'cta', title: 'Ready to transform your hiring?', subtitle: "Join thousands of companies building their best teams on Job Portal Pro. Post a job today and see the difference.", cta: { text: 'Get Started Free', url: '/register'}}
    ]
  },
  webCompaniesPage: {
    title: 'MNCs actively hiring',
    featuredItems: [{
      title: 'Company Categories',
      items: [
        { id: 'comp-cat-1', name: 'MNCs', countLabel: '150 Companies', link: '#', logoUrls: [] },
        { id: 'comp-cat-2', name: 'Product', countLabel: '200 Companies', link: '#', logoUrls: [] },
      ]
    }]
  },
  globalHeader: {
    id: 'global-header',
    name: 'Main Website Header',
    groups: [
      { title: 'Jobs', links: [{ text: 'IT jobs', url: '/jobs?keywords=IT' }] },
      { title: 'Companies', links: [{ text: 'MNC companies', url: '/companies?category=MNC' }] },
    ]
  },
  globalFooter: {
      id: 'global-footer',
      name: 'Main Website Footer',
      groups: [
        { title: 'Job Seekers', links: [{ text: 'Find Jobs', url: '/jobs' }] },
        { title: 'Recruiters', links: [{ text: 'Post a Job', url: '/company/' }] },
        { title: 'Company', links: [{ text: 'About Us', url: '#' }] },
      ]
  }
};