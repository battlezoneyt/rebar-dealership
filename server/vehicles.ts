import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Character } from '@Shared/types/character.js';
import * as Utility from '@Shared/utility/index.js';
import { Vehicles } from '../shared/interface.js';

const API_NAME = 'rebar-server-vehciles-api';
const Rebar = useRebar();
const db = Rebar.database.useDatabase();
const getter = Rebar.get.usePlayerGetter();
const api = Rebar.useApi();

const VEHICLES_COLLECTION = 'ServerVehicles';

const vehicles: { [key: string]: Vehicles } = {};
type VehiclesChangeCallback = (_id: string, fieldName: string) => void;
const callbacks: VehiclesChangeCallback[] = [];

class InternalFunctions {
    static update(vehshop: Vehicles) {
        vehicles[vehshop._id as string] = vehshop;
    }
}

async function init() {
    const vehList = await db.getAll<{ _id: string }>(VEHICLES_COLLECTION);
    if (vehList.length === 0) {
        alt.logWarning(`No Dealership have been created`);
        return;
    }

    for (const { _id } of vehList) {
        const [fullVehicles] = await db.getMany<Vehicles>({ _id }, VEHICLES_COLLECTION);
        if (fullVehicles) {
            InternalFunctions.update(fullVehicles);
        }
    }
}

export function useServerVehicles() {
    async function create(_veh: Vehicles): Promise<any> {
        if (!_veh.vehicleLabel || _veh.vehicleModel || _veh.vehicleCategory || _veh.vehicleType) {
            alt.logWarning(`Cannot create a Vehicle, missing Vehicle name / model / category / type.`);
            return {
                status: false,
                response: `Cannot create a Vehicle, missing Vehicle name / model / category / type.`,
            };
        }

        const veh: Vehicles = {
            ..._veh,
        };

        const index = findVehiclesByModelId(_veh.vehicleModel);

        if (index) {
            alt.logWarning(`This Vehicle ` + _veh.vehicleModel + ` already created.`);
            return { status: false, response: `Cannot insert faction into database.` };
        }

        const document = await db.create<Vehicles>(veh, VEHICLES_COLLECTION);
        if (!document) {
            alt.logWarning(`Cannot insert faction into database.`);
            return { status: false, response: `Cannot insert faction into database.` };
        }

        const vehId = document.toString();
        veh._id = vehId;
        InternalFunctions.update(veh);

        return { status: true, response: vehId };
    }

    async function remove(_id: string): Promise<any> {
        const veh = vehicles[_id];
        if (!veh) {
            return { status: false, response: `Dealership was not found with id: ${_id}` };
        }

        return { status: true, response: `Deleted Dealership successfully` };
    }

    async function update(_id: string, fieldName: string, partialObject: Partial<Vehicles>): Promise<any> {
        const veh = vehicles[_id];
        console.log(veh);
        if (!veh) {
            return { status: false, response: `Dealership was not found with id: ${_id}` };
        }

        try {
            await db.update({ _id, [fieldName]: partialObject[fieldName] }, VEHICLES_COLLECTION);
        } catch (err) {
            console.error(err);
            return { status: false, response: `Failed to update data.` };
        }

        callbacks.forEach((cb) => cb(_id, fieldName));
        return { status: true, response: `Dealership Data Updated` };
    }

    async function findVehiclesById(_id: string): Promise<Vehicles | null> {
        return vehicles[_id] || null;
    }

    async function findVehiclesByModelId(vehicleModel: number): Promise<Vehicles | null> {
        return vehicles[vehicleModel] || null;
    }

    function findVehiclesByName(nameOrPartialName: string): Vehicles | null {
        const normalizedQuery = nameOrPartialName.replace(/ /g, '').toLowerCase();
        return (
            Object.values(vehicles).find((vehs) =>
                vehs.vehicleLabel.replace(/ /g, '').toLowerCase().includes(normalizedQuery),
            ) || null
        );
    }

    function getAllVehicles(): Array<Vehicles> {
        return Object.values(vehicles);
    }

    function onUpdate(callback: VehiclesChangeCallback) {
        callbacks.push(callback);
    }

    async function setVehicleStatus(vehicleId: string): Promise<any> {
        const findVeh = await findVehiclesById(vehicleId);
        if (!findVeh || findVeh === undefined) {
            return false;
        }
        vehicles[vehicleId].isDisabled = !vehicles[vehicleId].isDisabled;

        const didUpdate = update(findVeh._id as string, VEHICLES_COLLECTION, {
            isDisabled: vehicles[vehicleId].isDisabled,
        });

        return didUpdate;
    }

    async function getVehicleStatus(vehicleId: string): Promise<any> {
        const findVeh = await findVehiclesById(vehicleId);
        if (!findVeh || findVeh === undefined) {
            return false;
        }
        return vehicles[vehicleId].isDisabled;
    }

    return {
        create,
        remove,
        update,
        onUpdate,
        findVehiclesById,
        findVehiclesByModelId,
        findVehiclesByName,
        getAllVehicles,
        setVehicleStatus,
        getVehicleStatus,
    };
}

declare global {
    export interface ServerPlugin {
        [API_NAME]: ReturnType<typeof useServerVehicles>;
    }
}

Rebar.useApi().register(API_NAME, useServerVehicles());

init();
