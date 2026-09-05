import { useState } from "react";
import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowsExchange, IconCircleX, IconVolume } from "@tabler/icons-react";

import { callNext, attendTicket, cancelTicket, getQueues, transferTicket } from "../../api/keuesApi";
import PanelShell from "./PanelShell";
import NumberDisplay from "./NumberDisplay";

import type { AppConfiguration } from "../../types/config";
import type { Queue } from "../../types/models";


interface Props {
    config: AppConfiguration;
}


export default function CallTicketPanel({ config }: Props) {

    const [ticketId, setTicketId] = useState<string | null>(null);
    const [ticketCode, setTicketCode] = useState("-");
    const [message, setMessage] = useState<string | null>(null);
    const [calling, setCalling] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [queues, setQueues] = useState<Queue[]>([]);


    async function next() {

        if (!config.counterId || calling)
            return;

        setCalling(true);
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
        finally {
            setCalling(false);
        }
    }


    async function finish() {

        if (!ticketId || !config.counterId || finishing || cancelling)
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

        if (!ticketId || !config.counterId || finishing || cancelling)
            return;

        setCancelling(true);

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


    async function openTransfer() {

        if (!ticketId || !config.counterId || !config.locationId)
            return;

        setMessage(null);
        setQueues([]);

        try {
            const result = await getQueues(config.server, config.locationId);
            setQueues(result);
            setTransferOpen(true);
        }
        catch (e) {
            setMessage((e as Error).message);
        }
    }


    async function transfer(queueId: string) {

        if (!ticketId || !config.counterId || transferring)
            return;

        setTransferring(true);

        try {
            await transferTicket(config.server, config.counterId, ticketId, queueId);
            setTicketId(null);
            setTicketCode("-");
            setTransferOpen(false);
            notifications.show({
                title: "Ticket transferred",
                message: "The ticket was moved to another queue",
                color: "green",
                autoClose: 2000
            });
        }
        catch (e) {
            setMessage((e as Error).message);
            setTransferOpen(false);
        }
        finally {
            setTransferring(false);
        }
    }


    return (
        <PanelShell
            title={config.flowName ?? "Call tickets"}
            subtitle={config.counterName ?? "Counter"}
        >
            <NumberDisplay value={ticketCode} caption="Current ticket" />

            <Button
                size="xl"
                w="100%"
                variant="filled"
                color="blue"
                loading={calling}
                onClick={() => void next()}
            >
                Call next
            </Button>

            <Button
                size="xl"
                w="100%"
                variant="filled"
                color="green"
                disabled={!ticketId}
                loading={finishing}
                onClick={() => void finish()}
            >
                Finish
            </Button>

            <Group justify="center" gap="lg">
                <Button
                    variant="subtle"
                    color="blue"
                    size="sm"
                    disabled={!ticketId}
                    leftSection={<IconArrowsExchange size={16} />}
                    onClick={() => void openTransfer()}
                >
                    Transfer ticket
                </Button>

                <Button
                    variant="subtle"
                    color="gray"
                    size="sm"
                    disabled={!ticketId}
                    leftSection={<IconCircleX size={16} />}
                    onClick={() => setCancelOpen(true)}
                >
                    Cancel ticket
                </Button>
            </Group>

            {message && (
                <Alert color={ticketId ? "red" : "yellow"} radius="md" w="100%">
                    {message}
                </Alert>
            )}

            <Modal
                opened={transferOpen}
                onClose={() => setTransferOpen(false)}
                centered
                radius="lg"
                title={<Text fw={700}>Transfer ticket</Text>}
            >
                <Text size="sm" c="dimmed" mb="md">
                    Transfer ticket <Text component="span" fw={700} c="dark">{ticketCode}</Text> to another queue.
                </Text>

                {queues.length === 0 ? (
                    <Text size="sm" c="dimmed">
                        No available queues.
                    </Text>
                ) : (
                    <Stack gap="sm">
                        {queues.map(queue => (
                            <Button
                                key={queue.id}
                                variant="default"
                                size="md"
                                w="100%"
                                loading={transferring}
                                onClick={() => void transfer(queue.id)}
                            >
                                {queue.name}
                            </Button>
                        ))}
                    </Stack>
                )}

                <Group justify="flex-end" gap="sm" mt="lg">
                    <Button variant="subtle" onClick={() => setTransferOpen(false)}>
                        Close
                    </Button>
                </Group>
            </Modal>

            <Modal
                opened={cancelOpen}
                onClose={() => setCancelOpen(false)}
                centered
                radius="lg"
                title={<Text fw={700}>Cancel ticket</Text>}
            >
                <Text size="sm" c="dimmed">
                    Cancel ticket <Text component="span" fw={700} c="dark">{ticketCode}</Text>? The customer will lose their turn.
                </Text>

                <Group justify="flex-end" gap="sm" mt="lg">
                    <Button variant="default" onClick={() => setCancelOpen(false)}>
                        Keep ticket
                    </Button>

                    <Button
                        color="red"
                        loading={cancelling}
                        onClick={() => {
                            setCancelOpen(false);
                            void cancel();
                        }}
                    >
                        Cancel ticket
                    </Button>
                </Group>
            </Modal>
        </PanelShell>
    );
}
