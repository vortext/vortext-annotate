/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */
define(function (require) {
  'use strict';

  var Q = require("Q");
  var _ = require("underscore");
  var Backbone = require("backbone");

  function updateProgress (deferred, e) {
    if (e.lengthComputable) {
      var percentComplete = e.loaded / e.total;
      if(percentComplete > 0.99) {
        deferred.notify({state: "loading", message: "Processing…", completed: 1.0});
      } else {
        deferred.notify({state: "loading", message: "Uploading file", completed: percentComplete.toPrecision(2)});
      }
    } else {
      console.log("Unable to compute progress information since the total size is unknown");
    }
  }

  function transferComplete(deferred, e) {
    deferred.notify({state: "loading", message: "Processing…", completed: NaN});
  }

  var Topologies = Backbone.Model.extend({
    fetch: function(topology, data) {
      var uri = "/topologies/" + topology;
      var deferred = Q.defer();
      var xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", _.partial(updateProgress, deferred), false);
      xhr.upload.addEventListener("load", _.partial(updateProgress, deferred), false);
      deferred.notify({message: "Uploading file", progress: NaN, state: "loading"});

      xhr.open("POST", uri, true);
      xhr.setRequestHeader('X-CSRF-Token', window.csrfToken);

      xhr.onload = function (e) {
        if (xhr.status >= 200 && xhr.status < 400) {
          var data = JSON.parse(xhr.responseText);
          deferred.notify({message: "Done", progress: 1.0, state: "done"});
          deferred.resolve(data);
        } else {
          deferred.reject({status: xhr.status, message: xhr.responseText});
        }
      };
      xhr.send(data);
      return deferred.promise;
    }
  });

  return Topologies;
});
