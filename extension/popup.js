document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    const loginDiv = document.getElementById('login');
    const tokenInput = document.getElementById('token');
    const saveBtn = document.getElementById('saveBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    const { token } = await chrome.storage.local.get(['token']);

    if (token) {
        showStatus();
    } else {
        showLogin();
    }

    saveBtn.addEventListener('click', async () => {
        const tokenVal = tokenInput.value;
        if (tokenVal) {
            await chrome.storage.local.set({ token: tokenVal });
            showStatus();
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await chrome.storage.local.remove(['token']);
        showLogin();
    });

    function showStatus() {
        statusDiv.style.display = 'block';
        loginDiv.style.display = 'none';
    }

    function showLogin() {
        statusDiv.style.display = 'none';
        loginDiv.style.display = 'block';
    }
});
