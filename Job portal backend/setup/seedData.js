
const Cms = require('../models/Cms');
const Broadcast = require('../models/Broadcast');
const SubscriptionPlan = require('../models/SubscriptionPlanSchema');

// Mock data for seeding
const MOCK_CMS_CONTENT = {
  webPublicHome: {
    banners: [
      {
        id: 'banner-hero-1',
        name: "Public Homepage Hero",
        placement: 'web-public-home',
        title: "Find your dream job now",
        subtitle: "2 Lakh+ jobs for you to explore",
        mediaType: 'image',
        backgroundImageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070',
        cta: { text: "Search Jobs", link: "/jobs" },
        useDarkOverlay: false,
        showIllustration: true,
      },
    ],
    cards: [],
    featuredItems: []
  }
};

const seedData = async () => {
  try {
    // Seed CMS
    if (await Cms.countDocuments() === 0) {
      console.log('Seeding CMS content...');
      await new Cms({ content: MOCK_CMS_CONTENT, singleton: "cms-content" }).save();
      console.log('✅ CMS content seeded.');
    }

    // Seed Plans
    if (await SubscriptionPlan.countDocuments() === 0) {
      console.log('Seeding subscription plans...');
      await SubscriptionPlan.seedDefaultPlans();
      console.log('✅ Subscription plans seeded.');
    }

    // Seed Email Templates
    const EmailTemplate = require('../models/EmailTemplate');
    if (await EmailTemplate.countDocuments({ name: 'forgot_password' }) === 0) {
      console.log('Seeding forgot_password email template...');
      await new EmailTemplate({
        name: 'forgot_password',
        subject: 'Reset Your Password',
        body: '<p>Hi {{name}},</p><p>You requested to reset your password.</p><p>Please click the link below to reset it:</p><a href="{{link}}">Reset Password</a><p>If you did not request this, please ignore this email.</p>',
        createdBy: null,
        updatedBy: null
      }).save();
      console.log('✅ forgot_password template seeded.');
    }

  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = seedData;
