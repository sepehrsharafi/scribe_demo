import {
  RiMailLine,
  RiMicLine,
  RiQuestionLine,
  RiSparklingLine,
  RiVerifiedBadgeLine,
} from "@remixicon/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eyebrow, Page, PageHead } from "@/components/page-layout";
import { getI18n } from "@/lib/i18n/server";

const topics = [
  {
    icon: RiMicLine,
    title: "Recording a visit",
    copy: "Consent, microphone checks, pausing, and what happens if the browser closes.",
  },
  {
    icon: RiSparklingLine,
    title: "Reviewing a draft",
    copy: "Edit the text directly, or ask for a revision scoped to one section.",
  },
  {
    icon: RiVerifiedBadgeLine,
    title: "Signing and addenda",
    copy: "What locking means, how versions are kept, and how to correct a signed note.",
  },
];

const faqs = [
  {
    question: "Where do I find a patient's notes?",
    answer:
      "On the consultation they came from. Open a patient to see every consultation in one list, then open a consultation for its note, its transcript and its processing history — all three are tabs on the same page.",
  },
  {
    question: "What happens if the browser closes during a visit?",
    answer:
      "Audio is written to local storage in encrypted chunks as it is captured, not held whole in memory. When you return, Scribe offers to recover the recording and carry on from where it stopped.",
  },
  {
    question: "Can Scribe add a finding that was not discussed?",
    answer:
      "No. The model may summarise and clinically rephrase, but it cannot introduce findings, values, diagnoses, or medications that are absent from the transcript. Sections that were never covered stay marked as explicit gaps.",
  },
  {
    question: "Can a signed note be changed?",
    answer:
      "A signed note is read-only. Any later correction is stored as a separate addendum, so the original record and the full version chain behind it stay intact.",
  },
  {
    question: "How long does a draft take to arrive?",
    answer:
      "Roughly proportional to the length of the recording. The visit shows its real state the whole time, and you can leave the page and come back without losing anything.",
  },
];

export default async function Help() {
  const { t } = await getI18n();

  return (
    <Page className="space-y-8">
      <PageHead
        eyebrow={t("Support")}
        title={t("How can we help?")}
        description={t("Short answers for capturing, recovering, reviewing, and signing a consultation.")}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {topics.map(({ icon: Icon, title, copy }) => (
          <Card
            key={title}
            size="sm"
            className="relative transition-colors hover:bg-muted/40"
          >
            <CardHeader>
              <a href="#questions" className="after:absolute after:inset-0">
                <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
                  <Icon className="size-4.5" />
                </span>
                <CardTitle className="mt-3">{t(title)}</CardTitle>
              </a>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">
              {t(copy)}
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-4" id="questions">
        <div className="flex items-center justify-between gap-4 border-b pb-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            {t("Common questions")}
          </h2>
          <Eyebrow>{t("{count} answers", { count: faqs.length })}</Eyebrow>
        </div>
        <Accordion>
          {faqs.map(({ question, answer }) => (
            <AccordionItem key={question} value={question}>
              <AccordionTrigger>{t(question)}</AccordionTrigger>
              <AccordionContent className="max-w-prose leading-relaxed text-muted-foreground">
                {t(answer)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <Alert>
        <RiQuestionLine />
        <AlertTitle>{t("Still need a hand?")}</AlertTitle>
        <AlertDescription>
          {t("Demo support usually replies within one working day.")}
        </AlertDescription>
        <div className="col-start-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            render={<a href="mailto:support@scribe.demo" />}
          >
            <RiMailLine data-icon="inline-start" />
            {t("Contact support")}
          </Button>
        </div>
      </Alert>
    </Page>
  );
}
