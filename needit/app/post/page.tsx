import { SiteHeader } from "@/components/site-header";
import { PostNeedBody } from "@/components/post/post-need-body";
import { requirePostAccess } from "@/lib/post-access";

/**
 * The full page. Reached by a hard load, a refresh, or a shared link.
 *
 * Client-side navigation to /post from anywhere in the app is intercepted by
 * app/@panel/(.)post/page.tsx and renders as a right-gutter panel instead. This
 * file is the floor under that: nobody ends up in a modal with nothing behind
 * it, and /post stays a real, shareable, refreshable URL.
 */
export default async function PostPage() {
  await requirePostAccess();

  return (
    <main className="min-h-screen flex flex-col items-center">
      <SiteHeader />
      <div className="w-full max-w-lg flex flex-col gap-4 p-5">
        <PostNeedBody />
      </div>
    </main>
  );
}
