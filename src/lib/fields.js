/**
 * メタタグのフィールド定義
 * 
 * OpenGraphのメタタグを抽出するためのフィールド情報
 */
const fields = [
  {
    multiple: false,
    property: 'og:title',
    fieldName: 'ogTitle'
  },
  {
    multiple: false,
    property: 'og:type',
    fieldName: 'ogType'
  },
  {
    multiple: false,
    property: 'og:description',
    fieldName: 'ogDescription'
  },
  {
    multiple: false,
    property: 'og:url',
    fieldName: 'ogUrl'
  },
  {
    multiple: false,
    property: 'og:site_name',
    fieldName: 'ogSiteName'
  },
  {
    multiple: true,
    property: 'og:image',
    fieldName: 'ogImage'
  },
  {
    multiple: true,
    property: 'og:image:url',
    fieldName: 'ogImageURL'
  },
  {
    multiple: true,
    property: 'og:image:secure_url',
    fieldName: 'ogImageSecureURL'
  },
  {
    multiple: true,
    property: 'og:image:width',
    fieldName: 'ogImageWidth'
  },
  {
    multiple: true,
    property: 'og:image:height',
    fieldName: 'ogImageHeight'
  },
  {
    multiple: true,
    property: 'og:image:type',
    fieldName: 'ogImageType'
  },
  {
    multiple: true,
    property: 'og:image:alt',
    fieldName: 'ogImageAlt'
  },
  {
    multiple: false,
    property: 'og:locale',
    fieldName: 'ogLocale'
  },
  {
    multiple: false,
    property: 'twitter:title',
    fieldName: 'twitterTitle'
  },
  {
    multiple: false,
    property: 'twitter:description',
    fieldName: 'twitterDescription'
  },
  {
    multiple: false,
    property: 'twitter:card',
    fieldName: 'twitterCard'
  },
  {
    multiple: false,
    property: 'twitter:site',
    fieldName: 'twitterSite'
  },
  {
    multiple: false,
    property: 'twitter:creator',
    fieldName: 'twitterCreator'
  },
  {
    multiple: true,
    property: 'twitter:image',
    fieldName: 'twitterImage'
  },
  {
    multiple: true,
    property: 'twitter:image:src',
    fieldName: 'twitterImageSrc'
  },
  {
    multiple: true,
    property: 'twitter:image:alt',
    fieldName: 'twitterImageAlt'
  }
];

export default fields;