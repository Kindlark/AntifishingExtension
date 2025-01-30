const wlcontainer=document.getElementById("whitelistul")
function getWhitelist() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ whitelist: [] }, (items) => {
        resolve(items.whitelist);
      });
    });
}
function removeFromWhitelist(index) {
    getWhitelist().then((whitelist) => {
        whitelist.splice(index,1);
        chrome.storage.local.set({ whitelist: whitelist });
        //alert("removed");
        while(wlcontainer.firstChild)wlcontainer.removeChild(wlcontainer.firstChild);
        drawWL();
    });
}
let i=0;
function drawWL(){
    getWhitelist().then((wl)=> {
        wl.forEach(domain => {
            const domainItem=document.createElement('li');
            domainItem.textContent=domain;
            domainItem.setAttribute("style", "width: fit-content; font-size: 25px")
            domainItem.setAttribute("uniqueIndex", i.toString())
            domainItem.addEventListener("click", function name(e) {
                let index=parseInt(this.getAttribute("uniqueIndex"))
                removeFromWhitelist(index)
            })
            wlcontainer.appendChild(domainItem);
            i++;
        });
    })
}
drawWL()
