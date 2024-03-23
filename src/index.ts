import { launchOnionRouters } from "./onionRouters/launchOnionRouters";
import { initiateRegistryService} from "./registry/registry";
import { launchUsers } from "./users/launchUsers";

export async function launchNetwork(nbNodes: number, nbUsers: number) {
  // launch node registry
  const registry = await initiateRegistryService();

  // launch all nodes
  const onionServers = await launchOnionRouters(nbNodes);

  // launch all users
  const userServers = await launchUsers(nbUsers);

  return [registry, ...onionServers, ...userServers];
}