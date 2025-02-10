const API_KEY = 'AIzaSyDaG1QNpDVufoq2i0X_HFHRuBb4QONf6vs';

async function isPhishing(url) {
  const whitelist = await getWhitelist();
  const includes=(website) => website.includes(url.replace(/^(https?:\/\/)/, '').match(/^([^:\/]+)/)[1]);
  if (whitelist.includes(url)) {
    return false; 
  }
  if(openPhishArray.some(includes)){
    return true;
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
        document.open();
        document.write("");
        document.close();
          document.body.style='';
          document.head.innerHTML='';
          document.head.innerText='';
          document.head.style='';
          
          const clear=(element) => document.body.removeAttribute(element);
          document.body.removeAttributeNode
          document.body.getAttributeNames().some(clear)
          document.body.innerHTML = `
              <div id="box">
                <div id="container">
                  <p id="text">Сайт заблокирован из-за фишинга!</p>
                  <button id="addToWhiteList">Добавить в белый список</button>
                </div>
              </div>`;
          document.body.style.display = 'flex';
          document.body.style.margin = '0';
          document.body.style.justifyContent = 'center';
          document.body.style.textAlign = 'center';
          document.body.style.width = '100%';
          document.body.style.height = '100%';
          document.body.style.height = '100%';
          const box = document.getElementById("box");
          box.style.display = 'flex';
          box.style.margin = '0';
          box.style.justifyContent = 'center';
          box.style.textAlign = 'center';
          box.style.width = '100%';
          box.style.height = '100%';
          box.style.backgroundColor = '#02090A';

          const container = document.getElementById("container");
          container.style.marginTop = '20%';

          const text = document.getElementById("text");
          text.style.marginBottom = '60px';
          text.style.fontSize = '80px';
          text.style.fontWeight = '900';
          text.style.color = '#D44842';
          text.style.fontFamily = 'Arial';
          text.style.letterSpacing = '-3px';
          text.style.textShadow = '0 4px 1px #822425, 0 8px 1px #420E0F, 0 12px 1px #1D0707';

          const button = document.getElementById("addToWhiteList");
          button.style.width = '450px';
          button.style.height = '110px';
          button.style.backgroundColor = '#02090A';
          button.style.outline = 'none';
          button.style.border = 'solid 10px #3B1415';
          button.style.borderRadius = '30px';
          button.style.fontSize = '30px';
          button.style.fontWeight = '700';
          button.style.color = '#D44842';
          button.style.textShadow = '0 2px 3px #591E1C';
          button.style.boxShadow = '0 0 5px #591E1C, inset 0 0 5px #591E1C';
          button.style.cursor = 'pointer';
            
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
  const url = tab.url;
  const isDangerous = await isPhishing(url);
  if (isDangerous) {
    handlePhishing(tabId, url);
    addToRecentlyBlocked(url);
      
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "add_to_whitelist") {
      addToWhitelist(message.url);
    }
});

chrome.alarms.create("update_cache_openphish", 
  { delayInMinutes: 5,
    periodInMinutes: 5
  }
);

var openPhishArray=new Array();

async function reCacheOpenPhish(){
  const response=await fetch("https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt", 
    {
      method: "GET"
    }
  );
  const received=await response.text();
  if(response.ok){
    openPhishArray=received.split("\n");
    //console.log("UPDATED")
  }
  const response_static_db=await fetch("https://raw.githubusercontent.com/codeesura/Anti-phishing-extension/refs/heads/main/phishing-sites-list.json",
    {method: "GET"}
  );
  const resp_db=await response_static_db.json();
  for(var site in resp_db){
    openPhishArray.push(resp_db[site]);
  }
  console.log("RCVD");
  console.log(openPhishArray);
}

chrome.alarms.onAlarm.addListener(async function alarm(alarm){
  if(alarm.name==="update_cache_openphish")await reCacheOpenPhish();
});
reCacheOpenPhish();