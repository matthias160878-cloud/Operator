import { getTranslations } from "next-intl/server";
import { WebsitePosts } from "@/components/website-posts/WebsitePosts";

export default async function WebsitePostsPage() {
  const t = await getTranslations("websitePosts");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("subtitle")}</p>
      </div>
      <WebsitePosts />
    </div>
  );
}
