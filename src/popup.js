
const loginButton = document.getElementById('login');
const logoutButton = document.getElementById('logout');
const loginButtonContainer = document.getElementById('loginButtonContainer');
const userContentContainer = document.getElementById('userContentContainer');
const toggleFindAcronym = document.getElementById('toggleFindAcronym');
const acronymSearchInput = document.getElementById('acronymSearchInput');
const searchContainer = document.getElementById('searchContainer');

let searchedAcronyms = [];
let db = [];
let hasBeenToggled = false;

window.onload = (event) => {
    console.log('loading db');
    fetch('https://raw.githubusercontent.com/emclaug2/ACRYN-plugin/master/acroynms.json')
        .then((response) => response.json())
        .then((data) => {
            console.log('database loaded');
            db = data.acronyms;
        }).catch((err) => {
            console.error(err);
    })
};

/*
chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.borderColor = color;
});
*/

function login() {
    loginButtonContainer.style.display = 'none';
    userContentContainer.style.display = 'block';
}

function logout() {
    loginButtonContainer.style.display = 'block';
    userContentContainer.style.display = 'none';
}

async function toggleAcronyms() {
    console.log('checked box');
    const show = toggleFindAcronym.checked;
    console.log('show');
    console.log(show);

    console.log('db!');
    console.log(db);
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (hasBeenToggled) {
        console.log('been toggled');
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: updateTooltipCss,
            args: [show]
        });
    } else {
        console.log('toggling on');
        hasBeenToggled = true;
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: discoverAcronyms,
            args: [db],
        });
    }
}

function searchDatabaseForAcronyms(e) {

    const value = e.target.value.toUpperCase();
    if (value) {
        searchContainer.style.display = 'block';
    } else {
        searchContainer.style.display = 'none';
    }


    searchedAcronyms = [];
    for (const entry of db) {
        if (value === entry.abbr.toUpperCase()) {
            searchedAcronyms.push(entry);
        }
    }

    const noSearchParentEl =  document.getElementById('nonSearchContainer');
    const searchParentEl = document.getElementById('searchContainer');


    /** Suggest your own Acronym. */
    const suggestYourOwnEl = document.createElement("span");
    suggestYourOwnEl.id = 'suggestYourOwn';
    suggestYourOwnEl.innerHTML = 'Suggest your Own';

    if (value) {
        searchParentEl.innerHTML = '';
        noSearchParentEl.style.display = 'none';
        searchParentEl.style.display = 'block';
        if (searchedAcronyms.length === 0) {
            const noResultsFoundEl = document.createElement("div");
            noResultsFoundEl.id = 'noResultsFound';
            noResultsFoundEl.innerHTML = `<span style="margin-right: 8px">No results found.<span>`;
            noResultsFoundEl.append(suggestYourOwnEl);
            searchParentEl.append(noResultsFoundEl);
            document.getElementById('suggestYourOwn').addEventListener('click', () => {
                chrome.tabs.create({url: 'https://www.google.com'});
            });
        } else {
            searchedAcronyms.map((match) => {
                const matchEl = document.createElement("div");
                matchEl.className = 'searched-acronym-item';
                matchEl.innerHTML =
                    `<div>
                       <div style="font-size: 16px;">
                            ${match.meaning}
                       </div>
                       <div style="font-size: 14px;">
                           
                            <span class="material-icons small-icon">apps</span>
                            ${match.sector}
                            
                            <span class="material-icons small-icon" style="margin-left: 8px">public</span>
                            ${match.region}
                        </div>
                    </div>
                    <div display: flex>
                       <span class="material-icons large-icon">thumb_up</span>
                       <span class="material-icons large-icon">face</span>
                    </div>
                    `
                searchParentEl.append(matchEl);
            });
            searchParentEl.append(suggestYourOwnEl);
            document.getElementById('suggestYourOwn').addEventListener('click', () => {
                chrome.tabs.create({url: 'https://www.google.com'});
            });
        }
    } else {
        noSearchParentEl.innerHTML = '';
        noSearchParentEl.style.display = 'block';
        searchParentEl.style.display = 'none';
    }
}

acronymSearchInput.addEventListener('keyup', searchDatabaseForAcronyms);
loginButton.addEventListener('click', login);
logoutButton.addEventListener('click', logout);
toggleFindAcronym.addEventListener('change', toggleAcronyms);

// When the button is clicked, inject setPageBackgroundColor into current page
loginButton.addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    let acronyms = [];
    await fetch('https://raw.githubusercontent.com/emclaug2/ACRYN-plugin/master/acroynms.json')
        .then((response) => response.json())
        .then((data) => {
            acronyms = data.acronyms;
        });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: discoverAcronyms,
        args: [acronyms],
    });
});

function updateTooltipCss(show) {
    console.log('show has value!!! : ' + show);
    var myList = document.getElementsByClassName("eaton-acronym-plugin-tooltip-text");
    var i = 0;
    while(i < myList.length) {
        if (show) {
            myList[i].style.backgroundColor="";
            myList[i].style.borderBottom="";
        } else {
            myList[i].style.backgroundColor="unset";
            myList[i].style.borderBottom="unset";
        }
        i++;
    }
}

// The body of this function will be executed as a content script inside the
// current page
function discoverAcronyms(dbAcronyms) {
    /** Returns an array of elements where the immediate inner content contains an acroynm. */
    const iterateTree = (el, acronyms) => {
        const els = [];
        if (el.hasChildNodes()) {
            for (const child of el.childNodes) {
                els.push(...iterateTree(child, acronyms));
            }
        } else if (el.nodeType === Node.TEXT_NODE && el.nodeValue) {
            for (const word of el.nodeValue.split(' ')) {
                if (acronyms.has(word)) {
                    els.push({ el, word });
                }
            }
        }
        return els;
    };

    const map = new Map();
    for (const acro of dbAcronyms) {
        map.set(acro.abbr, acro.meaning);
    }

    const matches = [];
    for (const el of document.body.children) {
        matches.push(...iterateTree(el, map));
    }

    let highlightColor = 'yellow'; // default
    chrome.storage.sync.get('color', ({ color }) => {
        highlightColor = color;
        for (const match of matches) {
            const word = match.word;
            const el = match.el;
            const definition = map.get(word);
            const re = new RegExp(word, 'g');
            if (el.parentElement && el.parentElement.innerHTML) {
                el.parentElement.innerHTML = el.parentElement.innerHTML.replace(
                    re,
                    `
                  <span class="eaton-acronym-plugin-tooltip-text">${word}
                      <span class="tooltip-text">${definition}</span>
                  </span>
              `
                );
            }
        }
    });
}

// Need to handle multiple matches gracefully.
// Need to handle databsae updates.
