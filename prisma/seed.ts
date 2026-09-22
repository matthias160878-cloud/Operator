/**
 * Demo-Daten für ein aussagekräftiges Dashboard bei der ersten Installation.
 * WICHTIG: Diese Daten sind eindeutig als Beispieldaten gekennzeichnet
 * (Setting "demoDataSeeded"), das UI zeigt dafür einen "Demo-Daten"-Hinweis.
 * Plattform-Accounts werden bewusst NICHT als "Verbunden" geseedet — echte
 * Verbindungen entstehen ausschließlich über echte OAuth-Zugangsdaten.
 *
 * Ausführen mit: npx prisma db seed
 */
import { PrismaClient, Platform, ContentStatus } from "@prisma/client";

const prisma = new PrismaClient();

const PLATFORMS: Platform[] = [
  "YOUTUBE",
  "TIKTOK",
  "INSTAGRAM",
  "LINKEDIN",
  "FACEBOOK",
];

const DEMO_TITLES = [
  "Die Zukunft autonomer KI-Agenten",
  "5 KI-Agenten, die dein Leben verändern",
  "KI im Business — Chancen & Risiken",
  "Tools für kreative Content-Erstellung",
  "Wie Content-Automatisierung wirklich funktioniert",
  "Der größte Fehler bei KI-Content",
  "So baust du deine erste KI-Kampagne",
  "Hinter den Kulissen: Ein Tag mit SECRET 58",
];

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const existingDemo = await prisma.setting.findFirst({
    where: { key: "demoDataSeeded" },
  });
  if (existingDemo) {
    console.log("Demo-Daten bereits vorhanden — überspringe Seed (kein Duplikat).");
    return;
  }

  const workspace = await prisma.workspace.upsert({
    where: { slug: "secret-58" },
    update: {},
    create: {
      name: "Secret 58 Media",
      slug: "secret-58",
      users: {
        create: {
          email: "max.mustermann@secret58.media",
          name: "Max Mustermann",
          role: "OWNER",
        },
      },
      brand: {
        create: {
          name: "Secret 58",
          description:
            "KI-natives Social-Media-Studio für autonome Content-Produktion.",
          targetAudience: "25-45 Jahre, Tech-Interessierte",
          industry: "KI & Technologie",
          language: "Deutsch",
          tonality: "Professionell & Inspirierend",
          humor: "Dezent",
          formality: "Neutral, geduzt",
          preferredWords: JSON.stringify(["autonom", "Wirkung", "Klarheit"]),
          forbiddenWords: JSON.stringify(["revolutionär", "disruptiv"]),
          preferredCtas: JSON.stringify([
            "Jetzt mehr erfahren",
            "Starte deine erste Kampagne",
          ]),
          brandValues: JSON.stringify(["Innovation", "Vertrauen", "Erfolg"]),
          topics: JSON.stringify([
            "KI-Agenten",
            "Content-Automatisierung",
            "Social Media Strategie",
          ]),
          colors: JSON.stringify(["#6D5BFF", "#22D3EE", "#0B0F1A"]),
          fonts: JSON.stringify(["Geist Sans", "Geist Mono"]),
          visualRules: "Dunkles UI, HUD-Elemente, klare Typografie.",
        },
      },
    },
  });

  for (const platform of PLATFORMS) {
    await prisma.platformAccount.upsert({
      where: { workspaceId_platform: { workspaceId: workspace.id, platform } },
      update: {},
      create: {
        workspaceId: workspace.id,
        platform,
        accountName: "",
        status: "NOT_CONFIGURED",
      },
    });
  }

  const campaign = await prisma.campaign.create({
    data: {
      workspaceId: workspace.id,
      title: "KI-Agenten Revolution",
      goal: "Reichweite & Thought Leadership",
      targetAudience: "25-45 Jahre, Tech-Interessierte",
      platforms: JSON.stringify(PLATFORMS),
      language: "Deutsch",
      status: "ACTIVE",
    },
  });

  const growthCampaign = await prisma.campaign.create({
    data: {
      workspaceId: workspace.id,
      title: "Social Media Wachstum",
      goal: "Follower-Wachstum",
      targetAudience: "18-35 Jahre, Creator-Community",
      platforms: JSON.stringify(["INSTAGRAM", "TIKTOK"]),
      language: "Deutsch",
      status: "DRAFT",
    },
  });

  const launchCampaign = await prisma.campaign.create({
    data: {
      workspaceId: workspace.id,
      title: "Produkt Launch",
      goal: "Launch-Ankündigung",
      targetAudience: "Bestehende Kundschaft",
      platforms: JSON.stringify(PLATFORMS),
      language: "Deutsch",
      status: "DRAFT",
    },
  });

  for (const [camp, count, prefix] of [
    [growthCampaign, 6, "Wachstum"],
    [launchCampaign, 12, "Launch"],
  ] as const) {
    for (let i = 0; i < count; i++) {
      await prisma.contentItem.create({
        data: {
          workspaceId: workspace.id,
          campaignId: camp.id,
          title: `${prefix}-Idee ${i + 1}`,
          platform: PLATFORMS[i % PLATFORMS.length],
          format: "Entwurf",
          status: "DRAFT",
          language: "Deutsch",
        },
      });
    }
  }

  const now = new Date();
  const statuses: ContentStatus[] = [
    "DRAFT",
    "IN_REVIEW",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
    "PUBLISHED",
  ];

  for (let i = 0; i < DEMO_TITLES.length; i++) {
    const platform = PLATFORMS[i % PLATFORMS.length];
    const status = statuses[i % statuses.length];
    const createdAt = new Date(now.getTime() - randomBetween(0, 6) * 86400000);
    const scheduledAt =
      status === "SCHEDULED" || status === "PUBLISHED"
        ? new Date(now.getTime() + randomBetween(-3, 4) * 86400000)
        : null;

    const item = await prisma.contentItem.create({
      data: {
        workspaceId: workspace.id,
        campaignId: campaign.id,
        title: DEMO_TITLES[i],
        platform,
        format: platform === "YOUTUBE" ? "Video" : platform === "BLOG" ? "Artikel" : "Reel",
        status,
        hook: `${DEMO_TITLES[i]} — das musst du wissen.`,
        script: `HOOK: ${DEMO_TITLES[i]}\n\nPROBLEM: Viele verstehen den Wandel noch nicht.\n\nVALUE: Wir erklären die wichtigsten Effekte.\n\nEXAMPLE: Ein Praxisbeispiel aus dem Alltag.\n\nPAYOFF: Mehr Klarheit und Zeitersparnis.\n\nCTA: Folge uns für mehr.`,
        hashtags: JSON.stringify(["#KI", "#SocialMedia", "#Automatisierung"]),
        keywords: JSON.stringify(["KI-Agenten", "Automatisierung"]),
        language: "Deutsch",
        thumbnailIdea: `Thumbnail-Konzept für "${DEMO_TITLES[i]}"`,
        scheduledAt,
        publishedAt: status === "PUBLISHED" ? createdAt : null,
        createdAt,
      },
    });

    if (status === "PUBLISHED") {
      await prisma.analytics.create({
        data: {
          contentItemId: item.id,
          platform,
          views: randomBetween(4000, 130000),
          likes: randomBetween(200, 9000),
          comments: randomBetween(10, 900),
          shares: randomBetween(5, 700),
          saves: randomBetween(0, 400),
          engagementRate: Number((Math.random() * 12 + 2).toFixed(1)),
          watchTimeSeconds: randomBetween(20, 240),
          recordedAt: createdAt,
        },
      });
    }
  }

  const revenueSamples: Array<{
    source: string;
    type: "AD_REVENUE" | "SPONSORSHIP" | "AFFILIATE" | "DONATION" | "OTHER";
    platform: Platform | null;
    amount: number;
    status: "RECEIVED" | "PENDING";
    daysAgo: number;
  }> = [
    { source: "YouTube Partnerprogramm", type: "AD_REVENUE", platform: "YOUTUBE", amount: 184.32, status: "RECEIVED", daysAgo: 3 },
    { source: "Sponsoring Acme GmbH", type: "SPONSORSHIP", platform: "INSTAGRAM", amount: 650, status: "RECEIVED", daysAgo: 6 },
    { source: "Affiliate-Links Blogartikel", type: "AFFILIATE", platform: "BLOG", amount: 42.5, status: "RECEIVED", daysAgo: 10 },
    { source: "Sponsoring TechStart AG", type: "SPONSORSHIP", platform: "TIKTOK", amount: 400, status: "PENDING", daysAgo: 1 },
  ];

  for (const r of revenueSamples) {
    await prisma.revenueEntry.create({
      data: {
        workspaceId: workspace.id,
        campaignId: campaign.id,
        source: r.source,
        type: r.type,
        platform: r.platform,
        amount: r.amount,
        currency: "EUR",
        status: r.status,
        origin: "MANUAL",
        recordedAt: new Date(now.getTime() - r.daysAgo * 86400000),
      },
    });
  }

  const agentSamples: Array<{
    agentKey: string;
    agentName: string;
    task: string;
    status: "SUCCESS" | "RUNNING" | "WAITING" | "ERROR";
  }> = [
    { agentKey: "content-brain", agentName: "ContentBrainAgent", task: "Analysiert Content-Plan", status: "SUCCESS" },
    { agentKey: "script", agentName: "ScriptAgent", task: "Erstellt Script für YouTube", status: "SUCCESS" },
    { agentKey: "video", agentName: "VideoAgent", task: "Generiert Video (9/16)", status: "RUNNING" },
    { agentKey: "publishing", agentName: "PublishingAgent", task: "Wartet auf Freigabe", status: "WAITING" },
    { agentKey: "analytics", agentName: "AnalyticsAgent", task: "Sammelt Performance-Daten", status: "SUCCESS" },
  ];

  for (const sample of agentSamples) {
    const startedAt = new Date(now.getTime() - randomBetween(2, 240) * 60000);
    await prisma.agentRun.create({
      data: {
        workspaceId: workspace.id,
        agentKey: sample.agentKey,
        agentName: sample.agentName,
        task: sample.task,
        status: sample.status,
        startedAt,
        finishedAt: sample.status === "SUCCESS" ? new Date(startedAt.getTime() + randomBetween(30, 300) * 1000) : null,
        result: sample.status === "SUCCESS" ? "Abgeschlossen." : null,
      },
    });
  }

  await prisma.setting.upsert({
    where: { workspaceId_key: { workspaceId: workspace.id, key: "demoDataSeeded" } },
    update: { value: "true" },
    create: { workspaceId: workspace.id, key: "demoDataSeeded", value: "true" },
  });

  console.log("Demo-Daten erfolgreich geseedet für Workspace:", workspace.slug);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
