/**
 * Shared storefront helpers.
 *
 * The social/contact links were previously hard-coded with the same defaults in
 * StorefrontLayout, the homepage and the contact page. Centralise them here so a
 * single source of truth drives every page, with site_settings overrides applied
 * consistently.
 */

/** Default brand links used when a value is missing from site_settings. */
export const SOCIAL_DEFAULTS = {
  whatsappNumber: "923364246604",
  instagram: "https://www.instagram.com/byareeqaan/",
  tiktok: "https://www.tiktok.com/@by_areeqan",
  facebook: "https://www.facebook.com/ByAreeqan/",
} as const;

export interface StorefrontSocials {
  whatsappNumber: string;
  /** Ready-to-use wa.me link. */
  whatsapp: string;
  instagram: string;
  tiktok: string;
  facebook: string;
}

/**
 * Resolve the storefront social links from a site_settings map, falling back to
 * the brand defaults for any missing value.
 */
export function resolveSocials(
  settings?: Record<string, string> | null
): StorefrontSocials {
  const st = settings ?? {};
  const whatsappNumber = st.whatsapp_number || SOCIAL_DEFAULTS.whatsappNumber;
  return {
    whatsappNumber,
    whatsapp: `https://wa.me/${whatsappNumber}`,
    instagram: st.instagram_url || SOCIAL_DEFAULTS.instagram,
    tiktok: st.tiktok_url || SOCIAL_DEFAULTS.tiktok,
    facebook: st.facebook_url || SOCIAL_DEFAULTS.facebook,
  };
}
