// netlify/functions/get_analytics.js
// Returns analytics from in-memory storage

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'looks2025';

// Access the same global storage
global.analytics = global.analytics || {
    sessions: [],
    captures: [],
    generations: [],
    shares: []
};

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
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
        const analytics = global.analytics;
        
        const sessions = analytics.sessions.length;
        const captures = analytics.captures.length;
        const generations = analytics.generations.length;
        const shares = analytics.shares.length;
        
        const summary = {
            totalSessions: sessions,
            totalCaptures: captures,
            totalGenerations: generations,
            totalShares: shares,
            captureRate: sessions > 0 ? ((captures / sessions) * 100).toFixed(1) : '0.0',
            generationRate: captures > 0 ? ((generations / captures) * 100).toFixed(1) : '0.0',
            shareRate: generations > 0 ? ((shares / generations) * 100).toFixed(1) : '0.0'
        };
        
        console.log('📊 Analytics retrieved:', summary);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ...analytics,
                summary
            })
        };
    } catch (error) {
        console.error('❌ Error retrieving analytics:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to retrieve analytics',
                details: error.message 
            })
        };
    }
};
