import * as alt from 'alt-shared';

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
    saleHistory?: Array<SalesHistory>;
    purchaseHistory?: Array<PurchaseHistory>;
};

export type PurchaseHistory = {
    vehicleId: string;
    purchaseDataTime: string;
    purchaseAmount: string;
    stock: number;
};
export type Locations = {
    DelerShipLocation?: Array<Locals>;
    PurchaseLocation?: Array<Locals>;
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
    VehicleSalePrice: number;
    VehiclePurchasePrice?: number;
    vehicleInfo?: [];
};

export type SalesHistory = Vehicles & {
    soldVehicleId: string;
    soldDateTime: string;
    payementType: PAYMENT_TYPE;
    payementStatus: boolean;
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
