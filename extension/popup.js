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

    function showStatus() {
        statusDiv.classList.remove('hidden');
        loginDiv.classList.add('hidden');
    }

    function showLogin() {
        statusDiv.classList.add('hidden');
        loginDiv.classList.remove('hidden');
        tokenInput.value = '';
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
