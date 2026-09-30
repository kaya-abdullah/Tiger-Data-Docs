import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parse, stringify } from "yaml";

const HTTP_METHODS = new Set([
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
]);

type OpenAPIObject = Record<string, unknown>;

function isObject(value: unknown): value is OpenAPIObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonPublic(value: OpenAPIObject): boolean {
  return (
    value["x-tigerdata-internal"] === true ||
    value["x-tigerdata-preview"] === true
  );
}

function filterPathItems(pathItems: unknown): number {
  if (!isObject(pathItems)) return 0;
  let removed = 0;

  for (const [path, value] of Object.entries(pathItems)) {
    if (!isObject(value)) continue;
    if (isNonPublic(value)) {
      delete pathItems[path];
      removed += 1;
      continue;
    }

    for (const [method, operation] of Object.entries(value)) {
      if (
        HTTP_METHODS.has(method.toLowerCase()) &&
        isObject(operation) &&
        isNonPublic(operation)
      ) {
        delete value[method];
        removed += 1;
      }
    }

    if (
      !Object.keys(value).some((key) => HTTP_METHODS.has(key.toLowerCase()))
    ) {
      delete pathItems[path];
    }
  }

  return removed;
}

function stripVisibilityMarkers(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(stripVisibilityMarkers);
    return;
  }
  if (!isObject(value)) return;

  delete value["x-tigerdata-internal"];
  delete value["x-tigerdata-preview"];
  Object.values(value).forEach(stripVisibilityMarkers);
}

/**
 * Generate the public, build-local OpenAPI document used by Starlight.
 *
 * The upstream repository contains internal and preview operations. Filtering
 * happens on every build so those operations can never become documentation
 * pages merely because the vendored source file was refreshed.
 */
export async function generatePublicTigerCloudOpenAPI(
  source: URL,
  output: URL,
) {
  const document = parse(await readFile(source, "utf8")) as OpenAPIObject;
  if (
    document.openapi !== "3.0.3" ||
    !isObject(document.info) ||
    !isObject(document.paths)
  ) {
    throw new Error(
      "The vendored Tiger Cloud OpenAPI file is not the expected OpenAPI 3.0.3 document.",
    );
  }

  const removedOperations =
    filterPathItems(document.paths) + filterPathItems(document.webhooks);
  stripVisibilityMarkers(document);

  await mkdir(dirname(output.pathname), { recursive: true });
  await writeFile(output, stringify(document, { lineWidth: 0 }), "utf8");
  return { removedOperations };
}
