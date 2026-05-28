import { useRouter } from "expo-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { showMessage } from "react-native-flash-message";
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { CheckIcon, CloseIcon, CrownIcon } from "@/components/ui/icons";
import { useQuotaStore } from "@/features/converter/store/use-quota-store";

// Radial dark-gold background with sparkle circles
export function PaywallBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
        <Defs>
          <RadialGradient
            id="radial-bg"
            cx="50%"
            cy="0%"
            rx="120%"
            ry="70%"
            fx="50%"
            fy="0%"
          >
            <Stop offset="0%" stopColor="#2A1F00" />
            <Stop offset="60%" stopColor="#0A0A0C" />
            <Stop offset="100%" stopColor="#0A0A0C" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#radial-bg)" />
        <Circle cx="12%" cy="18%" r="2" fill="#FFD200" fillOpacity={0.55} />
        <Circle cx="78%" cy="9%" r="2" fill="#FFFFFF" fillOpacity={0.35} />
        <Circle cx="22%" cy="36%" r="1.5" fill="#FFFFFF" fillOpacity={0.25} />
        <Circle cx="88%" cy="28%" r="2.5" fill="#FFD200" fillOpacity={0.45} />
        <Circle cx="60%" cy="14%" r="1.5" fill="#FFFFFF" fillOpacity={0.4} />
      </Svg>
      {children}
    </View>
  );
}

// Gold-orange gradient background medallion for CrownIcon
export function HeroMedallion() {
  return (
    <View
      style={{
        shadowColor: "#FF9600",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.55,
        shadowRadius: 60,
        elevation: 20,
      }}
      className="mb-4 size-19 items-center justify-center rounded-[26px] border border-white/20 bg-linear-to-br from-[#FFE066] via-[#FFB100] to-[#FF7A00]"
    >
      <CrownIcon color="#1A1A1C" size={42} />
    </View>
  );
}

// Bullet row layout showing PRO benefits
export function FeatureRow({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-3 py-1">
      <View
        style={{ elevation: 2 }}
        className="size-5.5 items-center justify-center rounded-full border border-white/20 bg-linear-to-br from-accent to-[#FFB100]"
      >
        <CheckIcon color="#1A1A1C" size={12} />
      </View>
      <Text className="flex-1 text-sm font-semibold text-white/95">
        {label}
      </Text>
    </View>
  );
}

type PlanCardInfo = {
  id: string;
  title: string;
  price: string;
  per: string;
  sub: string;
  badge?: string;
};

export function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: PlanCardInfo;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.8}
      className={`w-full flex-row items-center gap-3 rounded-[18px] border px-4 py-3.5 ${
        selected
          ? "border-accent bg-accent/12"
          : "border-white/10 bg-white/5"
      }`}
    >
      <View
        className={`size-5.5 items-center justify-center rounded-full border-2 ${
          selected
            ? "border-accent bg-accent"
            : "border-white/35 bg-transparent"
        }`}
      >
        {selected && (
          <CheckIcon color="#1A1A1C" size={10} />
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-[15px] font-extrabold text-white">
            {plan.title}
          </Text>
          {plan.badge && (
            <View className="rounded-full bg-accent px-2 py-0.5">
              <Text className="text-[9px] leading-none font-black tracking-widest text-[#1A1A1C] uppercase">
                {plan.badge}
              </Text>
            </View>
          )}
        </View>
        {plan.sub !== "" && (
          <Text className="mt-1 text-[11px] font-bold text-accent">
            {plan.sub}
          </Text>
        )}
      </View>

      <View className="items-end justify-center">
        <Text className="text-lg font-black text-white">
          {plan.price}
          {plan.per !== "" && (
            <Text className="text-[11.5px] font-semibold text-white/55">
              {" "}
              {plan.per}
            </Text>
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function TitleBlock({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View>
      <Text className="text-[11px] font-bold tracking-wider text-white/60 uppercase">
        {eyebrow}
      </Text>

      <View className="mt-2 flex-row items-baseline gap-2.5">
        <Text className="text-[38px] leading-none font-extrabold tracking-tighter text-white">
          {title}
        </Text>
        <View className="rounded-lg bg-linear-to-r from-accent to-[#FFB100] px-2.5 py-1">
          <Text className="text-lg leading-none font-black tracking-widest text-[#1A1A1C] uppercase">
            PRO
          </Text>
        </View>
      </View>
    </View>
  );
}

export function CTADock({
  ctaText,
  trialNote,
  restoreText,
  termsText,
  onPress,
  onBack,
}: {
  ctaText: string;
  trialNote: string;
  restoreText: string;
  termsText: string;
  onPress: () => void;
  onBack: () => void;
}) {
  return (
    <View className="bg-linear-to-b from-transparent via-bg/85 to-bg px-[22px] pt-3 pb-[18px]">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          shadowColor: "#FF9600",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.5,
          shadowRadius: 36,
          elevation: 10,
        }}
        className="w-full items-center justify-center rounded-full border border-transparent bg-linear-to-br from-[#FFE066] via-[#FFB100] to-[#FF8A00] py-4.5"
      >
        <Text className="text-base font-black tracking-tight text-[#1A1A1C] uppercase">
          {ctaText}
        </Text>
      </TouchableOpacity>

      <Text className="mt-2.5 text-center text-[11.5px] leading-normal text-white/50">
        {trialNote}
      </Text>

      <View className="mt-2 flex-row items-center justify-center gap-3.5">
        <TouchableOpacity onPress={onBack}>
          <Text className="text-[11.5px] font-semibold text-white/55">
            {restoreText}
          </Text>
        </TouchableOpacity>
        <Text className="text-[11.5px] font-bold text-white/20">·</Text>
        <TouchableOpacity onPress={onBack}>
          <Text className="text-[11.5px] font-semibold text-white/55">
            {termsText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function usePaywallScreenState() {
  const router = useRouter();
  const { t } = useTranslation();
  const { unlockPro } = useQuotaStore();

  const [selectedPlan, setSelectedPlan] = React.useState("yearly");

  const features = [
    t("converter.featureNoAds"),
    t("converter.featureUnlimited"),
    t("converter.featurePrecision"),
    t("converter.featureWidgets"),
    t("converter.featureWallpapers"),
    t("converter.featureSync"),
  ];

  const plans = [
    {
      id: "monthly",
      title: t("converter.planMonthly"),
      price: "$4.99",
      per: t("converter.pricePerMonth"),
      sub: "",
    },
    {
      id: "yearly",
      title: t("converter.planYearly"),
      price: "$19.99",
      per: t("converter.pricePerYear"),
      sub: t("converter.save60"),
      badge: t("converter.bestValue"),
    },
    {
      id: "lifetime",
      title: t("converter.planLifetime"),
      price: "$49.99",
      per: t("converter.priceOnce"),
      sub: "",
    },
  ];

  const handlePurchase = () => {
    unlockPro();
    showMessage({
      message: "Subscription Active",
      description: "You are now a PRO member! Thank you.",
      type: "success",
      duration: 3000,
    });
    router.back();
  };

  return {
    router,
    t,
    selectedPlan,
    setSelectedPlan,
    features,
    plans,
    handlePurchase,
  };
}

export default function PaywallScreen() {
  const {
    router,
    t,
    selectedPlan,
    setSelectedPlan,
    features,
    plans,
    handlePurchase,
  } = usePaywallScreenState();

  return (
    <PaywallBackground>
      {/* Close Button */}
      <View className="absolute top-3.5 right-3.5 z-10">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="size-9 items-center justify-center rounded-full border border-white/12 bg-white/10 active:opacity-75"
          accessibilityLabel="Close"
        >
          <CloseIcon color="#FFF" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 40, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <HeroMedallion />

        <TitleBlock eyebrow={t("converter.paywallEyebrow")} title={t("converter.paywallTitle")} />

        <Text className="mt-2.5 text-[14px] leading-relaxed text-white/70">
          {t("converter.paywallSubtitle")}
        </Text>

        <View className="mt-5 gap-2.5">
          {features.map(f => (
            <FeatureRow key={f} label={f} />
          ))}
        </View>

        <View className="mt-6 gap-2.5">
          {plans.map(p => (
            <PlanCard
              key={p.id}
              plan={p}
              selected={selectedPlan === p.id}
              onSelect={() => setSelectedPlan(p.id)}
            />
          ))}
        </View>
      </ScrollView>

      <CTADock
        ctaText={t("converter.paywallCta")}
        trialNote={t("converter.trialNote")}
        restoreText={t("converter.restorePurchase")}
        termsText={t("converter.termsAndPrivacy")}
        onPress={handlePurchase}
        onBack={() => router.back()}
      />
    </PaywallBackground>
  );
}
