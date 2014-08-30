/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */
define(function (require) {
  'use strict';

  var Q = require("Q");
  var _ = require("underscore");

  function updateProgress (deferred, e) {
    if (e.lengthComputable) {
      var percentComplete = e.loaded / e.total;
      deferred.notify({state: "loading", message: "Uploading file", completed: percentComplete.toPrecision(2)});
    } else {
      deferred.notify({state: "loading", message: "Processing…", completed: NaN});
    }
  }

  function transferComplete(deferred, e) {
    deferred.notify({state: "loading", message: "Processing…", completed: NaN});
  }

  var send = function(uri, data, fields) {
    var deferred = Q.defer();
    var xhr = new XMLHttpRequest();
    var fd = new FormData();

    deferred.notify({state: "loading", message: "Processing…", completed: 0.0});
    xhr.upload.addEventListener("progress", _.partial(updateProgress, deferred), false);
    xhr.upload.addEventListener("load", _.partial(transferComplete, deferred), false);

    xhr.open("POST", uri, true);
    xhr.setRequestHeader('X-CSRF-Token', window.csrfToken);

    xhr.onload = function (e) {
      if (xhr.status >= 200 && xhr.status < 400) {
        deferred.notify({state: "done", message: "Completed", completed: 1.0});
        deferred.resolve(xhr.responseText);
      } else {
        deferred.reject({status: xhr.status, message: xhr.responseText});
      }
    };

    fd.append("file", data);

    for (var key in fields) {
      if (fields.hasOwnProperty(key)) {
        fd.append(key, fields[key]);
      }
    }
    xhr.send(fd);
    return deferred.promise;
  };

  // from http://stackoverflow.com/questions/12092633/pdf-js-rendering-a-pdf-file-using-a-base64-file-source-instead-of-url
  var BASE64_MARKER = ';base64,';
  function convertUriToBinary(dataURI) {
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));

    for(var i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  }

  var readFileAsBinary = function(file) {
    var reader = new FileReader();
    var deferred = Q.defer();

    reader.onload = function(e) {
      var data =  convertUriToBinary(reader.result);
      deferred.resolve(data);
    };
    reader.readAsDataURL(file);

    return deferred.promise;
  };

  return {
    send: send,
    convertUriToBinary: convertUriToBinary,
    readFileAsBinary: readFileAsBinary
  };

});
