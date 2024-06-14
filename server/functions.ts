import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Character } from '@Shared/types/character.js';
import { useDealershipHandlers } from './handlers.js';
import { Locals, Locations } from '../shared/interface.js';

const API_NAME = 'rebar-dealership-functions-api';
const Rebar = useRebar();
const db = Rebar.database.useDatabase();
const getter = Rebar.get.usePlayerGetter();
const api = Rebar.useApi();
const RebarEvents = Rebar.events.useEvents();
const FACTION_COLLECTION = 'Vehicleshop';
const factionapi = await Rebar.useApi().getAsync('faction-handlers-api');
export function useDealershipFunctions() {
    /**
     * set Faction to a dealership
     *
     */
    async function setFaction(vehShopId: string, factionId: string): Promise<any> {
        const vehShops = await useDealershipHandlers().findDealershipById(vehShopId);

        const faction = await factionapi.findFactionById(factionId);
        if (!faction) {
            return { status: false, response: `Faction doesn't Exist.` };
        }
        const didUpdate = await useDealershipHandlers().update(vehShops._id as string, 'factionId', {
            factionId: factionId,
        });

        return didUpdate.status;
    }

    async function addLocations(
        player: alt.Player,
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
        if (dealership.location !== undefined) {
            if (dealership.location[locationType] !== undefined || dealership.location[locationType].length > 0) {
                const index = dealership.location[locationType].findIndex((r) => r.locationName != locationName);
                if (index <= -1) {
                    return false;
                }
            } else {
                dealership.location[locationType] = [];
            }
        } else {
            dealership.location = {};
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
        player: alt.Player,
        delershipId: string,
        locationType: keyof Locations,
        locationId: string,
    ): Promise<boolean> {
        const dealership = await useDealershipHandlers().findDealershipById(delershipId);
        if (dealership.location === undefined) return false;
        if (dealership.location[locationType] === undefined) return false;
        if (dealership.location[locationType].length < 0) return false;
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
        if (didUpdate.status) {
            // updateMembers(faction);
        }

        return didUpdate.status;
    }

    return {
        setFaction,
        addLocations,
        removeLocations,
    };
}

declare global {
    export interface ServerPlugin {
        [API_NAME]: ReturnType<typeof useDealershipFunctions>;
    }
}

Rebar.useApi().register(API_NAME, useDealershipFunctions());
