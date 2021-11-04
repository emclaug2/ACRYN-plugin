// Initialize butotn with users's prefered color
let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

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



// The body of this function will be executed as a content script inside the
// current page
function searchForAcronyms() {
  /** Returns an array of elements where the immediate inner content contains an acroynm. */
  const iterateTree = (el, acronym) => {
    const els = [];
    if (el.hasChildNodes()) {
      for (const child of el.childNodes) {
        els.push(...iterateTree(child, acronym));
      }
    } else if (el.nodeType === Node.TEXT_NODE) {
      console.log(el.nodeValue);
      if(el.nodeValue && el.nodeValue.includes(acronym)) {
        els.push(el);
      }
    }
    return els;
  }

  chrome.storage.sync.get("acronyms", ({ acronyms }) => {
    for (const acronym  of acronyms) {
      const acroEls = [];
      for (const el of document.body.children) {
        acroEls.push(...iterateTree(el, acronym));
      }
      for (const acroEl of acroEls) {
        const re = new RegExp(acronym,"g");
        acroEl.parentElement.innerHTML = acroEl.parentElement.innerHTML
            .replace(re, `<span style="background-color: yellow">${acronym}</span>`);
      }
    }
  });
}