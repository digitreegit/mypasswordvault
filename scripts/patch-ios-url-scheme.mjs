/**
 * Ensures Supabase OAuth deep link scheme is registered in the iOS app.
 * Run after `npx cap add ios` or `npx cap sync` if redirects fail.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const plistPath = join(process.cwd(), "ios/App/App/Info.plist");
const scheme = "com.skyface.mypasswordvault";

if (!existsSync(plistPath)) {
  console.log("patch-ios-url-scheme: ios/App/App/Info.plist not found — skip");
  process.exit(0);
}

let xml = readFileSync(plistPath, "utf8");
if (xml.includes(`<string>${scheme}</string>`)) {
  console.log("patch-ios-url-scheme: scheme already present");
  process.exit(0);
}

const block = `	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleURLName</key>
			<string>${scheme}</string>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>${scheme}</string>
			</array>
		</dict>
	</array>
`;

if (xml.includes("<key>CFBundleURLTypes</key>")) {
  console.log("patch-ios-url-scheme: CFBundleURLTypes exists but scheme missing — edit Info.plist manually");
  process.exit(1);
}

xml = xml.replace(
  "</dict>\n</plist>",
  `${block}</dict>\n</plist>`
);
writeFileSync(plistPath, xml);
console.log("patch-ios-url-scheme: added", scheme);
