var mxRuntime = window.external.mxGetRuntime(),
  mxBrowser = mxRuntime.create('mx.browser'),
  mxStorage = mxRuntime.storage,
  debugMode = false,
  PDF_FILE = 'pdf-file',
  OPENED_PDFS = 'OPENED_PDFS',
  pdfUrl = 'mxaddon-pkg://{d0e723de-bdd9-4c64-95c6-c1dc9ce289f1}/window.html',
  IS_PDF_URL = 'is-pdf-url';

function debug(message) {
  if (debugMode) {
    console.log(message);
  }
}

function pdfExistsSync(obj) {
  var http = new XMLHttpRequest();
  http.open('HEAD', obj.url);
  http.onreadystatechange = function() {
      if (this.readyState == this.DONE) {
        var contentType = this.getResponseHeader('Content-Type');
        if (contentType && contentType.indexOf('application/pdf') > -1) {
          mxRuntime.post(obj.listenId, {
            isPdfUrl: true
          });
        }
      }
  };
  http.send();
}

function savePDF(url) {
  var openedPdfs = JSON.parse(mxStorage.getConfig(OPENED_PDFS) || '[]');
  var foundIndex = openedPdfs.findIndex(function (item) {
    return item.url === url;
  });

  if (foundIndex === -1) {
    openedPdfs.push({ url: url });
    mxStorage.setConfig(OPENED_PDFS, JSON.stringify(openedPdfs));
  }
}

mxRuntime.listen(IS_PDF_URL, function (obj) {
  fetch(obj.url, {
    method: 'HEAD'
  }).then(function (res) {
    var contentType = res.headers.get('Content-Type');
    if (contentType && contentType.indexOf('application/pdf') > -1) {
      savePDF(obj.url);
      // send message to the page.
      mxRuntime.post(obj.listenId, {
        isPdfUrl: true
      });
    }
  }).catch(function (err) {
    console.error(err);
  });
});

mxBrowser.onBrowserEvent = function (obj) {
  if (obj.type === 'ON_NAVIGATE') {
    debug(obj.url);
    if (obj.url.search(/^file:/) === 0 && obj.url.search(/\.pdf$/) > -1) {
      var tab = mxBrowser.tabs.getTabById(obj.id);

      savePDF(obj.url);
      mxStorage.setConfig(PDF_FILE, obj.url);
      mxBrowser.tabs.newTab({
        url: pdfUrl + '?pdfLink=' + obj.url,
        active: false
      });
      tab.close();
    }
  }
};
