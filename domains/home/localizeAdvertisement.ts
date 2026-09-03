import type { Locale } from "@/domains/i18n";
import type { Advertisement } from "@/domains/home/api";

const ADVERTISEMENT_AR: Record<string, { title: string; description: string }> = {
  "Partner Clinic Checkups": {
    title: "فحوصات في العيادات الشريكة",
    description: "احجز فحصاً شاملاً في عياداتنا الشريكة مع أطباء موثوقين.",
  },
  "Medicine Home Delivery": {
    title: "توصيل الأدوية للمنزل",
    description: "اطلب الروشتات والأدوية بدون وصفة مع توصيل سريع إلى باب منزلك.",
  },
  "Free Consultation Week": {
    title: "أسبوع الاستشارة المجانية",
    description: "مرضى جدد يحصلون على استشارة أولى مجانية مع أطباء مختارين هذا الشهر.",
  },
  "Annual Health Screening": {
    title: "الفحص الصحي السنوي",
    description: "باقات تحاليل وأشعة كاملة بأسعار مخفضة في العيادات الشريكة.",
  },
};

export function localizeAdvertisement(
  item: Advertisement,
  locale: Locale,
): Pick<Advertisement, "title" | "description"> {
  if (locale !== "ar") {
    return { title: item.title, description: item.description };
  }

  const translated = ADVERTISEMENT_AR[item.title];
  return translated ?? { title: item.title, description: item.description };
}
