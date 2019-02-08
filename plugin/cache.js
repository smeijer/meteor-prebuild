const fs = Npm.require('fs');
import { APP_ID, METEOR_ROOT } from './constants';

const CACHE_DIR = Plugin.path.join(
  METEOR_ROOT, '.babel-cache',
);

const CACHE_FILE = Plugin.path.join(
  CACHE_DIR,
  'prebuild.' + APP_ID + '.json',
);

const cache = {
  _keys: fs.existsSync(CACHE_FILE)
    ? JSON.parse(Plugin.fs.readFileSync(CACHE_FILE, 'utf8'))
    : {},

  modifiedTime(file) {
    return new Date(fs.statSync(file).mtime).getTime();
  },

  write(file) {
    const files = Array.isArray(file) ? file : [file];

    const times = files.map(f => new Date(fs.statSync(f).mtime).getTime());

    files.forEach((f, i) => {
      this._keys[f] = times[i];
    });

    Plugin.fs.mkdirSync(CACHE_DIR, { recursive: true });
    Plugin.fs.writeFileSync(CACHE_FILE, JSON.stringify(this._keys), 'utf8');
  },

  includes(file) {
    const files = Array.isArray(file) ? file : [file];

    if (!files.every(f => this._keys[f])) {
      return false;
    }

    return files.every(f => this._keys[f] === this.modifiedTime(f));
  },
};

export default cache;
