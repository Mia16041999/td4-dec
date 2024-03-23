import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

// Define the structure for a network node
export type NetworkNode = {
  nodeId: number;
  pubKey: string;
};

export type NodeRegistrationRequest = {
  nodeId: number; // Changed from 'id' to 'nodeId'
  pubKey: string;
};

export type NodeRegistryResponse = {
  allNodes: NetworkNode[];
};

const nodeStorage: NetworkNode[] = [];

// Function to initiate the registry service
export async function initiateRegistryService() {
  const registryService = express();
  registryService.use(express.json());
  registryService.use(bodyParser.json());

  // Endpoint to verify if the registry service is running
  registryService.get("/status", (req, res) => {
    res.send("Registry service is up and running");
  });
// Endpoint to handle the registration of a new node

registryService.post("/registerNode", (req: Request, res: Response) => {
  const { nodeId, pubKey }: NodeRegistrationRequest = req.body;

  const index = nodeStorage.findIndex(node => node.nodeId === nodeId);

  if (index !== -1) {
    nodeStorage[index].pubKey = pubKey;
    res.json({ message: "Node updated successfully." });
  } else {
    nodeStorage.push({ nodeId, pubKey });
    res.json({ message: "Node registered successfully." });
  }
});


  // Endpoint to retrieve the list of all registered nodes
  registryService.get("/getNodeRegistry", (req, res) => {
    res.json({ allNodes: nodeStorage });
  });

  // Start the registry server and listen for requests
  const registryServer = registryService.listen(REGISTRY_PORT, () => {
    console.log(`Registry service is now active on port: ${REGISTRY_PORT}`);
  });

  return registryServer;
}
