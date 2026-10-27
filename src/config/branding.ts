export interface EcosystemProduct {
  id: string;
  name: string;
  nameHindi: string;
  tagline: string;
  status: 'live' | 'upcoming' | 'in_development';
  url?: string;
}

export const BRAND_CONFIG = {
  parentBrand: 'OmniCraft',
  parentBrandHindi: 'ओम्नी क्राफ्ट',
  parentTagline: 'Modern AI Business & Engineering Ecosystem',
  parentTaglineHindi: 'आधुनिक एआई बिज़नेस व इंजीनियरिंग इकोसिस्टम',
  currentProduct: {
    name: 'Construction Khata AI',
    nameHindi: 'कंस्ट्रक्शन खाता एआई',
    badge: 'by OmniCraft',
    tagline: 'Site Khata, Inventory & Financial Accounting',
    fullTitle: 'Construction Khata AI • An OmniCraft Product',
  },
  products: [
    {
      id: 'construction-khata',
      name: 'Construction Khata AI',
      nameHindi: 'कंस्ट्रक्शन खाता एआई',
      tagline: 'Site Khata, Material Inventory & Labour Accounting',
      status: 'live',
      url: 'https://construction-khata-ai1.vercel.app',
    },
    {
      id: 'ai-sanitary-shop',
      name: 'AI Sanitary Shop',
      nameHindi: 'एआई सेनेटरी शॉप',
      tagline: 'Smart Retail & Inventory Management for Sanitary Stores',
      status: 'live',
    },
    {
      id: 'omnicraft-3d',
      name: 'OmniCraft 3D Portal',
      nameHindi: 'ओम्नी क्राफ्ट 3D पोर्टल',
      tagline: 'Interactive 3D Web Showcase & Product Universe',
      status: 'in_development',
    },
  ] as EcosystemProduct[],
  copyright: `© ${new Date().getFullYear()} OmniCraft Ecosystem. All rights reserved.`,
  supportEmail: 'support@omnicraft.ai',
};
