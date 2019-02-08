import PreBuild from './plugin/prebuild';

Plugin.registerCompiler(
  {
    extensions: ['prebuild.js'],
  },
  function compiler() {
    return new PreBuild();
  },
);
