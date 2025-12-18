const mongoose = require('mongoose');
const SubscriptionPlan = require('../models/SubscriptionPlanSchema');
require('dotenv').config();

const runSeed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB. Removing old plans and seeding new ones...');

        // Remove plans that are NOT in our new list
        const allowedPlans = ["free", "standard_999", "pro_2499", "standard_4999"];
        await SubscriptionPlan.deleteMany({ name: { $nin: allowedPlans } });
        console.log('Old plans removed.');

        await SubscriptionPlan.seedDefaultPlans();
        console.log('Seeding complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding plans:', error);
        process.exit(1);
    }
};

runSeed();
