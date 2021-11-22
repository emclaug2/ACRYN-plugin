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
        })
        .catch((err) => {
            console.error(err);
        });
};

function login() {
    loginButtonContainer.style.display = 'none';
    userContentContainer.style.display = 'block';
}

function logout() {
    loginButtonContainer.style.display = 'block';
    userContentContainer.style.display = 'none';
}

async function toggleAcronyms() {
    const show = toggleFindAcronym.checked;
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (hasBeenToggled) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: updateTooltipCss,
            args: [show],
        });
    } else {
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

    const noSearchParentEl = document.getElementById('nonSearchContainer');
    const searchParentEl = document.getElementById('searchContainer');

    /** Suggest your own Acronym. */
    const suggestYourOwnEl = document.createElement('span');
    suggestYourOwnEl.id = 'suggestYourOwn';

    if (value) {
        searchParentEl.innerHTML = '';
        noSearchParentEl.style.display = 'none';
        searchParentEl.style.display = 'block';
        if (searchedAcronyms.length === 0) {
            const noResultsFoundEl = document.createElement('div');
            noResultsFoundEl.id = 'noResultsFound';
            noResultsFoundEl.innerHTML = `<span style="margin-right: 8px">No results found.<span>`;
            suggestYourOwnEl.innerHTML = 'Suggest your Own';
            noResultsFoundEl.append(suggestYourOwnEl);
            searchParentEl.append(noResultsFoundEl);
            document.getElementById('suggestYourOwn').addEventListener('click', () => {
                chrome.tabs.create({ url: 'https://www.google.com' });
            });
        } else {
            searchedAcronyms.map((match) => {
                const matchEl = document.createElement('div');
                matchEl.className = 'searched-acronym-item';
                matchEl.innerHTML = `
                    <div>
                       <div class="acronym-meaning">
                            ${match.meaning}
                       </div>
                       <div class="acronym-sector-region">
                            <span class="material-icons small-icon">apps</span>
                            ${match.sector}
                            <span class="material-icons small-icon" style="margin-left: 8px">public</span>
                            ${match.region}
                        </div>
                    </div>
                    <div display: flex>
                       <span class="material-icons large-icon" style="margin-right: 12px">thumb_up_off_alt</span>
                       <span class="material-icons large-icon">swap_vert</span>
                    </div>
                    `;
                searchParentEl.append(matchEl);
            });

            const dividerEl = document.createElement('div');
            dividerEl.innerHTML = `<div style="margin: 8px 0px 16px 0px; width: 100%; border-bottom: solid 1px #bbbbbb"></div>`;

            searchParentEl.append(dividerEl);
            suggestYourOwnEl.style.textDecoration = 'none';
            suggestYourOwnEl.innerHTML = '+ Suggest your Own';
            searchParentEl.append(suggestYourOwnEl);
            document.getElementById('suggestYourOwn').addEventListener('click', () => {
                chrome.tabs.create({ url: 'https://www.google.com' });
            });
        }
    } else {
        noSearchParentEl.style.display = 'block';
        searchParentEl.style.display = 'none';
    }
}

acronymSearchInput.addEventListener('keyup', searchDatabaseForAcronyms);
loginButton.addEventListener('click', login);
logoutButton.addEventListener('click', logout);
toggleFindAcronym.addEventListener('change', toggleAcronyms);

function updateTooltipCss(show) {
    var myList = document.getElementsByClassName('eaton-acronym-plugin-tooltip-text');
    var i = 0;
    while (i < myList.length) {
        if (show) {
            myList[i].style.backgroundColor = '';
            myList[i].style.borderBottom = '';
        } else {
            myList[i].style.backgroundColor = 'unset';
            myList[i].style.borderBottom = 'unset';
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
