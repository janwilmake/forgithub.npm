import { resolveDependencies } from "./resolve";

export default {
  async fetch(request: Request) {
    try {
      // Extract owner/repo from the URL path
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/").filter(Boolean);

      if (pathParts.length < 2) {
        return new Response(
          "Please provide a GitHub repository path in the format: /owner/repo",
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const owner = pathParts[0];
      const repo = pathParts[1];
      const type =
        pathParts[2] === "node_modules" ? "node_modules" : "dependencies";
      const branch = pathParts[3] || "master";
      const basePath = pathParts.slice(4).join("/");
      // GitHub raw content base URL
      const rawGitHubUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}${
        basePath ? `/` + basePath : ""
      }`;
      // Fetch package.json
      const packageJsonResponse = await fetch(`${rawGitHubUrl}/package.json`);

      if (!packageJsonResponse.ok) {
        return new Response(
          JSON.stringify({
            error: `Failed to fetch package.json: ${packageJsonResponse.status} ${packageJsonResponse.statusText}`,
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const packageJsonContent = await packageJsonResponse.text();

      // Try to fetch .npmrc (optional)
      let npmrcContent = "";
      try {
        const npmrcResponse = await fetch(`${rawGitHubUrl}/.npmrc`);
        if (npmrcResponse.ok) {
          npmrcContent = await npmrcResponse.text();
        }
      } catch (error) {
        console.log("No .npmrc file found or error fetching it:", error);
      }

      // Empty package-lock.json since we're not using it
      const packageLockContent = "{}";

      // Resolve dependencies
      const dependencies = await resolveDependencies(
        packageJsonContent,
        npmrcContent,
        packageLockContent,
        type,
      );

      // Format the result
      const result = {};

      result[`dependencies.json`] = {};
      // Process each dependency
      for (const [packageName, info] of Object.entries(dependencies)) {
        // Create JSON file with package info

        const {
          metadata: { readme, users, ...metadata },
          ...json
        } = info;
        result[`dependencies.json`][packageName] = { ...json, ...metadata };

        if (readme) {
          result[`${packageName}.md`] = readme;
        }
      }

      return new Response(JSON.stringify(result, null, 2), {
        headers: {
          "Content-Type": "application/json;charset=utf8",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
