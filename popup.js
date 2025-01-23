const curUrl = document.getElementById('cururl');
const messageDiv = document.getElementById('status');
const recblockedwebsites = document.getElementById("recentlyblocked-list");

const blockedwebsitestoshow = 7;
const apiKey = "AIzaSyDaG1QNpDVufoq2i0X_HFHRuBb4QONf6vs";

document.addEventListener('DOMContentLoaded', function() {
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        
        if (tabs.length > 0) {
            const currentTab = tabs[0];
            const url = currentTab.url; 
            const furl = url.replace(/^(https?:\/\/)/, '').match(/^([^\/]+)/)[1];

            curUrl.textContent = furl;
        }
    });

    checkCurrentUrl();
    setRecentBlockedWebsites(blockedwebsitestoshow);
});


function setRecentBlockedWebsites(n) {

    let websites = JSON.parse(localStorage.getItem('blocked')) || [];
    
    if (websites != "") {
        const blockedsites = websites.slice(0, n);
        const fsites = blockedsites.map(el => {
            if (el.length > 40) {
                return el.slice(0, 40) + '...';
            }
            return el;
        });

        recblockedwebsites.textContent = fsites.join("\n"); 
    } else {
        recblockedwebsites.textContent = "Здесь пока ничего нету...";
    }
}

// проверяет ссылку на фишинг
async function checkUrl(url, apiKey) {
    const api_url = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

    const data = {
        "client": {
            "clientId": "theantifishing",
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

// проверка urlа
async function checkCurrentUrl() {
    let currentUrl = await getCurrentUrl();

    if (currentUrl) {
        const matches = await checkUrl(currentUrl, apiKey);
        if (matches && matches.length > 0) {
            showMessage(`Фишинговый сайт!`);
            messageDiv.style.backgroundColor='#ff575f';
            messageDiv.style.color="#ffffff";
            addBlocked(currentUrl);
            setRecentBlockedWebsites(blockedwebsitestoshow);
        } else {
            showMessage(`Этот сайт безопасен :D`);
            messageDiv.style.backgroundColor='#83f7a0';
            messageDiv.style.color="#000000";
        }
    } else {
        showMessage('Could not get current URL');
    }
}

function addBlocked(website) {

    let websites = JSON.parse(localStorage.getItem('blocked')) || [];
    if(!website.includes(website))websites.unshift(website);

    localStorage.setItem('blocked', JSON.stringify(websites));
}