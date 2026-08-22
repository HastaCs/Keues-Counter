import { useEffect, useState } from "react";
import { Center, Loader, Stack } from "@mantine/core";

import ConfigScreen from "./components/config/ConfigScreen";
import CounterPanel from "./components/flows/CounterPanel";
import Brand from "./components/Brand";
import { connect } from "./api/signalRService";
import { isTauri, loadConfiguration } from "./api/appBridge";
import { configureTarget } from "./api/net";

import type { AppConfiguration } from "./types/config";


export default function App() {

    const [config, setConfig] = useState<AppConfiguration | null>(null);
    const [showConfig, setShowConfig] = useState(false);
    const [loading, setLoading] = useState(true);


    useEffect(() => {

        let mounted = true;

        async function init() {
            try {
                if (isTauri()) {
                    const result = await loadConfiguration();

                    if (mounted && result.success && result.config) {
                        const c = result.config;

                        if (c.server && c.locationId && c.flowId && c.counterId && c.flowType != null) {
                            setConfig(c);
                        }
                    }
                }
            }
            catch {
                // No config or error: the configuration screen is shown
            }
            finally {
                if (mounted)
                    setLoading(false);
            }
        }

        void init();

        return () => {
            mounted = false;
        };
    }, []);


    useEffect(() => {
        if (!config)
            return;

        void (async () => {
            await configureTarget(config.server);
            await connect(config).catch(() => {});
        })();
    }, [config]);


    if (loading) {
        return (
            <Center h="100vh" bg="#f8f9fa">
                <Stack align="center" gap="lg">
                    <Brand size="lg" />
                    <Loader size="lg" color="dark" />
                </Stack>
            </Center>
        );
    }

    if (!config || showConfig) {
        return (
            <ConfigScreen
                initialConfig={config}
                onSaved={(c) => {
                    setConfig(c);
                    setShowConfig(false);
                }}
                onCancel={config ? () => setShowConfig(false) : undefined}
            />
        );
    }

    return (
        <CounterPanel
            config={config}
            onOpenConfig={() => setShowConfig(true)}
        />
    );
}
