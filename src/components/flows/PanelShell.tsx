import type { ReactNode } from "react";
import { Center, Paper, Stack, Text } from "@mantine/core";


interface Props {
    title: string;
    subtitle?: string;
    children: ReactNode;
}


export default function PanelShell({ title, subtitle, children }: Props) {

    return (
        <Center
            mih="100vh"
            p={56}
            style={{
                boxSizing: "border-box",
                background: "radial-gradient(1200px 600px at 50% 20%, #e0e7ff 0%, #f8f9fa 60%)"
            }}
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
                            {title}
                        </Text>

                        {subtitle && (
                            <Text size="sm" fw={600} c="white" ta="center" truncate>
                                {subtitle}
                            </Text>
                        )}
                    </Stack>

                    {children}

                </Stack>
            </Paper>
        </Center>
    );
}
