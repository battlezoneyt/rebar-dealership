import { time } from '@Shared/utility/index.js';
import * as alt from 'alt-shared';
import { Timestamp } from 'mongodb';

export type DealershipCore = {
    _id?: string;
    dealershipName: string;
    dealerShipType: DEALERSHIP_TYPES;
    vehicleType: VEHICLE_TYPES;
};

export type Dealership = DealershipCore & {
    factionId?: string;
    location?: Locations;
    vehicles?: Array<Vehicles>;
};

export type PurchaseHistory = {
    purchaseId: string;
    purchaseQty: number;
    purchaseDataTime: Date;
    purchaseAmount: number;
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
    rentel: 7,
} as const;

export type VEHICLE_TYPES = keyof typeof VehicleTypes;

export type Locals = {
    locationId: string;
    locationName: string;
    pos: alt.Vector3;
    spawnSpots?: Array<{ pos: alt.Vector3; rot: alt.Vector3 }>;
};

export type Vehicles = {
    vehicleId: string;
    vehicleCategory: VEHICLE_CATEFORY;
    vehicleName: string;
    vehicleModel: string;
    VehicleSalePrice: number;
    VehiclePurchasePrice?: number;
    saleHistory?: Array<SalesHistory>;
    purchaseHistory?: Array<PurchaseHistory>;
    isDisabled?: boolean;
    stock?: number;
    availableColor?: string[];
};

export type SalesHistory = {
    salesId: string;
    soldVehicleId: string;
    soldTocharacterId: string;
    soldDateTime: string;
    payementType: PAYMENT_TYPE;
    payementStatus: boolean;
    soldPrice: number;
};

const PaymentType = {
    CASH: 1,
    BANK: 2,
} as const;

export type PAYMENT_TYPE = keyof typeof PaymentType;
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
