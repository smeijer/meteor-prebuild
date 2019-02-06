# Install

```
meteor add smeijer:prebuild
```

# Usage

Create a `.prebuild.js` file in the root of your project:

```js
// .prebuild.js

const git = require('git-rev-sync');

const version = git.tag(true).replace('dirty', git.short());

module.exports = {
  write: [
    { data: { version }, dest: './release.json', pretty: true },
  ],
  minify: [
    { entry: './imports/service-worker.js', dest: './public/service-worker.min.js', compile: true },
  ],
};
```
