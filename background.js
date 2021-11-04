let color = '#3aa757';

// acronyms are stored in the browser on install, for now.  Ideally we should do a refresh periodically.
// Maybe when browser is opened.  Not as frequent as a new tab opened.
const acronyms = ['PX', 'Github', 'Eaton'];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color, acronyms });
  console.log('Default background color set to %cgreen', `color: ${color}`);
});
