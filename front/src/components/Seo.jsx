const SITE_NAME = "Aurassens";
const SITE_URL = "https://aurassens.shop";
const DEFAULT_OG_IMAGE = `${SITE_URL}/LOGO.png`;

function Seo({ title, description, path, image = DEFAULT_OG_IMAGE, noindex = false, type = "website" }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Diffuseurs de parfum d'exception`;
  const canonical = `${SITE_URL}${path || ""}`;

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="fr_CA" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />
    </>
  );
}

export default Seo;
