import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../features/vayon/property/components/PropertyWizard.tsx", import.meta.url), "utf8");
const stepper = source.slice(source.indexOf('<nav className="mt-5'), source.indexOf("{error &&"));

test("property wizard uses ten real navigation buttons with visible number and title", () => {
  assert.match(stepper, /<button/);
  assert.match(stepper, /<span aria-hidden="true" className="font-semibold">\{number\}<\/span>/);
  assert.match(stepper, /<span>\{section\}<\/span>/);
  for (const label of ["Basic", "Location", "Pricing", "Pricing Details", "Media", "Amenities", "Ownership", "Documents", "Review", "Publish"]) {
    assert.match(source, new RegExp(label));
  }
});

test("active and inactive buttons have the required substantial presentation", () => {
  assert.match(stepper, /min-h-12/);
  assert.match(stepper, /min-w-\[140px\]/);
  assert.match(stepper, /items-center justify-start gap-2\.5 whitespace-nowrap rounded-xl/);
  assert.match(stepper, /px-5 py-3/);
  assert.match(stepper, /bg-vds-success font-bold text-vds-on-accent/);
  assert.match(stepper, /bg-vds-elevated text-vds-muted hover:bg-vds-hover/);
});

test("step navigation scrolls and snaps responsively without hiding or clipping labels", () => {
  assert.match(stepper, /overflow-x-auto/);
  assert.match(stepper, /min-w-max snap-x snap-mandatory/);
  assert.match(stepper, /shrink-0 snap-start/);
  for (const forbidden of ["overflow-hidden", "absolute", "opacity-0", "sr-only", "line-clamp", "truncate", "text-transparent", 'className={active?"inline":"hidden']) {
    assert.doesNotMatch(stepper, new RegExp(forbidden));
  }
});

test("current step and keyboard-native navigation remain accessible", () => {
  assert.match(stepper, /aria-current=\{active \? "step" : undefined\}/);
  assert.match(stepper, /Step \$\{number\} of \$\{sections\.length\}, \$\{section\}/);
  assert.match(stepper, /type="button"/);
  assert.match(stepper, /onClick=\{\(\) => setStep\(number\)\}/);
  assert.match(stepper, /focus-ring/);
});
