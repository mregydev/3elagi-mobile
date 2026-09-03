import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";
import { GLOBAL_WEB_CSS } from "@/components/web/globalWebStyles";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_WEB_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
