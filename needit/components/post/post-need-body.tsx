import { FirstRunHint } from "@/components/onboarding/first-run-hint";
import { PostNeedForm } from "@/components/post/post-need-form";

/**
 * Everything inside the max-w-lg column on /post: the first-run hint and the
 * form itself.
 *
 * Factored out so the full page (app/post/page.tsx) and the intercepted panel
 * (app/@panel/(.)post/page.tsx) render the SAME body and differ only in
 * chrome. The form is not forked and must never be — if the panel ever needs
 * the form to look different, that is a prop on PostNeedForm, not a copy.
 */
export function PostNeedBody() {
  return (
    <>
      <FirstRunHint id="post">
        <strong className="font-semibold">
          This is how buying works on Exprifi.
        </strong>{" "}
        You don&apos;t search for cards — you say what you want and your max,
        and sellers come to you.
      </FirstRunHint>
      <PostNeedForm />
    </>
  );
}
