// Mock CMS Content Data
const MOCK_CMS_CONTENT = {
    webPublicHome: {
        banners: [
            {
                name: "Hero Banner",
                title: "Find Your <span class='text-primary'>Dream Job</span> Today",
                subtitle: "Connect with top companies and discover opportunities that match your skills",
                eyebrow: "Job Portal Pro",
                cta: { text: "Get Started", link: "/register" },
                backgroundImageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&h=600&fit=crop",
                useDarkOverlay: true,
                showIllustration: true
            }
        ],
        cards: [],
        featuredItems: []
    },
    companyLanding: {
        banners: [
            {
                name: "Company Hero",
                title: "Hire the <span class='text-accent'>Best Talent</span>",
                subtitle: "Post jobs, manage applications, and build your dream team",
                eyebrow: "For Employers",
                cta: { text: "Start Hiring", link: "/company/register" },
                backgroundImageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&h=600&fit=crop",
                useDarkOverlay: true,
                showIllustration: false
            }
        ],
        cards: [],
        featuredItems: []
    },
    globalHeader: {
        logo: {
            text: "Job Portal Pro",
            imageUrl: "",
            link: "/"
        },
        links: [
            { text: "Jobs", link: "/jobs", icon: "briefcase" },
            { text: "Companies", link: "/companies", icon: "building" },
            { text: "About", link: "/about", icon: "info" }
        ]
    },
    globalFooter: {
        logo: {
            text: "Job Portal Pro",
            imageUrl: "",
            link: "/"
        },
        links: [
            { text: "About Us", link: "/about" },
            { text: "Contact", link: "/contact" },
            { text: "Privacy Policy", link: "/privacy" },
            { text: "Terms of Service", link: "/terms" }
        ],
        socialLinks: {
            facebook: "https://facebook.com",
            twitter: "https://twitter.com",
            linkedin: "https://linkedin.com",
            instagram: "https://instagram.com"
        },
        copyrightText: "© 2024 Job Portal Pro. All rights reserved."
    }
};

module.exports = {
    MOCK_CMS_CONTENT
};
