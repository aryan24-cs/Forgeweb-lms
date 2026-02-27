import Activity from '../models/Activity.js';

export const logActivity = async (userId, action, entityType, entityId, details = '') => {
    try {
        await Activity.create({ user: userId, action, entityType, entityId, details });
    } catch (err) {
        console.error('Activity log error:', err.message);
    }
};
