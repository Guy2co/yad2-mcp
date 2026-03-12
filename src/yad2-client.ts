import type { Page } from 'playwright';
import { launchPage, navigateTo, extractNextData } from './browser.js';
import { parseItem, parseResponse } from './parser.js';
import { buildQuery } from './query-builder.js';
import type { Listing, SearchParams, SearchResult, Yad2ApiItem } from './types.js';

const BASE_URL = 'https://www.yad2.co.il/realestate';

function feedQueryKey(type: 'rent' | 'forsale'): string {
  return `realestate-${type}-feed`;
}

export class Yad2Client {
  async search(type: 'rent' | 'forsale', params: SearchParams): Promise<SearchResult> {
    const { page, close } = await launchPage();
    try {
      return await this._doSearch(page, type, params);
    } finally {
      await close();
    }
  }

  private async _doSearch(
    page: Page,
    type: 'rent' | 'forsale',
    params: SearchParams,
  ): Promise<SearchResult> {
    const query = new URLSearchParams(buildQuery(params)).toString();
    const cityQuery = params.city !== undefined ? `?city=${params.city}` : '';
    await navigateTo(page, `${BASE_URL}/${type}${cityQuery}&${query}`);
    const data = await extractNextData(page, feedQueryKey(type));
    return parseResponse(data, params.page ?? 1);
  }

  async getListing(token: string): Promise<Listing> {
    const { page, close } = await launchPage();
    try {
      return await this._doGetListing(page, token);
    } finally {
      await close();
    }
  }

  private async _doGetListing(page: Page, token: string): Promise<Listing> {
    await navigateTo(page, `${BASE_URL}/item/${token}`);
    const data = await extractNextData(page, 'item');
    return parseItem(data as Yad2ApiItem);
  }
}
