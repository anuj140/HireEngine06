---
description: Fix dark‑mode colors for all cards, sections, and text in the company app
---

// turbo-all
1. Update DashboardStatCard and all card containers in `apps/company/pages/DashboardPage.tsx`
```json
{
  "TargetFile": "c:\\Users\\Admin\\OneDrive\\Desktop\\HireEngine\\apps\\company\\pages\\DashboardPage.tsx",
  "CodeMarkdownLanguage": "tsx",
  "Complexity": 5,
  "Description": "Add dark‑mode classes to DashboardStatCard and all card containers",
  "Instruction": "Replace the existing bg‑white card divs with dark‑mode aware classes.",
  "ReplacementChunks": [
    {
      "StartLine": 17,
      "EndLine": 22,
      "TargetContent": "<div className=\"bg-white p-4 rounded-2xl shadow-sm flex items-center space-x-4 h-full border border-gray-200\">…</div>",
      "ReplacementContent": "<div className=\"bg-white dark:bg-dark-light-background p-4 rounded-2xl shadow-sm flex items-center space-x-4 h-full border border-gray-200 dark:border-dark-border\">\n  <div className=\"bg-blue-100 dark:bg-primary/20 p-3 rounded-full\">{icon}</div>\n  <div>\n    <p className=\"text-2xl font-bold text-dark-gray dark:text-dark-text\">{value}</p>\n    <h4 className=\"text-sm text-gray-600 dark:text-dark-text-secondary\">{title}</h4>\n  </div>\n</div>"
    },
    {
      "StartLine": 260,
      "EndLine": 262,
      "TargetContent": "<div className=\"bg-white p-4 rounded-2xl shadow-sm border border-gray-200\">",
      "ReplacementContent": "<div className=\"bg-white dark:bg-dark-light-background p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border\">"
    },
    {
      "StartLine": 291,
      "EndLine": 293,
      "TargetContent": "<div className=\"bg-white p-4 rounded-2xl shadow-sm border border-gray-200\">",
      "ReplacementContent": "<div className=\"bg-white dark:bg-dark-light-background p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border\">"
    },
    {
      "StartLine": 324,
      "EndLine": 326,
      "TargetContent": "<div className=\"bg-white p-6 rounded-2xl shadow-md border\">",
      "ReplacementContent": "<div className=\"bg-white dark:bg-dark-light-background p-6 rounded-2xl shadow-md border dark:border-dark-border\">"
    },
    {
      "StartLine": 343,
      "EndLine": 345,
      "TargetContent": "<div className=\"bg-white p-6 rounded-2xl shadow-md border\">",
      "ReplacementContent": "<div className=\"bg-white dark:bg-dark-light-background p-6 rounded-2xl shadow-md border dark:border-dark-border\">"
    }
  ]
}
```

2. Update subscription cards in `apps/company/pages/SubscriptionPage.tsx`
```json
{
  "TargetFile": "c:\\Users\\Admin\\OneDrive\\Desktop\\HireEngine\\apps\\company\\pages\\SubscriptionPage.tsx",
  "CodeMarkdownLanguage": "tsx",
  "Complexity": 4,
  "Description": "Add dark‑mode to subscription plan cards",
  "Instruction": "Replace bg‑white containers with dark‑mode aware versions.",
  "ReplacementChunks": [
    {
      "StartLine": 94,
      "EndLine": 96,
      "TargetContent": "<div className=\"bg-white p-6 rounded-2xl shadow-sm border-2 border-primary/20\">",
      "ReplacementContent": "<div className=\"bg-white dark:bg-dark-light-background p-6 rounded-2xl shadow-sm border-2 border-primary/20 dark:border-dark-border\">"
    },
    {
      "StartLine": 144,
      "EndLine": 147,
      "TargetContent": "<div className={`relative bg-white rounded-2xl shadow-sm border-2 ...`}>",
      "ReplacementContent": "<div className={`relative bg-white dark:bg-dark-light-background rounded-2xl shadow-sm border-2 ... dark:border-dark-border`}>"
    }
  ]
}
```

3. Update team page cards in `apps/company/pages/TeamPage.tsx`
```json
{
  "TargetFile": "c:\\Users\\Admin\\OneDrive\\Desktop\\HireEngine\\apps\\company\\pages\\TeamPage.tsx",
  "CodeMarkdownLanguage": "tsx",
  "Complexity": 4,
  "Description": "Add dark‑mode to team cards and tables",
  "Instruction": "Replace each bg‑white container with dark‑mode aware classes.",
  "ReplacementChunks": [
    {
      "StartLine": 98,
      "EndLine": 100,
      "TargetContent": "<div className=\"bg-white rounded-xl shadow-sm border p-4\">",
      "ReplacementContent": "<div className=\"bg-white dark:bg-dark-light-background rounded-xl shadow-sm border p-4 dark:border-dark-border\">"
    },
    {
      "StartLine": 263,
      "EndLine": 265,
      "TargetContent": "<div className=\"bg-white rounded-lg w-full max-w-lg\">",
      "ReplacementContent": "<div className=\"bg-white dark:bg-dark-light-background rounded-lg w-full max-w-lg\">"
    },
    {
      "StartLine": 334,
      "EndLine": 336,
      "TargetContent": "<div className=\"bg-white rounded-lg w-full max-w-md\">",
      "ReplacementContent": "<div className=\"bg-white dark:bg-dark-light-background rounded-lg w-full max-w-md\">"
    }
  ]
}
```

4. Update payment page container in `apps/company/pages/PaymentPage.tsx`
```json
{
  "TargetFile": "c:\\Users\\Admin\\OneDrive\\Desktop\\HireEngine\\apps\\company\\pages\\PaymentPage.tsx",
  "CodeMarkdownLanguage": "tsx",
  "Complexity": 3,
  "Description": "Add dark‑mode to payment wrapper",
  "Instruction": "Replace the bg‑white wrapper with dark‑mode aware classes.",
  "ReplacementChunks": [
    {
      "StartLine": 178,
      "EndLine": 180,
      "TargetContent": "<div className=\"bg-white rounded-2xl shadow-lg overflow-hidden\">",
      "ReplacementContent": "<div className=\"bg-white dark:bg-dark-light-background rounded-2xl shadow-lg overflow-hidden\">"
    }
  ]
}
```

5. Update recruiter company profile cards in `apps/company/pages/RecruiterCompanyProfilePage.tsx`
```json
{
  "TargetFile": "c:\\Users\\Admin\\OneDrive\\Desktop\\HireEngine\\apps\\company\\pages\\RecruiterCompanyProfilePage.tsx",
  "CodeMarkdownLanguage": "tsx",
  "Complexity": 5,
  "Description": "Add dark‑mode to profile sections and leader cards",
  "Instruction": "Replace each bg‑white container with dark‑mode aware classes.",
  "ReplacementChunks": [
    {
      "StartLine": 34,
      "EndLine": 36,
      "TargetContent": "<div className=\"bg-white p-6 rounded-xl shadow-sm border\">",
      "ReplacementContent": "<div className=\"bg-white dark:bg-dark-light-background p-6 rounded-xl shadow-sm border dark:border-dark-border\">"
    },
    {
      "StartLine": 188,
      "EndLine": 190,
      "TargetContent": "<div className=\"text-center p-8 bg-white rounded-lg shadow-sm\">",
      "ReplacementContent": "<div className=\"text-center p-8 bg-white dark:bg-dark-light-background rounded-lg shadow-sm\">"
    },
    {
      "StartLine": 192,
      "EndLine": 194,
      "TargetContent": "<div className=\"bg-white p-6 rounded-2xl shadow-sm border flex items-start space-x-6\">",
      "ReplacementContent": "<div className=\"bg-white dark:bg-dark-light-background p-6 rounded-2xl shadow-sm border flex items-start space-x-6 dark:border-dark-border\">"
    },
    {
      "StartLine": 256,
      "EndLine": 259,
      "TargetContent": "<h1 className=\"text-2xl font-bold text-dark-gray\">Editing Company Profile\</h1>",
      "ReplacementContent": "<h1 className=\"text-2xl font-bold text-dark-gray dark:text-dark-text\">Editing Company Profile\</h1>"
    },
    {
      "StartLine": 246,
      "EndLine": 259,
      "TargetContent": "<h4 className=\"font-bold text-sm text-dark-gray\">{leader.name}\</h4>",
      "ReplacementContent": "<h4 className=\"font-bold text-sm text-dark-gray dark:text-dark-text\">{leader.name}\</h4>"
    }
  ]
}
```

6. Apply generic dark‑mode to any remaining `bg-white` containers across the app (optional sweep). This step is left for future maintenance.

---

*Running this workflow will automatically apply the above replacements, bringing all cards, sections, and text into full dark‑mode harmony.*
