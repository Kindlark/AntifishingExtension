const curUrl = document.getElementById('cururl');
const messageDiv = document.getElementById('status');
const recblockedwebsites = document.getElementById("blockedSitesList");
const toSettings = document.getElementById('settings');
const downloadCSV = document.getElementById('csv_download');
const downloadJSON = document.getElementById('json_download');

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
        for (const site of blocked) {
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
  messageDiv.textContent = message;
}

async function checkCurrentUrl() {
  let currentUrl = await getCurrentUrl();

  chrome.storage.local.get({ blocked: []}, async function(items) {
    const blocked = items.blocked;
  
    if (blocked && blocked.length > 0 && blocked.includes(currentUrl)) {    
      showMessage(`Фишинговый сайт!`);
      messageDiv.style.backgroundColor='#ff575f';
      messageDiv.style.color="#ffffff";

    } else {
      showMessage(`Этот сайт безопасен :D`);
      messageDiv.style.backgroundColor='#83f7a0';
      messageDiv.style.color="#000000";
    }
  });
}

// function downloadCSV(jsonData, filename = 'data.csv') {

//   const items = jsonData; 
//   const replacer = (key, value) => value === null ? '' : value; 
//   const header = Object.keys(items[0]); 
//   let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
//   csv.unshift(header.join(',')); 
//   csv = csv.join('\r\n');

//   const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
//   const downloadAnchorNode = document.createElement('a');
//   downloadAnchorNode.setAttribute("href", dataStr);
//   downloadAnchorNode.setAttribute("download", filename);
//   document.body.appendChild(downloadAnchorNode);
//   downloadAnchorNode.click();
//   downloadAnchorNode.remove();
// }

// downloadCSV.addEventListener('click', function() {
  
// });

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
