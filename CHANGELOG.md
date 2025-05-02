# September 28th, 2024

Implemented tar unpacking logic

# October 1st 2024

First version is live! I've implemented dependency resolving (/resolve) asa well as getting package contents (/package) and getting all contents for all modules with (/modules)

Huge first day. It's live to production within ±3 hours. Never made a SaaS so fast!

# October 7th, 2024: Resolve bigger packages

Due to the architecture, things are now limited to smaller packages. This can likely be resolved if we implement streaming and ensure memory usage is efficient.

**Improved `edge-util` and other packages**

- ✅ Read in about esbuild a bit more
- 🤔🟠 Found that `edge-util` is still crappy because the ESM part gets errors. Let's try ESM only now since it'd be better anyway for treeshaking. or at least have a way to confirm the esm build works before deploying.
- ✅ Add a check in my packages for it to be buildable with esbuild
- ✅ Test in `test` folder until tree-shaking `edge-util` works
- 💡 Learned that we need sideEffects:false in package.json to support better splitting. Crazy!
- ✅ create a new version of `edge-util` that has proper ESM

**performance**

- ✅ In `/resolve` add size info, and limit size at 10MB, otherwise cancel early.

**bundling a repo/package** (see `/npm` and `/package`)

- ✅ If no names are given or `?bundle=true` just bundle normally.
- ✅ Allow `?filter=a,b,c` param to filter on names to make output size much smaller.
- ✅ When name filter is given, attach new entry that only import/exports those names from the actual entry - should then be automatically fixed using tree-shaking.

If this works I've got something awesome. Figure out how to make the code here as human-readable as possible.

TEST:

- ✅ https://npmjz.com/files/edge-util?filter=mapMany,oneByOne
- ✅ https://npmjz.com/files/edge-util?bundle=true

✅ Alter the composition of files and repo so we can get these node_modules and filters for both!

🎉 I can now get super small bundles for the `edge-util` package. Let's continue on the parsing front!

# Better files endpoint (october 9th, 2024)

- ✅ cleanup
- ✅ accept header for uithub.
- ✅ Ensure OpenAPI shows accept header as param in files, and support stream, json, and text.
- ✅ Add `/files/gh/*` to OpenAPI
- ✅ Try `npmjz/files` and confirm it works well for both repos and npm

# Parse (october 9th, 2024)

- ✅ parse
- ✅ found back swc-helpers stuff for parsing into typescript data
- ✅ much better parsing
- ✅ Simplify: `npmjz/parse` = `npmjz/files` + `swcapi/swc/parse`
- ✅ Try it with swc 3001 and ensure to log errors and fix them
- ✅ Make `npmjz/imports` work
- ✅ From files:
  - ✅ looks up package.json
  - ✅ looks up entry that we choose (prioritize ESM)
  - ✅ if found, filters out the rest of the files
  - ✅ parse only the entry files
  - ✅ respond with imports
- ✅ For each item, retrieve and put in JSON
  - ✅ isPackage:boolean
  - ✅ packageName
  - ✅ isModule:boolean
  - ✅ hasSideEffectsFalse
  - ✅ imports
- ✅ Using `npmjz/imports`, implement `minimal-modules` **doesn't work good yet, but starting point is there**

# Improvements (october 18th, 2024)

✅ Update URL structure making it more flexible

✅ Created initial version of og:image for uithub repos. Fixed problematic things with it. Now works everywhere!

✅ Allow retrieving hash and size for github

✅ Same for npmjs

✅ Also support for JSR.io so I can start experimenting with this

✅ Fix getAssetsManifest by using https://jsr.io/@bcheidemann/flatten-ignorefiles and https://jsr.io/@ivanmaxlogiudice/gitignore

🤔 by default, all can be made static in the folder, except .ts I guess as that's obviously not usable yet in web. if we can somehow figure out which files are meant for backend and which aren't we can also filter out backendfiles, but don't have to. at this stage we can assume .md is already gone if it was source.

✅ Figure out a ignore file parser that actually works without fs/path

# Added readme finder - november 18, 2024

It is now possible to get all readmes by going to /package-readmes/...id (or manually via /readme). Support for markdown + json. Very useful as context for github repos!

# May 2nd, 2025

Holy shit, time goes fast. I've moved away from the previous npmjz version as it was too chaotic and built on old principles. The new version should be more integratable with `uit`. Let's try to keep it coherent this time.
