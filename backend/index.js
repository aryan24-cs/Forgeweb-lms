import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

import authRoutes from './routes/auth.js';
import leadRoutes from './routes/leads.js';
import clientRoutes from './routes/clients.js';
import projectRoutes from './routes/projects.js';
import paymentRoutes from './routes/payments.js';
import taskRoutes from './routes/tasks.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';
import expenseRoutes from './routes/expenses.js';
import './utils/cron.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: function (origin, callback) {
        // Dynamically allow any origin (helps with Vercel/Netlify deployments)
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
}));
app.use(express.json());

// Ensure Database Connection is Ready Before API Routes (Critical for Vercel Serverless)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Database connecting failed', error: error.message });
    }
});

// Run Seed Logic in background safely
const syncUsers = async () => {
    try {
        await connectDB();
        const initialUsers = [
            { name: 'Admin', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: 'admin' },
            { name: process.env.EMP1_NAME, email: process.env.EMP1_EMAIL, password: process.env.EMP1_PASSWORD, role: 'sales' },
            { name: process.env.EMP2_NAME, email: process.env.EMP2_EMAIL, password: process.env.EMP2_PASSWORD, role: 'sales' },
            { name: process.env.EMP3_NAME, email: process.env.EMP3_EMAIL, password: process.env.EMP3_PASSWORD, role: 'sales' }
        ];

        for (const u of initialUsers) {
            if (!u.email || !u.password || !u.name) continue;
            let userByName = await User.findOne({ name: u.name });
            let userByEmail = await User.findOne({ email: u.email });
            if (userByName) {
                userByName.email = u.email;
                userByName.password = u.password;
                userByName.role = u.role;
                await userByName.save();
            } else if (userByEmail) {
                userByEmail.name = u.name;
                userByEmail.password = u.password;
                userByEmail.role = u.role;
                await userByEmail.save();
            } else {
                await User.create(u);
            }
        }
        console.log('Users synced from .env');
    } catch (err) {
        console.log('User seed skipped:', err.message);
    }
};

if (process.env.NODE_ENV !== 'production') {
    syncUsers();
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/expenses', expenseRoutes);

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

// Required for Vercel Serverless Deployment
export default app;
