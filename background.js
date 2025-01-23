const API_KEY = "AIzaSyDaG1QNpDVufoq2i0X_HFHRuBb4QONf6vs";

async function checkUrl(url) {
  const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`;

  const requestBody = {
    client: {
      clientId: "theantifishing",
      clientVersion: "1.0",
    },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url: url }],
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        return false; 
    }
    
    const data = await response.json();
    
    if (data.matches && data.matches.length > 0) {
      return true; 
    }
    return false; 
  } catch (error) {
    console.error("Ошибка при проверке URL:", error);
    return false;
  }
}

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) { 
    return;
  }

  const url = details.url;
  // let whitelist = JSON.parse(localStorage.getItem('whitewebsites')) || [];
  // if (whitelist.includes(url)) {
  //   return;
  // }
  
  console.log(`Проверка URL: ${url}`);
  const isThreat = await checkUrl(url);
  if (isThreat) {
      console.log(`URL ${url} является фишинговым!`);

    chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        function: () => {
            document.body.innerHTML = '';
            document.body.style.cssText = 'margin: 0;';

            let div = document.createElement('div');
            let buttonAddToWhiteList = document.createElement('button');
            buttonAddToWhiteList.textContent = "Добавить в белый список";
            buttonAddToWhiteList.style.cssText = 'border: none; background-color:rgb(41, 214, 119); border-radius: 5px; color: #f1faee; width: 10rem; height: 3rem; margin-top: 2rem; cursor: pointer;';
            // buttonAddToWhiteList.addEventListener("click", function() {
              
            //   let whitewebsites = JSON.parse(localStorage.getItem('whitewebsites')) || [];
            //   whitewebsites.unshift(url);
            //   localStorage.setItem('whitewebsites', JSON.stringify(whitewebsites));

            // });
            div.style.cssText = 'display: flex; margin: 0; justify-content: center; align-items: center; width: 100vw; height: 100vh; font-size: 30px; font-weight: bold; text-align: center; background-color: #e63946; color: #f1faee; font-family: Arial, Helvetica, sans-serif; flex-direction: column;';
            div.textContent = 'Сайт заблокирован из-за фишинга!';
            div.appendChild(buttonAddToWhiteList);
            document.body.append(div);
        },
    });
  } else {
    console.log(`URL ${url} безопасен.`);
  }
});