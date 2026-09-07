import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Ensambla la carpeta `public/` que sirve Firebase Hosting:
 *   /            → worship setlist (index.html estático, sin build)
 *   /grado-uno/  → Grado Uno (PWA React+Vite, build con base /grado-uno/)
 *
 * El producto worship sigue siendo abrible como index.html directo; este
 * script sólo empaqueta para el hosting. `public/` es un artefacto (gitignored).
 */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1) Worship app (main) en la raíz del hosting.
cpSync(join(root, "index.html"), join(out, "index.html"));
console.log("✔ worship → public/index.html");

// 1b) Archivos estáticos de la raíz del hosting (p. ej. hosting/sw.js, el
//     service worker que purga el SW viejo de Grado Uno registrado en "/").
cpSync(join(root, "hosting"), out, { recursive: true });
console.log("✔ hosting/* → public/");

// 2) Grado Uno (feature) construido y copiado bajo /grado-uno/.
const gradoUno = join(root, "grado-uno");
console.log("… building grado-uno (base /grado-uno/)");
execSync("npm run build", { cwd: gradoUno, stdio: "inherit" });
const dist = join(gradoUno, "dist");
if (!existsSync(dist)) throw new Error("grado-uno/dist missing after build");
cpSync(dist, join(out, "grado-uno"), { recursive: true });
console.log("✔ grado-uno → public/grado-uno/");

console.log("\nHosting listo en public/. Deploy: firebase deploy --only hosting");
