import type { Page } from 'playwright';
import { navigateTo, extractNextData, withPage } from '../infra/browser.js';
import { parseItem, parseResponse } from './parser.js';
import { buildQuery } from './query-builder.js';
import type { Listing, SearchParams, SearchResult, Yad2ApiItem } from './types.js';

const BASE_URL = 'https://www.yad2.co.il/realestate';

function feedQueryKey(type: 'rent' | 'forsale'): string {
  return `realestate-${type}-feed`;
}

export class Yad2RealEstateClient {
  async search(type: 'rent' | 'forsale', params: SearchParams): Promise<SearchResult> {
    return withPage((page) => this._doSearch(page, type, params));
  }

  private async _doSearch(
    page: Page,
    type: 'rent' | 'forsale',
    params: SearchParams,
  ): Promise<SearchResult> {
    const queryStr = new URLSearchParams(buildQuery(params, type)).toString();
    await navigateTo(page, `${BASE_URL}/${type}?${queryStr}`);
    const data = await extractNextData(page, feedQueryKey(type));
    return parseResponse(data, params.page ?? 1);
  }

  async getListing(token: string): Promise<Listing> {
    return withPage((page) => this._doGetListing(page, token));
  }

  private async _doGetListing(page: Page, token: string): Promise<Listing> {
    await navigateTo(page, `${BASE_URL}/item/${token}`);
    const data = await extractNextData(page, 'item');
    return parseItem(data as Yad2ApiItem);
  }
}
