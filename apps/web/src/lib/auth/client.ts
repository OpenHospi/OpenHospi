import { jwtClient, genericOAuthClient, multiSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [genericOAuthClient(), multiSessionClient(), jwtClient()],
});
