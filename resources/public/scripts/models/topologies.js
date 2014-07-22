/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */
define(['underscore', 'Q', 'backbone'], function(_, Q, Backbone) {
  'use strict';

  var Topologies = Backbone.Model.extend({
    defaults: {},
    call: function(uri, data) {
      var deferred = Q.defer();
      var xhr = new XMLHttpRequest();
      xhr.open("POST", uri, true);
      xhr.onload = function (e) {
        if (xhr.status >= 200 && xhr.status < 400) {
          var data = JSON.parse(xhr.responseText);
          deferred.resolve(data);
        } else {
          deferred.reject(data);
        }
      };
      xhr.send(data);
      return deferred.promise;
    }
  });

  return Topologies;
});
