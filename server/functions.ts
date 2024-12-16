import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Character } from '@Shared/types/character.js';
import { useDealershipHandlers } from './handlers.js';
import {
    AllowedVehicles,
    CurrencyDefinitions,
    DEALERSHIP_TYPES,
    Locals,
    Locations,
    PurchaseHistory,
    VEHICLE_CATEFORY,
    Vehicles,
} from '../shared/interface.js';
import { time } from '@Shared/utility/index.js';
import { timeStamp } from 'console';
import {
    AccountCurrencies,
    AllCurrencies,
    AllCurrencyTypes,
    CharacterCurrencies,
} from '@Plugins/rebar-currency/shared/config.js';

const API_NAME = 'rebar-dealership-functions-api';
const Rebar = useRebar();
const db = Rebar.database.useDatabase();
const getter = Rebar.get.usePlayerGetter();
const api = Rebar.useApi();
const DEALERSHIP_COLLECTION = 'Vehicleshop';
const factionHandleapi = await api.getAsync('faction-handlers-api');
const factionFunctionapi = await api.getAsync('faction-functions-api');
const vehicleHandleapi = await api.getAsync('rebar-server-vehciles-api');
const FuelAPI = await Rebar.useApi().getAsync('ascended-fuel-api');
const { useCurrency } = await api.getAsync('currency-api');

export function useDealershipFunctions() {
    /**
     * set Faction to a dealership
     *
     */
    async function setFaction(vehShopId: string, factionId: string): Promise<any> {
        const vehShops = await useDealershipHandlers().findDealershipById(vehShopId);

        const faction = await factionHandleapi.findFactionById(factionId);
        if (!faction) {
            return { status: false, response: `Faction doesn't Exist.` };
        }
        const didUpdate = await useDealershipHandlers().update(vehShops._id as string, 'factionId', {
            factionId: factionId,
        });

        return didUpdate.status;
    }

    async function removeFaction(vehShopId: string): Promise<any> {
        const vehShops = await useDealershipHandlers().findDealershipById(vehShopId);
        if (!vehShops.factionId || vehShops.factionId == undefined) return;
        const didUpdate = await useDealershipHandlers().update(vehShops._id as string, 'factionId', {
            factionId: undefined,
        });

        return didUpdate.status;
    }

    async function getFaction(vehShopId: string): Promise<any> {
        const vehShops = await useDealershipHandlers().findDealershipById(vehShopId);
        if (!vehShops.factionId || vehShops.factionId == undefined) return;
        const faction = factionHandleapi.findFactionById(vehShops.factionId);
        if (!faction) {
            return { status: false, response: `Faction doesn't Exist.` };
        }

        return faction;
    }

    async function addLocations(
        dealershipId: string,
        locationType: keyof Locations,
        locationName: string,
        pos: alt.Vector3,
        spawnSpots?: Array<{ pos: alt.Vector3; rot: alt.Vector3 }>,
    ): Promise<any> {
        const dealership = await useDealershipHandlers().findDealershipById(dealershipId);
        if ((dealership.factionId && dealership.factionId !== null) || dealership.factionId != '') {
            return `This Dealership with ${dealershipId} is liked to faction. Please remove before adding location`;
        }

        dealership.location = dealership.location || {};
        dealership.location[locationType] = dealership.location[locationType] || [];

        const exists = dealership.location[locationType].some((loc) => loc.locationName === locationName);
        if (exists) {
            return false;
        }
        const location: Locals = {
            locationId: Rebar.utility.sha256Random(JSON.stringify(dealership.location)),
            locationName,
            pos,
            spawnSpots,
        };

        try {
            dealership.location[locationType].push(location);
        } catch (err) {
            console.log(err);
        }
        const didUpdate = await useDealershipHandlers().update(dealership._id as string, 'location', {
            location: dealership.location,
        });

        return didUpdate.status;
    }

    async function removeLocations(
        delershipId: string,
        locationType: keyof Locations,
        locationId: string,
    ): Promise<boolean> {
        const dealership = await useDealershipHandlers().findDealershipById(delershipId);
        if (!dealership?.location?.[locationType]?.length) return false;
        const index = dealership.location[locationType].findIndex((r) => r.locationId === locationId);
        if (index <= -1) {
            return false;
        }
        try {
            dealership.location[locationType] = dealership.location[locationType].filter(
                (location) => location.locationId !== locationId,
            );
        } catch (err) {
            console.log(err);
        }

        const didUpdate = await useDealershipHandlers().update(dealership._id as string, 'location', {
            location: dealership.location,
        });

        return didUpdate.status;
    }

    async function addVehiclesToDealership(
        dealershipId: string,
        vehicleId: string,
        VehiclePurchasePrice: number,
        VehicleSalePrice?: number,
        showInList?: boolean,
    ): Promise<any> {
        const vehcile = await vehicleHandleapi.findVehiclesById(vehicleId);
        if (vehcile) return 'Vehicles Already in Dealership';
        const dealership = await useDealershipHandlers().findDealershipById(dealershipId);
        if (!dealership || dealership === undefined) return false;
        if (!dealership.vehicles || dealership.vehicles === undefined) {
            dealership.vehicles = [];
        }
        const index = dealership.vehicles.findIndex((r) => r.vehicleId != vehicleId);
        if (index >= -1) {
            return false;
        }
        let vehicle: AllowedVehicles = {
            vehicleId: vehicleId,
            VehiclePurchasePrice: VehiclePurchasePrice,
            VehicleSalePrice: VehicleSalePrice ?? 0,
            showInList: showInList ?? false,
        };
        try {
            dealership.vehicles.push(vehicle);
        } catch (err) {
            console.log(err);
        }
        const didUpdate = await useDealershipHandlers().update(dealership._id as string, DEALERSHIP_COLLECTION, {
            vehicles: dealership.vehicles,
        });

        return didUpdate.status;
    }

    async function setVehicleStatus(dealershipId: string, vehicleId: string): Promise<any> {
        const dealership = await useDealershipHandlers().findDealershipById(dealershipId);
        if (!dealership || dealership === undefined) return false;
        if (!dealership.vehicles) {
            return false;
        }
        const index = dealership.vehicles.findIndex((r) => r.vehicleId === vehicleId);
        if (index <= -1) {
            return false;
        }
        dealership.vehicles[index].showInList = !dealership.vehicles[index].showInList;

        const didUpdate = await useDealershipHandlers().update(dealership._id as string, DEALERSHIP_COLLECTION, {
            vehicles: dealership.vehicles,
        });

        return didUpdate.status;
    }

    async function addPurchase(dealershipId: string, vehicleId: string, purchaseQty: number): Promise<any> {
        const dealership = await useDealershipHandlers().findDealershipById(dealershipId);
        if (!dealership || dealership === undefined || !purchaseQty) return false;
        if (!dealership.vehicles || !dealership.factionId || dealership.factionId === undefined) {
            return false;
        }
        const index = dealership.vehicles.findIndex((r) => r.vehicleId === vehicleId);
        if (index <= -1) {
            return false;
        }
        if (
            !dealership.vehicles[index] ||
            dealership.vehicles[index] === undefined ||
            !dealership.vehicles[index].VehiclePurchasePrice ||
            dealership.vehicles[index].VehiclePurchasePrice === undefined
        ) {
            return;
        }
        const purchaseHistory: PurchaseHistory = {
            purchaseId: Rebar.utility.sha256Random(JSON.stringify(dealership.vehicles[index].purchaseHistory)),
            purchaseQty: purchaseQty,
            purchaseDataTime: new Date(),
            purchaseAmount: dealership.vehicles[index].VehiclePurchasePrice * purchaseQty,
            orderStatus: 'OPEN',
            deliveryStatus: 'PENDING',
        };
        if (!dealership.vehicles[index].purchaseHistory || dealership.vehicles[index].purchaseHistory === undefined) {
            dealership.vehicles[index].purchaseHistory = [];
        }

        const paymentStatus = await factionFunctionapi.subBank(
            dealership.factionId,
            dealership.vehicles[index].VehiclePurchasePrice * purchaseQty,
        );
        if (!paymentStatus) {
            return;
        }
        dealership.vehicles[index].purchaseHistory.push(purchaseHistory);
        // dealership.vehicles[index].stock = +purchaseQty;
        const didUpdate = await useDealershipHandlers().update(dealership._id as string, 'vehicles', {
            vehicles: dealership.vehicles,
        });

        return didUpdate.status;
    }

    async function getVehicle(dealershipId: string, vehicleId: string): Promise<AllowedVehicles> {
        const dealership = await useDealershipHandlers().findDealershipById(dealershipId);
        if (!dealership || dealership === undefined) return undefined;
        if (!dealership.vehicles || dealership.vehicles === undefined) return undefined;
        const filteredVehicle = dealership.vehicles.filter((vehicle) => vehicle.vehicleId === vehicleId);

        return filteredVehicle[0];
    }

    async function addStock(dealershipId: string, vehicleId: string, qty: number): Promise<any> {
        const dealership = await useDealershipHandlers().findDealershipById(dealershipId);
        if (!dealership || dealership === undefined) return false;
        if (!dealership.vehicles || dealership.vehicles === undefined) return false;
        const index = dealership.vehicles.findIndex((r) => r.vehicleId === vehicleId);
        if (index <= -1) {
            return false;
        }
        if (!dealership.vehicles[index].stock) {
            dealership.vehicles[index].stock = 0;
        }
        dealership.vehicles[index].stock = +qty;
        const didUpdate = await useDealershipHandlers().update(dealership._id as string, 'vehicles', {
            vehicles: dealership.vehicles,
        });

        return didUpdate.status;
    }

    async function getAvailableStock(dealershipId: string, vehicleId: string): Promise<number> {
        const filteredVehicle = await getVehicle(dealershipId, vehicleId);
        if (!filteredVehicle || filteredVehicle === undefined) return 0;
        return filteredVehicle.stock;
    }

    async function setAvailableColor(dealershipId: string, vehicleId: string, color: string): Promise<any> {
        const dealership = await useDealershipHandlers().findDealershipById(dealershipId);
        if (!dealership || dealership === undefined) return false;
        if (!dealership.vehicles) {
            return false;
        }
        const index = dealership.vehicles.findIndex((r) => r.vehicleId === vehicleId);
        if (index <= -1) {
            return false;
        }

        if (!dealership.vehicles[index].availableColor || dealership.vehicles[index].availableColor === undefined) {
            dealership.vehicles[index].availableColor = [];
        }

        if (dealership.vehicles[index].availableColor.includes(color)) return;
        dealership.vehicles[index].availableColor.push(color);

        const didUpdate = await useDealershipHandlers().update(dealership._id as string, 'vehicles', {
            vehicles: dealership.vehicles,
        });

        return didUpdate.status;
    }

    async function addSales(
        player: alt.Player,
        dealershipId: string,
        vehicleId: string,
        characterId: string,
        color?: number,
        CurrencyType?: keyof CurrencyDefinitions,
        payementType?: AllCurrencyTypes,
    ): Promise<any> {
        const dealership = await useDealershipHandlers().findDealershipById(dealershipId);
        if (!dealership || dealership === undefined) return false;
        if (!dealership.vehicles) {
            return false;
        }
        const vehicleIndex = dealership.vehicles.findIndex((v) => v.vehicleId === vehicleId);
        if (vehicleIndex === -1) return false;
        if (
            !dealership.vehicles[vehicleIndex] ||
            dealership.vehicles[vehicleIndex] === undefined ||
            !dealership.vehicles[vehicleIndex].VehiclePurchasePrice ||
            dealership.vehicles[vehicleIndex].VehiclePurchasePrice === undefined ||
            !dealership.vehicles[vehicleIndex].VehicleSalePrice ||
            dealership.vehicles[vehicleIndex].VehicleSalePrice === undefined ||
            dealership.vehicles[vehicleIndex].stock <= 0
        ) {
            return;
        }

        if (dealership.dealerShipType == 'self_service') {
            if (CurrencyType == 'Character') {
                const characterCurrency = useCurrency(player, 'Character');
                const isCashAvailable = await characterCurrency.has(
                    payementType as keyof CharacterCurrencies,
                    dealership.vehicles[vehicleIndex].VehicleSalePrice,
                );
                if (!isCashAvailable) {
                    return;
                } else {
                    const isUpdate = await characterCurrency.sub(
                        payementType as keyof CharacterCurrencies,
                        dealership.vehicles[vehicleIndex].VehicleSalePrice,
                    );
                }
            } else if (CurrencyType == 'Account') {
                const accountCurrency = useCurrency(player, 'Account');
                const isCashAvailable = await accountCurrency.has(
                    payementType as keyof AccountCurrencies,
                    dealership.vehicles[vehicleIndex].VehicleSalePrice,
                );
                if (!isCashAvailable) {
                    return;
                } else {
                    await accountCurrency.sub(
                        payementType as keyof AccountCurrencies,
                        dealership.vehicles[vehicleIndex].VehicleSalePrice,
                    );
                }
            } else {
                return;
            }
        } else {
            if (!dealership.factionId || dealership.factionId === undefined) return;
        }
        const vehcileDetails = await vehicleHandleapi.findVehiclesById(vehicleId);
        const newVehicle = new alt.Vehicle(vehcileDetails.vehicleModel, 645.85 + 3, -260.33, 42.009, 0, 0, 0);
        if (!newVehicle) return;
        const rVehicle = Rebar.vehicle.useVehicle(newVehicle);
        const document = await rVehicle.create(characterId);
        if (!rVehicle || !document) return;
        Rebar.document.vehicle.useVehicle(newVehicle).setBulk({
            fuel: 30,
            ascendedFuel: {
                consumption: 0,
                max: 0,
                type: '',
            },
            color: {
                primary: color ?? 0,
                primaryCustom: new alt.RGBA(255, 0, 0, 255),
                secondary: color ?? 0,
                secondaryCustom: new alt.RGBA(0, 255, 0, 255),
                wheel: 10,
                pearl: 120,
                xenon: 3,
            },
        });
        Rebar.document.vehicle.useVehicleBinder(newVehicle).bind(Rebar.document.vehicle.useVehicle(newVehicle).get());
        Rebar.vehicle.useVehicle(newVehicle).sync();
        Rebar.vehicle.useVehicle(newVehicle).save();
        const didAdd = await rVehicle.keys.add(characterId);
        if (!didAdd) return;
        dealership.vehicles[vehicleIndex].stock = dealership.vehicles[vehicleIndex].stock - 1;
        if (dealership.dealerShipType == 'self_service') {
            const character = Rebar.document.character.useCharacter(player);
            const document = character.get();

            const salesHistory = {
                salesId: Rebar.utility.sha256Random(JSON.stringify(dealership.vehicles[vehicleIndex].saleHistory)),
                soldVehicleId: document._id,
                soldTocharacterId: characterId,
                soldDateTime: new Date(),
                soldPrice: dealership.vehicles[vehicleIndex].VehicleSalePrice,
                payementStatus: true,
                payementType: payementType,
            };
            if (
                !dealership.vehicles[vehicleIndex].saleHistory ||
                dealership.vehicles[vehicleIndex].saleHistory === undefined
            ) {
                dealership.vehicles[vehicleIndex].saleHistory = [];
            }

            dealership.vehicles[vehicleIndex].saleHistory.push(salesHistory);
        } else {
            const salesHistory = {
                salesId: Rebar.utility.sha256Random(JSON.stringify(dealership.vehicles[vehicleIndex].saleHistory)),
                soldVehicleId: document._id,
                soldTocharacterId: characterId,
                soldBycharacterId: document._id,
                soldDateTime: new Date(),
                soldPrice: dealership.vehicles[vehicleIndex].VehicleSalePrice,
                payementStatus: false,
            };
            if (
                !dealership.vehicles[vehicleIndex].saleHistory ||
                dealership.vehicles[vehicleIndex].saleHistory === undefined
            ) {
                dealership.vehicles[vehicleIndex].saleHistory = [];
            }

            dealership.vehicles[vehicleIndex].saleHistory.push(salesHistory);
        }
        const didUpdate = await useDealershipHandlers().update(dealership._id as string, 'vehicles', {
            vehicles: dealership.vehicles,
        });

        return didUpdate.status;
    }

    return {
        setFaction,
        removeFaction,
        getFaction,
        addLocations,
        removeLocations,
        addVehiclesToDealership,
        setVehicleStatus, //check wheather the vehicle is disabled / enabled
        addPurchase,
        getVehicle,
        getAvailableStock,
        addStock,
        setAvailableColor,
        addSales,
    };
}

declare global {
    export interface ServerPlugin {
        [API_NAME]: ReturnType<typeof useDealershipFunctions>;
    }
}

Rebar.useApi().register(API_NAME, useDealershipFunctions());
