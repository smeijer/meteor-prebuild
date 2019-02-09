const fs = Npm.require('fs');
const rollup = Npm.require('rollup').rollup;
const Future = Npm.require('fibers/future');
const exec = Npm.require('sync-exec');

import cache from './cache';

import { PACKAGE_JSON } from './constants';

function ensurePath(file) {
  const dirName = Plugin.path.basename(
    Plugin.path.dirname(Plugin.path.resolve(file)),
  );

  if (!fs.existsSync(dirName)) {
    Plugin.fs.mkdirSync(dirName, { recursive: true });
  }
}

function log(msg, point) {
  const whitespace = ' '.repeat(Math.max(1, 50 - msg.length));
  const message = (point ? '=> ' : '') + msg + whitespace;
  console.log(message);
}

export default class PreBuild {
  constructor() {
    const ROOT = Plugin.convertToOSPath(Plugin.fs.realpathSync('./'));

    let config = PACKAGE_JSON.meteor && PACKAGE_JSON.meteor.preBuild;
    let configChanged = cache.includes('package.json');

    if (!config && fs.existsSync('.prebuild.json')) {
      configChanged = cache.includes('.prebuild.json');
      config = JSON.parse(Plugin.fs.readFileSync('.prebuild.json', 'utf8'));
    }

    if (!config) {
      return;
    }

    log('Running prebuild', true);

    if (Array.isArray(config.exec)) {
      config.exec.forEach(task => {
        log('   Running script ' + task.file);
        // Dynamic includes don't work on Mac and Linux, as Meteor has wrapped the
        // require call. I guess it's a bug on Windows, that it worked at all. Just
        // spawn a node instance instead.
        const result = exec('meteor node ' + task.file, task.args || [], {
          cwd: ROOT,
        });
        if (result.status !== 0) {
          log('   ERROR while running ' + task.file);
        }
      });
    }

    // Minifying is done in a few stages.
    //
    //   1. We use rollup to bundle the resolved file tree into a singe file
    //   2. Babel compiles modern javascript to something node understands
    //   3. And the meteor minifier uses terser to reduce the size.
    //   4. The timestamps of the resolved files, are written to cache to
    //      prevent us from building the same file twice.
    if (Array.isArray(config.bundle)) {
      const future = new Future();

      const threads = config.bundle.map(async task => {
        if (!task.entry) {
          throw new Error(
            "You haven't provided an `entry` property for your bundle task",
          );
        }

        if (!task.dest) {
          throw new Error(
            "You haven't provided an `dest` property for your bundle task",
          );
        }

        const minify =
          task.minify === true ||
          (task.minify !== false && process.env.NODE_ENV === 'production');

        const bundle = await rollup({ input: task.entry });
        if (
          !configChanged &&
          cache.includes(bundle.watchFiles) &&
          fs.existsSync(task.dest)
        ) {
          return;
        }

        log('   Bundling file ' + task.entry);

        const { output } = await bundle.generate({
          format: 'cjs',
        });

        let code = output
          .filter(x => !x.isAsset)
          .map(x => x.code)
          .join('\n\n');

        if (minify) {
          code = meteorJsMinify(code).code;
        }

        ensurePath(task.dest);

        Plugin.fs.writeFileSync(task.dest, code, 'utf8');
        cache.write(bundle.watchFiles);
      });

      Promise.all(threads)
        .then(() => {
          future.return();
        })
        .catch(ex => {
          console.error('Something went wrong during prebuild');
          console.error(ex);
          future.return();
        });

      // Ensure that pre-builds are running synchronous, to prevent meteor
      // from starting the app build before dynamic dependencies are saved.
      future.wait();
    }

    log('Completed prebuild.', true);
  }

  // this method is required for meteor to be seen as a valid compiler plugin
  processFilesForTarget() {}
}
