import { useRebar } from '@Server/index.js';
import alt from 'alt-server';
import {
    CurrencyDefinitions,
    DEALERSHIP_TYPES,
    Locations,
    VEHICLE_CATEFORY,
    VEHICLE_TYPES,
} from '../shared/interface.js';
import { AccountCurrencies, AllCurrencyTypes, CharacterCurrencies } from '@Plugins/rebar-currency/shared/config.js';

const rebar = useRebar();
const messenger = rebar.messenger.useMessenger();
const api = rebar.useApi();
const getter = rebar.get.usePlayerGetter();
const apiHandler = await api.getAsync('rebar-dealership-handlers-api');
const apifunction = await api.getAsync('rebar-dealership-functions-api');

messenger.commands.register({
    name: '/dlrcreate',
    desc: '/dlrcreate to create Dealership',
    options: { permissions: ['admin'] },
    callback: async (
        player: alt.Player,
        dealershipName: string,
        dealerShipType: DEALERSHIP_TYPES,
        vehicleType: VEHICLE_TYPES,
    ) => {
        try {
            const result = await apiHandler.create({
                dealershipName: dealershipName,
                dealerShipType: dealerShipType,
                vehicleType: vehicleType,
            });
            console.log(result.response);
        } catch (err) {
            messenger.message.send(player, { type: 'warning', content: 'Somthing went wrong!.' });
        }
    },
});

messenger.commands.register({
    name: '/dlrsetfaction',
    desc: '/dlrsetfaction set dealership faction ',
    options: { permissions: ['admin'] },
    callback: async (player: alt.Player, vehShopId: string, factionId: string) => {
        const result = await apifunction.setFaction(vehShopId, factionId);
        console.log(result);
    },
});

messenger.commands.register({
    name: '/dlraddlocation',
    desc: '/dlraddlocation to add dealership location ',
    options: { permissions: ['admin'] },
    callback: async (
        player: alt.Player,
        vehShopId: string,
        // locationType: keyof Locations,
        locationName: string,
        x: string,
        y: string,
        z: string,
    ) => {
        const pos = new alt.Vector3(parseFloat(x), parseFloat(y), parseFloat(z));
        const result = await apifunction.addLocations(vehShopId, 'DelerShipLocation', locationName, pos);
        console.log(result);
    },
});

messenger.commands.register({
    name: '/dlrremovelocation',
    desc: '/dlrremovelocation to remove dealership location ',
    options: { permissions: ['admin'] },
    callback: async (player: alt.Player, dealershipId: string, locationType: keyof Locations, locationId: string) => {
        const result = await apifunction.removeLocations(dealershipId, locationType, locationId);
        console.log(result);
    },
});

messenger.commands.register({
    name: '/dlraddvehicle',
    desc: '/dlraddvehicle new vehicle to the dealership ',
    options: { permissions: ['admin'] },
    callback: async (
        player: alt.Player,
        vehShopId: string,
        vehicleId: string,
        VehiclePurchasePrice: string,
        VehicleSalePrice?: string,
        showInList?: string,
    ) => {
        const showInListBoolean = showInList?.toLowerCase() === 'true';
        const result = await apifunction.addVehiclesToDealership(
            vehShopId,
            vehicleId,
            parseInt(VehiclePurchasePrice),
            parseInt(VehicleSalePrice),
            showInListBoolean,
        );
        console.log(result);
    },
});

messenger.commands.register({
    name: '/dlrsetvehiclestatus',
    desc: '/dlrsetvehiclestatus to set vehicle status to enabled or disabled ',
    options: { permissions: ['admin'] },
    callback: async (player: alt.Player, dealershipId: string, vehicleId: string) => {
        const result = await apifunction.setVehicleStatus(dealershipId, vehicleId);
        console.log(result);
    },
});

messenger.commands.register({
    name: '/dlrgetallvehicles',
    desc: '/dlrgetallvehicles to get all aviable vehicle in the dealership',
    options: { permissions: ['admin'] },
    callback: async (player: alt.Player, dealershipId: string) => {
        const dealership = await apiHandler.findDealershipById(dealershipId);
        console.log(dealership.vehicles);
    },
});

messenger.commands.register({
    name: '/dlraddstock',
    desc: '/dlraddstock to add stock to dealership ',
    options: { permissions: ['admin'] },
    callback: async (player: alt.Player, dealershipId: string, vehicleId: string, qty: string) => {
        const result = await apifunction.addPurchase(dealershipId, vehicleId, parseInt(qty));
    },
});

messenger.commands.register({
    name: '/dlrsetcolor',
    desc: '/dlrsetcolor set available color',
    options: { permissions: ['admin'] },
    callback: async (player: alt.Player, dealershipId: string, vehicleId: string, color: string) => {
        if (!dealershipId || !vehicleId || !color) return;

        const result = await apifunction.setAvailableColor(dealershipId, vehicleId, color);
        console.log(result);
    },
});

messenger.commands.register({
    name: '/dlrsalevehicle',
    desc: '/dlrsalevehicle to sell a vehicle',
    options: { permissions: ['admin'] },
    callback: async (
        player: alt.Player,
        dealershipId: string,
        vehicleId: string,
        characterId: string,
        color?: string,
        CurrencyType?: keyof CurrencyDefinitions,
        PaymentType?: AllCurrencyTypes,
    ) => {
        if (!dealershipId || !vehicleId) return;
        const result = await apifunction.addSales(
            player,
            dealershipId,
            vehicleId,
            characterId,
            parseInt(color),
            CurrencyType,
            PaymentType,
        );
        console.log(result);
    },
});
