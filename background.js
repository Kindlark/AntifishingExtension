const API_KEY = 'AIzaSyDaG1QNpDVufoq2i0X_HFHRuBb4QONf6vs';

async function isPhishing(url) {

  const whitelist = await getWhitelist();
  if (whitelist.includes(url)) {
    return false; 
  }

  const fetchUrl = 'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=' + API_KEY;
  const response = await fetch(fetchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client: {
        clientId: "heflnbpgkfocajnbdmefghiaaoajdlnk", 
        clientVersion: "1.0.0",
      },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url: url }],
      },
    }),
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.matches && data.matches.length > 0;

}

async function handlePhishing(tabId) {

  chrome.scripting.executeScript({
      target: { tabId: tabId },

      function: () => {
          document.body.innerHTML = `
              <div style="display: flex; margin: 0; justify-content: center; align-items: center; width: 100vw; height: 100vh; font-size: 30px; font-weight: bold; text-align: center; background-color: #e63946; color: #f1faee; font-family: Arial, Helvetica, sans-serif; flex-direction: column;">
                <p>Сайт заблокирован из-за фишинга!</p>
                <button id="addToWhiteList" style="border: none; background-color:rgb(41, 214, 119); border-radius: 5px; color: #f1faee; width: 10rem; height: 3rem; cursor: pointer;">Все равно перейти</button>
              </div>
          `;
          document.body.style.cssText = 'margin: 0;';
            
          const addToWhiteList = document.getElementById("addToWhiteList");
          addToWhiteList.addEventListener("click", () => {
            chrome.runtime.sendMessage({ action: "add_to_whitelist", url: window.location.href });
            window.location.reload();
          });
        }
  });
}

function getWhitelist() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ whitelist: [] }, (items) => {
      resolve(items.whitelist);
    });
  });
}

function addToWhitelist(url) {
    getWhitelist().then((whitelist) => {
        if(!whitelist.includes(url)) {
          whitelist.push(url);
          chrome.storage.local.set({ whitelist: whitelist });
        }
    });
}

function getRecentlyBlockedList() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ blocked: [] }, (items) => {
      resolve(items.blocked);
    });
  });
}

function addToRecentlyBlocked(url) {
  getRecentlyBlockedList().then((blocked) => {
      if(!blocked.includes(url)) {
        blocked.push(url);
        chrome.storage.local.set({ blocked: blocked });
      }
  });
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
      const url = tab.url;
      const isDangerous = await isPhishing(url);
      if (isDangerous) {
        handlePhishing(tabId, url);
        addToRecentlyBlocked(url);
      }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "add_to_whitelist") {
      addToWhitelist(message.url);
    }
});