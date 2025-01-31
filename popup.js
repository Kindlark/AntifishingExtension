const curUrl = document.getElementById('cururl');
const messageCircle = document.getElementById('statusCircle');
const messageText = document.getElementById('statusText');
const recblockedwebsites = document.getElementById("blockedSitesList");
const toSettings = document.getElementById('settings');
const downloadCSV = document.getElementById('csv_download');
const downloadJSON = document.getElementById('json_download');
const body = document.getElementById('bod')

const amountOfBlockedSitesToShow = 7;

document.addEventListener('DOMContentLoaded', function() {
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        
        if (tabs.length > 0) {
            const currentTab = tabs[0];
            const url = currentTab.url; 
            const furl = url.replace(/^(https?:\/\/)/, '').match(/^([^\/]+)/)[1];

            curUrl.textContent = furl.substring(0, 30);
        }
    });

    checkCurrentUrl();

    chrome.storage.local.get({ blocked: []}, function(items) {
      const blocked = items.blocked;
      if (blocked && blocked.length > 0) {
        let cnt = 0;
        for (site of blocked) {
          site=site.url
          if (cnt == amountOfBlockedSitesToShow) {
            break;
          }

          const listItem = document.createElement('li');
          
          if (site.length > 38) {
            listItem.textContent = site.substring(0, 38) + '...';
          } else {
            listItem.textContent = site;
          }

          recblockedwebsites.appendChild(listItem);
          cnt++;
        }
      } else {
        const listItem = document.createElement('li');
        listItem.textContent = 'Здесь пока ничего нет...';
        recblockedwebsites.appendChild(listItem);
      }
    });
});

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

function showMessage(message) {
  messageText.textContent = message;
}

async function checkCurrentUrl() {
  let currentUrl = await getCurrentUrl();

  chrome.storage.local.get({ blocked: []}, async function(items) {
    const blocked = items.blocked;
    const wasBlocked= (bl_url) => bl_url.url==currentUrl;
    if (blocked && blocked.length > 0 && blocked.some(wasBlocked)) {    
      showMessage(`Сайт может быть фишинговым!`);
      body.style.backgroundImage="url('plug-img/background 4.svg')"
      messageCircle.style.backgroundColor="#CA4842"
      messageCircle.style.boxShadow="0 0 10px #CA4842";
      messageText.style.color="#D44842";
      messageText.style.textShadow="0 0 3px #822425";
    } else {
      showMessage(`Cайт безопасен :D`);
      body.style.backgroundImage="url('plug-img/background 3.svg')"
      messageCircle.style.backgroundColor="#19CFF8"
      messageCircle.style.boxShadow="0 0 10px #19CFF8";
      messageText.style.color="#CCF6FF";
      messageText.style.textShadow="0 0 3px rgba(144, 234, 254, 0.5)";
    }
  });
}

function download_csv(jsonData, filename = 'data.csv') {

  const items = jsonData; 
  const replacer = (key, value) => value === null ? '' : value; 
  const header = Object.keys(items[0]); 
  let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
  csv.unshift(header.join(',')); 
  csv = csv.join('\r\n');

  const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", filename);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

downloadCSV.addEventListener('click', function() {
  
  chrome.storage.local.get({ blocked: []}, async function(items) {
    const blocked = items.blocked;
    download_csv(blocked, 'blockedWebsitesCSV.csv');
  });

});

function download_json(jsonData, filename = 'data.json') {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", filename);
  document.body.appendChild(downloadAnchorNode); 
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

downloadJSON.addEventListener('click', function() {

  chrome.storage.local.get({ blocked: []}, async function(items) {
    const blocked = items.blocked;
    download_json(blocked, 'blockedWebsitesJSON.json');
  });

});

toSettings.addEventListener('click', function() {

});
