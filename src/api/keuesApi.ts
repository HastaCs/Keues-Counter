import { serverBase } from "./net";

import type { Location, Counter, Ticket, Flow, FlowNode } from "../types/models";


export async function getLocations(server: string): Promise<Location[]> {

    const response = await fetch(`${serverBase(server)}/api/locations`);

    const json = await response.json();

    return json.data;
}


export async function getCounters(
    server: string,
    locationId: string
): Promise<Counter[]> {

    const response = await fetch(
        `${serverBase(server)}/api/counters?locationId=${locationId}`
    );

    const json = await response.json();

    return json.data;
}


export async function getFlows(
    server: string,
    locationId: string
): Promise<Flow[]> {

    const response = await fetch(
        `${serverBase(server)}/api/flows?locationId=${locationId}`
    );

    const json = await response.json();

    return json.data;
}


export async function getFlow(
    server: string,
    flowId: string
): Promise<Flow> {

    const response = await fetch(
        `${serverBase(server)}/api/flows/${flowId}`
    );

    return await response.json();
}


export function getFlowQueueIds(flow: Flow): string[] {

    try {
        const nodes = JSON.parse(flow.flowJson) as FlowNode[];

        return nodes
            .filter(x => x.nodeType === "ticket" && x.queueId)
            .map(x => x.queueId as string);
    }
    catch {
        return [];
    }
}


export async function callNext(
    server: string,
    counterId: string,
    flowId: string
): Promise<Ticket | null> {

    const response = await fetch(
        `${serverBase(server)}/api/counters/${counterId}/call-next-ticket`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                counterId,
                flowId
            })
        }
    );

    if (!response.ok)
        throw new Error("Could not call the next ticket");

    const text = await response.text();

    if (!text)
        return null;

    return JSON.parse(text) as Ticket;
}


export async function attendTicket(
    server: string,
    counterId: string,
    ticketId: string,
    flowId: string
) {

    await fetch(
        `${serverBase(server)}/api/counters/${counterId}/attend-ticket`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                counterId,
                ticketId,
                flowId
            })
        }
    );
}


export async function cancelTicket(
    server: string,
    counterId: string,
    ticketId: string
) {

    const response = await fetch(
        `${serverBase(server)}/api/counters/${counterId}/cancel-ticket`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ticketId
            })
        }
    );

    if (!response.ok)
        throw new Error("Could not cancel the ticket");
}


export async function setCounterFree(
    server: string,
    counterId: string,
    flowId: string
) {

    const response = await fetch(
        `${serverBase(server)}/api/counters/${counterId}/set-free`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                counterId,
                flowId
            })
        }
    );

    if (!response.ok)
        throw new Error("Could not notify that the counter is free");
}


export async function manualCall(
    server: string,
code:string,
flowId:string,
locationId:string,
counterId:string,

) {

    const response = await fetch(
        `${serverBase(server)}/api/counters/${counterId}/call-manual-ticket`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code,
                flowId,
                locationId,
                counterId
            })
        }
    );

    if (!response.ok)
        throw new Error("Could not call the manual number");
}
