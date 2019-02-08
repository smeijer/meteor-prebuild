# Install

```
meteor add smeijer:prebuild
```

# Usage

Create a `.prebuild.json` file in the root of your project:

```json
{
    "exec": [
        { "file": "./write-release-info.js" }
    ],
    "bundle": [
        { "entry": "./service-worker.js", "dest": "./sw.min.js" }
    ] 
}
```

Make sure that the code in `exec` files is running sync! Otherwise Meteor will finish the build before your prebuild has been completed. This can cause issues, if you're writing files there, upon which the build is depending.

