import { HubConnection, HubConnectionBuilder, HubConnectionState } from "@microsoft/signalr";

import { serverBase } from "./net";

import type { AppConfiguration } from "../types/config";


export type ConnectionStatus =
    | "connecting"
    | "connected"
    | "reconnecting"
    | "disconnected";


type StatusListener = (status: ConnectionStatus) => void;


let connection: HubConnection | null = null;
let statusListener: StatusListener | null = null;
let connectSeq = 0;
let lastUrl = "";
let currentStatus: ConnectionStatus = "disconnected";


function notify(status: ConnectionStatus) {
    currentStatus = status;
    statusListener?.(status);
}


export function getStatus(): ConnectionStatus {
    return currentStatus;
}


export function subscribeStatus(listener: StatusListener): () => void {
    statusListener = listener;
    return () => {
        if (statusListener === listener)
            statusListener = null;
    };
}


function buildUrl(config: AppConfiguration): string {

    const params = new URLSearchParams({
        deviceId: config.deviceId ?? "",
        name: config.deviceName ?? config.counterName ?? config.counterId ?? "",
        locationId: config.locationId ?? "",
        flowId: config.flowId ?? "",
        type: "Counter"
    });

    return `${serverBase(config.server)}/devices?${params.toString()}`;
}


async function stopCurrent(): Promise<void> {

    const old = connection;
    connection = null;
    lastUrl = "";

    if (old && old.state !== HubConnectionState.Disconnected) {
        try {
            await old.stop();
        }
        catch {
            // The connection was already stopped or closed
        }
    }
}


export async function connect(config: AppConfiguration): Promise<void> {

    const url = buildUrl(config);
    const seq = ++connectSeq;

    if (connection && lastUrl === url && connection.state === HubConnectionState.Connected) {
        notify("connected");
        return;
    }

    await stopCurrent();

    if (seq !== connectSeq)
        return;

    lastUrl = url;
    connection = new HubConnectionBuilder()
        .withUrl(url)
        .withAutomaticReconnect({
            nextRetryDelayInMilliseconds() {
                return 2000;
            }
        })
        .build();

    connection.onreconnecting(() => {
        if (seq === connectSeq)
            notify("reconnecting");
    });
    connection.onreconnected(() => {
        if (seq === connectSeq)
            notify("connected");
    });
    connection.onclose(() => {
        if (seq === connectSeq)
            notify("disconnected");
    });

    notify("connecting");

    try {
        await connection.start();

        if (seq !== connectSeq) {
            void connection.stop();
            return;
        }

        notify("connected");
    }
    catch (error) {
        if (seq === connectSeq)
            notify("disconnected");
        throw error;
    }
}


export async function disconnect(): Promise<void> {

    connectSeq++;

    const had = connection !== null;

    await stopCurrent();

    if (had)
        notify("disconnected");
}
