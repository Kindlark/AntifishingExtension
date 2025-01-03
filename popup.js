const apiKeyInput = document.getElementById('api-key');
const saveKeyButton = document.getElementById('save-key');
const checkUrlButton = document.getElementById('check-url');
const messageDiv = document.getElementById('message');

async function getApiKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['apiKey'], function (result) {
            resolve(result.apiKey);
        });
    });
}

// сохраняет urlку
async function saveApiKey(apiKey) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ apiKey: apiKey }, function () {
            resolve();
        });
    });
}

// проверяет ссылку на фишинг
async function checkUrl(url, apiKey) {
    const api_url = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

    const data = {
        "client": {
            "clientId": "your-extension-id",
            "clientVersion": "1.0.0"
        },
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{ "url": url }]
        }
    };

    try {
        const response = await fetch(api_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const responseData = await response.json();
        return responseData.matches;
    }
    catch (error) {
        console.error('Error checking URL:', error);
        return null;
    }
}

// выводит результат в html
function showMessage(message) {
    messageDiv.textContent = message;
}

// получает url
async function getCurrentUrl() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0])
                resolve(tabs[0].url)
            else
                resolve(null)
        });
    });
}


// будет получать url если url будет меняться
async function checkCurrentUrl() {
    let apiKey = await getApiKey();
    if (!apiKey) {
        showMessage('API key not set. Please set it in the popup.');
        return;
    }
    let currentUrl = await getCurrentUrl();

    if (currentUrl) {
        showMessage(`Checking URL: ${currentUrl}`);
        const matches = await checkUrl(currentUrl, apiKey);
        if (matches && matches.length > 0) {
            showMessage(`Dangerous Site Detected! URL: ${currentUrl} is dangerous!`);
        } else {
            showMessage(`URL: ${currentUrl} is OK!`);
        }
    } else {
        showMessage('Could not get current URL');
    }
}


// достает api ключ из сохраненений
document.addEventListener('DOMContentLoaded', async function () {
    const apiKey = await getApiKey();
    if (apiKey) {
        apiKeyInput.value = apiKey;
    }
});

// сохраняет api ключ
saveKeyButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        await saveApiKey(apiKey);
        showMessage("API Key Saved");
    } else {
        showMessage("Please enter API Key!");
    }
});

// запускает проверку ссылки когда нажимается кнопка
checkUrlButton.addEventListener('click', async () => {
    showMessage("Checking URL...")
    await checkCurrentUrl();
});