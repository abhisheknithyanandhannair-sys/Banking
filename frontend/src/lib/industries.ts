import { CountryCode, CountryIndustryOption, RegistrationProfile } from "@/types";

export const industryCatalogByCountry: Record<CountryCode, CountryIndustryOption[]> = {
  ireland: [
    {
      value: "construction",
      label: "Construction",
      sector: "construction",
      subIndustries: [
        { value: "residential-build", label: "Residential Build" },
        { value: "commercial-fit-out", label: "Commercial Fit-Out" },
        { value: "public-infrastructure", label: "Public Infrastructure" },
      ],
    },
    {
      value: "professional-services",
      label: "Professional Services",
      sector: "professional_services",
      subIndustries: [
        { value: "accounting-advisory", label: "Accounting & Advisory" },
        { value: "legal-compliance", label: "Legal & Compliance" },
        { value: "business-consulting", label: "Business Consulting" },
      ],
    },
    {
      value: "wholesale-retail",
      label: "Wholesale & Retail",
      sector: "retail",
      subIndustries: [
        { value: "specialty-retail", label: "Specialty Retail" },
        { value: "omnichannel-commerce", label: "Omnichannel Commerce" },
        { value: "trade-distribution", label: "Trade Distribution" },
      ],
    },
    {
      value: "accommodation-food",
      label: "Accommodation & Food",
      sector: "hospitality",
      subIndustries: [
        { value: "hotels-stays", label: "Hotels & Stays" },
        { value: "food-service", label: "Food Service" },
        { value: "tourism-experiences", label: "Tourism Experiences" },
      ],
    },
    {
      value: "manufacturing",
      label: "Manufacturing",
      sector: "manufacturing",
      subIndustries: [
        { value: "food-processing", label: "Food Processing" },
        { value: "industrial-components", label: "Industrial Components" },
        { value: "consumer-goods-production", label: "Consumer Goods Production" },
      ],
    },
    {
      value: "ict-tech-services",
      label: "ICT & Tech Services",
      sector: "ict",
      subIndustries: [
        { value: "saas-platforms", label: "SaaS Platforms" },
        { value: "it-services", label: "IT Services" },
        { value: "data-cyber", label: "Data & Cyber" },
      ],
    },
  ],
  france: [
    {
      value: "professional-tech-services",
      label: "Professional & Tech Services",
      sector: "professional_services",
      subIndustries: [
        { value: "business-advisory", label: "Business Advisory" },
        { value: "engineering-services", label: "Engineering Services" },
        { value: "digital-consulting", label: "Digital Consulting" },
      ],
    },
    {
      value: "retail-personal-services",
      label: "Retail & Personal Services",
      sector: "retail",
      subIndustries: [
        { value: "retail-operations", label: "Retail Operations" },
        { value: "consumer-services", label: "Consumer Services" },
        { value: "beauty-wellness", label: "Beauty & Wellness" },
      ],
    },
    {
      value: "construction-public-works",
      label: "Construction & Public Works",
      sector: "construction",
      subIndustries: [
        { value: "public-works", label: "Public Works" },
        { value: "general-construction", label: "General Construction" },
        { value: "green-retrofit", label: "Green Retrofit" },
      ],
    },
    {
      value: "manufacturing-industry",
      label: "Manufacturing & Industry",
      sector: "manufacturing",
      subIndustries: [
        { value: "precision-manufacturing", label: "Precision Manufacturing" },
        { value: "industrial-assembly", label: "Industrial Assembly" },
        { value: "advanced-materials", label: "Advanced Materials" },
      ],
    },
    {
      value: "accommodation-food",
      label: "Accommodation & Food",
      sector: "hospitality",
      subIndustries: [
        { value: "boutique-hospitality", label: "Boutique Hospitality" },
        { value: "restaurants-cafes", label: "Restaurants & Cafes" },
        { value: "tourism-services", label: "Tourism Services" },
      ],
    },
    {
      value: "ict-media",
      label: "ICT & Media",
      sector: "ict",
      subIndustries: [
        { value: "software-media", label: "Software & Media" },
        { value: "french-tech", label: "French Tech Startup" },
        { value: "digital-content", label: "Digital Content" },
      ],
    },
  ],
  germany: [
    {
      value: "mechanical-engineering",
      label: "Mechanical Engineering",
      sector: "manufacturing",
      subIndustries: [
        { value: "machinery-components", label: "Machinery Components" },
        { value: "industrial-systems", label: "Industrial Systems" },
        { value: "precision-engineering", label: "Precision Engineering" },
      ],
    },
    {
      value: "professional-business-services",
      label: "Professional & Business Services",
      sector: "professional_services",
      subIndustries: [
        { value: "business-services", label: "Business Services" },
        { value: "knowledge-services", label: "Knowledge Services" },
        { value: "compliance-advisory", label: "Compliance Advisory" },
      ],
    },
    {
      value: "wholesale-retail-trade",
      label: "Wholesale & Retail Trade",
      sector: "wholesale",
      subIndustries: [
        { value: "trade-distribution", label: "Trade Distribution" },
        { value: "merchant-wholesale", label: "Merchant Wholesale" },
        { value: "specialty-retail", label: "Specialty Retail" },
      ],
    },
    {
      value: "construction",
      label: "Construction",
      sector: "construction",
      subIndustries: [
        { value: "building-construction", label: "Building Construction" },
        { value: "specialist-trades", label: "Specialist Trades" },
        { value: "civil-projects", label: "Civil Projects" },
      ],
    },
    {
      value: "automotive-supply-chain",
      label: "Automotive Supply Chain",
      sector: "manufacturing",
      subIndustries: [
        { value: "tier-one-supplier", label: "Tier 1 Supplier" },
        { value: "ev-components", label: "EV Components" },
        { value: "industrial-tooling", label: "Industrial Tooling" },
      ],
    },
    {
      value: "ict-digital-deeptech",
      label: "ICT / Digital / DeepTech",
      sector: "ict",
      subIndustries: [
        { value: "software-platforms", label: "Software Platforms" },
        { value: "deeptech-r-and-d", label: "DeepTech R&D" },
        { value: "digital-infrastructure", label: "Digital Infrastructure" },
      ],
    },
  ],
  spain: [
    {
      value: "professional-services",
      label: "Professional Services",
      sector: "professional_services",
      subIndustries: [
        { value: "consulting", label: "Consulting" },
        { value: "accounting", label: "Accounting" },
        { value: "agency-services", label: "Agency Services" },
      ],
    },
    {
      value: "retail-trade",
      label: "Retail & Trade",
      sector: "retail",
      subIndustries: [
        { value: "retail-stores", label: "Retail Stores" },
        { value: "commerce", label: "Commerce" },
        { value: "distribution", label: "Distribution" },
      ],
    },
    {
      value: "manufacturing",
      label: "Manufacturing",
      sector: "manufacturing",
      subIndustries: [
        { value: "light-manufacturing", label: "Light Manufacturing" },
        { value: "food-production", label: "Food Production" },
        { value: "industrial-goods", label: "Industrial Goods" },
      ],
    },
    {
      value: "hospitality-tourism",
      label: "Hospitality & Tourism",
      sector: "hospitality",
      subIndustries: [
        { value: "hotels", label: "Hotels" },
        { value: "restaurants", label: "Restaurants" },
        { value: "tourism-services", label: "Tourism Services" },
      ],
    },
    {
      value: "construction",
      label: "Construction",
      sector: "construction",
      subIndustries: [
        { value: "residential", label: "Residential" },
        { value: "commercial", label: "Commercial" },
        { value: "infrastructure", label: "Infrastructure" },
      ],
    },
    {
      value: "ict-digital",
      label: "ICT & Digital",
      sector: "ict",
      subIndustries: [
        { value: "software", label: "Software" },
        { value: "digital-services", label: "Digital Services" },
        { value: "platform-business", label: "Platform Business" },
      ],
    },
  ],
  netherlands: [
    {
      value: "professional-services",
      label: "Professional Services",
      sector: "professional_services",
      subIndustries: [
        { value: "advisory", label: "Advisory" },
        { value: "financial-services", label: "Financial Services" },
        { value: "legal-services", label: "Legal Services" },
      ],
    },
    {
      value: "retail-wholesale",
      label: "Retail & Wholesale",
      sector: "wholesale",
      subIndustries: [
        { value: "trade", label: "Trade" },
        { value: "distribution", label: "Distribution" },
        { value: "ecommerce", label: "Ecommerce" },
      ],
    },
    {
      value: "manufacturing",
      label: "Manufacturing",
      sector: "manufacturing",
      subIndustries: [
        { value: "industrial-equipment", label: "Industrial Equipment" },
        { value: "consumer-goods", label: "Consumer Goods" },
        { value: "specialist-production", label: "Specialist Production" },
      ],
    },
    {
      value: "hospitality-food",
      label: "Hospitality & Food",
      sector: "hospitality",
      subIndustries: [
        { value: "food-service", label: "Food Service" },
        { value: "boutique-stays", label: "Boutique Stays" },
        { value: "events", label: "Events" },
      ],
    },
    {
      value: "construction",
      label: "Construction",
      sector: "construction",
      subIndustries: [
        { value: "property-development", label: "Property Development" },
        { value: "specialist-contracting", label: "Specialist Contracting" },
        { value: "sustainable-build", label: "Sustainable Build" },
      ],
    },
    {
      value: "ict-tech",
      label: "ICT & Tech",
      sector: "ict",
      subIndustries: [
        { value: "software-products", label: "Software Products" },
        { value: "cyber-cloud", label: "Cyber & Cloud" },
        { value: "data-platforms", label: "Data Platforms" },
      ],
    },
  ],
};

export function getIndustryOptions(country: CountryCode): CountryIndustryOption[] {
  return industryCatalogByCountry[country];
}

export function getIndustryOption(country: CountryCode, industryValue: string): CountryIndustryOption {
  return (
    industryCatalogByCountry[country].find((option) => option.value === industryValue) ??
    industryCatalogByCountry[country][0]
  );
}

export function getDefaultRegistration(country: CountryCode): RegistrationProfile {
  const firstIndustry = industryCatalogByCountry[country][0];
  return {
    companyName: "Green Horizon SME Ltd",
    registrationNumber: "SME-2026-001",
    contactName: "Aisling Byrne",
    contactEmail: "aisling.byrne@example.com",
    contactPhone: "+353 1 555 0199",
    industry: firstIndustry.value,
    subIndustry: firstIndustry.subIndustries[0].value,
  };
}

export function deriveSector(country: CountryCode, industryValue: string): string {
  return getIndustryOption(country, industryValue).sector;
}

export function getSubIndustryOptions(country: CountryCode, industryValue: string) {
  return getIndustryOption(country, industryValue).subIndustries;
}

export function getIndustryLabel(country: CountryCode, industryValue: string): string {
  return getIndustryOption(country, industryValue).label;
}

export function getSubIndustryLabel(country: CountryCode, industryValue: string, subIndustryValue: string): string {
  return (
    getIndustryOption(country, industryValue).subIndustries.find((option) => option.value === subIndustryValue)?.label ??
    getIndustryOption(country, industryValue).subIndustries[0].label
  );
}

export function formatSectorLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
