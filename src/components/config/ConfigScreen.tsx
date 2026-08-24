import { useEffect, useState } from "react";
import {
    Alert,
    Badge,
    Box,
    Button,
    Group,
    Paper,
    Select,
    Stack,
    Tabs,
    TextInput,
    Title,
    Text
} from "@mantine/core";
import { IconRefresh, IconSettings } from "@tabler/icons-react";

import {
    getLocations,
    getFlows,
    getFlow,
    getCounters,
    getFlowQueueIds
} from "../../api/keuesApi";

import { isTauri, saveConfiguration } from "../../api/appBridge";
import { configureTarget } from "../../api/net";

import UpdatePanel from "./UpdatePanel";
import Brand from "../Brand";

import type { Location, Counter, Flow } from "../../types/models";
import type { AppConfiguration } from "../../types/config";


const flowTypeNames = ["TicketMachine", "SetFree", "ManualCall"];


interface Props {
    initialConfig?: AppConfiguration | null;
    onSaved: (config: AppConfiguration) => void;
    onCancel?: () => void;
}


export default function ConfigScreen({ initialConfig, onSaved, onCancel }: Props) {

    const [server, setServer] = useState(initialConfig?.server ?? "");
    const [deviceName, setDeviceName] = useState(initialConfig?.deviceName ?? "");
    const [locations, setLocations] = useState<Location[]>([]);
    const [flows, setFlows] = useState<Flow[]>([]);
    const [counters, setCounters] = useState<Counter[]>([]);

    const [locationId, setLocationId] = useState<string | null>(initialConfig?.locationId ?? null);
    const [flowId, setFlowId] = useState<string | null>(initialConfig?.flowId ?? null);
    const [counterId, setCounterId] = useState<string | null>(initialConfig?.counterId ?? null);

    const [selectedFlowType, setSelectedFlowType] = useState<number | null>(initialConfig?.flowType ?? null);

    const [searching, setSearching] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {

        let mounted = true;

        async function load() {

            const cfg = initialConfig;

            if (!cfg)
                return;

            setSearching(true);
            setError(null);

            try {
                const locs = cfg.locationId && cfg.locationName
                    ? [{ id: cfg.locationId, name: cfg.locationName } as Location]
                    : await getLocations(cfg.server);
                if (!mounted)
                    return;
                setLocations(locs);

                if (!cfg.locationId)
                    return;

                const fls = cfg.flowId && cfg.flowName
                    ? [{ id: cfg.flowId, name: cfg.flowName, flowType: cfg.flowType ?? 0 } as Flow]
                    : await getFlows(cfg.server, cfg.locationId);
                if (!mounted)
                    return;
                setFlows(fls);

                if (!cfg.flowId)
                    return;

                const flow = fls.find(x => x.id === cfg.flowId);

                if (cfg.counterId && cfg.counterName) {
                    setCounters([{ id: cfg.counterId, name: cfg.counterName } as Counter]);
                    setSelectedFlowType(flow?.flowType ?? cfg.flowType ?? null);
                    return;
                }

                const cnts = await getCounters(cfg.server, cfg.locationId);

                const queueIds = flow
                    ? new Set(getFlowQueueIds(flow))
                    : new Set<string>();

                if (mounted) {
                    setSelectedFlowType(flow?.flowType ?? null);

                    if (flow?.flowType === 1) {
                        setCounters(cnts);
                    }
                    else {
                        setCounters(
                            cnts.filter(x =>
                                x.queues.some(q => queueIds.has(q))
                            )
                        );
                    }
                }
            }
            catch (e) {
                if (mounted)
                    setError((e as Error).message);
            }
            finally {
                if (mounted)
                    setSearching(false);
            }
        }

        void load();

        return () => {
            mounted = false;
        };
    }, [initialConfig]);


    async function connect() {

        if (!server.trim())
            return;

        setConnecting(true);
        setError(null);

        try {
            await configureTarget(server);

            const data = await getLocations(server);
            setLocations(data);

            let freshFlowType = selectedFlowType;

            if (locationId) {
                const fls = await getFlows(server, locationId);
                setFlows(fls);

                if (flowId) {
                    const cnts = await getCounters(server, locationId);
                    const flow = fls.find(x => x.id === flowId);

                    freshFlowType = flow?.flowType ?? null;
                    setSelectedFlowType(freshFlowType);

                    if (flow?.flowType === 1) {
                        setCounters(cnts);
                    }
                    else {
                        const queueIds = flow
                            ? new Set(getFlowQueueIds(flow))
                            : new Set<string>();

                        setCounters(
                            cnts.filter(x =>
                                x.queues.some(q => queueIds.has(q))
                            )
                        );
                    }
                }
            }

            if (isTauri()) {
                await saveConfiguration({
                    server: server.trim(),
                    locationId,
                    flowId,
                    counterId,
                    flowType: freshFlowType,
                    deviceName: deviceName.trim(),
                    deviceId: initialConfig?.deviceId
                });
            }
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setConnecting(false);
        }
    }


    async function changeLocation(id: string | null) {

        if (!id)
            return;

        setLocationId(id);
        setFlowId(null);
        setCounterId(null);
        setCounters([]);
        setFlows([]);

        setError(null);

        try {
            await configureTarget(server);

            const data = await getFlows(server, id);
            setFlows(data);
        }
        catch (e) {
            setError((e as Error).message);
        }
    }


    async function changeFlow(id: string | null) {

        if (!id || !locationId)
            return;

        setFlowId(id);
        setCounterId(null);

        setError(null);

        try {
            await configureTarget(server);

            const [data, flow] = await Promise.all([
                getCounters(server, locationId),
                getFlow(server, id)
            ]);

            setSelectedFlowType(flow?.flowType ?? null);

            if (flow?.flowType === 1) {
                setCounters(data);
            }
            else {
                const queueIds = flow
                    ? new Set(getFlowQueueIds(flow))
                    : new Set<string>();

                setCounters(
                    data.filter(x =>
                        x.queues.some(q => queueIds.has(q))
                    )
                );
            }
        }
        catch (e) {
            setError((e as Error).message);
        }
    }


    async function save() {

        if (!server.trim() || !locationId || !flowId || !counterId)
            return;

        const location = locations.find(x => x.id === locationId);
        const flow = flows.find(x => x.id === flowId);
        const counter = counters.find(x => x.id === counterId);

        const config: AppConfiguration = {
            server: server.trim(),
            deviceName: deviceName.trim(),
            locationId,
            flowId,
            counterId,
            flowType: selectedFlowType,
            deviceId: initialConfig?.deviceId,
            locationName: location?.name,
            flowName: flow?.name,
            counterName: counter?.name,
            counterCode: counter?.code
        };

        if (isTauri()) {
            const result = await saveConfiguration(config);

            if (result?.config?.deviceId)
                config.deviceId = result.config.deviceId;
        }

        onSaved(config);
    }


    return (
        <Box
            bg="#f8f9fa"
            mih="100vh"
            style={{
                paddingTop: 40,
                "--mantine-font-size-xs": "0.6875rem",
                "--mantine-font-size-sm": "0.75rem",
                "--mantine-font-size-md": "0.8125rem",
                "--mantine-font-size-lg": "0.875rem",
                "--mantine-font-size-xl": "1rem",
                "--mantine-h2-font-size": "1.25rem",
                "--mantine-h3-font-size": "1.125rem"
            }}
        >
            <Paper p="xl" shadow="md" w={500} mx="auto" style={{ borderColor: "#e5e7eb" }} withBorder>
                <Stack>

                    <Brand />

                    <Title order={2}>
                        Counter settings
                    </Title>

                    <Tabs defaultValue="settings" variant="pills" color="blue" radius="lg">
                        <Tabs.List
                            grow
                            p={4}
                            style={{
                                backgroundColor: "#eef1f6",
                                borderRadius: "var(--mantine-radius-lg)"
                            }}
                        >
                            <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
                                Settings
                            </Tabs.Tab>
                            <Tabs.Tab value="updates" leftSection={<IconRefresh size={16} />}>
                                Updates
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="settings" pt="md">
                            <Stack gap="sm">

                                <Text size="sm" c="dimmed">
                                    Select location, flow and counter
                                </Text>

                                <TextInput
                                    label="Machine name"
                                    value={deviceName}
                                    onChange={e => setDeviceName(e.currentTarget.value)}
                                    placeholder="Register 1"
                                />

                                <Group align="flex-end" gap="sm">
                                    <TextInput
                                        style={{ flex: 1 }}
                                        label="Server"
                                        value={server}
                                        onChange={e => setServer(e.currentTarget.value)}
                                        placeholder="http://localhost:5125"
                                    />
                                    <Button onClick={() => void connect()} loading={connecting} mb={1}>
                                        Connect
                                    </Button>
                                </Group>

                                <Select
                                    label="Location"
                                    placeholder="Select a location"
                                    data={
                                        locations.map(x => ({
                                            value: x.id,
                                            label: x.name
                                        }))
                                    }
                                    value={locationId}
                                    onChange={id => void changeLocation(id)}
                                    disabled={locations.length === 0}
                                />

                                <Select
                                    label={
                                        <Group gap={6} wrap="nowrap">
                                            <Text component="span" inherit>
                                                Flow
                                            </Text>
                                            {selectedFlowType != null && (
                                                <Badge size="sm" variant="light" color="blue">
                                                    {flowTypeNames[selectedFlowType] ?? "Unknown"}
                                                </Badge>
                                            )}
                                        </Group>
                                    }
                                    placeholder="Select a flow"
                                    data={
                                        flows.map(x => ({
                                            value: x.id,
                                            label: x.name
                                        }))
                                    }
                                    value={flowId}
                                    onChange={id => void changeFlow(id)}
                                    disabled={flows.length === 0}
                                />

                                <Select
                                    label="Counter"
                                    placeholder="Select a counter"
                                    data={
                                        counters.map(x => ({
                                            value: x.id,
                                            label: x.name
                                        }))
                                    }
                                    value={counterId}
                                    onChange={setCounterId}
                                    disabled={counters.length === 0}
                                />

                                {flowId && counters.length === 0 && !searching && (
                                    <Alert color="yellow">
                                        No counters for this flow
                                    </Alert>
                                )}

                                {error && (
                                    <Alert color="red">
                                        {error}
                                    </Alert>
                                )}

                                <Group grow>
                                    {onCancel && (
                                        <Button variant="default" onClick={onCancel}>
                                            Back
                                        </Button>
                                    )}

                                    <Button
                                        onClick={() => void save()}
                                        disabled={!server.trim() || !locationId || !flowId || !counterId}
                                    >
                                        Save and start
                                    </Button>
                                </Group>

                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="updates" pt="md">
                            <UpdatePanel />
                        </Tabs.Panel>
                    </Tabs>

                </Stack>
            </Paper>
        </Box>
    );
}
