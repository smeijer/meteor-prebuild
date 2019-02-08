// Write your package code here!

// Variables exported by this module can be imported by other packages and
// applications. See prebuild-tests.js for an example of importing.
export const name = 'prebuild';

const fs = Npm.require('fs');
const rollup = Npm.require('rollup').rollup;
const Future = Npm.require('fibers/future');

import cache from './cache';

import { APP_ID, PACKAGE_JSON, METEOR_RELEASE, METEOR_ROOT } from './constants';

export default class PreBuild {
  constructor() {
    const ROOT = Plugin.convertToOSPath(Plugin.fs.realpathSync('./'));

    const preBuild = PACKAGE_JSON.meteor && PACKAGE_JSON.meteor.preBuild;
    const preBuilds = Array.isArray(preBuild)
      ? preBuild
      : [preBuild || '.prebuild.js'];

    if (!fs.existsSync(Plugin.path.join(ROOT, preBuilds[0]))) {
      console.log(
        'No prebuild script found. Register the script your in package.json under meteor.preBuild, or add a ".prebuild.js" file to your project root',
      );
      return;
    }

    const context = {
      meteor: {
        appId: APP_ID,
        install: METEOR_ROOT,
        release: METEOR_RELEASE,
      },
      package: PACKAGE_JSON,
    };

    preBuilds.forEach(path => {
      const scriptPath = Plugin.path.join(ROOT, path);

      console.log('=> Running prebuild script: ' + path);

      const factory = require(scriptPath);
      const job = typeof factory === 'function' ? factory(context) : factory;

      if (Array.isArray(job.write)) {
        job.write.forEach(task => {
          const data = typeof task.data === 'function' ? task.data(context) : task.data;
          const json = task.pretty ?
            JSON.stringify(data, '', '  ') :
            JSON.stringify(data);

          Plugin.fs.writeFileSync(task.dest, json, 'utf8');
          console.log('  created ' + task.dest);
        });
      }

      // Minifying is done in a few stages.
      //
      //   1. We use rollup to bundle the resolved file tree into a singe file
      //   2. Babel compiles modern javascript to something node understands
      //   3. And the meteor minifier uses terser to reduce the size.
      //   4. The timestamps of the resolved files, are written to cache to
      //      prevent us from building the same file twice.
      if (Array.isArray(job.minify)) {
        const future = new Future();

        const minifyActions = job.minify.map(async task => {
          const bundle = await rollup({ input: task.entry });

          if (cache.includes(bundle.watchFiles) && fs.existsSync(task.dest)) {
            return;
          }

          const { output } = await bundle.generate({
            format: 'cjs',
          });

          const bundled = output.filter(x => !x.isAsset).map(x => x.code).join('\n\n');
          const compiled = Babel.compile(bundled);
          const minified = meteorJsMinify(compiled.code);

          Plugin.fs.writeFileSync(task.dest, minified.code, 'utf8');
          console.log('  saved ' + task.dest);
          cache.write(bundle.watchFiles);
        });

        Promise.all(minifyActions).then(() => {
          future.return();
        }).catch(() => {
          console.error('Something went wrong during prebuild');
          future.return();
        });

        // Ensure that pre-builds are running synchronous, to prevent meteor
        // from starting the app build before dynamic dependencies are saved.
        future.wait();
      }
    });

    console.log('\n=> Completed prebuild.\n');
  }

  // this method is required for meteor to be seen as a valid compiler plugin
  processFilesForTarget() {
  }
}
