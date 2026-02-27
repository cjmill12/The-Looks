const fs = require('fs').promises;
const ANALYTICS_FILE = '/tmp/analytics.json';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'looks2025';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const password = event.queryStringParameters?.password;
    if (password !== ADMIN_PASSWORD) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid password' })
        };
    }

    try {
        const data = await fs.readFile(ANALYTICS_FILE, 'utf8');
        const analytics = JSON.parse(data);
        
        // Simple counts
        const summary = {
            totalSessions: analytics.sessions.length,
            totalCaptures: analytics.captures.length,
            totalGenerations: analytics.generations.length,
            totalShares: analytics.shares.length,
            captureRate: ((analytics.captures.length / analytics.sessions.length) * 100).toFixed(1),
            generationRate: ((analytics.generations.length / analytics.captures.length) * 100).toFixed(1),
            shareRate: ((analytics.shares.length / analytics.generations.length) * 100).toFixed(1)
        };
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ ...analytics, summary })
        };
    } catch (error) {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                sessions: [], 
                captures: [], 
                generations: [], 
                shares: [],
                summary: { totalSessions: 0, totalCaptures: 0, totalGenerations: 0, totalShares: 0 }
            })
        };
    }
};
