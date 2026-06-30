import { ChevronDown } from "./Icons";

export function HelpFaqItem({
  question,
  answerHtml,
}: {
  question: string;
  answerHtml: string;
}) {
  const html = answerHtml.replace(/\s*\n\s*/g, " ").trim();

  return (
    <details className="help-faq-item group rounded-lg border border-ink-200 bg-white open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-ink-900 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 text-left leading-snug">{question}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-ink-400 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div
        className="help-faq-item__answer border-t border-ink-100 px-4 py-3 text-sm text-ink-600 leading-snug [&_strong]:font-semibold [&_strong]:text-ink-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </details>
  );
}
