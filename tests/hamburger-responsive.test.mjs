import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const topBarSource = readFileSync("components/layout/top-bar.tsx", "utf8");
const desktopNavSource = readFileSync("components/layout/desktop-nav.tsx", "utf8");
const topbarSearchSource = readFileSync("components/layout/topbar-search.tsx", "utf8");
const hamburgerSource = readFileSync("components/layout/hamburger-menu.tsx", "utf8");

test("hamburger navigation is only exposed before the regular desktop navigation fits", () => {
  assert.match(topBarSource, /<div className="lg:hidden">\s*<HamburgerMenu profile=\{profile\} \/>/);
  assert.match(desktopNavSource, /className="hidden lg:flex items-center gap-1"/);
  assert.match(topbarSearchSource, /className="relative flex-1 max-w-md mx-2 hidden lg:flex"/);
  assert.match(topBarSource, /className="lg:hidden inline-flex items-center justify-center w-10 h-10/);
});

test("hamburger drawer owns viewport height and keeps the nav body scrollable", () => {
  assert.match(hamburgerSource, /"relative h-dvh max-h-dvh min-h-0 w-\[88vw\] max-w-sm/);
  assert.match(hamburgerSource, /"min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain/);
});

test("hamburger drawer closes when the viewport becomes wide enough for desktop navigation", () => {
  assert.match(hamburgerSource, /window\.matchMedia\("\(min-width: 1024px\)"\)/);
  assert.match(hamburgerSource, /mediaQuery\.addEventListener\("change", onDesktopBreakpoint\)/);
});
