/* -*- tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2; js-indent-level: 2; -*- */
define(function (require) {
  'use strict';

  var DOCUMENTS_URI = window.location.href + "/documents";

  var _ = require("underscore");
  var Backbone = require("backbone");
  var FileUtil = require("helpers/fileUtil");
  var Q = require("Q");

  var Document = Backbone.Model.extend({
    idAttribute: "fingerprint",
    urlRoot: DOCUMENTS_URI,
    defaults: {
      name: null,
      _progress: null,
      _upload: null
    }
  });

  var Documents = Backbone.Collection.extend({
    model: Document,
    remove: function(models, options) {
      var model = Backbone.Collection.prototype.remove.call(this, models, options);
      model.destroy();
    },
    upload: function(files) {
      var self = this;
      var documents = _.map(files, function(file) {
        return FileUtil.readFileAsBinary(file).then(function(data) {
          return PDFJS.getDocument(data).then(function(pdf) {

            var document = {
              fingerprint: pdf.pdfInfo.fingerprint,
              name: file.name
            };

            var upload = FileUtil.send(DOCUMENTS_URI, file, document);
            document._upload = upload;

            return document;
          });
        });
      });

      Q.all(documents).then(function(documents) {
        self.add(documents);
        self.each(function(document) {
          var  _upload = document.get("_upload");
          if(_upload) {
            _upload.then(
              function(data) {
                document.unset("_upload");
              },
              function(error) {
                document.unset("_upload");
              },
              function(progress) {
                document.set("_progress", progress);
              });
          }
        });
      });
    }
  });

  return Documents;
});
