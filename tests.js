// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest';

// Import and rename a variable exported by prebuild.js.
import { name as packageName } from 'meteor/smeijer:prebuild';

// Write your tests here!
// Here is an example.
Tinytest.add('prebuild - example', function(test) {
  test.equal(packageName, 'prebuild');
});
