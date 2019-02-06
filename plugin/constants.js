const fs = Npm.require('fs');

export const IS_METEOR_APP = fs.existsSync('./.meteor');

export const APP_ID = IS_METEOR_APP ? Plugin.fs
  .readFileSync('./.meteor/.id', 'utf8')
  .split('\n')
  .find(x => x[0] !== '#' && x !== '')
  .trim() : new Date().getTime();

export const PACKAGE_JSON = IS_METEOR_APP ? JSON.parse(
  Plugin.fs.readFileSync('./package.json', 'utf8'),
) : {};

export const METEOR_RELEASE = IS_METEOR_APP ? Plugin.fs.readFileSync(
  './.meteor/release',
  'utf8',
) :  'unknown';

export const METEOR_ROOT = (function resolveMeteorRoot() {
  const paths = [
    Plugin.path.join(process.argv[1], '../../'),
    Plugin.path.join(process.env.BABEL_CACHE_DIR, '../'),
    Plugin.path.join(process.env.NODE_PATH, '../../../'),
  ];

  for (let i = 0; i < paths.length; i++) {
    if (
      fs.existsSync(Plugin.path.join(paths[i], '/tools')) &&
      fs.existsSync(Plugin.path.join(paths[i], '/dev_bundle'))
    ) {
      return paths[i];
    }
  }
})();
