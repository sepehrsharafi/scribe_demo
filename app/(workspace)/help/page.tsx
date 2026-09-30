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
    title: "Starting a visit",
    copy: "Pick the patient and press Start once they agree to be recorded. Attach files on the Context tab before or during the visit.",
  },
  {
    icon: RiSparklingLine,
    title: "Reviewing the note",
    copy: "The note and the patient’s instructions are documents you edit like any text, headings included. Highlighted phrases need a check.",
  },
  {
    icon: RiVerifiedBadgeLine,
    title: "Approving",
    copy: "Approving signs off the note and the instructions together. Both stay editable; a later change is flagged until you approve it.",
  },
];

const faqs = [
  {
    question: "What are the four tabs on a visit?",
    answer:
      "Context is what to know going in — a one-line summary, each problem on the record and the plan for the visit — with any attached files. Note is the clinical record. Instructions is the same plan in plain words for the patient to take home. Transcript is the conversation it all came from, turn by turn.",
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
    question: "Can an approved note be changed?",
    answer:
      "Yes. Approving signs a note off; it does not lock it. Change the note or the instructions at any time — the visit shows that they changed after approval, and one click approves the changes.",
  },
  {
    question: "What happens if I switch tabs while recording?",
    answer:
      "In Chrome and Edge, pressing Start floats the recording in a small window that stays on top of other tabs and apps, with pause and the way back. Close it and the recording waits in the corner of Scribe instead; Pop out brings the window back. Elsewhere it carries on in the corner of Scribe.",
  },
  {
    question: "How long does a note take to arrive?",
    answer:
      "Seconds. The visit shows each step as it happens — securing the audio, transcribing, writing the note, writing the instructions — and you can leave the page and come back without losing anything.",
  },
];

export default async function Help() {
  const { t } = await getI18n();

  return (
    <Page className="space-y-8">
      <PageHead
        eyebrow={t("Support")}
        title={t("How can we help?")}
        description={t("Short answers for starting, recovering, reviewing, and approving a visit.")}
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
