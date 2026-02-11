export const GONKA_NODES = [
  "http://node1.gonka.ai:8000",
  "http://node2.gonka.ai:8000",
  "http://node3.gonka.ai:8000",
];

export const getRandomNode = () => GONKA_NODES[Math.floor(Math.random() * GONKA_NODES.length)];
