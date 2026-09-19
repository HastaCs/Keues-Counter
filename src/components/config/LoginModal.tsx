import { useState } from "react";
import { Alert, Button, Group, Modal, PasswordInput, Stack, Text, TextInput } from "@mantine/core";


interface Props {
    opened: boolean;
    counterName?: string;
    loading: boolean;
    error: string | null;
    onCancel: () => void;
    onSubmit: (email: string, password: string) => void;
}


export default function LoginModal({ opened, counterName, loading, error, onCancel, onSubmit }: Props) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");


    function close() {
        setEmail("");
        setPassword("");
        onCancel();
    }


    function submit() {
        if (!email.trim() || !password || loading)
            return;

        onSubmit(email.trim(), password);
    }


    return (
        <Modal
            opened={opened}
            onClose={close}
            centered
            radius="lg"
            closeOnClickOutside={!loading}
            closeOnEscape={!loading}
            title={<Text fw={700}>Authorization required</Text>}
        >
            <Text size="sm" c="dimmed" mb="md">
                Counter <Text component="span" fw={700} c="dark">{counterName ?? "this counter"}</Text> requires authorization.
                Sign in to get access.
            </Text>

            <Stack gap="sm">
                <TextInput
                    label="Email"
                    placeholder="user@example.com"
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.currentTarget.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter")
                            submit();
                    }}
                />

                <PasswordInput
                    label="Password"
                    value={password}
                    onChange={e => setPassword(e.currentTarget.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter")
                            submit();
                    }}
                />

                {error && (
                    <Alert color="red">
                        {error}
                    </Alert>
                )}

                <Group justify="flex-end" gap="sm" mt="sm">
                    <Button variant="default" disabled={loading} onClick={close}>
                        Cancel
                    </Button>

                    <Button
                        color="blue"
                        loading={loading}
                        disabled={!email.trim() || !password}
                        onClick={submit}
                    >
                        Sign in
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
