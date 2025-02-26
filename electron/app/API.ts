import { setupMainHandler } from './setupMainHandler';
import { ipcMain } from 'electron';
import { settingsService } from './services/settings-service';
import { appSettingService } from './services/app-setting-service';
import { trackItemService } from './services/track-item-service';
import { stateManager } from './state-manager';
import { State } from './enums/state';
import AppManager from './app-manager';

const settingsActions = {
    fetchAnalyserSettingsJsonString: async () => {
        return settingsService.fetchAnalyserSettingsJsonString();
    },
    updateByName: async (payload) => {
        return settingsService.updateByName(payload.name, payload.jsonData);
    },
    getRunningLogItemAsJson: async () => {
        return settingsService.getRunningLogItemAsJson();
    },
    fetchWorkSettings: async () => {
        return settingsService.fetchWorkSettings();
    },
    saveThemeAndNotify: async (payload) => {
        AppManager.saveThemeAndNotify(payload);
    },
};

const appSettingsActions = {
    changeColorForApp: async (payload) => {
        return appSettingService.changeColorForApp(payload.appName, payload.color);
    },
};
const trackItemActions = {
    findAllDayItems: async (payload) => {
        return trackItemService.findAllDayItems(payload.from, payload.to, payload.taskName);
    },

    createTrackItem: async (payload) => {
        return trackItemService.createTrackItem(payload.trackItem);
    },
    updateTrackItem: async (payload) => {
        return trackItemService.updateTrackItem(payload.trackItem, payload.trackItem.id);
    },
    updateTrackItemColor: async (payload) => {
        return trackItemService.updateTrackItemColor(payload.appName, payload.color);
    },
    deleteByIds: async (payload) => {
        return trackItemService.deleteByIds(payload.trackItemIds);
    },
    searchFromItems: async (payload) => {
        const { from, to, taskName, searchStr, paging } = payload;
        return trackItemService.findAllItems(from, to, taskName, searchStr, paging);
    },
    exportFromItems: async (payload) => {
        const { from, to, taskName, searchStr } = payload;
        return trackItemService.findAndExportAllItems(from, to, taskName, searchStr);
    },
    findFirstLogItems: async () => {
        return trackItemService.findFirstLogItems();
    },
    findFirstTrackItem: async () => {
        return trackItemService.findFirstTrackItem();
    },
    getOnlineStartTime: async () => {
        const statusItem = stateManager.getCurrentStatusTrackItem();

        return statusItem && statusItem.app === State.Online ? statusItem.beginDate : null;
    },
};

export const initIpcActions = () =>
    setupMainHandler({ ipcMain } as any, { ...settingsActions, ...appSettingsActions, ...trackItemActions }, true);
