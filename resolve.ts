import { satisfies } from "semver";

/** Registry configuration for different package scopes */
type RegistryConfig = {
  [scope: string]: string;
};

/** Package metadata from package.json or package-lock.json */
type PackageMetadata = {
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
  optionalDependencies?: { [key: string]: string };
};

/** Package registry response structure */
type PackageRegistryResponse = {
  name?: string;
  "dist-tags"?: { [tag: string]: string };
  time?: { [version: string]: string };
  versions?: {
    [version: string]: {
      dist: {
        tarball: string;
        fileCount?: number;
        unpackedSize?: number;
      };
      dependencies?: { [packageName: string]: string };
    };
  };
  // Add other possible package metadata fields
  description?: string;
  author?: any;
  homepage?: string;
  license?: string;
  repository?: any;
  /** Added by me */
  repositoryUrl?: string | null;
  bugs?: any;
  keywords?: string[];
  maintainers?: any[];
  readme?: string;
  readmeFilename?: string;
  _id?: string;
  _rev?: string;
  users?: any;
};

/** Enhanced package resolution result */
type PackageResolutionResult = {
  [packageName: string]: {
    version: string;
    versionTime: string;
    tarballUrl: string;
    metadata: Omit<PackageRegistryResponse, "versions" | "time">;
  };
};

/** Parse .npmrc to extract custom registry configurations */
function parseNpmrc(npmrcContent: string): RegistryConfig {
  const registryConfig: RegistryConfig = {};

  npmrcContent.split("\n").forEach((line) => {
    // Remove comments and trim whitespace
    line = line.split("#")[0].trim();

    // Look for registry configurations
    const registryMatch = line.match(/^(@\w+):registry\s*=\s*(.+)$/);
    if (registryMatch) {
      registryConfig[registryMatch[1]] = registryMatch[2];
    }
  });

  return registryConfig;
}

/** Determine the appropriate registry for a package */
function getPackageRegistry(
  packageName: string,
  registryConfig: RegistryConfig,
): string {
  // Check if package has a scoped registry
  const scopeMatch = packageName.match(/^(@[^/]+)\//);
  if (scopeMatch && registryConfig[scopeMatch[1]]) {
    return registryConfig[scopeMatch[1]];
  }

  // Default to npm registry
  return "https://registry.npmjs.org";
}

/** Fetch package metadata from registry */
async function fetchPackageMetadata(
  packageName: string,
  registryConfig: RegistryConfig,
  fetchFullMetadata: boolean = false,
): Promise<PackageRegistryResponse | null> {
  const registryUrl = getPackageRegistry(packageName, registryConfig);
  const fullUrl = `${registryUrl}/${packageName}`;

  // console.log(`Fetching metadata for ${packageName} from ${fullUrl}`);
  try {
    // Choose appropriate Accept header based on whether we want full or abbreviated metadata
    const headers = fetchFullMetadata
      ? { Accept: "application/json" } // Request full metadata
      : {
          Accept:
            "application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*",
        };

    const response = await fetch(fullUrl, { headers });

    if (!response.ok) {
      console.warn(
        `Failed to fetch metadata for ${packageName}: ${response.statusText}`,
      );
      return null;
    }

    return (await response.json()) as PackageRegistryResponse;
  } catch (error) {
    console.error(`Error fetching package metadata for ${packageName}:`, error);
    return null;
  }
}

/** Resolve package version and metadata according to npm conventions */
async function resolvePackageVersion(
  packageName: string,
  versionRange: string,
  registryConfig: RegistryConfig,
  fetchFullMetadata: boolean = false,
): Promise<{
  version: string;
  tarballUrl: string;
  versionTime: string;
  metadata: Omit<PackageRegistryResponse, "versions" | "time">;
  dependencies: { [packageName: string]: string };
} | null> {
  const metadata = await fetchPackageMetadata(
    packageName,
    registryConfig,
    fetchFullMetadata,
  );

  if (!metadata) {
    console.warn(`No metadata found for ${packageName}`);
    return null;
  }

  if (!metadata.versions) {
    console.warn(`No versions found for ${packageName}`);
    return null;
  }

  let version: string;

  // Handle "*" by using the latest tag
  if (versionRange === "*") {
    version =
      metadata["dist-tags"]?.latest ||
      Object.keys(metadata.versions).sort().pop() ||
      "";
    if (!version) {
      console.warn(`No latest version found for ${packageName}`);
      return null;
    }
  } else {
    // Find the latest version that satisfies the range
    const matchingVersions = Object.keys(metadata.versions).filter((version) =>
      satisfies(version, versionRange),
    );

    if (matchingVersions.length === 0) {
      console.warn(`No version found matching ${packageName}@${versionRange}`);
      return null;
    }

    // Take the most recent matching version
    version = matchingVersions.sort((a, b) => {
      // Parse versions as semver for proper comparison
      const aParts = a.split(".").map(Number);
      const bParts = b.split(".").map(Number);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        if (aVal !== bVal) return bVal - aVal; // Descending order
      }
      return 0;
    })[0];
  }

  const versionMetadata = metadata.versions[version];
  const versionTime = metadata.time?.[version] || new Date().toISOString();

  // Get dependencies for this specific version
  const dependencies = versionMetadata.dependencies || {};

  // Create a clean metadata object without versions and time
  const { versions, time, ...cleanMetadata } = metadata;

  const repositoryUrl = parseRepositoryUrl(cleanMetadata.repository);
  return {
    version,
    tarballUrl: versionMetadata.dist.tarball,
    versionTime,
    metadata: { repositoryUrl, ...cleanMetadata },
    dependencies,
  };
}

/**
 * Parse NPM repository field to a normalized URL string
 *
 * Handles various repository field formats:
 * - Object with type and url properties: { type: "git", url: "git+https://github.com/org/repo.git" }
 * - Simple string URL: "https://github.com/org/repo"
 * - Various Git URL formats
 *
 * @param repository The repository field from package.json
 * @returns A normalized repository URL as a string, or null if parsing fails
 */
export function parseRepositoryUrl(repository: any): string | null {
  // If repository is undefined or null
  if (repository == null || repository === undefined) {
    return null;
  }

  let url: string | null = null;

  // Handle object format: { type: "git", url: "..." }
  if (typeof repository === "object" && repository.url) {
    url = repository.url;
  }
  // Handle string format: "https://github.com/org/repo"
  else if (typeof repository === "string") {
    url = repository;
  }

  // If we couldn't extract a URL, return null
  if (!url) {
    return null;
  }

  // Normalize the URL

  // Remove 'git+' prefix
  url = url.replace(/^git\+/, "");

  // Convert git:// protocol to https://
  url = url.replace(/^git:\/\//, "https://");

  // Remove .git suffix
  url = url.replace(/\.git$/, "");

  // Ensure the URL uses https protocol
  if (url.startsWith("http://")) {
    url = url.replace(/^http:\/\//, "https://");
  }

  return url;
}
/**
 * Resolve package dependencies with enhanced metadata, including recursive resolution
 * for node_modules type - now with proper parallelization
 */
export async function resolveDependencies(
  packageJsonContent: string,
  npmrcContent: string,
  packageLockContent: string,
  type: "dependencies" | "node_modules",
): Promise<PackageResolutionResult> {
  // Parse input contents
  const packageJson: PackageMetadata = JSON.parse(packageJsonContent);
  const registryConfig = parseNpmrc(npmrcContent);

  // Collect dependencies based on type
  const dependencies: { [key: string]: string } = {};

  // Merge dependencies from package.json
  const collectDependencies = (deps?: { [key: string]: string }) => {
    if (deps) {
      Object.entries(deps).forEach(([name, version]) => {
        dependencies[name] = version;
      });
    }
  };

  if (type === "dependencies") {
    collectDependencies(packageJson.dependencies);
  } else {
    // For node_modules, include all dependency types
    collectDependencies(packageJson.dependencies);
    collectDependencies(packageJson.devDependencies);
    collectDependencies(packageJson.optionalDependencies);
  }

  // Final result object
  const result: PackageResolutionResult = {};

  if (type === "dependencies") {
    // For dependencies type, resolve direct dependencies in parallel
    const resolutionPromises = Object.entries(dependencies).map(
      async ([packageName, versionRange]) => {
        try {
          const resolvedPackage = await resolvePackageVersion(
            packageName,
            versionRange,
            registryConfig,
            true,
          );

          if (resolvedPackage) {
            const { dependencies, ...resolution } = resolvedPackage;
            return { packageName, resolution };
          }
        } catch (error) {
          console.error(`Error resolving ${packageName}:`, error);
        }
        return null;
      },
    );

    // Wait for all direct dependencies to be resolved
    const resolvedDependencies = await Promise.all(resolutionPromises);

    // Add resolved dependencies to result
    resolvedDependencies.forEach((item) => {
      if (item) {
        result[item.packageName] = item.resolution;
      }
    });
  } else {
    // For node_modules type, use a more sophisticated parallel resolution approach
    const processed = new Set<string>();
    const inProgress = new Map<string, Promise<void>>();

    // This function will handle resolving a package and its dependencies
    async function resolvePackageAndDependencies(
      packageName: string,
      versionRange: string,
    ): Promise<void> {
      // Skip if already processed
      const packageKey = `${packageName}@${versionRange}`;

      if (processed.has(packageKey)) {
        return;
      }

      // If already in progress, wait for it to complete
      if (inProgress.has(packageKey)) {
        await inProgress.get(packageKey);
        return;
      }

      // Mark as in progress with a promise that will resolve when done
      const resolutionPromise = (async () => {
        try {
          console.log(`Resolving ${packageName}@${versionRange}`);

          const resolvedPackage = await resolvePackageVersion(
            packageName,
            versionRange,
            registryConfig,
            false,
          );

          if (resolvedPackage) {
            // Add to result

            const { dependencies, ...rest } = resolvedPackage;
            result[packageName] = rest;

            // Process all dependencies in parallel
            if (resolvedPackage.dependencies) {
              const depPromises = Object.entries(
                resolvedPackage.dependencies,
              ).map(([depName, depVersion]) =>
                resolvePackageAndDependencies(depName, depVersion),
              );

              // Wait for all dependencies to resolve
              await Promise.all(depPromises);
            }
          }
        } catch (error) {
          console.error(`Error resolving ${packageName}:`, error);
        } finally {
          // Mark as processed and remove from in-progress
          processed.add(packageKey);
          inProgress.delete(packageKey);
        }
      })();

      // Store the promise
      inProgress.set(packageKey, resolutionPromise);

      // Wait for this package to be fully resolved
      await resolutionPromise;
    }

    // Start resolving all direct dependencies in parallel
    const initialPromises = Object.entries(dependencies).map(
      ([packageName, versionRange]) =>
        resolvePackageAndDependencies(packageName, versionRange),
    );

    // Wait for all resolution chains to complete
    await Promise.all(initialPromises);
  }

  return result;
}
