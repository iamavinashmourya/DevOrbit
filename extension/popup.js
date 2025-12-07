document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    const loginDiv = document.getElementById('login');
    const tokenInput = document.getElementById('token');
    const saveBtn = document.getElementById('saveBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const currentDomainEl = document.getElementById('currentDomain');
    const sessionTimeEl = document.getElementById('sessionTime');

    // Check for token
    const { token } = await chrome.storage.local.get(['token']);

    if (token) {
        showStatus();
        updateStats();
    } else {
        showLogin();
    }

    // Save Token
    saveBtn.addEventListener('click', async () => {
        const tokenVal = tokenInput.value.trim();

        // Basic JWT validation (3 parts separated by dots)
        const parts = tokenVal.split('.');
        if (parts.length !== 3) {
            alert('Invalid Token Format. Please copy the full token starting with "eyJ..."');
            return;
        }

        if (tokenVal) {
            await chrome.storage.local.set({ token: tokenVal });
            showStatus();
            updateStats();
        }
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        await chrome.storage.local.remove(['token']);
        showLogin();
    });

    // Test Connection
    const testBtn = document.getElementById('testBtn');
    const testResult = document.getElementById('testResult');

    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            testResult.textContent = 'Testing...';
            const { token } = await chrome.storage.local.get(['token']);
            if (!token) {
                testResult.textContent = 'No token found.';
                testResult.style.color = '#ef4444';
                return;
            }

            try {
                const res = await fetch('http://localhost:4000/api/v1/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    testResult.textContent = `Success: Connected as ${data.user.name}`;
                    testResult.style.color = '#22c55e';
                } else {
                    testResult.textContent = `Error: ${res.status} ${res.statusText}`;
                    testResult.style.color = '#ef4444';
                }
            } catch (e) {
                testResult.textContent = `Network Error: ${e.message}`;
                testResult.style.color = '#ef4444';
            }
        });
    }

    function showStatus() {
        statusDiv.classList.remove('hidden');
        loginDiv.classList.add('hidden');
    }

    function showLogin() {
        statusDiv.classList.add('hidden');
        loginDiv.classList.remove('hidden');
        tokenInput.value = '';
    }

    // Type Selector Logic
    const typeSelect = document.getElementById('typeSelect');

    if (typeSelect) {
        // Load current type from trackingState
        const { trackingState } = await chrome.storage.local.get(['trackingState']);
        if (trackingState && trackingState.currentType) {
            typeSelect.value = trackingState.currentType;
        }

        // Save on change
        typeSelect.addEventListener('change', async () => {
            const newType = typeSelect.value;

            // 1. Update current session state
            const { trackingState } = await chrome.storage.local.get(['trackingState']);
            if (trackingState) {
                trackingState.currentType = newType;
                await chrome.storage.local.set({ trackingState });
            }

            // 2. Train the model (Save to customDomainMap) - "The Proper Form"
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url) {
                try {
                    const url = new URL(tab.url);
                    const domain = url.hostname;

                    const { customDomainMap } = await chrome.storage.local.get(['customDomainMap']);
                    const newMap = customDomainMap || {};
                    newMap[domain] = newType;

                    await chrome.storage.local.set({ customDomainMap: newMap });
                    console.log(`Trained: ${domain} is now ${newType}`);
                } catch (e) {
                    console.error('Failed to learn domain', e);
                }
            }
        });
    }

    async function updateStats() {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            try {
                const url = new URL(tab.url);
                currentDomainEl.textContent = url.hostname;
            } catch (e) {
                currentDomainEl.textContent = 'New Tab';
            }
        } else {
            currentDomainEl.textContent = 'None';
        }

        // In a real app, we'd query the background script for the session duration
        // For now, just show "Tracking..."
        sessionTimeEl.textContent = 'Active';
    }
});
