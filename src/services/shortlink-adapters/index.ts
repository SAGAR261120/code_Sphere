import { IShortlinkProviderAdapter } from './types';
import { GPLinksAdapter } from './gplinks.adapter';
import { SignedPostbackAdapter } from './signed-postback.adapter';
import { ManualReviewAdapter } from './manual.adapter';

export * from './types';
export * from './gplinks.adapter';
export * from './signed-postback.adapter';
export * from './manual.adapter';

const gplinksAdapter = new GPLinksAdapter();
const signedPostbackAdapter = new SignedPostbackAdapter();
const manualReviewAdapter = new ManualReviewAdapter();

const adapterRegistry: Record<string, IShortlinkProviderAdapter> = {
  gplinks: gplinksAdapter,
  'signed-postback': signedPostbackAdapter,
  adlinkfly: signedPostbackAdapter,
  shrinkme: signedPostbackAdapter, // ShrinkMe postback compatible
  manual: manualReviewAdapter,
};

export function getShortlinkAdapter(slug?: string | null): IShortlinkProviderAdapter {
  if (!slug) {
    return signedPostbackAdapter;
  }
  const normalized = slug.toLowerCase().trim();
  return adapterRegistry[normalized] || signedPostbackAdapter;
}
