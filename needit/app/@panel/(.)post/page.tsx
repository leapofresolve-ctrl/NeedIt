import { SiteHeader } from "@/components/site-header";
import { PostNeedBody } from "@/components/post/post-need-body";
import { PostNeedPanel } from "@/components/post/post-need-panel";
import { requirePostAccess } from "@/lib/post-access";

/**
 * Intercepts a client-side navigation to /post and renders it as a panel over
 * whatever the seller was already looking at. A hard load of /post skips this
 * entirely and gets app/post/page.tsx.
 *
 * Same gate as the full page, deliberately: an intercepted route is still a
 * route, and a logged-out soft navigation must redirect rather than render a
 * form nobody can submit.
 *
 * The body is the shared <PostNeedBody />. The header is passed in as a prop
 * because the panel is a client component and <SiteHeader /> is not — and it is
 * only ever shown below lg, where the panel covers the page's own header.
 */
export default async function PostNeedPanelPage() {
  await requirePostAccess();

  return (
    <PostNeedPanel mobileHeader={<SiteHeader />}>
      <PostNeedBody />
    </PostNeedPanel>
  );
}
