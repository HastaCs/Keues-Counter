import { useState } from "react";
import {
    Alert,
    Button,
    Center,
    Paper,
    Stack,
    Text
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowUp, IconCircleCheck } from "@tabler/icons-react";

import { setCounterFree } from "../../api/keuesApi";

import type { AppConfiguration } from "../../types/config";


interface Props {
    config: AppConfiguration;
}


export default function SetFreePanel({ config }: Props) {

    const [message, setMessage] = useState<string | null>(null);
    const [sent, setSent] = useState(false);


    async function markFree() {

        if (!config.counterId)
            return;

        setMessage(null);

        try {
            await setCounterFree(config.server, config.counterId, config.flowId!);
            setSent(true);
            notifications.show({
                title: "Counter marked as free",
                message: `${config.counterName ?? "Counter"} is now free`,
                color: "green",
                icon: <IconCircleCheck size={20} />,
                autoClose: 2000
            });
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
                        py={14}
                        gap={4}
                        style={{
                            borderRadius: "var(--mantine-radius-md)",
                            background: "linear-gradient(90deg, #2563eb, #3b82f6)"
                        }}
                    >
                        <Text size="xl" fw={800} c="white" ta="center" truncate>
                            {config.counterName ?? "Counter"}
                        </Text>
                    </Stack>

                    <Button
                        radius="100%"
                        w={180}
                        h={180}
                        p={0}
                        variant="filled"
                        style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)" }}
                        aria-label="Mark as free"
                        mod={{ sent }}
                        styles={{
                            root: {
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                                "&[data-sent]": {
                                    filter: "brightness(0.85)"
                                },
                                "&:hover": {
                                    transform: "scale(1.05)",
                                    boxShadow: "0 8px 20px rgba(37,99,235,0.35)"
                                },
                                "&:active": {
                                    transform: "scale(0.95)"
                                }
                            }
                        }}
                        onClick={markFree}
                    >
                        <IconArrowUp size={72} />
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
