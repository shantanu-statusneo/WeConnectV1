import { getLanguageMetadata, type Language } from "@/lib/i18n";
import { notFound } from "next/navigation";

interface LanguageLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

// Generate static params for all supported languages
export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "hi" }, { lang: "fr" }];
}

export default async function LanguageLayout({
  children,
  params,
}: LanguageLayoutProps) {
  const { lang } = await params;

  // Validate language
  const validLanguages = ["en", "hi", "fr"];
  if (!validLanguages.includes(lang)) {
    notFound();
  }

  const langMeta = getLanguageMetadata(lang as Language);

  return (
    <div data-lang={lang} lang={langMeta.langCode}>
      {children}
    </div>
  );
}
