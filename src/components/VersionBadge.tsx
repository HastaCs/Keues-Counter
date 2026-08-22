import { Badge } from "@mantine/core";

import { APP_VERSION } from "../constants/app";


export default function VersionBadge() {

    return (
        <Badge
            pos="fixed"
            bottom={12}
            right={12}
            size="sm"
            variant="outline"
            color="gray"
            style={{ zIndex: 100 }}
            aria-label={`App version ${APP_VERSION}`}
            title={`Version ${APP_VERSION}`}
        >
            v{APP_VERSION}
        </Badge>
    );
}
