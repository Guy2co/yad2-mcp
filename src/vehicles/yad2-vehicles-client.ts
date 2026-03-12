import type { Page } from 'playwright';
import {
  navigateTo,
  extractNextData,
  extractNextDataByMatcher,
  withPage,
} from '../infra/browser.js';
import { parseVehicleItem, parseVehicleResponse } from './parser.js';
import { buildVehicleQuery } from './query-builder.js';
import type {
  VehicleListing,
  VehicleSearchParams,
  VehicleSearchResult,
  Yad2VehicleApiItem,
} from './types.js';

const BASE_URL = 'https://www.yad2.co.il/vehicles';

function vehiclesMatcher(k: unknown[]): boolean {
  return k[0] === 'feed' && k[1] === 'vehicles' && k[2] === 'cars';
}

export class Yad2VehiclesClient {
  async searchVehicles(params: VehicleSearchParams): Promise<VehicleSearchResult> {
    return withPage((page) => this._doSearchVehicles(page, params));
  }

  private async _doSearchVehicles(
    page: Page,
    params: VehicleSearchParams,
  ): Promise<VehicleSearchResult> {
    const query = new URLSearchParams(buildVehicleQuery(params)).toString();
    await navigateTo(page, `${BASE_URL}/cars?${query}`);
    const data = await extractNextDataByMatcher(page, vehiclesMatcher, 'feed/vehicles/cars');
    return parseVehicleResponse(data, params.page ?? 1);
  }

  async getCarListing(token: string): Promise<VehicleListing> {
    return withPage((page) => this._doGetCarListing(page, token));
  }

  private async _doGetCarListing(page: Page, token: string): Promise<VehicleListing> {
    await navigateTo(page, `${BASE_URL}/item/${token}`);
    const data = await extractNextData(page, 'item');
    return parseVehicleItem(data as Yad2VehicleApiItem);
  }
}
