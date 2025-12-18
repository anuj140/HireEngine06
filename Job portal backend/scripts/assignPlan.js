// scripts/assignPlan.js
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const SubscriptionPlan = require('../models/SubscriptionPlanSchema');
const Subscription = require('../models/Subcription');
const Recruiter = require('../models/Recruiter');
const RecruiterRequest = require('../models/RecruiterRequest');

/**
 * Connect to MongoDB database
 */
async function connectDB() {
  try {
    // Load environment variables
    const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hireengine';
    
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log('✅ Connected to MongoDB');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDB() {
  try {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
  }
}

/**
 * Assign a subscription plan to a recruiter
 * @param {string} recruiterIdentifier - Email, phone, or ID of the recruiter
 * @param {string} planName - Name of the subscription plan (free, standard_999, pro_2499, standard_4999)
 * @param {Object} options - Additional options
 */
async function assignPlanToRecruiter(
  recruiterIdentifier,
  planName,
  options = {}
) {
  let isConnected = false;
  
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
      isConnected = true;
    }
    
    console.log('🔍 Looking for recruiter:', recruiterIdentifier);
    
    // Find the recruiter by email, phone, or ID
    let recruiter;
    
    // Try by ID first
    if (mongoose.Types.ObjectId.isValid(recruiterIdentifier)) {
      console.log(`   Searching by ID...`);
      recruiter = await Recruiter.findById(recruiterIdentifier);
    }
    
    // Try by email if not found by ID
    if (!recruiter) {
      console.log(`   Searching by email...`);
      recruiter = await Recruiter.findOne({ email: recruiterIdentifier });
    }
    
    // Try by phone if not found by email
    if (!recruiter) {
      console.log(`   Searching by phone...`);
      recruiter = await Recruiter.findOne({ phone: recruiterIdentifier });
    }
    
    // Check if recruiter exists in RecruiterRequest (pending approval)
    if (!recruiter) {
      console.log(`   Checking pending requests...`);
      const recruiterRequest = await RecruiterRequest.findOne({
        $or: [
          { email: recruiterIdentifier },
          { phone: recruiterIdentifier },
          { _id: mongoose.Types.ObjectId.isValid(recruiterIdentifier) ? recruiterIdentifier : null }
        ]
      });
      
      if (recruiterRequest) {
        console.warn('⚠️  Recruiter found in pending requests, not yet approved.');
        console.warn('   Please approve the recruiter request first before assigning a subscription.');
        throw new Error(`Recruiter ${recruiterIdentifier} is pending approval. Approve them first.`);
      }
    }
    
    if (!recruiter) {
      throw new Error(`Recruiter not found: ${recruiterIdentifier}. Check email, phone, or ID.`);
    }

    console.log(`✅ Found recruiter: ${recruiter.name} (${recruiter.email})`);

    // Find the subscription plan
    console.log(`🔍 Looking for plan: ${planName}`);
    const plan = await SubscriptionPlan.findOne({ 
      name: planName,
      isActive: true 
    });
    
    if (!plan) {
      // Try case-insensitive search
      const allPlans = await SubscriptionPlan.find({ isActive: true });
      const matchingPlan = allPlans.find(p => 
        p.name.toLowerCase() === planName.toLowerCase() ||
        p.displayName.toLowerCase().includes(planName.toLowerCase())
      );
      
      if (matchingPlan) {
        console.log(`ℹ️  Found plan by approximate match: ${matchingPlan.name} (${matchingPlan.displayName})`);
        planName = matchingPlan.name; // Use the correct plan name
      } else {
        console.log('📋 Available plans:');
        allPlans.forEach(p => {
          console.log(`  - ${p.name} (${p.displayName}): ₹${p.price}/month`);
        });
        throw new Error(`Subscription plan "${planName}" not found or inactive. Available plans shown above.`);
      }
    }

    console.log(`✅ Found plan: ${plan.displayName} (₹${plan.price})`);

    // Calculate dates
    const startDate = new Date();
    const planDurationDays = plan.duration || 30;
    const customDurationDays = options.durationMonths ? options.durationMonths * 30 : null;
    const durationDays = customDurationDays || planDurationDays;
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    // Check for existing active subscriptions
    const existingActiveSubs = await Subscription.find({
      recruiterId: recruiter._id,
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('plan');

    if (existingActiveSubs.length > 0) {
      console.warn(`⚠️  Recruiter has ${existingActiveSubs.length} active subscription(s):`);
      existingActiveSubs.forEach((sub, index) => {
        console.log(`   ${index + 1}. ${sub.plan.displayName} - Expires: ${sub.endDate.toDateString()} (ID: ${sub._id})`);
      });

      if (options.deactivateOld !== false) {
        console.log('📝 Deactivating old active subscriptions...');
        for (const sub of existingActiveSubs) {
          sub.status = 'cancelled';
          sub.cancellation = {
            cancelledAt: new Date(),
            cancelledBy: null, // System/admin
            reason: 'Replaced by new subscription assignment'
          };
          await sub.save();
          console.log(`   ✓ Deactivated subscription: ${sub._id}`);
        }
      } else {
        console.log('ℹ️  Keeping old subscriptions active (deactivateOld option is false)');
      }
    }

    // Create new subscription
    console.log('📝 Creating new subscription...');
    const subscription = new Subscription({
      recruiterId: recruiter._id,
      plan: plan._id,
      status: 'active',
      startDate: startDate,
      endDate: endDate,
      autoRenew: options.autoRenew || false,
      payment: {
        amount: plan.price,
        currency: plan.currency || 'INR',
        paymentMethod: options.paymentMethod || 'manual_assignment',
        transactionId: options.transactionId || `MANUAL-${Date.now()}`,
        paymentStatus: 'completed',
        paidAt: new Date()
      },
      usage: {
        jobsPosted: 0,
        activeJobs: 0,
        totalApplications: 0,
        teamMembersAdded: 0,
        managersAdded: 0
      },
      invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      notes: `Plan assigned manually via script on ${new Date().toISOString()}. Plan: ${plan.displayName}`
    });

    await subscription.save();
    
    // Update recruiter's subscription field for backward compatibility
    const planTypeMap = {
      'free': 'free',
      'standard_999': 'standard',
      'pro_2499': 'pro',
      'standard_4999': 'pro_max'
    };
    
    recruiter.subscription = {
      plan: planTypeMap[plan.name] || 'free',
      jobPostLimit: plan.features.maxActiveJobs || 3,
      jobsPostedThisMonth: 0,
      renewDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      premiumExpires: endDate,
      isPremiumActive: plan.name !== 'free'
    };
    
    await recruiter.save();
    
    console.log('\n🎉 SUBSCRIPTION ASSIGNED SUCCESSFULLY!');
    console.log('========================================');
    console.log(`👤 Recruiter: ${recruiter.name}`);
    console.log(`   Email: ${recruiter.email}`);
    console.log(`   Phone: ${recruiter.phone}`);
    console.log('----------------------------------------');
    console.log(`📋 Plan: ${plan.displayName}`);
    console.log(`   Price: ₹${plan.price}`);
    console.log(`   Features:`);
    console.log(`     • Max Active Jobs: ${plan.features.maxActiveJobs || 'Unlimited'}`);
    console.log(`     • Job Validity: ${plan.features.jobValidityDays} days`);
    console.log(`     • Team Members: ${plan.features.maxTeamMembers}`);
    console.log(`     • Managers: ${plan.features.maxManagers}`);
    console.log('----------------------------------------');
    console.log(`📅 Subscription Details:`);
    console.log(`   Start Date: ${startDate.toDateString()}`);
    console.log(`   End Date: ${endDate.toDateString()}`);
    console.log(`   Duration: ${durationDays} days`);
    console.log(`   Auto-renew: ${subscription.autoRenew ? 'Yes' : 'No'}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Invoice: ${subscription.invoiceNumber}`);
    console.log('----------------------------------------');
    console.log(`🔗 IDs:`);
    console.log(`   Subscription ID: ${subscription._id}`);
    console.log(`   Recruiter ID: ${recruiter._id}`);
    console.log(`   Plan ID: ${plan._id}`);
    console.log('========================================\n');

    // Return the created subscription
    return {
      subscription,
      recruiter,
      plan
    };

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    throw error;
  } finally {
    // Disconnect only if we connected in this function
    if (isConnected) {
      await disconnectDB();
    }
  }
}

/**
 * List all available plans
 */
async function listAvailablePlans() {
  let isConnected = false;
  
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
      isConnected = true;
    }
    
    const plans = await SubscriptionPlan.find({ isActive: true }).sort('popularityRank');
    
    console.log('\n📋 AVAILABLE SUBSCRIPTION PLANS');
    console.log('========================================');
    plans.forEach(plan => {
      console.log(`\n${plan.displayName} (${plan.name}):`);
      console.log(`  Price: ₹${plan.price}/${plan.duration} days`);
      console.log(`  Features:`);
      console.log(`    • Max Active Jobs: ${plan.features.maxActiveJobs || 'Unlimited'}`);
      console.log(`    • Job Validity: ${plan.features.jobValidityDays} days`);
      console.log(`    • Team Members: ${plan.features.maxTeamMembers}`);
      console.log(`    • Managers: ${plan.features.maxManagers}`);
      console.log(`    • Description Length: ${plan.features.maxDescriptionLength || 'Unlimited'} chars`);
      console.log(`  Description: ${plan.description}`);
    });
    console.log('========================================\n');
    
    return plans;
  } catch (error) {
    console.error('❌ Error listing plans:', error.message);
    throw error;
  } finally {
    if (isConnected) {
      await disconnectDB();
    }
  }
}

/**
 * List recruiters (paginated)
 */
async function listRecruiters(page = 1, limit = 10) {
  let isConnected = false;
  
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
      isConnected = true;
    }
    
    const skip = (page - 1) * limit;
    const recruiters = await Recruiter.find()
      .skip(skip)
      .limit(limit)
      .select('name email phone companyName subscription.plan isActive')
      .sort('createdAt');
    
    const total = await Recruiter.countDocuments();
    
    console.log(`\n👥 RECRUITERS (Page ${page} of ${Math.ceil(total/limit)})`);
    console.log('========================================');
    recruiters.forEach((recruiter, index) => {
      const activeStatus = recruiter.isActive ? '✅' : '❌';
      console.log(`${index + 1}. ${recruiter.name} ${activeStatus}`);
      console.log(`   Email: ${recruiter.email}`);
      console.log(`   Phone: ${recruiter.phone}`);
      console.log(`   Company: ${recruiter.companyName}`);
      console.log(`   Current Plan: ${recruiter.subscription?.plan || 'free'}`);
      console.log('   ---');
    });
    console.log(`Total: ${total} recruiters`);
    console.log('========================================\n');
    
    return { recruiters, total, page, totalPages: Math.ceil(total/limit) };
  } catch (error) {
    console.error('❌ Error listing recruiters:', error.message);
    throw error;
  } finally {
    if (isConnected) {
      await disconnectDB();
    }
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    await connectDB();
    
    // Test models
    const recruiterCount = await Recruiter.countDocuments();
    const planCount = await SubscriptionPlan.countDocuments();
    
    console.log('\n✅ Connection test successful!');
    console.log(`📊 Recruiters in database: ${recruiterCount}`);
    console.log(`📊 Subscription plans in database: ${planCount}`);
    
    await disconnectDB();
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

/**
 * Main function - handles command line arguments
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📋 SUBSCRIPTION ASSIGNMENT SCRIPT
========================================
Usage:
  node scripts/assignPlan.js <command> [options]

Commands:
  assign <recruiter> <plan> [options]  Assign a plan to a recruiter
  list-plans                           List all available plans
  list-recruiters [page] [limit]       List recruiters (paginated)
  test-connection                      Test database connection

Options for assign command:
  --auto-renew true/false             Enable auto-renew (default: false)
  --duration-months N                 Custom duration in months
  --payment-method "method"           Payment method used
  --transaction-id "id"               Transaction ID
  --keep-old                          Keep old subscriptions active
  
Examples:
  node scripts/assignPlan.js assign recruiter@example.com standard_999
  node scripts/assignPlan.js assign "631a1b2c3d4e5f6a7b8c9d0a" pro_2499 --auto-renew true
  node scripts/assignPlan.js assign "+919876543210" standard_4999 --duration-months 6
  node scripts/assignPlan.js list-plans
  node scripts/assignPlan.js list-recruiters 1 20
  node scripts/assignPlan.js test-connection
    `);
    return;
  }

  if (args.length === 0) {
    console.log('❌ No command provided. Use --help for usage information.');
    return;
  }

  const command = args[0];

  switch (command) {
    case 'assign':
      if (args.length < 3) {
        console.log('❌ Missing arguments for assign command.');
        console.log('   Usage: node scripts/assignPlan.js assign <recruiter> <plan> [options]');
        return;
      }
      
      const recruiterIdentifier = args[1];
      const planName = args[2];
      
      // Parse options
      const options = {};
      for (let i = 3; i < args.length; i++) {
        if (args[i] === '--auto-renew') {
          options.autoRenew = args[i + 1] === 'true';
          i++;
        } else if (args[i] === '--duration-months') {
          options.durationMonths = parseInt(args[i + 1]);
          i++;
        } else if (args[i] === '--payment-method') {
          options.paymentMethod = args[i + 1];
          i++;
        } else if (args[i] === '--transaction-id') {
          options.transactionId = args[i + 1];
          i++;
        } else if (args[i] === '--keep-old') {
          options.deactivateOld = false;
        }
      }
      
      await assignPlanToRecruiter(recruiterIdentifier, planName, options);
      break;
      
    case 'list-plans':
      await listAvailablePlans();
      break;
      
    case 'list-recruiters':
      const page = parseInt(args[1]) || 1;
      const limit = parseInt(args[2]) || 10;
      await listRecruiters(page, limit);
      break;
      
    case 'test-connection':
      await testConnection();
      break;
      
    default:
      console.log(`❌ Unknown command: ${command}`);
      console.log('   Use --help for available commands.');
  }
}

// Run the script if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

// Export functions for use in other modules
module.exports = {
  assignPlanToRecruiter,
  listAvailablePlans,
  listRecruiters,
  testConnection
};




