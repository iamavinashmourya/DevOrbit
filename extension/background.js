const DOMAIN_MAP = {
    'github.com': 'project',
    'stackoverflow.com': 'learn',
    'leetcode.com': 'dsa',
    'geeksforgeeks.org': 'learn',
    'w3schools.com': 'learn',
    'udemy.com': 'learn',
    'coursera.org': 'learn',
    'instagram.com': 'timepass',
    'facebook.com': 'timepass',
    'twitter.com': 'timepass',
    'reddit.com': 'timepass',
    'netflix.com': 'timepass',
    'linkedin.com': 'social',
    'chatgpt.com': 'project',
    'claude.ai': 'project',
    'localhost': 'project'
};

let customDomainMap = {};

// Initialize state and custom map
chrome.runtime.onStartup.addListener(async () => {
    const { trackingState, customDomainMap: storedMap } = await chrome.storage.local.get(['trackingState', 'customDomainMap']);
    if (trackingState) console.log('Restored tracking state:', trackingState);
    if (storedMap) customDomainMap = storedMap;
});

// Also load immediately
chrome.storage.local.get(['customDomainMap'], (result) => {
    if (result.customDomainMap) customDomainMap = result.customDomainMap;
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.customDomainMap) {
        customDomainMap = changes.customDomainMap.newValue || {};
    }
});

// Keywords
const LEARN_KEYWORDS = [
    'tutorial', 'course', 'learn', 'study', 'lecture', 'lesson', 'bootcamp',
    'python', 'javascript', 'java', 'react', 'node', 'css', 'html', 'sql',
    'algorithm', 'structure', 'system design', 'math', 'physics', 'chemistry',
    'history', 'documentary', 'how to', 'guide', 'explanation', 'vs code',
    'programming', 'coding', 'development', 'engineer', 'science', 'research',
    'documentation', 'docs', 'manual', 'reference', 'api'
];

const TIMEPASS_KEYWORDS = [
    'funny', 'prank', 'vlog', 'gaming', 'gameplay', 'trailer', 'movie',
    'song', 'music', 'dance', 'comedy', 'show', 'episode', 'highlight',
    'meme', 'challenge', 'reaction', 'unboxing', 'review', 'entertainment',
    'gossip', 'celebrity', 'viral', 'trending'
];

async function fetchClassification(domain, title) {
    const { token } = await chrome.storage.local.get(['token']);
    if (!token) return null;

    try {
        const res = await fetch('http://localhost:4000/api/v1/ai/classify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ url: `https://${domain}`, title })
        });

        if (res.ok) {
            const data = await res.json();
            return data.category;
        }
    } catch (e) {
        console.error('AI Classification Failed', e);
    }
    return null;
}

async function determineCategory(domain, title) {
    // 0. Check User's Custom Map (Highest Priority)
    if (customDomainMap[domain]) {
        return customDomainMap[domain];
    }

    const lowerTitle = (title || '').toLowerCase();

    // 1. Check strict domain map first
    let mappedCategory = null;
    if (!domain.includes('youtube.com') && !domain.includes('youtu.be') && !domain.includes('google')) {
        if (DOMAIN_MAP[domain]) mappedCategory = DOMAIN_MAP[domain];
        else {
            for (const key in DOMAIN_MAP) {
                if (domain.endsWith(key)) {
                    mappedCategory = DOMAIN_MAP[key];
                    break;
                }
            }
        }
    }
    if (mappedCategory) return mappedCategory;

    // 2. Universal Keyword Check
    if (LEARN_KEYWORDS.some(k => lowerTitle.includes(k))) return 'learn';
    if (TIMEPASS_KEYWORDS.some(k => lowerTitle.includes(k))) return 'timepass';

    // 3. AI Classification (Fallback for unknown sites)
    if (!domain.includes('youtube') && !domain.includes('google')) {
        console.log(`Asking Gemini about: ${domain}`);
        const aiCategory = await fetchClassification(domain, title);

        if (aiCategory) {
            // Cache the result so we don't ask again
            customDomainMap[domain] = aiCategory;
            await chrome.storage.local.set({ customDomainMap });
            return aiCategory;
        }
    }

    // 4. Final Fallback
    if (domain.includes('youtube')) return 'timepass';
    return 'app_usage';
}

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    handleTabChange(tab);
});

// Listen for URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.title) {
        handleTabChange(tab);
    }
});

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // Browser lost focus
        await stopTracking();
    } else {
        const [tab] = await chrome.tabs.query({ active: true, windowId });
        if (tab) {
            handleTabChange(tab);
        }
    }
});

async function handleTabChange(tab) {
    if (!tab.url) return;

    let url;
    try {
        url = new URL(tab.url);
    } catch (e) {
        return; // Invalid URL
    }

    const domain = url.hostname;
    const title = tab.title;

    // Get current state
    const { trackingState } = await chrome.storage.local.get(['trackingState']);
    const currentDomain = trackingState ? trackingState.domain : null;

    // Only create new activity if domain changed (not title)
    if (currentDomain !== domain) {
        await stopTracking();
        await startTracking(tab.id, domain, title);
    } else if (trackingState) {
        // Same domain - just update the title in case it changed
        trackingState.title = title;
        await chrome.storage.local.set({ trackingState });
    }
}

async function startTracking(tabId, domain, title) {
    const startTime = Date.now();
    const initialType = await determineCategory(domain, title);

    const newState = {
        tabId,
        domain,
        title,
        startTime,
        currentType: initialType
    };

    await chrome.storage.local.set({ trackingState: newState });
    console.log(`Started tracking: ${domain} (${title}) as ${initialType}`);
}

async function stopTracking() {
    const { trackingState } = await chrome.storage.local.get(['trackingState']);

    if (trackingState && trackingState.domain && trackingState.startTime) {
        const endTime = Date.now();
        const duration = endTime - trackingState.startTime;

        if (duration > 10000) { // Track if > 10 seconds
            console.log(`Stopped tracking: ${trackingState.domain}, duration: ${duration}ms`);
            await saveActivity(trackingState.domain, trackingState.title, trackingState.startTime, endTime, trackingState.currentType);
        } else {
            console.log(`Ignored short session: ${trackingState.domain}, duration: ${duration}ms`);
        }

        // Clear state
        await chrome.storage.local.remove(['trackingState']);
    }
}

async function saveActivity(domain, title, start, end, type) {
    const activity = {
        type: type,
        title: title || domain, // Use video title if available
        source: 'browser_extension',
        metadata: { domain },
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
        durationMinutes: Math.max(1, Math.ceil((end - start) / 60000))
    };

    // Retrieve token
    const { token } = await chrome.storage.local.get(['token']);

    if (token) {
        try {
            await fetch('http://localhost:4000/api/v1/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(activity)
            });
        } catch (e) {
            console.error('Failed to sync activity', e);
        }
    } else {
        console.log('No token found, skipping sync');
    }
}
