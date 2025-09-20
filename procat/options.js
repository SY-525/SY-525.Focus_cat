const siteList = document.getElementById('siteList');
const newSite = document.getElementById('newSite');

async function loadSites() {
    const data = await chrome.storage.sync.get(['blockedSites']);
    const sites = data.blockedSites || ["youtube.com", "netflix.com", "tiktok.com", "instagram.com"];
    siteList.innerHTML = '';
    
    sites.forEach((site, index) => {
        const li = document.createElement('li');
        
        const siteText = document.createElement('span');
        siteText.innerText = site;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerText = 'Remove';
        removeBtn.className = 'remove-btn';
        removeBtn.onclick = async () => {
            sites.splice(index, 1);
            await chrome.storage.sync.set({ blockedSites: sites });
            loadSites();
        };
        
        li.appendChild(siteText);
        li.appendChild(removeBtn);
        siteList.appendChild(li);
    });
}

document.getElementById('addSite').addEventListener('click', async () => {
    const site = newSite.value.trim();
    if (!site) return;
    
    const data = await chrome.storage.sync.get(['blockedSites']);
    const sites = data.blockedSites || [];
    
    if (sites.includes(site)) {
        alert('Site already in the list!');
        return;
    }
    
    sites.push(site);
    await chrome.storage.sync.set({ blockedSites: sites });
    newSite.value = '';
    loadSites();
});

// Allow adding sites with Enter key
newSite.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('addSite').click();
    }
});

loadSites();