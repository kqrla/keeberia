import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/howitworks/flow")({
  component: () => <Outlet />,
});
