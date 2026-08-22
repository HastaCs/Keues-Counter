import { useState } from "react";
import {
    Alert,
    Button,
    Center,
    Paper,
    SimpleGrid,
    Stack,
    Text
} from "@mantine/core";
import { IconRotateClockwise } from "@tabler/icons-react";

import { manualCall } from "../../api/keuesApi";

import type { AppConfiguration } from "../../types/config";


interface Props {
    config: AppConfiguration;
}


export default function ManualCallPanel({ config }: Props) {

    const [number, setNumber] = useState(0);
    const [message, setMessage] = useState<string | null>(null);


    async function change(delta: number) {

        const next = Math.max(0, number + delta);

        setNumber(next);
        setMessage(null);

        if (!config.counterId)
            return;

        try {
            await manualCall(config.server, next.toString(), config.flowId!, config.locationId!, config.counterId);
        }
        catch (e) {
            setMessage((e as Error).message);
        }
    }


    async function reset() {

        setNumber(1);
        setMessage(null);

        if (!config.counterId)
            return;

        try {
            await manualCall(config.server, "1", config.flowId!, config.locationId!, config.counterId);
        }
        catch (e) {
            setMessage((e as Error).message);
        }
    }


    return (
        <Center
            h="100vh"
            bg="radial-gradient(1200px 600px at 50% 20%, #e0e7ff 0%, #f8f9fa 60%)"
        >
            <Paper
                p="xl"
                shadow="xl"
                w={480}
                radius="lg"
                withBorder
                style={{ borderColor: "#e5e7eb", overflow: "hidden" }}
            >
                <div
                    style={{
                        height: 6,
                        margin: -32,
                        marginBottom: 24,
                        background: "linear-gradient(90deg, #2563eb, #3b82f6)"
                    }}
                />

                <Stack align="center" gap="lg">

                <Stack
                    w="100%"
                    px="md"
                    py={10}
                    gap={4}
                    style={{
                        borderRadius: "var(--mantine-radius-md)",
                        background: "linear-gradient(90deg, #2563eb, #3b82f6)"
                    }}
                >
                    <Text size="lg" fw={700} c="white" ta="center" truncate>
                        {config.flowName ?? "Manual call"}
                    </Text>

                    <Text size="sm" fw={600} c="white" ta="center" truncate>
                        {config.counterName ?? "Counter"}
                    </Text>
                </Stack>

                    <Paper
                        w="100%"
                        p="xl"
                        radius="lg"
                        withBorder
                        style={{
                            background: "linear-gradient(135deg, #f5f7ff 0%, #e0e7ff 100%)",
                            borderColor: "#c7d2fe"
                        }}
                    >
                        <Stack align="center" gap={0}>
                            <Text ta="center" style={{ fontSize: 96 }} fw={900} lh={1} color="#1a1a2e">
                                {number}
                            </Text>

                            <Text size="sm" c="dimmed">
                                Current number
                            </Text>
                        </Stack>
                    </Paper>

                    <SimpleGrid cols={2} w="100%" style={{ justifyItems: "center" }}>
                        <Button
                            size="xl"
                            radius="100%"
                            w={110}
                            h={110}
                            p={0}
                            variant="default"
                            style={{ fontSize: 32, border: "2px solid #1a1a2e", color: "#1a1a2e" }}
                            styles={{
                                root: {
                                    "&:hover": {
                                        transform: "scale(1.05)",
                                        boxShadow: "0 8px 20px rgba(0,0,0,0.15)"
                                    }
                                }
                            }}
                            onClick={() => change(-1)}
                        >
                            −1
                        </Button>

                        <Button
                            size="xl"
                            radius="100%"
                            w={110}
                            h={110}
                            p={0}
                            variant="default"
                            style={{ fontSize: 32, border: "2px solid #1a1a2e", color: "#1a1a2e" }}
                            styles={{
                                root: {
                                    "&:hover": {
                                        transform: "scale(1.05)",
                                        boxShadow: "0 8px 20px rgba(0,0,0,0.15)"
                                    }
                                }
                            }}
                            onClick={() => change(1)}
                        >
                            +1
                        </Button>

                        <Button
                            size="xl"
                            radius="100%"
                            w={110}
                            h={110}
                            p={0}
                            variant="filled"
                            style={{
                                fontSize: 32,
                                background: "linear-gradient(135deg, #2563eb, #3b82f6)"
                            }}
                            styles={{
                                root: {
                                    "&:hover": {
                                        transform: "scale(1.05)",
                                        boxShadow: "0 8px 20px rgba(37,99,235,0.35)"
                                    }
                                }
                            }}
                            onClick={() => change(-10)}
                        >
                            −10
                        </Button>

                        <Button
                            size="xl"
                            radius="100%"
                            w={110}
                            h={110}
                            p={0}
                            variant="filled"
                            style={{
                                fontSize: 32,
                                background: "linear-gradient(135deg, #2563eb, #3b82f6)"
                            }}
                            styles={{
                                root: {
                                    "&:hover": {
                                        transform: "scale(1.05)",
                                        boxShadow: "0 8px 20px rgba(37,99,235,0.35)"
                                    }
                                }
                            }}
                            onClick={() => change(10)}
                        >
                            +10
                        </Button>
                    </SimpleGrid>

                    <Button
                        size="lg"
                        variant="outline"
                        color="dark"
                        w="100%"
                        leftSection={<IconRotateClockwise size={18} />}
                        onClick={reset}
                    >
                        Reset to 1
                    </Button>

                    {message && (
                        <Alert color="yellow" radius="md" w="100%">
                            {message}
                        </Alert>
                    )}

                </Stack>
            </Paper>
        </Center>
    );
}
