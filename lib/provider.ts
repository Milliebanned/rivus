import { Mppx, Store, tempo } from "mppx/server";
import { PATH_USD, accountFromEnv, clientFor, requireEnv } from "./tempo";

function createProvider() {
  const account = accountFromEnv("PROVIDER_PRIVATE_KEY");
  const client = clientFor(account);
  // Shared by the SSE generator and the mid-stream voucher POSTs, so charges see top-ups immediately.
  const store = Store.memory();

  const mppx = Mppx.create({
    secretKey: requireEnv("MPP_SECRET_KEY"),
    methods: [
      tempo.session({
        account,
        currency: PATH_USD,
        getClient: () => client,
        store,
        sse: true,
      }),
    ],
  });

  return { mppx, address: account.address };
}

// Next dev re-evaluates modules on reload; keep one store so open channels survive it.
const globalForProvider = globalThis as unknown as { rivusProvider?: ReturnType<typeof createProvider> };

export function getProvider() {
  globalForProvider.rivusProvider ??= createProvider();
  return globalForProvider.rivusProvider;
}
