import Dexie, { Table } from 'dexie';

export interface PricePoint {
  referenceMonth: string; // e.g., "abril de 2024"
  price: string; // "R$ 10.000,00"
}

export interface VehicleHistory {
  id?: number;
  vehicleKey: string; // `${vehicleType}:${brandId}:${modelId}:${yearId}`
  codeFipe: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  updatedAt: number;
  priceHistory: PricePoint[];
}

class VehicleDB extends Dexie {
  histories!: Table<VehicleHistory, number>;

  constructor() {
    super('vehicle_db');
    this.version(1).stores({
      histories: '++id, vehicleKey, codeFipe, updatedAt',
    });
  }
}

export const vehicleDB = new VehicleDB();
