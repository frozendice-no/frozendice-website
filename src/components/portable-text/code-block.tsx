import { codeToHtml } from "shiki";

type CodeValue = {
  language?: string;
  code: string;
};

type Props = { value: CodeValue };

export async function CodeBlock({ value }: Props) {
  const language = value.language ?? "text";
  const html = await codeToHtml(value.code, {
    lang: language,
    themes: { light: "github-light", dark: "github-dark" },
  });
  return (
    <div
      className="my-6 overflow-x-auto rounded-lg border text-sm [&_pre]:p-4 [&_pre]:bg-transparent"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
