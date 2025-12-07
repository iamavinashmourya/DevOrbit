let activeTabId = null;
let activeDomain = null;
let startTime = null;
const TRACKING_INTERVAL = 60000; // 1 minute

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    handleTabChange(tab);
});

// Listen for URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.url) {
        handleTabChange(tab);
    }
});

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // Browser lost focus
        stopTracking();
    } else {
        const [tab] = await chrome.tabs.query({ active: true, windowId });
        if (tab) {
            handleTabChange(tab);
        }
    }
});

async function handleTabChange(tab) {
    if (!tab.url) return;

    const url = new URL(tab.url);
    const domain = url.hostname;

    if (activeDomain !== domain) {
        await stopTracking();
        startTracking(tab.id, domain);
    }
}

function startTracking(tabId, domain) {
    activeTabId = tabId;
    activeDomain = domain;
    startTime = Date.now();
    console.log(`Started tracking: ${domain}`);
}

async function stopTracking() {
    if (activeDomain && startTime) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (duration > 5000) { // Only track if > 5 seconds
            console.log(`Stopped tracking: ${activeDomain}, duration: ${duration}ms`);
            await saveActivity(activeDomain, startTime, endTime);
        }
    }
    activeTabId = null;
    activeDomain = null;
    startTime = null;
}

async function saveActivity(domain, start, end) {
    // In a real extension, we would get the user token from storage
    // and send a POST request to the backend.
    // For now, we'll just log it or store in local storage to sync later.

    const activity = {
        type: 'app_usage',
        source: 'browser_extension',
        metadata: { domain },
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
        durationMinutes: Math.max(1, Math.round((end - start) / 60000))
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
