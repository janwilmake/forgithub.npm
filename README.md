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
