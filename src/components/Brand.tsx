import { useId } from "react";
import { Group, Text } from "@mantine/core";


interface Props {
    size?: "md" | "lg";
}


export default function Brand({ size = "md" }: Props) {

    const gradientId = useId();
    const fontSize = size === "lg" ? "1.75rem" : "1.5rem";
    const iconSize = size === "lg" ? 40 : 32;

    return (
        <Group gap={10} justify="center" align="center" wrap="nowrap">
            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 256 256"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#863bff" />
                        <stop offset="1" stopColor="#5a12c7" />
                    </linearGradient>
                </defs>
                <rect width="256" height="256" rx="56" fill={`url(#${gradientId})`} />
                <rect x="72" y="64" width="112" height="128" rx="18" fill="#ffffff" />
                <g fill="#863bff">
                    <rect x="92" y="92" width="72" height="14" rx="7" />
                    <rect x="92" y="122" width="72" height="14" rx="7" />
                    <rect x="92" y="152" width="44" height="14" rx="7" />
                </g>
                <circle cx="184" cy="72" r="12" fill="#ffd60a" />
                <circle cx="184" cy="128" r="12" fill="#ffd60a" />
                <circle cx="184" cy="184" r="12" fill="#ffd60a" />
            </svg>
            <Text fw={900} style={{ color: "#1a1a2e", fontSize, letterSpacing: 2, lineHeight: 1 }}>
                KEUES
            </Text>
        </Group>
    );
}
