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



// The body of this function will be execuetd as a content script inside the
// current page
function searchForAcronyms() {

  const wrapAcronym = (div, ) => {

  };

  const hasAcronym = (el, acr) => {
    if (el && el.children && el.children[0] && el.children[0].innerText.includes(acr)) {
      console.log(el.children[0]);
      return el.children[0];
    }
  }

  chrome.storage.sync.get("acronyms", ({ acronyms }) => {
  //  const divs = document.getElementsByTagName("div");
    for (const acronym of acronyms) {
      console.log(acronym);

      const re = new RegExp(acronym,"g");
      document.body.innerHTML = document.body.innerHTML.replace(re, `<span style="background-color: yellow">${acronym}</span>`);
    }
  });
}