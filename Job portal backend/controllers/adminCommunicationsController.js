// Mock broadcasts data
const mockBroadcasts = [
    {
        id: '1',
        name: 'Welcome Campaign',
        subject: 'Welcome to Job Portal Pro!',
        message: 'Thank you for joining our platform...',
        audience: 'All Users',
        channels: ['email', 'notification'],
        status: 'Sent',
        sentDate: '2024-01-15',
        openRate: '45.2%',
        clickRate: '12.3%'
    },
    {
        id: '2',
        name: 'New Features Announcement',
        subject: 'Check out our latest features',
        message: 'We have exciting new features...',
        audience: 'Active Users',
        channels: ['notification'],
        status: 'Sent',
        sentDate: '2024-01-20',
        openRate: '38.7%',
        clickRate: '9.1%'
    }
];

// Get all broadcasts
exports.getBroadcasts = async (req, res) => {
    try {
        // In a real app, fetch from database
        // const broadcasts = await Broadcast.find().sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: mockBroadcasts });
    } catch (error) {
        console.error('Error fetching broadcasts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch broadcasts' });
    }
};

// Create a new broadcast
exports.createBroadcast = async (req, res) => {
    try {
        const { name, subject, message, audience, channels, status } = req.body;

        // In a real app, save to database
        // const broadcast = await Broadcast.create({ ...req.body, createdBy: req.user.id });

        const newBroadcast = {
            id: Date.now().toString(),
            name,
            subject,
            message,
            audience,
            channels,
            status: status || 'Draft',
            sentDate: status === 'Sent' ? new Date().toISOString().split('T')[0] : null,
            openRate: '0%',
            clickRate: '0%'
        };

        mockBroadcasts.unshift(newBroadcast);

        res.status(201).json({ success: true, data: newBroadcast });
    } catch (error) {
        console.error('Error creating broadcast:', error);
        res.status(500).json({ success: false, message: 'Failed to create broadcast' });
    }
};
