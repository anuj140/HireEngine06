const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // General Settings
  siteName: {
    type: String,
    default: 'Job Portal'
  },
  siteLogo: {
    type: String,
    default: ''
  },
  siteFavicon: {
    type: String,
    default: ''
  },
  
  // Color Scheme
  colors: {
    primary: {
      type: String,
      default: '#3b82f6'
    },
    secondary: {
      type: String,
      default: '#10b981'
    },
    accent: {
      type: String,
      default: '#f59e0b'
    },
    background: {
      type: String,
      default: '#f9fafb'
    },
    text: {
      type: String,
      default: '#111827'
    }
  },
  
  // Homepage Components
  heroBanner: {
    title: {
      type: String,
      default: 'Find Your Dream Job'
    },
    subtitle: {
      type: String,
      default: 'Thousands of job opportunities waiting for you'
    },
    backgroundImage: String,
    ctaButton: {
      text: {
        type: String,
        default: 'Browse Jobs'
      },
      link: {
        type: String,
        default: '/jobs'
      }
    }
  },
  
  // Feature Cards
  featureCards: [{
    title: String,
    description: String,
    icon: String,
    image: String,
    ctaButton: {
      text: String,
      link: String
    },
    order: Number,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
//   // Testimonials
//   testimonials: [{
//     name: String,
//     position: String,
//     company: String,
//     content: String,
//     avatar: String,
//     rating: {
//       type: Number,
//       min: 1,
//       max: 5

//     },
//     isActive: {
//       type: Boolean,
//       default: true
//     }
//   }],
  
  // Footer Content
  footer: {
    copyrightText: {
      type: String,
      default: '© 2024 Job Portal. All rights reserved.'
    },
    socialLinks: [{
      platform: String,
      icon: String,
      url: String,
      isActive: Boolean
    }],
    quickLinks: [{
      title: String,
      url: String,
      isActive: Boolean
    }],
    contactInfo: {
      email: String,
      phone: String,
      address: String
    }
  },
  
  // SEO Settings
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    ogImage: String
  },
  
  // Other Settings
  contactEmail: String,
  supportEmail: String,
  phoneNumber: String,
  address: String,
  
  // Maintenance Mode
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: String,
  
  // Analytics
  googleAnalyticsId: String,
  facebookPixelId: String,
  
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);