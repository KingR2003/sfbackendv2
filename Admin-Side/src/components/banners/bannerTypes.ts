export type BannerStatus = "Active" | "Scheduled" | "Expired" | "Inactive";
export type BannerPlatform = "App" | "Website" | "Both";
export type BannerCampaign = "Festival" | "Seasonal" | "Discount" | "New Product" | "Announcement";
export type BannerGender = "All" | "Male" | "Female";
export type BannerAgeGroup = "All Ages" | "13–17" | "18–25" | "26–35" | "36–45" | "45+";
export type BannerRedirect = "Honey" | "Chikki" | "Ghee" | "Custom Page";

export interface BannerAnalytics {
  views: number;
  clicks: number;
}

export interface Banner {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  platform: BannerPlatform;
  gender: BannerGender;
  ageGroup: BannerAgeGroup;
  campaign: BannerCampaign;
  buttonText: string;
  redirectPage: BannerRedirect;
  priority: number;
  startDate: string; // ISO date-time string
  endDate: string;
  active: boolean;
  status: BannerStatus;
  analytics: BannerAnalytics;
  createdAt: string;
}

export function computeStatus(banner: Pick<Banner, "active" | "startDate" | "endDate">): BannerStatus {
  if (!banner.active) return "Inactive";
  const now = new Date();
  const start = new Date(banner.startDate);
  const end = new Date(banner.endDate);
  if (start > now) return "Scheduled";
  if (end < now) return "Expired";
  return "Active";
}

export function ctr(a: BannerAnalytics): string {
  if (a.views === 0) return "0%";
  return `${((a.clicks / a.views) * 100).toFixed(1)}%`;
}

export function daysUntilExpiry(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 1,
    title: "Women's Day Special",
    description: "Celebrate Women's Day with pure organic honey.",
    imageUrl: "/banner-womens-day.jpg",
    platform: "Both",
    gender: "Female",
    ageGroup: "18–25",
    campaign: "Festival",
    buttonText: "Shop Now",
    redirectPage: "Honey",
    priority: 1,
    startDate: "2026-03-01T10:00",
    endDate: "2026-03-08T23:59",
    active: true,
    status: "Active",
    analytics: { views: 2340, clicks: 324 },
    createdAt: "2026-02-25T09:00",
  },
  {
    id: 2,
    title: "Honey Sale – 20% Off",
    description: "Get 20% off on all honey products this week.",
    imageUrl: "/banner-honey.jpg",
    platform: "App",
    gender: "Male",
    ageGroup: "All Ages",
    campaign: "Discount",
    buttonText: "Buy Now",
    redirectPage: "Honey",
    priority: 2,
    startDate: "2026-03-05T00:00",
    endDate: "2026-03-15T23:59",
    active: true,
    status: "Active",
    analytics: { views: 1820, clicks: 210 },
    createdAt: "2026-03-01T11:00",
  },
  {
    id: 3,
    title: "Chikki Festival Pack",
    description: "Limited edition chikki packs for the festive season.",
    imageUrl: "/banner-chikki.jpg",
    platform: "Website",
    gender: "Female",
    ageGroup: "All Ages",
    campaign: "Seasonal",
    buttonText: "Explore",
    redirectPage: "Chikki",
    priority: 3,
    startDate: "2026-03-20T00:00",
    endDate: "2026-04-05T23:59",
    active: true,
    status: "Scheduled",
    analytics: { views: 0, clicks: 0 },
    createdAt: "2026-03-05T14:00",
  },
  {
    id: 4,
    title: "Ghee Launch Offer",
    description: "Introducing our new pure cow ghee – first 500 orders get 15% off.",
    imageUrl: "/banner-ghee.webp",
    platform: "Both",
    gender: "Male",
    ageGroup: "26–35",
    campaign: "New Product",
    buttonText: "Order Now",
    redirectPage: "Ghee",
    priority: 4,
    startDate: "2026-02-01T00:00",
    endDate: "2026-02-28T23:59",
    active: false,
    status: "Expired",
    analytics: { views: 4100, clicks: 890 },
    createdAt: "2026-01-28T10:00",
  },
];

export const CAMPAIGN_OPTIONS: BannerCampaign[] = ["Festival", "Seasonal", "Discount", "New Product", "Announcement"];
export const PLATFORM_OPTIONS: BannerPlatform[] = ["App", "Website", "Both"];
export const GENDER_OPTIONS: BannerGender[] = ["All", "Male", "Female"];
export const AGE_OPTIONS: BannerAgeGroup[] = ["All Ages", "13–17", "18–25", "26–35", "36–45", "45+"];
export const REDIRECT_OPTIONS: BannerRedirect[] = ["Honey", "Chikki", "Ghee", "Custom Page"];
export const CTA_OPTIONS = ["Shop Now", "Buy Now", "Explore", "Order Now", "Learn More"];
