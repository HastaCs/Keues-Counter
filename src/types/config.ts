export interface AppConfiguration {
    server: string;
    locationId: string | null;
    flowId: string | null;
    counterId: string | null;
    flowType: number | null;
    deviceId?: string;
    deviceName?: string;
    locationName?: string;
    flowName?: string;
    counterName?: string;
    counterCode?: string;
}
