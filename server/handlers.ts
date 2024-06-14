import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Character } from '@Shared/types/character.js';
import * as Utility from '@Shared/utility/index.js';
import { Dealership, DealershipCore } from '../shared/interface.js';

const API_NAME = 'rebar-dealership-handlers-api';
const Rebar = useRebar();
const db = Rebar.database.useDatabase();
const getter = Rebar.get.usePlayerGetter();
const api = Rebar.useApi();

const DEALERSHIP_COLLECTION = 'Vehicleshop';

const vehicleShops: { [key: string]: Dealership } = {};
type DealershipChangeCallback = (_id: string, fieldName: string) => void;
const callbacks: DealershipChangeCallback[] = [];

class InternalFunctions {
    static update(vehshop: Dealership) {
        vehicleShops[vehshop._id as string] = vehshop;
    }
}

async function init() {
    const vehShopList = await db.getAll<{ _id: string }>(DEALERSHIP_COLLECTION);
    if (vehShopList.length === 0) {
        alt.logWarning(`No Dealership have been created`);
        return;
    }

    for (const { _id } of vehShopList) {
        const [fullDealership] = await db.getMany<Dealership>({ _id }, DEALERSHIP_COLLECTION);
        if (fullDealership) {
            InternalFunctions.update(fullDealership);
        }
    }
}

export function useDealershipHandlers() {
    async function create(_vehShop: DealershipCore): Promise<any> {
        if (!_vehShop.dealershipName) {
            alt.logWarning(`Cannot create a Dealership, missing Dealership name.`);
            return { status: false, response: `Cannot create Dealership, missing Dealership name.` };
        }

        const vehShop: Dealership = {
            ..._vehShop,
        };

        const existingFactions = await db.getMany<Dealership>(
            { dealershipName: _vehShop.dealershipName },
            DEALERSHIP_COLLECTION,
        );
        if (existingFactions.length > 0) {
            alt.logWarning(`This Faction ` + _vehShop.dealershipName + ` already created.`);
            return { status: false, response: `Cannot insert faction into database.` };
        }

        const document = await db.create<Dealership>(vehShop, DEALERSHIP_COLLECTION);
        if (!document) {
            alt.logWarning(`Cannot insert faction into database.`);
            return { status: false, response: `Cannot insert faction into database.` };
        }

        const vehShopId = document.toString();
        vehShop._id = vehShopId;
        InternalFunctions.update(vehShop);

        return { status: true, response: vehShopId };
    }

    async function remove(_id: string): Promise<any> {
        const vehShop = vehicleShops[_id];
        if (!vehShop) {
            return { status: false, response: `Faction was not found with id: ${_id}` };
        }

        // delete vehShop[_id];

        // let onlinePlayers: Array<alt.Player> = [];
        // for (const member of members) {
        //     member.faction = null;
        //     const xPlayer: alt.Player = getter.byCharacter(member._id);

        //     if (xPlayer && Rebar.document.character.useCharacter(xPlayer).isValid()) {
        //         const character = Rebar.document.character.useCharacter(xPlayer);
        //         await character.set('faction', '');

        //         if (character.get()._id === ownerIdentifier) {
        //             const characterCurrency = useCurrency(xPlayer, 'Character');
        //             await characterCurrency.add('bank', faction.bank);
        //         }

        //         onlinePlayers.push(xPlayer);
        //     } else if (member._id === ownerIdentifier) {
        //         member.bank += faction.bank;
        //         await db.update({ _id: ownerIdentifier, bank: member.bank }, 'Characters');
        //     }
        // }

        // for (const vehicle of faction.vehicles) {
        //     const altVehicle = alt.Vehicle.all.find((v) => v && v.valid && v.id.toString() === vehicle.vehicleId);
        //     if (altVehicle) altVehicle.destroy();

        //     await db.deleteDocument(vehicle.vehicleId, 'Vehicles');
        // }

        return { status: true, response: `Deleted Dealership successfully` };
    }

    async function update(_id: string, fieldName: string, partialObject: Partial<Dealership>): Promise<any> {
        const vehShop = vehicleShops[_id];
        console.log(vehShop);
        if (!vehShop) {
            return { status: false, response: `Dealership was not found with id: ${_id}` };
        }

        try {
            await db.update({ _id, [fieldName]: partialObject[fieldName] }, DEALERSHIP_COLLECTION);
        } catch (err) {
            console.error(err);
            return { status: false, response: `Failed to update data.` };
        }

        callbacks.forEach((cb) => cb(_id, fieldName));
        return { status: true, response: `Dealership Data Updated` };
    }

    async function findDealershipById(_id: string): Promise<Dealership | null> {
        return vehicleShops[_id] || null;
    }

    function findDealershipByName(nameOrPartialName: string): Dealership | null {
        const normalizedQuery = nameOrPartialName.replace(/ /g, '').toLowerCase();
        return (
            Object.values(vehicleShops).find((vehShop) =>
                vehShop.dealershipName.replace(/ /g, '').toLowerCase().includes(normalizedQuery),
            ) || null
        );
    }

    function getAllDealership(): Array<Dealership> {
        return Object.values(vehicleShops);
    }

    function onUpdate(callback: DealershipChangeCallback) {
        callbacks.push(callback);
    }

    return {
        create,
        remove,
        update,
        onUpdate,
        findDealershipByName,
        findDealershipById,
        getAllDealership,
    };
}

declare global {
    export interface ServerPlugin {
        [API_NAME]: ReturnType<typeof useDealershipHandlers>;
    }
}

Rebar.useApi().register(API_NAME, useDealershipHandlers());

init();
