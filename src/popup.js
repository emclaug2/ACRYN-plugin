// Initialize butotn with users's prefered color
let changeColor = document.getElementById('changeColor');
let loginButton = document.getElementById('login');
let loginButtonContainer = document.getElementById('loginButtonContainer');
let userContentContainer = document.getElementById('userContentContainer');

window.onload = (event) => {
    console.log('page is fully loaded');
};
/*
chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.borderColor = color;
});
*/

function login() {
    loginButtonContainer.style.display = 'none';
}

loginButton.addEventListener('click', login);

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
        function: searchForAcronyms,
        args: [acronyms],
    });
});

// The body of this function will be executed as a content script inside the
// current page
function searchForAcronyms(dbAcronyms) {
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
                  <span class="tooltip">${word}
                      <span class="tooltiptext">${definition}</span>
                  </span>
              `
                );
            }
        }
    });
}

// Need to handle multiple matches gracefully.
// Need to handle dynamic content.  Imagine async content.
// Need to handle tab changes.
// Need to handle databsae updates.
// Tooltip needs HTML
