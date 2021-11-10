// Initialize butotn with users's prefered color
let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.borderColor = color;
});

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });



  fetch('https://jsonplaceholder.typicode.com/posts/1')
      .then(res => res.json())
      .then(console.log)

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setPageBackgroundColor,
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: searchForAcronyms,
  });
});

// The body of this function will be execuetd as a content script inside the
// current page
function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
}

window.onload=function(){
  console.log("page load!");
}


// The body of this function will be executed as a content script inside the
// current page
function searchForAcronyms() {

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
  }

  chrome.storage.sync.get("acronyms", async ({ acronyms }) => {

      const map = new Map();
      for (const acro of acronyms) {
        map.set(acro.abbr, acro.meaning);
      }

      const matches = [];
      for (const el of document.body.children) {
        matches.push(...iterateTree(el, map));
      }

      let highlightColor = 'yellow'; // default
      chrome.storage.sync.get("color", ({ color }) => {
        highlightColor = color;
        for (const match of matches) {
          const word = match.word;
          const el = match.el;
          const definition = map.get(word);
          const re = new RegExp(word,"g");
          if (el.parentElement && el.parentElement.innerHTML) {
            el.parentElement.innerHTML = el.parentElement.innerHTML
                .replace(re, `
                    <span class="tooltip" style="background-color: ${highlightColor}">${word}
                        <span class="tooltiptext">${definition}</span>
                    </span>
                `);
          }
        }
      });
  });
}

// Need to handle multiple matches gracefully.
// Need to handle dynamic content.  Imagine async content.
// Need to handle tab changes.
// Need to handle databsae updates.
// Tooltip needs HTML