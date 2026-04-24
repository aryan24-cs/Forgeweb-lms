import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import compression from 'compression';
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
import founderWithdrawalRoutes from './routes/founderWithdrawals.js';
import SalariesRoutes from './routes/salaries.js';
import dailyTaskRoutes from './routes/dailyTasks.js';
import dailyRecordRoutes from './routes/dailyRecords.js';
import noteRoutes from './routes/notes.js';
import './utils/cron.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(compression());
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

// Seed only admin user from env (all other users managed via Admin Panel)
const seedAdmin = async () => {
    try {
        await connectDB();
        const adminEmail = process.env.ADMIN_EMAIL?.trim();
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword) return;

        let admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            await User.create({ 
                name: 'Admin', 
                email: adminEmail, 
                password: adminPassword, 
                plainPassword: adminPassword,
                role: 'admin' 
            });
            console.log('Admin user created from .env');
        } else {
            // Sync admin password if changed in env
            admin.password = adminPassword;
            admin.plainPassword = adminPassword;
            admin.role = 'admin';
            await admin.save();
            console.log('Admin user synced from .env');
        }
    } catch (err) {
        console.log('Admin seed skipped:', err.message);
    }
};

if (process.env.NODE_ENV !== 'production') {
    seedAdmin();
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
app.use('/api/founder-withdrawals', founderWithdrawalRoutes);
app.use('/api/salaries', SalariesRoutes);
app.use('/api/daily-tasks', dailyTaskRoutes);
app.use('/api/daily-records', dailyRecordRoutes);
app.use('/api/notes', noteRoutes);

// --- Serving Frontend (Production/Shared Env) ---
// Note: In local dev, Vite handles routing. In production/unified, this handles SPA.
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all route for any non-API requests to serve the frontend SPA
app.get(/.*/, (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'), (err) => {
            if (err) {
                // If index.html doesn't exist, we fallback to a simple error
                res.status(404).send("LMS Platform: Frontend not built or missing. Run 'npm run build' in frontend directory.");
            }
        });
    } else {
        res.status(404).json({ message: "API Route Not Found" });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

// Required for Vercel Serverless Deployment
export default app;
