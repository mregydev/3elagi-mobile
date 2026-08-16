import React from "react";
import { PublicFaqSection } from "@/components/marketing/PublicFaqSection";
import { PublicHeroMediaSection } from "@/components/marketing/PublicHeroMediaSection";
import { PublicHeroSection } from "@/components/marketing/PublicHeroSection";
import { PublicHowItWorksSection } from "@/components/marketing/PublicHowItWorksSection";
import { PublicRoleChoiceSection } from "@/components/marketing/PublicRoleChoiceSection";
import { useWebLayout } from "@/hooks/useWebLayout";

interface Props {
  showFaq?: boolean;
}

export function PublicLandingSections({ showFaq = true }: Props) {
  const { isDesktop } = useWebLayout();

  return (
    <>
      {/* CTAs default to /doctors — see PublicHeroSection. */}
      <PublicHeroSection showMedia={isDesktop} />
      {!isDesktop ? <PublicHeroMediaSection /> : null}
      {/* No handler: the patient card always lands on the doctor directory. */}
      <PublicRoleChoiceSection />
      <PublicHowItWorksSection />
      {showFaq ? <PublicFaqSection compact /> : null}
    </>
  );
}
