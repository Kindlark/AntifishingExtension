const checkUrlButton = document.getElementById('check-url');
const messageDiv = document.getElementById('message');

const apiKey = "AIzaSyDaG1QNpDVufoq2i0X_HFHRuBb4QONf6vs";

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

// запускает проверку ссылки когда нажимается кнопка
checkUrlButton.addEventListener('click', async () => {
    showMessage("Checking URL...")
    await checkCurrentUrl();
});