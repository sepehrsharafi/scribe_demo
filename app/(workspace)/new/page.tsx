import { Capture } from "./capture";

export default async function New({ searchParams }: PageProps<"/new">) {
  const { resume, patient } = await searchParams;
  const patientId = Array.isArray(patient) ? patient[0] : patient;

  /*
   * `Capture` holds the stage it is on in state, and /new -> /new is a same
   * route navigation, so without a key the flow would stay on the screen it was
   * already showing. "New consultation" from a finished draft is exactly that
   * navigation, and it did nothing until this key was here.
   */
  return (
    <Capture
      key={`${resume ? "resume" : ""}|${patientId ?? ""}`}
      resumed={Boolean(resume)}
      patientId={patientId}
    />
  );
}
