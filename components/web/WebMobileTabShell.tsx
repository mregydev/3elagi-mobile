import React from "react";

interface Props {
  children: React.ReactNode;
}

/** Previously wrapped stack routes with a mobile web bottom tab bar.
 * Bottom nav was replaced by the side drawer — pass children through. */
export function WebMobileTabShell({ children }: Props) {
  return <>{children}</>;
}
