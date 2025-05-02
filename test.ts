import { resolveDependencies } from "./resolve.ts";

// Sample implementation when called directly
const samplePackageJson = JSON.stringify({
  dependencies: {
    express: "^4.18.2",
    chalk: "^4.1.2",
  },
});
const sampleNpmrc = "";
const samplePackageLock = JSON.stringify({});

const startTime = Date.now();

resolveDependencies(
  samplePackageJson,
  sampleNpmrc,
  samplePackageLock,
  "dependencies",
)
  .then((result) => {
    const duration = Date.now() - startTime;
    console.log(
      `Resolved ${
        Object.keys(result).length
      } packages in total in ${duration}ms`,
    );
    console.log("Direct dependencies:");
    ["express", "chalk"].forEach((dep) => {
      if (result[dep]) {
        console.log(`- ${dep}@${result[dep].version}`);
      }
    });

    // Print some nested dependencies for express
    console.log("\nSome nested dependencies of express:");
    ["accepts", "body-parser", "debug"].forEach((dep) => {
      if (result[dep]) {
        console.log(`- ${dep}@${result[dep].version}`);
      } else {
        console.log(`- ${dep} (not resolved)`);
      }
    });
  })
  .catch((err) => console.error("Error:", err));
