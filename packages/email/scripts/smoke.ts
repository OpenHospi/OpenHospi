import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { Locale } from "@openhospi/i18n";

import { renderEmail, type EmailTemplateName, type TemplatePropsMap } from "../src/index";

const LOCALES: Locale[] = ["nl", "en", "de"];

const FIXTURES: { [K in EmailTemplateName]: TemplatePropsMap[K] } = {
  verificationCode: { code: "123456" },
  eventInvitation: {
    eventTitle: "Movie Night",
    roomTitle: "Cosy room in Amsterdam",
    eventUrl: "http://localhost:3000/applications",
  },
  eventReminder: {
    eventTitle: "Movie Night",
    time: "19:00",
    eventUrl: "http://localhost:3000/applications",
  },
  eventCancelled: { eventTitle: "Movie Night" },
  rsvpReceived: {
    name: "Jan de Vries",
    status: "attending",
    eventUrl: "http://localhost:3000/my-rooms",
  },
  applicationAccepted: {
    roomTitle: "Cosy room in Amsterdam",
    roomUrl: "http://localhost:3000/rooms/123",
  },
  applicationNotChosen: { roomTitle: "Cosy room in Amsterdam" },
  userBanned: { reason: "Repeated harassment of other users" },
  listingRemoved: { reason: "Listing contains misleading information" },
};

async function main() {
  const outDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist-html");
  await mkdir(outDir, { recursive: true });

  const templates = Object.keys(FIXTURES) as EmailTemplateName[];
  const baseUrl = "https://openhospi.nl";
  let failed = 0;

  for (const locale of LOCALES) {
    for (const template of templates) {
      const props = FIXTURES[template];
      try {
        const { html, text, subject } = await renderEmail(template, props, locale, baseUrl);
        if (!subject || !html || !text) {
          throw new Error(
            `empty output: subject=${subject.length}, html=${html.length}, text=${text.length}`,
          );
        }
        const htmlPath = resolve(outDir, `${locale}-${template}.html`);
        const textPath = resolve(outDir, `${locale}-${template}.txt`);
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths derived from compile-time fixtures, not user input
        await writeFile(htmlPath, html, "utf8");
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths derived from compile-time fixtures, not user input
        await writeFile(textPath, text, "utf8");
        console.log(`✓ ${locale}/${template} — "${subject}" (${html.length} B html)`);
      } catch (err) {
        failed += 1;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`✗ ${locale}/${template} — ${message}`);
      }
    }
  }

  const total = LOCALES.length * templates.length;
  if (failed > 0) {
    console.error(`\n${failed}/${total} renders failed`);
    process.exit(1);
  }
  console.log(`\nAll ${total} renders succeeded — artifacts in ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
