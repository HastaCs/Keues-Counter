import { useState } from "react";
import {
    Alert,
    Button,
    Center,
    Group,
    Paper,
    Stack,
    Text
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconVolume } from "@tabler/icons-react";

import { callNext, attendTicket, cancelTicket } from "../../api/keuesApi";

import type { AppConfiguration } from "../../types/config";


interface Props {
    config: AppConfiguration;
}


export default function CallTicketPanel({ config }: Props) {

    const [ticketId, setTicketId] = useState<string | null>(null);
    const [ticketCode, setTicketCode] = useState("-");
    const [message, setMessage] = useState<string | null>(null);
    const [finishing, setFinishing] = useState(false);
    const [cancelling, setCancelling] = useState(false);


    async function next() {

        if (!config.counterId)
            return;

        setMessage(null);

        try {
            const ticket = await callNext(config.server, config.counterId, config.flowId!);

            if (!ticket) {
                setMessage("No tickets waiting");
                return;
            }

            const isRecall = ticketId !== null && ticket.ticketId === ticketId;

            setTicketId(ticket.ticketId);
            setTicketCode(ticket.code);

            if (isRecall) {
                notifications.show({
                    title: "Ticket recalled",
                    message: `Ticket ${ticket.code} was called again`,
                    color: "blue",
                    icon: <IconVolume size={20} />,
                    autoClose: 2000
                });
            }
        }
        catch (e) {
            setMessage((e as Error).message);
        }
    }


    async function finish() {

        if (!ticketId || !config.counterId)
            return;

        setFinishing(true);
        setMessage(null);

        try {
            await attendTicket(config.server, config.counterId, ticketId, config.flowId!);
            setTicketId(null);
            setTicketCode("-");
        }
        catch (e) {
            setMessage((e as Error).message);
        }
        finally {
            setFinishing(false);
        }
    }


    async function cancel() {

        if (!ticketId || !config.counterId)
            return;

        setCancelling(true);
        setMessage(null);

        try {
            await cancelTicket(config.server, config.counterId, ticketId);
            setTicketId(null);
            setTicketCode("-");
        }
        catch (e) {
            setMessage((e as Error).message);
        }
        finally {
            setCancelling(false);
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
                        background: "linear-gradient(90deg, #1a1a2e, #374151)"
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
                            {config.flowName ?? "Call tickets"}
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
                                {ticketCode}
                            </Text>

                            <Text size="sm" c="dimmed">
                                Current ticket
                            </Text>
                        </Stack>
                    </Paper>

                    <Button
                        size="xl"
                        w="100%"
                        variant="filled"
                        style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)" }}
                        styles={{
                            root: {
                                "&:hover": {
                                    transform: "scale(1.02)",
                                    boxShadow: "0 8px 20px rgba(37,99,235,0.35)"
                                }
                            }
                        }}
                        onClick={next}
                    >
                        Call next
                    </Button>

                    <Group grow w="100%" gap="sm">
                        <Button
                            size="xl"
                            color="red"
                            variant="filled"
                            disabled={!ticketId}
                            loading={finishing}
                            styles={{
                                root: {
                                    "&:hover": {
                                        transform: "scale(1.02)",
                                        boxShadow: "0 8px 20px rgba(220,38,38,0.35)"
                                    }
                                }
                            }}
                            onClick={finish}
                        >
                            Finish
                        </Button>

                        <Button
                            size="xl"
                            color="orange"
                            variant="filled"
                            disabled={!ticketId}
                            loading={cancelling}
                            onClick={cancel}
                        >
                            Cancel
                        </Button>
                    </Group>

                    {message && (
                        <Alert color={ticketId ? "red" : "yellow"} radius="md" w="100%">
                            {message}
                        </Alert>
                    )}

                </Stack>
            </Paper>
        </Center>
    );
}
