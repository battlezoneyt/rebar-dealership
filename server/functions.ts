import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Character } from '@Shared/types/character.js';
import { useDealershipHandlers } from './handlers.js';
import {
    CurrencyDefinitions,
    DEALERSHIP_TYPES,
    Locals,
    Locations,
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
const FACTION_COLLECTION = 'Vehicleshop';
const factionHandleapi = await Rebar.useApi().getAsync('faction-handlers-api');
const factionFunctionapi = await api.getAsync('faction-functions-api');
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
        if (dealership.location === undefined) {
            dealership.location = {};
        }
        if (dealership.location[locationType] !== undefined || dealership.location[locationType].length > 0) {
            const index = dealership.location[locationType].findIndex((r) => r.locationName != locationName);
            if (index <= -1) {
                return false;
            }
        } else {
            dealership.location[locationType] = [];
        }
        let location: Locals = {
            locationId: Rebar.utility.sha256Random(JSON.stringify(dealership.location)),
            locationName: locationName,
            pos: pos,
            spawnSpots: spawnSpots,
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

    async function addVehicles(
        dealershipId: string,
        vehicleCategory: VEHICLE_CATEFORY,
        vehicleName: string,
        vehicleModel: string,
        VehicleSalePrice: number,
        VehiclePurchasePrice?: number,
    ): Promise<any> {
        const dealership = await useDealershipHandlers().findDealershipById(dealershipId);
        if (!dealership || dealership === undefined) return false;
        if (!dealership.vehicles || dealership.vehicles === undefined) {
            dealership.vehicles = [];
        }
        const index = dealership.vehicles.findIndex((r) => r.vehicleModel != vehicleModel);
        if (index >= -1) {
            return false;
        }

        let vehicle: Vehicles = {
            vehicleId: Rebar.utility.sha256Random(JSON.stringify(dealership.location)),
            vehicleCategory: vehicleCategory,
            vehicleName: vehicleName,
            vehicleModel: vehicleModel,
            VehicleSalePrice: VehicleSalePrice,
            VehiclePurchasePrice: VehiclePurchasePrice ?? undefined,
        };
        try {
            dealership.vehicles.push(vehicle);
        } catch (err) {
            console.log(err);
        }
        const didUpdate = await useDealershipHandlers().update(dealership._id as string, 'vehicles', {
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
        dealership.vehicles[index].isDisabled = !dealership.vehicles[index].isDisabled;

        const didUpdate = await useDealershipHandlers().update(dealership._id as string, 'vehicles', {
            vehicles: dealership.vehicles,
        });

        return didUpdate.status;
    }

    async function getAllVehiclesOfDealership(dealershipId: string): Promise<Vehicles[]> {
        const dealership = await useDealershipHandlers().findDealershipById(dealershipId);
        if (!dealership || dealership === undefined) return undefined;
        const removeDisabled = dealership.vehicles.filter((vehicle) => !vehicle.isDisabled);

        return Object.values(removeDisabled);
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
            dealership.vehicles[index].VehiclePurchasePrice === undefined ||
            dealership.vehicles[index].isDisabled
        ) {
            return;
        }
        const purchaseHistory = {
            purchaseId: Rebar.utility.sha256Random(JSON.stringify(dealership.vehicles[index].purchaseHistory)),
            purchaseQty: purchaseQty,
            purchaseDataTime: new Date(),
            purchaseAmount: dealership.vehicles[index].VehiclePurchasePrice * purchaseQty,
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
        dealership.vehicles[index].stock = +purchaseQty;

        const didUpdate = await useDealershipHandlers().update(dealership._id as string, 'vehicles', {
            vehicles: dealership.vehicles,
        });

        return didUpdate.status;
    }

    async function getVehicle(dealershipId: string, vehicleId: string): Promise<Vehicles> {
        const dealership = await useDealershipHandlers().findDealershipById(dealershipId);
        if (!dealership || dealership === undefined) return undefined;
        if (!dealership.vehicles || dealership.vehicles === undefined) return undefined;
        const filteredVehicle = dealership.vehicles.filter((vehicle) => vehicle.vehicleId === vehicleId);

        return filteredVehicle[0];
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
        color?: string,
        CurrencyType?: keyof CurrencyDefinitions,
        payementType?: AllCurrencyTypes,
    ): Promise<any> {
        const dealership = await useDealershipHandlers().findDealershipById(dealershipId);
        if (!dealership || dealership === undefined) return false;
        if (!dealership.vehicles) {
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
            dealership.vehicles[index].VehiclePurchasePrice === undefined ||
            !dealership.vehicles[index].VehicleSalePrice ||
            dealership.vehicles[index].VehicleSalePrice === undefined ||
            dealership.vehicles[index].isDisabled ||
            dealership.vehicles[index].stock <= 0
        ) {
            return;
        }

        const newVehicle = new alt.Vehicle(
            dealership.vehicles[index].vehicleModel,
            645.85 + 3,
            -260.33,
            42.009,
            0,
            0,
            0,
        );
        const document = await Rebar.vehicle.useVehicle(newVehicle).create(characterId);
        if (!document) return;
        const soldVehicleId = document._id;
        Rebar.document.vehicle.useVehicle(newVehicle).setBulk({
            fuel: 30,
            ascendedFuel: {
                consumption: 0,
                max: 0,
                type: '',
            },
        });
        Rebar.document.vehicle.useVehicleBinder(newVehicle).bind(Rebar.document.vehicle.useVehicle(newVehicle).get());
        Rebar.vehicle.useVehicle(newVehicle).sync();
        Rebar.vehicle.useVehicle(newVehicle).save();
        if (dealership.dealerShipType == 'self_service') {
            if (CurrencyType == 'Character') {
                const characterCurrency = useCurrency(player, 'Character');
                const isCashAvailable = characterCurrency.has(
                    payementType as keyof CharacterCurrencies,
                    dealership.vehicles[index].VehicleSalePrice,
                );
                if (!isCashAvailable) {
                    return;
                } else {
                    characterCurrency.sub(
                        payementType as keyof CharacterCurrencies,
                        dealership.vehicles[index].VehicleSalePrice,
                    );
                }
            } else if (CurrencyType == 'Account') {
                const accountCurrency = useCurrency(player, 'Account');
                const isCashAvailable = accountCurrency.has(
                    payementType as keyof AccountCurrencies,
                    dealership.vehicles[index].VehicleSalePrice,
                );
                if (!isCashAvailable) {
                    return;
                } else {
                    accountCurrency.sub(
                        payementType as keyof AccountCurrencies,
                        dealership.vehicles[index].VehicleSalePrice,
                    );
                }
            } else {
                return;
            }
            const paymentStatus = await factionFunctionapi.addBank(
                dealership.factionId,
                dealership.vehicles[index].VehiclePurchasePrice,
            );
            if (!paymentStatus) {
                return;
            }
            const salesHistory = {
                salesId: Rebar.utility.sha256Random(JSON.stringify(dealership.vehicles[index].saleHistory)),
                soldVehicleId: soldVehicleId,
                soldTocharacterId: characterId,
                soldDateTime: new Date(),
                soldPrice: dealership.vehicles[index].VehicleSalePrice,
                payementStatus: true,
                payementType: payementType,
            };
            if (!dealership.vehicles[index].saleHistory || dealership.vehicles[index].saleHistory === undefined) {
                dealership.vehicles[index].saleHistory = [];
            }

            dealership.vehicles[index].saleHistory.push(salesHistory);
        } else {
            const salesHistory = {
                salesId: Rebar.utility.sha256Random(JSON.stringify(dealership.vehicles[index].saleHistory)),
                soldVehicleId: soldVehicleId,
                soldTocharacterId: characterId,
                soldDateTime: new Date(),
                soldPrice: dealership.vehicles[index].VehicleSalePrice,
                payementStatus: false,
            };
            if (!dealership.vehicles[index].saleHistory || dealership.vehicles[index].saleHistory === undefined) {
                dealership.vehicles[index].saleHistory = [];
            }

            dealership.vehicles[index].saleHistory.push(salesHistory);
        }
        dealership.vehicles[index].stock = dealership.vehicles[index].stock - 1;
        const didUpdate = await useDealershipHandlers().update(dealership._id as string, 'vehicles', {
            vehicles: dealership.vehicles,
        });

        return didUpdate.status;
    }

    return {
        setFaction,
        addLocations,
        removeLocations,
        addVehicles,
        setVehicleStatus, //check wheather the vehicle is disabled / enabled
        getAllVehiclesOfDealership, //return all vehicles which are not in disable status
        addPurchase,
        getVehicle,
        getAvailableStock,
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
