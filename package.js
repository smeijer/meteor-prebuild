var packages = [
  'ecmascript',
  'isobuild:compiler-plugin@1.0.0',
];

Package.describe({
  name: 'smeijer:prebuild',
  version: '1.0.1',
  summary: 'Compiler plugin to run node script prior to meteor build process',
  git: 'https://github.com/smeijer/meteor-prebuild',
  documentation: 'README.md',
});

Package.registerBuildPlugin({
  name: 'prebuild',
  use: [
    'minifier-js@2.4.0',
    'babel-compiler@7.2.4',
    'ecmascript',
  ],
  sources: [
    'plugin/cache.js',
    'plugin/constants.js',
    'plugin/prebuild.js',
    'plugin.js',
  ],
  npmDependencies: {
    "rollup": "1.1.2",
  },
});

Package.onUse(function use(api) {
  api.versionsFrom('1.3');
  api.use(packages, ['server']);
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('smeijer:prebuild');
  api.mainModule('tests.js');
});
