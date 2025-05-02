# jsr

https://news.ycombinator.com/item?id=39561594

This could become huge if deno starts taking off at some point

It is better than npm in many aspects.

It may also be better for me since it links directly to the typescript sources which are much better to be analysed.

It also poses the opportunity to automatically generate many packages with AI into JSR from npmjs.

Also jsr exposes perfect docs (.d.ts I guess).

I think there will be a prompt possible that takes the package and augments it into a cloudflare worker. Imagine we could create hundreds of little tools like comparevector, one being for toml conversion? https://jsr.io/@std/toml/doc It'd be huge for marketing for jsr.

Answer: with something similar to https://github.com/CodeFromAnywhere/microflare-template and some post processing to jsr packages with swc, we can turn any jsr function from any package into an API.

This. is. huge.

# Package Health Table

- ✅ Get top 1000 npm packages
- ✅ Store that into a JSON
- Get my own repos
- Get my own packages
- Represent the result of this in a HTML table
- Add links to useful things to test

Ensure the health table is available (hardcoded) on the website.

In uithub filter out all package.json files and link through to npmjz for them from the header

This will bring me back into flow as it gives me perspective.

# More

- Using `npmjz/parse` implement a dependency tree endpoint `npmjz/deptree` (use `simpleCircularDependencyFinder`). It'd be very cool to show this tree for every package&repo
- Also get entry-point exports using SWC. star-re-exports could be tough to manage so let's not do that yet and see how much that's needed.

✨ I've spent weeks and weeks in this realm so it's nice to put something out thare that's actually accessible!

# Package Health Endpoint 2.0

For any given package or repofolder we need an endpoint that can tell us this:

- Does it use `sideEffects:false`?
- How well does tree-shaking work? (each and avg % of bundle size compared to package size + dependency size, lower is better)
- How well does tree-shaking work for each dependency?
- What are the named imports / packages?
- What are the named exports? From any given selection of these, what context do we get?
- What is the unpackedSize of all dependencies via `/modules` and via `/minimal-modules`
- Size
- Speed loading
- Format
- Can I make a service-worker bundle successfully and how big is the worker?

Ensure this endpoint is cached on `[codeVersion]/[packageName]/[version]`. This is also a great starting point for a search engine so let's make it a vector + R2 for big pieces. `data` can be description of the package/repo.

Then, use the endpoint in the HTML file `package.html`

This is actually something I want to keep doing in realtime, forever. Best to create some sort of tracking/watching system for it rather than doing 1000+ requests daily. Having this dataset live, putting it in a nice html will help to convince users of what's possible.

<!--
With this in place, I can continue with deployment.
-->

# Type definitions

- Expose an endpoint `/types` that functions like `/modules` but instead gives text back for each package
- Figure out when to search for @types/package and how that convention works for @owner/package
- Try to figure out how to filter this with same names filter (use `&{packageName}.names=x,y,z`). see if I can do the same thing with the bundle with a prefix. try it out with `/Users/admin/Desktop/p0/edge-util/build/types/getQueryPath.d.ts` first. typeof?
- If that doesn't work, try Use a tool like api-extractor or dts-bundle-generator:
  These tools can bundle your .d.ts files into a single declaration file. api-extractor (by Microsoft): https://api-extractor.com/ or dts-bundle-generator: https://github.com/timocov/dts-bundle-generator
- from the typescript types bundle, prune it recursively using ts to get the needed types. see https://claude.ai/chat/22c45248-fe33-41da-a4f2-4928983eea2f for a starting point. maybe there's an easier way.
- ensure it gives all type information back of exported names for a package including doc comments, but nothing else.
- From there, we can use `typescript-to-json-schema` (maybe needs some alterations) and we can now make a `SemanticOperationSchema` for any function. Bonkers!
- It'd be worthwhile to cache this data in r2 on a per-version basis, separately, so this api can be super cheap and fast.
- Having the source code is already great for LLM so it solves the problem. no further parsing needed. However, to also make it a JSONSchema for more programmatic control on validation.

This is actually a much better VP that goes direct to the main application. What you need is you pass a `package.json` as body, and you get llm context back superfast.

This is a huge thing to have as it makes adding minimal context to a piece of code much easier. Imagine now having an AI use this endpoint! I want this to work for ALL esm packages.

# Streaming

Allow `stream:boolean` to also allow for bigger files.

# Global caching

We could implement global caching to circumvent [ratelimit](https://blog.npmjs.org/post/187698412060/acceptible-use.html): Any usage above this 5 million requests per month threshold is considered excessive and unacceptable use.

To circumvent this we can track packages using hooks and keep a global duplicated cache: https://www.openapisearch.com/api/npm-registry/openapi.html#/paths/npm-v1-hooks-hook/post
