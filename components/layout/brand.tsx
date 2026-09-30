/** Four squares, one of them the signal colour. */
export function BrandMark() {
  return (
    <span aria-hidden="true" className="grid size-6 shrink-0 grid-cols-2 grid-rows-2 gap-0.5">
      <i className="bg-foreground" />
      <i className="bg-primary" />
      <i className="bg-border" />
      <i className="bg-foreground" />
    </span>
  );
}
