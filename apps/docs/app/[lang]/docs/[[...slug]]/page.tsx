import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMDXComponents } from "@/components/mdx";
import { gitConfig } from "@/lib/layout.shared";
import { getPageImage, source } from "@/lib/source";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const { slug, lang } = await params;
  const page = source.getPage(slug, lang);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={`${page.url}.mdx`} />
        <ViewOptionsPopover
          markdownUrl={`${page.url}.mdx`}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/apps/docs/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { slug, lang } = await params;
  const page = source.getPage(slug, lang);
  if (!page) notFound();

  const image = getPageImage(page);

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: [{ url: image.url }],
    },
  };
}
