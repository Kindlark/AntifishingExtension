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
              <div style="display: flex; margin: 0;
              justify-content: center; align-items: center;
              width: 100vw; height: 100vh; font-size: 50px;
              font-weight: 1000; text-align: center; background-color: #C7503E;
              color: #f1faee;
              text-shadow: 0 4px 0 rgba(235, 219, 205, 0.5);
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif, Helvetica, sans-serif; flex-direction: column;">
                <p>Сайт заблокирован из-за фишинга!</p>
                <button id="addToWhiteList" 
                style="border: none;
                font-size: 20px;
                background-color:rgb(96, 146, 56);
                box-shadow:  0 0 10px rgba(87, 41, 31, 0.5);
                border-radius: 30px;
                text-shadow: 0 0 5px rgba(232, 239, 214, 0.5);
                color:rgb(223, 255, 213);
                width: 15rem; height: 4rem;
                cursor: pointer;"
                >Всё равно перейти</button>
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
    const alrBlocked=(domain) => domain.url==url;  
    if(!blocked.some(alrBlocked)) {
        let date=new Date();
        let domain={"url": url, "time": date.toLocaleString()}
        blocked.push(domain);
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