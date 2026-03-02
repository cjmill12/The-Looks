// netlify/functions/analytics.js
// Multi-shop tracking with Supabase

const SUPABASE_URL = 'https://sehiygaoyvxmaksodiex.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'looks2025';

async function supabaseQuery(query, body) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase error: ${error}`);
    }
    
    return response;
}

async function supabaseSelect(query) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase error: ${error}`);
    }
    
    return response.json();
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // POST = Log event
    if (event.httpMethod === 'POST') {
        try {
            const { eventType, eventData } = JSON.parse(event.body);
            
            // Extract shop_id from eventData (will be set by client)
            const shopId = eventData.shop_id || 'wyckoff'; // Default to wyckoff for now
            
            // Save to Supabase with shop_id
            await supabaseQuery('analytics_events', {
                event_type: eventType,
                session_id: eventData.sessionId,
                shop_id: shopId,
                data: eventData
            });
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true })
            };
        } catch (error) {
            console.error('Error logging event:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: error.message })
            };
        }
    }

    // GET = Retrieve analytics
    if (event.httpMethod === 'GET') {
        const password = event.queryStringParameters?.password;
        if (password !== ADMIN_PASSWORD) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid password' })
            };
        }

        try {
            const shopFilter = event.queryStringParameters?.shop;
            
            // Build query - optionally filter by shop
            let query = 'analytics_events?select=*&order=timestamp.desc';
            if (shopFilter) {
                query = `analytics_events?select=*&shop_id=eq.${shopFilter}&order=timestamp.desc`;
            }
            
            const events = await supabaseSelect(query);
            
            // Organize by event type
            const sessions = events.filter(e => e.event_type === 'session_start');
            const captures = events.filter(e => e.event_type === 'image_capture');
            const generations = events.filter(e => e.event_type === 'generation_complete');
            const shares = events.filter(e => e.event_type === 'share_click' || e.event_type === 'save_click');
            
            const sessionsCount = sessions.length;
            const capturesCount = captures.length;
            const generationsCount = generations.length;
            const sharesCount = shares.length;
            
            // Calculate per-shop breakdown
            const shopStats = {};
            events.forEach(e => {
                const shop = e.shop_id || 'unknown';
                if (!shopStats[shop]) {
                    shopStats[shop] = { sessions: 0, captures: 0, generations: 0, shares: 0 };
                }
                if (e.event_type === 'session_start') shopStats[shop].sessions++;
                if (e.event_type === 'image_capture') shopStats[shop].captures++;
                if (e.event_type === 'generation_complete') shopStats[shop].generations++;
                if (e.event_type === 'share_click' || e.event_type === 'save_click') shopStats[shop].shares++;
            });
            
            const summary = {
                totalSessions: sessionsCount,
                totalCaptures: capturesCount,
                totalGenerations: generationsCount,
                totalShares: sharesCount,
                captureRate: sessionsCount > 0 ? ((capturesCount / sessionsCount) * 100).toFixed(1) : '0.0',
                generationRate: capturesCount > 0 ? ((generationsCount / capturesCount) * 100).toFixed(1) : '0.0',
                shareRate: generationsCount > 0 ? ((sharesCount / generationsCount) * 100).toFixed(1) : '0.0',
                shopBreakdown: shopStats
            };
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    sessions: sessions.map(e => ({ ...e.data, timestamp: e.timestamp, shop_id: e.shop_id })),
                    captures: captures.map(e => ({ ...e.data, timestamp: e.timestamp, shop_id: e.shop_id })),
                    generations: generations.map(e => ({ ...e.data, timestamp: e.timestamp, shop_id: e.shop_id })),
                    shares: shares.map(e => ({ ...e.data, timestamp: e.timestamp, shop_id: e.shop_id })),
                    summary
                })
            };
        } catch (error) {
            console.error('Error retrieving analytics:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: error.message })
            };
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};
