import { useEffect, useRef, useState } from "react";
import { Alert, Button, SimpleGrid } from "@mantine/core";
import { IconRotateClockwise } from "@tabler/icons-react";

import { manualCall } from "../../api/keuesApi";
import PanelShell from "./PanelShell";
import NumberDisplay from "./NumberDisplay";

import type { AppConfiguration } from "../../types/config";


const CALL_DEBOUNCE_MS = 500;


interface Props {
    config: AppConfiguration;
}


export default function ManualCallPanel({ config }: Props) {

    const [number, setNumber] = useState(1);
    const [message, setMessage] = useState<string | null>(null);

    const numberRef = useRef(1);
    const timerRef = useRef<number | null>(null);


    useEffect(() => {
        return () => {
            if (timerRef.current !== null)
                window.clearTimeout(timerRef.current);
        };
    }, []);


    function scheduleCall() {

        const counterId = config.counterId;

        if (!counterId)
            return;

        if (timerRef.current !== null)
            window.clearTimeout(timerRef.current);

        timerRef.current = window.setTimeout(() => {

            timerRef.current = null;

            manualCall(
                config.server,
                numberRef.current.toString(),
                config.flowId!,
                config.locationId!,
                counterId
            ).catch((e: unknown) => setMessage((e as Error).message));

        }, CALL_DEBOUNCE_MS);
    }


    function change(delta: number) {

        const nextValue = Math.max(0, numberRef.current + delta);

        numberRef.current = nextValue;
        setNumber(nextValue);
        setMessage(null);

        scheduleCall();
    }


    function reset() {

        numberRef.current = 1;
        setNumber(1);
        setMessage(null);

        scheduleCall();
    }


    return (
        <PanelShell
            title={config.flowName ?? "Manual call"}
            subtitle={config.counterName ?? "Counter"}
        >
            <NumberDisplay value={number} caption="Current number" />

            <SimpleGrid cols={2} w="100%" style={{ justifyItems: "center" }}>
                <Button
                    size="xl"
                    radius="100%"
                    w={110}
                    h={110}
                    p={0}
                    variant="default"
                    style={{ fontSize: 32 }}
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
                    style={{ fontSize: 32 }}
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
                    color="blue"
                    style={{ fontSize: 32 }}
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
                    color="blue"
                    style={{ fontSize: 32 }}
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
        </PanelShell>
    );
}
