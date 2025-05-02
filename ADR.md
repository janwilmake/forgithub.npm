# Treeshaking

Very important component of this tech. Tree-shaking is tightly coupled usually with building in several frameworks. Also it doesn't work well with CJS.

I'm using esbuild now for it's simplicity but it's treeshaking is not neciserily the best! Haven't tried webpack and rollup yet, and there are more. We can even implement our own using the tsc.

Learn more about treeshaking and how it's handled by several libraries:

- https://webpack.js.org/guides/tree-shaking/
- https://rollupjs.org/introduction/#tree-shaking
- https://esbuild.github.io/api/#tree-shaking

For making tree shaking work, it's important for libraries to not have side effects. Apparently this is not a solved problem yet so we need to rely on parameter `sideEffects:false` in package.json

# Conflicting package resolution

Currently we only support non-conflicting dependency trees and error out otherwise.

- support for package.json resolutions
- support to install dependency of a dependency in nested node_modules folder to prevent the package from conflicting with other dependencies

OR

✅ Make it more relaxed by resolving to the least conflicted version and return warnings in JSON
