const mongoose = require("mongoose");
const EmailTemplate = require("../models/EmailTemplate");
require("dotenv").config();

// Default templates to seed
const DEFAULT_TEMPLATES = [
  {
    name: "broadcast_notification",
    subject: "{{title}} - Job Portal",
    body: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .content { padding: 30px; background: #f9f9f9; }
        .message-box { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; margin-top: 20px; }
        .btn { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .btn:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 24px;">{{title}}</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Job Portal Notification</p>
    </div>
    
    <div class="content">
        <div class="message-box">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hello {{name}},
            </p>
            
            <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <p style="margin: 0; font-size: 15px; color: #4b5563;">
                    {{message}}
                </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">
                This is an automated message from Job Portal.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="{{siteUrl}}" class="btn">Visit Job Portal</a>
            </div>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">
                © ${new Date().getFullYear()} Job Portal. All rights reserved.<br>
                <small>If you no longer wish to receive these notifications, please update your notification preferences in your account settings.</small>
            </p>
        </div>
    </div>
</body>
</html>
    `,
    description: "Default template for broadcast notifications"
  },
  {
    name: "welcome_email",
    subject: "Welcome to Job Portal, {{name}}!",
    body: `
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Similar structure as above */
    </style>
</head>
<body>
    <div style="text-align: center; padding: 30px;">
        <h1>Welcome {{name}}!</h1>
        <p>Thank you for joining Job Portal...</p>
    </div>
</body>
</html>
    `,
    description: "Welcome email for new users"
  }
];

const seedTemplates = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/jobportal");
    console.log("✅ Connected to MongoDB");
    
    const adminUserId = "YOUR_ADMIN_USER_ID"; // Replace with actual admin ID
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const templateData of DEFAULT_TEMPLATES) {
      // Check if template already exists
      const existingTemplate = await EmailTemplate.findOne({ 
        name: templateData.name 
      });
      
      if (existingTemplate) {
        // Update existing template
        existingTemplate.subject = templateData.subject;
        existingTemplate.body = templateData.body;
        existingTemplate.updatedBy = adminUserId;
        await existingTemplate.save();
        updatedCount++;
        console.log(`🔄 Updated template: ${templateData.name}`);
      } else {
        // Create new template
        await EmailTemplate.create({
          ...templateData,
          createdBy: adminUserId,
          updatedBy: adminUserId
        });
        createdCount++;
        console.log(`✅ Created template: ${templateData.name}`);
      }
    }
    
    console.log(`\n🎉 Seeding completed!`);
    console.log(`📊 Created: ${createdCount}, Updated: ${updatedCount}`);
    
    // List all templates
    const allTemplates = await EmailTemplate.find({}, 'name description');
    console.log("\n📋 Available templates:");
    allTemplates.forEach(tpl => {
      console.log(`  • ${tpl.name} - ${tpl.description || 'No description'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedTemplates();
}

module.exports = seedTemplates;