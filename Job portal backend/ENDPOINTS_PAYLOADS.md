admin panel

api/v1/admin/users/69218d385603351eefcd3cfa/details -- Get specific user details include both user and company (recruiter)

Response:-
{
    "success": true,
    "user": {
        "_id": "69218d385603351eefcd3cfa",
        "name": "Test Recruiter",
        "email": "company@example.com",
        "phone": "9876543210",
        "role": "recruiter",
        "isActive": true,
        "company": "Test Company",
        "profile": {
            "headline": "",
            "profileSummary": "",
            "location": "",
            "phone": "9876543210"
        },
        "appliedJobs": [],
        "bookmarks": [],
        "recruiterProfile": {
            "companyName": "Test Company",
            "verificationStatus": "pending"
        },
        "adminNotes": "",
        "warnings": [],
        "createdAt": "2025-11-22T10:15:20.610Z",
        "updatedAt": "2025-11-22T10:15:20.610Z"
    },
    "activity": {
        "applications": 0,
        "savedJobs": 0,
        "profileViews": 0,
        "interviews": 0
    },
    "reports": [],
    "adminNotes": "",
    "loginHistory": []
}


URL: api/v1/admin/companies/692423c522cba2c937a539e6 -- Get company details page [GET]
Response:-
{
    "success": true,
    "data": {
        "id": "692423c522cba2c937a539e6",
        "name": "HR Happy",
        "industry": "Robotics & AI",
        "website": "www.starkindustry2.0.com",
        "location": "Manhatten, New York",
        "registrationDate": "2025-11-24T09:22:13.038Z",
        "lastLogin": "2025-12-02T09:09:25.301Z",
        "plan": "Free",
        "verificationStatus": "Verified",
        "accountStatus": "Active",
        "contact": {
            "name": "HR  Pepper Potts",
            "email": "stark.industry@tony.com",
            "phone": "+9199123456789"
        },
        "jobs": {
            "active": 1,
            "pending": 0,
            "expired": 0
        },
        "applicationsReceived": 0,
        "flaggedJobs": 0,
        "pendingDocuments": null,
        "metrics": {
            "profileViews": 0,
            "loginFrequency": "Monthly",
            "responseRate": 0,
            "loginStreak": 0
        }
    }
}


URL:- api/v1/admin/companies/692423c522cba2c937a539e6 -- Update company details [PUT]
payload (json):-
{
    "name":"HR Happy",
    "industry":"Robotics & AI",
     "website":"www.starkindustry2.0.com",
     "location":"Manhatten, New York"
}

Response:-
{
    "success": true,
    "message": "Company updated successfully",
    "data": {
        "id": "692423c522cba2c937a539e6",
        "updatedFields": [
            "name",
            "industry",
            "website",
            "location"
        ],
        "updatedAt": "2025-12-02T08:42:56.126Z"
    }
}


URL: {{URL}}/admin/companies/6900a8e4a314054d33acb7ab/jobs -- Get specific company all jobs [GET]
Response: -
{
    "success": true,
    "data": {
        "company": {
            "id": "6900a8e4a314054d33acb7ab",
            "name": "Tech Solutions Pvt Ltd"
        },
        "jobs": [
            {
                "id": "691ae62a58bc4512b67c7631",
                "title": "SQL Engineer ",
                "status": "active",
                "applicantsCount": 1,
                "postedDate": "2025-11-17T09:08:58.398Z",
                "companyId": "6900a8e4a314054d33acb7ab",
                "department": "IT",
                "location": "Pune,Maharashtra",
                "salaryRange": {
                    "min": 400000,
                    "max": 480000,
                    "currency": "USD"
                }
            },
            {
                "id": "6918110a17532a56a4f4f1ea",
                "title": "Job 4 -- The Boring company",
                "status": "active",
                "applicantsCount": 1,
                "postedDate": "2025-11-15T05:35:06.192Z",
                "companyId": "6900a8e4a314054d33acb7ab",
                "department": null,
                "location": "Remote",
                "salaryRange": {
                    "min": 100000,
                    "max": 120000,
                    "currency": "USD"
                }
            },
            {
                "id": "691810ff17532a56a4f4f1e2",
                "title": "Job 3 -- The Boring company",
                "status": "active",
                "applicantsCount": 1,
                "postedDate": "2025-11-15T05:34:55.675Z",
                "companyId": "6900a8e4a314054d33acb7ab",
                "department": null,
                "location": "Remote",
                "salaryRange": {
                    "min": 100000,
                    "max": 120000,
                    "currency": "USD"
                }
            },
            {
                "id": "691810ee17532a56a4f4f1da",
                "title": "Job 2 -- The Boring company",
                "status": "active",
                "applicantsCount": 0,
                "postedDate": "2025-11-15T05:34:38.207Z",
                "companyId": "6900a8e4a314054d33acb7ab",
                "department": null,
                "location": "Remote",
                "salaryRange": {
                    "min": 100000,
                    "max": 120000,
                    "currency": "USD"
                }
            },
            {
                "id": "69180b533c327bed629352c1",
                "title": "Job 1 -- The Boring company",
                "status": "active",
                "applicantsCount": 0,
                "postedDate": "2025-11-15T05:10:43.413Z",
                "companyId": "6900a8e4a314054d33acb7ab",
                "department": null,
                "location": "Remote",
                "salaryRange": {
                    "min": 100000,
                    "max": 120000,
                    "currency": "USD"
                }
            },
            {
                "id": "6911a998cb09364ea930a263",
                "title": "Java Developer",
                "status": "active",
                "applicantsCount": 2,
                "postedDate": "2025-11-10T09:00:08.113Z",
                "companyId": "6900a8e4a314054d33acb7ab",
                "department": "Computer Science",
                "location": "pune, hydrabad, benguluru",
                "salaryRange": {
                    "min": 100000,
                    "max": 120000,
                    "currency": "USD"
                }
            },
            {
                "id": "690f11e818a58bcb1b71a69b",
                "title": "Digital Marketing Executive 105",
                "status": "active",
                "applicantsCount": 0,
                "postedDate": "2025-11-08T09:48:24.852Z",
                "companyId": "6900a8e4a314054d33acb7ab",
                "department": null,
                "location": "Delhi",
                "salaryRange": {
                    "min": 350000,
                    "max": 420000,
                    "currency": "USD"
                }
            },
            {
                "id": "690f11e818a58bcb1b71a698",
                "title": "Backend Engineer 102",
                "status": "active",
                "applicantsCount": 1,
                "postedDate": "2025-11-08T09:48:24.852Z",
                "companyId": "6900a8e4a314054d33acb7ab",
                "department": null,
                "location": "Bangalore",
                "salaryRange": {
                    "min": 900000,
                    "max": 1080000,
                    "currency": "USD"
                }
            },
            {
                "id": "690f11e818a58bcb1b71a69c",
                "title": "Go Developer 106",
                "status": "active",
                "applicantsCount": 0,
                "postedDate": "2025-11-08T09:48:24.852Z",
                "companyId": "6900a8e4a314054d33acb7ab",
                "department": null,
                "location": "Delhi",
                "salaryRange": {
                    "min": 350000,
                    "max": 420000,
                    "currency": "USD"
                }
            },
            {
                "id": "690f11e818a58bcb1b71a699",
                "title": "UI/UX Designer 104",
                "status": "active",
                "applicantsCount": 0,
                "postedDate": "2025-11-08T09:48:24.852Z",
                "companyId": "6900a8e4a314054d33acb7ab",
                "department": "Computer Science",
                "location": "Mumbai",
                "salaryRange": {
                    "min": 400000,
                    "max": 480000,
                    "currency": "USD"
                }
            }
        ],
        "pagination": {
            "total": 12,
            "page": 1,
            "limit": 10,
            "totalPages": 2
        }
    }
}

URL: {{URL}}/admin/companies/6900a8e4a314054d33acb7ab/analytics - Get specific company analytics of past 6 month [GET]
Response:- 
{
    "success": true,
    "data": {
        "jobPostingTrends": {
            "period": "monthly",
            "data": [
                {
                    "period": "Jan",
                    "active": 0,
                    "pending": 0,
                    "expired": 0
                },
                {
                    "period": "Feb",
                    "active": 0,
                    "pending": 0,
                    "expired": 0
                },
                {
                    "period": "Mar",
                    "active": 0,
                    "pending": 0,
                    "expired": 0
                },
                {
                    "period": "Apr",
                    "active": 0,
                    "pending": 0,
                    "expired": 0
                },
                {
                    "period": "May",
                    "active": 0,
                    "pending": 0,
                    "expired": 0
                },
                {
                    "period": "Jun",
                    "active": 0,
                    "pending": 0,
                    "expired": 0
                },
                {
                    "period": "Jul",
                    "active": 0,
                    "pending": 0,
                    "expired": 0
                },
                {
                    "period": "Aug",
                    "active": 0,
                    "pending": 0,
                    "expired": 0
                },
                {
                    "period": "Sept",
                    "active": 0,
                    "pending": 0,
                    "expired": 0
                },
                {
                    "period": "Oct",
                    "active": 0,
                    "pending": 0,
                    "expired": 0
                },
                {
                    "period": "Nov",
                    "active": 12,
                    "pending": 10,
                    "expired": 0
                },
                {
                    "period": "Dec",
                    "active": 0,
                    "pending": 0,
                    "expired": 0
                }
            ]
        },
        "applicationsTrends": {
            "data": [
                {
                    "period": "Jan",
                    "applications": 0
                },
                {
                    "period": "Feb",
                    "applications": 0
                },
                {
                    "period": "Mar",
                    "applications": 0
                },
                {
                    "period": "Apr",
                    "applications": 0
                },
                {
                    "period": "May",
                    "applications": 0
                },
                {
                    "period": "Jun",
                    "applications": 0
                },
                {
                    "period": "Jul",
                    "applications": 0
                },
                {
                    "period": "Aug",
                    "applications": 0
                },
                {
                    "period": "Sept",
                    "applications": 0
                },
                {
                    "period": "Oct",
                    "applications": 0
                },
                {
                    "period": "Nov",
                    "applications": 6
                },
                {
                    "period": "Dec",
                    "applications": 0
                }
            ]
        },
        "candidateSources": [
            {
                "source": "Direct Search",
                "value": 2,
                "percentage": 40
            },
            {
                "source": "Recommendation",
                "value": 1,
                "percentage": 30
            },
            {
                "source": "Referral",
                "value": 1,
                "percentage": 20
            },
            {
                "source": "Campaign",
                "value": 0,
                "percentage": 10
            }
        ],
        "jobCategories": [
            {
                "category": "Computer Science",
                "value": 2,
                "percentage": 17
            },
            {
                "category": "Other",
                "value": 9,
                "percentage": 75
            },
            {
                "category": "IT",
                "value": 1,
                "percentage": 8
            }
        ],
        "activityMetrics": {
            "profileViews": 0,
            "loginFrequency": "Monthly",
            "responseRate": 0,
            "flaggedJobs": 0,
            "avgResponseTime": 24
        }
    }
}