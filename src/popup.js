const loginButton = document.getElementById('login');
const logoutButton = document.getElementById('logout');
const loginButtonContainer = document.getElementById('loginButtonContainer');
const userContentContainer = document.getElementById('userContentContainer');
const toggleFindAcronym = document.getElementById('toggleFindAcronym');
const acronymSearchInput = document.getElementById('acronymSearchInput');
const searchContainer = document.getElementById('searchContainer');
const noSearchParentEl = document.getElementById('nonSearchContainer');

let searchedAcronyms = [];
let db = [];
let hasBeenToggled = false;

/** When the plugin is opened, fetch the database of acronyms. */
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

/** Logs user in, so they can view links to add their own acronyms. */
function login() {
    loginButtonContainer.style.display = 'none';
    userContentContainer.style.display = 'block';
}

/** Logs user out, resets to default state. */
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

/** Given a glossary entry, returns a new tooltip row that provides context. */
function createMatchElement(match) {
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
                       <span class="material-icons large-icon">unfold_more</span>
                    </div>
                    `;
    return matchEl;
}

function searchDatabaseForAcronyms(e) {

    // This is assuming all glossary entries use capital letters. */
    const value = e.target.value.toUpperCase();

    if (value) {
        searchContainer.style.display = 'block';
        noSearchParentEl.style.display = ' none';
        searchContainer.innerHTML = '';
    } else {
        searchContainer.style.display = 'none';
        noSearchParentEl.style.display = 'block';
        return;
    }

    // Iterate through all glossary entries, find matches.
    searchedAcronyms = [];
    for (const entry of db) {
        if (value === entry.abbr.toUpperCase()) {
            searchedAcronyms.push(entry);
        }
    }

    // Suggest your own, element.
    const suggestYourOwnEl = document.createElement('span');
    suggestYourOwnEl.id = 'suggestYourOwn';


    if (searchedAcronyms.length === 0) {
        const noResultsFoundEl = document.createElement('div');
        noResultsFoundEl.id = 'noResultsFound';
        noResultsFoundEl.innerHTML = `<span style="margin-right: 8px">No results found.<span>`;
        suggestYourOwnEl.innerHTML = 'Suggest your Own';
        noResultsFoundEl.append(suggestYourOwnEl);
        searchContainer.append(noResultsFoundEl);
        document.getElementById('suggestYourOwn').addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://www.google.com' });
        });
    } else {
        searchedAcronyms.map((match) => {
            const matchEl = createMatchElement(match);
            searchContainer.append(matchEl);
        });

        // Divider
        const dividerEl = document.createElement('div');
        dividerEl.innerHTML = `<div style="margin: 8px 0px 16px 0px; width: 100%; border-bottom: solid 1px #bbbbbb"></div>`;

        // Bottom link
        suggestYourOwnEl.style.textDecoration = 'none';
        suggestYourOwnEl.innerHTML = '+ Suggest your Own';

        searchContainer.append(dividerEl);
        searchContainer.append(suggestYourOwnEl);
        document.getElementById('suggestYourOwn').addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://www.google.com' });
        });
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

    const matIconEl = document.createElement('link');
    matIconEl.href = `https://fonts.googleapis.com/icon?family=Material+Icons`;
    matIconEl.rel='stylesheet'
    document.head.appendChild(matIconEl);

    // This should match the function from above but needs to copied since cannot provide a ref.
    const createMatchElement = (match) => {
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
                            <span class="material-icons small-icon" style="margin-left: 12px">public</span>
                            ${match.region}
                        </div>
                    </div>
                    <div>
                       <span class="material-icons large-icon" style="margin-right: 12px">thumb_up_off_alt</span>
                       <span class="material-icons large-icon">unfold_more</span>
                    </div>
                    `;
        return matchEl;
    }

    /** Returns an array of elements where the immediate inner content contains an acroynm. */
    const iterateTree = (el, map) => {
        const els = [];
        if (el.hasChildNodes()) {
            for (const child of el.childNodes) {
                els.push(...iterateTree(child, map));
            }
        } else if (el.nodeType === Node.TEXT_NODE && el.nodeValue) {
            for (const word of el.nodeValue.split(' ')) {
                if (map.has(word)) {
                    els.push({ el, entry: map.get(word) });
                }
            }
        }
        return els;
    };

    const map = new Map();
    for (const acro of dbAcronyms) {

        // TODO: this neds to be an array to support mutliple matches.  Abbr -> array etnries
        map.set(acro.abbr, acro);
    }

    const matches = [];
    for (const el of document.body.children) {
        matches.push(...iterateTree(el, map));
    }

    let highlightColor = 'yellow'; // default
    chrome.storage.sync.get('color', ({ color }) => {
        highlightColor = color;


        let matchNumber = 0;
        for (const match of matches) {
            matchNumber++;
            const abbr = match.entry.abbr;
            const el = match.el;
            const entry = match.entry;
            const definition = match.entry.meaning;
            const re = new RegExp(abbr, 'g');

            const expandToggleId = abbr+matchNumber+'expand';
            const collapseToggleId = abbr+matchNumber+'collapse';

            if (el.parentElement && el.parentElement.innerHTML) {
                el.parentElement.innerHTML = el.parentElement.innerHTML.replace(
                    re,
                    `
                  <span class="eaton-acronym-plugin-tooltip-text">${abbr}
                      <div class="tooltip-text">
                           <div class="searched-acronym-item">
                           
                                <div class="expanded">
                                       <div class="acronym-meaning" style="margin-bottom: 12px; display: flex; justify-content: space-between;">
                                            <div>${entry.meaning}</div>
                                            <span class="material-icons" id="${collapseToggleId}">unfold_less</span>
                                       </div>
                                       <div class="acronym-description" style="margin-bottom: 12px;">
                                            ${entry.description}
                                       </div>
                                       <div class="icon-row" style="margin-bottom: 8px;">
                                            <span class="material-icons small-icon">apps</span>
                                            Sector: ${entry.sector}
                                        </div>
                                       <div class="icon-row" style="margin-bottom: 8px;">
                                            <span class="material-icons small-icon">public</span>
                                            Region: ${entry.region}
                                        </div>
                                       <div class="icon-row" style="margin-bottom: 8px;">
                                            <span class="material-icons small-icon">link</span>
                                            ${entry.references.map((link) => `<a href="${link}">${link}</a>`)}
                                        </div>
                                       <div class="icon-row">
                                            <span class="material-icons small-icon">playlist_add_check</span>
                                            Last Updated: ${entry.lastUpdatedBy}, ${entry.lastUpdateUnixTime}
                                        </div>
                                        <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
                                            <div style="margin-right: 8px; display: flex; align-items: center">
                                                <span class="material-icons" style="margin-right: 4px;">thumb_up_off_alt</span>
                                                <span style="font-size: 16px">${entry.score}</span>
                                            </div>
                                            <div style="margin-left: 16px">
                                                <span class="material-icons">edit</span>
                                            </div>
                                        </div>
                                </div>
                                <div class="non-expanded">
                                    <div>
                                       <div class="acronym-meaning">
                                            ${entry.meaning}
                                       </div>
                                       <div class="acronym-sector-region"> 
                                            <span class="material-icons small-icon">apps</span>
                                            ${entry.sector}
                                            <span class="material-icons small-icon" style="margin-left: 12px">public</span>
                                            ${entry.region}
                                        </div>
                                    </div>
                                    <div>
                                       <span class="material-icons large-icon" style="margin-right: 12px">thumb_up_off_alt</span>
                                       <span class="material-icons large-icon" id="${expandToggleId}">unfold_more</span>
                                    </div>
                                </div>
                            </div>
                      </div>
                  </span>
              `
                );
            }
            const expandEl = document.getElementById(expandToggleId);
            if (expandEl) {
                console.log('found ' + expandToggleId);
                expandEl.onclick=(e) => {
                    e.stopPropagation();
                    expandEl.parentElement.parentElement.parentElement.classList.toggle('expanded') };
            }
            const collapseEl = document.getElementById(collapseToggleId);
            if (collapseEl) {
                console.log('found ' + collapseToggleId);
                collapseEl.onclick=(e) => {
                    e.stopPropagation();
                    collapseEl.parentElement.parentElement.parentElement.classList.toggle('expanded') };
            }
        }
    });
}

// Need to handle multiple matches gracefully.
// Need to handle databsae updates.
