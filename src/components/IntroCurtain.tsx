import { LogoMark } from "@/components/Logo";

// A brief branded hold over the first paint, so photography arrives behind it
// rather than popping in under the reader.
//
// Deliberately CSS-only, with no JavaScript anywhere in it. A curtain driven by
// a script is a curtain that can get stuck: if the bundle fails, or is slow, or
// throws, the visitor is left staring at a covered site with no way through.
// This one is dismissed by an animation the browser has already committed to
// before the first frame, so it always lifts -- even with JavaScript disabled.
//
// It sits in the root layout, which React keeps mounted across client-side
// navigation, so it plays once on arrival and never again while browsing.
export function IntroCurtain() {
  return (
    <div className="intro-curtain" aria-hidden="true">
      <div className="intro-curtain-mark">
        <LogoMark size={56} />
      </div>
    </div>
  );
}
