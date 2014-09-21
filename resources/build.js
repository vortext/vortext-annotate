({
  appDir: "public",
  baseUrl: "scripts",
  mainConfigFile: './public/scripts/common.js',
  dir: "build",
  optimize: "uglify2",
  useStrict: true,

  // call with `node r.js -o build.js`
  // add `optimize=none` to skip script optimization (useful during debugging).
  // see https://github.com/requirejs/example-multipage/
  onBuildWrite: function (moduleName, path, singleContents) {
    return singleContents.replace(/jsx!/g, '');
  },

  optimizeCss: 'standard',

  modules: [
    {
      name: "common",
      exclude: ["jsx", "react", "PDFJS"]
    },
    {
      name: 'project',
      include: ['dispatchers/project'],
      exclude: ['common']
    },
    {
      name: 'documents',
      include: ['dispatchers/documents'],
      exclude: ['common']
    },
    {
      name: 'document',
      include: ['dispatchers/document'],
      exclude: ['common']
    }
  ]
})
