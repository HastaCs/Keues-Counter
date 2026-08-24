import { useState } from "react";
import { Alert, Button, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowUp, IconCircleCheck } from "@tabler/icons-react";

import { setCounterFree } from "../../api/keuesApi";
import PanelShell from "./PanelShell";

import type { AppConfiguration } from "../../types/config";


interface Props {
    config: AppConfiguration;
}


export default function SetFreePanel({ config }: Props) {

    const [message, setMessage] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);


    async function markFree() {

        if (!config.counterId || sending)
            return;

        setMessage(null);
        setSending(true);

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
        finally {
            setSending(false);
        }
    }


    return (
        <PanelShell title={config.counterName ?? "Counter"}>
            <Button
                radius="100%"
                w={180}
                h={180}
                p={0}
                variant="filled"
                color="blue"
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
                        "&:active": {
                            transform: "scale(0.95)"
                        }
                    }
                }}
                onClick={() => void markFree()}
            >
                <Stack gap={2} align="center">
                    <IconArrowUp size={64} />
                    <Text size="lg" fw={800} c="white">
                        FREE
                    </Text>
                </Stack>
            </Button>

            {message && (
                <Alert color="yellow" radius="md" w="100%">
                    {message}
                </Alert>
            )}
        </PanelShell>
    );
}
