import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT, REGISTRY_PORT, BASE_ONION_ROUTER_PORT } from "../config";
import { rsaEncrypt, symEncrypt, createRandomSymmetricKey, exportSymKey, importPubKey } from "../crypto";
import { NetworkNode } from "../registry/registry"; // Adjusted import

export type SendMessageRequest = {  // Renamed for uniqueness
  message: string;
  destinationUserId: number;
};

export async function launchUser(userId: number) {  // Renamed function for uniqueness
  const userApp = express();
  userApp.use(express.json());
  userApp.use(bodyParser.json());

  var lastReceivedMessage: string | null = null;
  var lastSentMessage: string | null = null;
  var lastCircuit: NetworkNode[] = [];  // Renamed for clarity

  userApp.get("/status", (req, res) => {
    res.send("User service operational");  // Adjusted status message
  });

  userApp.get("/getLastReceivedMessage", (req, res) => {
    res.json({ result: lastReceivedMessage });
  });

  userApp.get("/getLastSentMessage", (req, res) => {
    res.json({ result: lastSentMessage });
  });

  userApp.get("/getLastUsedCircuit", (req, res) => {  // Renamed route for consistency
    res.json({ result: lastCircuit.map( (NetworkNode) => NetworkNode.nodeId) });
  });

  userApp.post("/sendMessage", async (req, res) => {
    const { message, destinationUserId } = req.body;
    const nodes = await fetch(`http://localhost:${REGISTRY_PORT}/getNodeRegistry`)
        .then((res) => res.json())
        .then((body: any) => body.nodes);
    let circuit: NetworkNode[] = [];
    for (let i = nodes.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
    }
    
    circuit = nodes.slice(0, 3);

    lastSentMessage = message;
    let messageToSend = lastSentMessage;
    if (messageToSend === null || messageToSend === undefined || messageToSend === "") {
      res.status(400).json({ error: 'Request body must contain a message property' });
      return;
    }
    for (let i = circuit.length - 1; i >= 0; i--) {
      const node = circuit[i];
      const symKey = await createRandomSymmetricKey();
      const destination = i == circuit.length - 1 ?
          `${BASE_USER_PORT + destinationUserId}`.padStart(10, '0') :
          `${BASE_ONION_ROUTER_PORT + circuit[i + 1].nodeId}`.padStart(10, '0');
      const messageToEncrypt = `${destination + messageToSend}`;
      const encryptedMessage = await symEncrypt(symKey, messageToEncrypt);
      const encryptedSymKey = await rsaEncrypt(await exportSymKey(symKey), node.pubKey);
      messageToSend = encryptedSymKey + encryptedMessage;
    }
    const entryNode = circuit[0];
    lastCircuit = circuit;
    await fetch(`http://localhost:${BASE_ONION_ROUTER_PORT + entryNode.nodeId}/message`, {
      method: "POST",
      body: JSON.stringify({ message: messageToSend }),
      headers: { "Content-Type": "application/json" },
    });
    lastSentMessage = message;
    res.send("success");
  });

  userApp.post("/message", (req, res) => {
    if (req.body.message) {
      lastReceivedMessage = req.body.message;
      res.status(200).send("success");
    } else {
      res.status(400).json({ error: 'Request body must contain a message property' });
    }
  });

  const server = userApp.listen(BASE_USER_PORT + userId, () => {
    console.log(`User ${userId} is listening on port ${BASE_USER_PORT + userId}`);
  });

  return server;
}