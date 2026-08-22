export interface Location {
    id: string;
    name: string;
    description: string;
    color: string;
}

export interface Counter {
    id: string;
    code: string;
    name: string;
    description: string;
    color: string;
    queues: string[];
}

export interface Ticket {
    ticketId: string;
    code: string;
}

export interface FlowNode {
    id: string;
    name: string;
    description: string;
    nodeType: "menu" | "ticket";
    parentId: string | null;
    queueId: string | null;
    icon: string;
    color: string;
}

export interface Flow {
    id: string;
    name: string;
    description: string;
    flowType: number;
    flowJson: string;
}
