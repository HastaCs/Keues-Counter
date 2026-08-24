import { Paper, Stack, Text } from "@mantine/core";


interface Props {
    value: string | number;
    caption: string;
}


export default function NumberDisplay({ value, caption }: Props) {

    return (
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
                <Text ta="center" style={{ fontSize: 96 }} fw={900} lh={1} c="#1a1a2e">
                    {value}
                </Text>

                <Text size="sm" c="dimmed">
                    {caption}
                </Text>
            </Stack>
        </Paper>
    );
}
