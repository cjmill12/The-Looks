// netlify/functions/log_event.js
// Uses Netlify Blobs for persistent storage
const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { eventType, eventData } = JSON.parse(event.body);
        const timestamp = new Date().toISOString();
        const sessionId = eventData.sessionId || `session_${Date.now()}`;
        
        // Get blob store
        const store = getStore('analytics');
        
        // Get existing data
        let analytics;
        try {
            const data = await store.get('data');
            analytics = data ? JSON.parse(data) : {
                sessions: [],
                captures: [],
                generations: [],
                shares: []
            };
        } catch (e) {
            analytics = {
                sessions: [],
                captures: [],
                generations: [],
                shares: []
            };
        }
        
        // Log the event
        if (eventType === 'session_start') {
            analytics.sessions.push({ sessionId, timestamp, ...eventData });
        } else if (eventType === 'image_capture') {
            analytics.captures.push({ sessionId, timestamp, ...eventData });
        } else if (eventType === 'generation_complete') {
            analytics.generations.push({ sessionId, timestamp, ...eventData });
        } else if (eventType === 'share_click' || eventType === 'save_click') {
            analytics.shares.push({ sessionId, timestamp, type: eventType, ...eventData });
        }
        
        // Save back to blob storage
        await store.set('data', JSON.stringify(analytics));
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true,
                currentCounts: {
                    sessions: analytics.sessions.length,
                    captures: analytics.captures.length,
                    generations: analytics.generations.length,
                    shares: analytics.shares.length
                }
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to log event',
                details: error.message 
            })
        };
    }
};
