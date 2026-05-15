import autoprefixer from "autoprefixer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "tailwindcss";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Array form so Vite's dev postcss pipeline applies the Tailwind plugin with explicit config resolution. */
export default {
  plugins: [
    tailwindcss({
      config: path.join(__dirname, "tailwind.config.js"),
    }),
    autoprefixer(),
  ],
};
