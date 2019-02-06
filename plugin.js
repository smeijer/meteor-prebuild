import PreBuild from './prebuild';

Plugin.registerCompiler({
  extensions: ['prebuild.js'],
}, function compiler() {
  return new PreBuild();
});
