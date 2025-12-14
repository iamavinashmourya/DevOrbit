export const getAppIconUrl = (appName: string): string | null => {
    if (!appName) return null;

    const lowerName = appName.toLowerCase();

    // Manual mapping for common apps to Simple Icons slugs
    const map: { [key: string]: string } = {
        'visual studio code': 'visualstudiocode',
        'vs code': 'visualstudiocode',
        'code': 'visualstudiocode',
        'cursor': 'cursor', // Might not exist, fallback to generic
        'google chrome': 'googlechrome',
        'chrome': 'googlechrome',
        'firefox': 'firefox',
        'microsoft edge': 'microsoftedge',
        'edge': 'microsoftedge',
        'brave': 'brave',
        'opera': 'opera',
        'safari': 'safari',
        'spotify': 'spotify',
        'discord': 'discord',
        'slack': 'slack',
        'teams': 'microsoftteams',
        'microsoft teams': 'microsoftteams',
        'zoom': 'zoom',
        'notion': 'notion',
        'obsidian': 'obsidian',
        'figma': 'figma',
        'postman': 'postman',
        'docker': 'docker',
        'github desktop': 'github',
        'github': 'github',
        'terminal': 'gnubash',
        'powershell': 'powershell',
        'windows terminal': 'windows11',
        'sublime text': 'sublimetext',
        'intellij idea': 'intellijidea',
        'android studio': 'androidstudio',
        'pycharm': 'pycharm',
        'webstorm': 'webstorm',
        'vlc': 'vlcmediaplayer',
        'whatsapp': 'whatsapp',
        'telegram': 'telegram',
        'instagram': 'instagram',
        'netflix': 'netflix',
        'youtube': 'youtube',
        'facebook': 'facebook',
        'twitter': 'twitter',
        'x': 'x',
        'chatgpt': 'openai',
        'claude': 'anthropic',
    };

    // 1. Check strict map
    if (map[lowerName]) {
        return `https://cdn.simpleicons.org/${map[lowerName]}`;
    }

    // 2. Fuzzy match / direct slug usage attempt
    // Most apps match their name (e.g. "netflix" -> "netflix")
    // We can try to clean the name and see if it works as a slug
    // But to avoid broken images, we should stick to a curated list or handle onError in UI.
    // Let's stick to the map for high reliability first, plus broad "clean" matching.

    const cleanName = lowerName.replace(/ /g, '').replace(/[^\w]/g, ''); // "Visual Studio Code" -> "visualstudiocode"

    // Check if the cleaned name exists in our known slug list (conceptually)
    // For now, let's just use the map to ensure quality. If we want to accept the clean name as a guess, we can return it.
    // Let's return the clean name as a "Best Guess" and let the UI handle 404s by falling back to Lucide.

    return `https://cdn.simpleicons.org/${cleanName}`;
};
