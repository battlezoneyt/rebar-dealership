import { FuelType } from '@Plugins/asc-fuel/server/src/config.js';
import { AccountCurrencies, AllCurrencyTypes, CharacterCurrencies } from '@Plugins/rebar-currency/shared/config.js';
import { time } from '@Shared/utility/index.js';
import * as alt from 'alt-shared';
import { Timestamp } from 'mongodb';

declare module '@Shared/types/vehicle.js' {
    export interface Vehicle {
        garrageInfo?: {
            garageID: string;
            isStored: boolean;
            impound?: boolean;
            impoundTime?: Timestamp;
            impoundBy?: string;
            impoundReason?: string;
        };
    }
}

export type DealershipCore = {
    _id?: string;
    dealershipName: string;
    dealerShipType: DEALERSHIP_TYPES;
    vehicleType: VEHICLE_TYPES;
};

export type CurrencyDefinitions = {
    Character: CharacterCurrencies;
    Account: AccountCurrencies;
};

export type Dealership = DealershipCore & {
    factionId?: string;
    location?: Locations;
    vehicles?: Array<AllowedVehicles>;
};

export type PurchaseHistory = {
    purchaseId: string;
    purchaseQty: number;
    purchaseDataTime: Date;
    purchaseAmount: number;
    orderStatus: string;
    deliveryStatus: string;
    deliveryTime?: Date;
};
export type Locations = {
    DelerShipLocation?: Array<Locals>;
    PurchaseLocation?: Array<Locals>;
    spawnVehicleLocation?: Array<Locals>;
    purchaseSpawnLocation?: Array<Locals>;
};
const DealerShipTypes = {
    self_service: 1,
    faction: 2,
} as const;

export type DEALERSHIP_TYPES = keyof typeof DealerShipTypes;

const VehicleTypes = {
    car: 1,
    truck: 2,
    boat: 3,
    air: 4,
    luxury: 5,
    motorcycle: 6,
    rental: 7,
} as const;

export type VEHICLE_TYPES = keyof typeof VehicleTypes;

export type Locals = {
    locationId: string;
    locationName: string;
    pos?: alt.Vector3;
    spawnSpots?: Array<{ pos: alt.Vector3; rot: alt.Vector3 }>;
};

export type AllowedVehicles = {
    vehicleId: string;
    VehiclePurchasePrice: number;
    VehicleSalePrice?: number;
    saleHistory?: Array<SalesHistory>;
    purchaseHistory?: Array<PurchaseHistory>;
    stock?: number;
    availableColor?: string[];
    showInList?: boolean;
};

export type Vehicles = {
    _id?: string;
    vehicleType: VEHICLE_TYPES;
    vehicleCategory: VEHICLE_CATEFORY;
    vehicleLabel: string;
    vehicleModel: number;
    isDisabled: boolean;
    fuelType?: FuelType;
    consumption?: number;
    maxFuel?: number;
};
export type SalesHistory = {
    salesId: string;
    soldVehicleId: string;
    soldTocharacterId: string;
    soldBycharacterId?: string;
    soldDateTime: Date;
    soldPrice: number;
    payementStatus: boolean;
    payementType?: AllCurrencyTypes;
};

// const PaymentType = {
//     CASH: 1,
//     BANK: 2,
// } as const;

// export type PAYMENT_TYPE = keyof typeof PaymentType;
const VehicleCategory = {
    Compact_Car: 1,
    SUV: 2,
    Coupe: 3,
    Sedan: 4,
    Sports: 5,
    Muscle: 6,
    Vintage: 7,
} as const;

export type VEHICLE_CATEFORY = keyof typeof VehicleCategory;
