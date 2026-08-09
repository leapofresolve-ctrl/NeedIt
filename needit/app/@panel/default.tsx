/**
 * The resting state of the @panel slot: nothing.
 *
 * Required. Without a default, a soft navigation away from /post would leave
 * Next unable to resolve the slot for the new URL and it would keep rendering
 * the last thing it had — i.e. the panel would survive the very redirect that
 * is supposed to dismiss it.
 */
export default function PanelDefault() {
  return null;
}
