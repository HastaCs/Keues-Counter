import { useEffect, useState } from "react";
import { Badge, Button, Group } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";

import CallTicketPanel from "./CallTicketPanel";
import SetFreePanel from "./SetFreePanel";
import ManualCallPanel from "./ManualCallPanel";
import VersionBadge from "../VersionBadge";
import { getStatus, subscribeStatus } from "../../api/signalRService";

import type { ConnectionStatus } from "../../api/signalRService";
import type { AppConfiguration } from "../../types/config";


interface Props {
    config: AppConfiguration;
    onOpenConfig: () => void;
}


export default function CounterPanel({ config, onOpenConfig }: Props) {

    const flowType = config.flowType ?? 0;

    const [status, setStatus] = useState<ConnectionStatus>(getStatus);

    useEffect(() => {
        return subscribeStatus(setStatus);
    }, []);


    function panel() {
        switch (flowType) {
            case 1:
                return <SetFreePanel config={config} />;
            case 2:
                return <ManualCallPanel config={config} />;
            default:
                return <CallTicketPanel config={config} />;
        }
    }

    const statusColor: Record<ConnectionStatus, string> = {
        connecting: "yellow",
        connected: "green",
        reconnecting: "orange",
        disconnected: "red"
    };

    const statusLabel: Record<ConnectionStatus, string> = {
        connecting: "Connecting…",
        connected: "Connected",
        reconnecting: "Reconnecting…",
        disconnected: "Disconnected"
    };


    return (
        <>
            <Group pos="fixed" top={20} right={20}>
                <Button
                    leftSection={<IconSettings size={16} />}
                    variant="default"
                    onClick={onOpenConfig}
                >
                    Settings
                </Button>
            </Group>

            {panel()}

            <VersionBadge />

            <Group pos="fixed" bottom={12} left={12} gap="xs" style={{ zIndex: 100 }}>
                <Badge size="md" variant="light" color={statusColor[status]}>
                    {statusLabel[status]}
                </Badge>
            </Group>
        </>
    );
}
