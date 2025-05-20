# npm module resolution via a simple API: https://npm.forgithub.com

Resolves npm package info via npm registry (see https://raw.githubusercontent.com/npm/registry/refs/heads/main/docs/responses/package-metadata.md)

AI Coding Models hallucinate on the contents of packages. It does not use any context of the actual stuff inside of packages. For bigger packages it's totally fine, but what about smaller ones that aren't represented well in your dataset of the model, or packages owned by the user? You need this additional context to have an AI chatbot that does not hallucinate.

Features:

- `/owner/repo[/node_modules][/branch][/...basePath]` - get file object that contains all node_modules or just 1 layer of dependencies. for the 1 layer, it includes readme files as well (if present). Resolves only from npmjs registry without looking at the tarfile yet.

Goals:

- Allow easy serverless access to npm package resolving
- Cheap, efficient, scalable
- **Coding context**: simple endpoint you provide with all files in your project, and you get a context-string per-file

Non-goals:

- Fancy website etc

# TODO

This is cool but a bit restrictive! It only works for a specific package.json in a given folder, and it only works for github as a source. To improve this, I need it to work as a transformer.

- **As a `formdata-transformer`**: turn `forgithub.npm` into a formdata transformer plugin that runs the resolver for every package.json that is encountered after that entire folder is scanned (also taking npmrc and package-lock.json) - it can become `uithub.npm` now.
- **As a `file-transformer`**: instead of this, think about it as an api instead. it'd take `{"package.json":object,"package-lock.json"?:object,".npmrc"?:string}` and it'd be able to resolve for that. before doing that though, think about monorepos. how should that be resolved?

**❌ As a ingest source returning FormData**:

- rename `node_modules` to `resolve-modules`
- in `resolve-modules`, return the resolved packages for all `package.json`s found, and call that `package-lock.json` if thats similar at all
- in `npm-install` it should use `resolve-modules` first and for each `package-lock.json` run `npm install` (merge formdata streams and put a prefix)

I can now visit `/owner/repo/npm-install` and it'd stream the node_modules needed to me. Think about limitations and write them into the plugin description/readme.

# GOAL: Resolver of github OR npm repos based off `package.json` in a repo.

- Source1: npm.forgithub.com --> dependencies: `(repositoryUrl | packageUrl)[]`
- Document how to use `uithub` as API or make `uitx` package already
- Create a merger that uses source of uithub itself in parallel, and outputs `FormData` for an applied filter on every repo/package.
- BONUS: for repo urls we'd want to use the sha closest to the releasedate (or tag-based) so the source is correct

This would allow getting original source files for all packages, applying a search over each in a fast way. Super dope. If this works, I can apply the same concept for `awesome` repos as well as `lists`.

Share with the world: all js/jsx/ts/tsx for all dependencies.

THIS IS THE FUTURE.

FOCUS on these merged sources:

- dependencies
- lists
- awesome repos
- popular
- Symbolic + semantic + LLM search to select repos about a topic

After that, create a multi-step pruning workflow that makes most sense.
