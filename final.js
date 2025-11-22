let nodes = [];
let edges = [];
let svg;

// Draw the graph from the input
function drawGraph() {
  svg = document.getElementById("graph");
  svg.innerHTML = "";
  document.getElementById("mstWeightDisplay").textContent = ""; // clear old MST text

  const rawNodes = document
    .getElementById("nodesInput")
    .value.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const rawEdges = document
    .getElementById("edgesInput")
    .value.split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (rawNodes.length === 0) {
    alert("Please enter at least one node (e.g., A,B,C).");
    return;
  }

  // Compute center from SVG size
  const svgRect = svg.getBoundingClientRect();
  const width = svgRect.width || svg.clientWidth || 600;
  const height = svgRect.height || svg.clientHeight || 400;

  const angleStep = (2 * Math.PI) / rawNodes.length;
  const radius = Math.min(width, height) / 2 - 40;
  const centerX = width / 2;
  const centerY = height / 2;

  // Build node list with positions
  nodes = rawNodes.map((id, i) => ({
    id,
    x: centerX + radius * Math.cos(i * angleStep),
    y: centerY + radius * Math.sin(i * angleStep),
  }));

  // Parse edges of form U-V:weight
  edges = [];
  for (const e of rawEdges) {
    const [uv, w] = e.split(":");
    if (!uv || !w) continue;

    const [u, v] = uv.split("-").map((s) => s.trim());
    const weight = Number(w);

    if (!u || !v || isNaN(weight)) continue;

    // Only add edges whose nodes exist
    if (!nodes.find((n) => n.id === u) || !nodes.find((n) => n.id === v)) {
      continue;
    }

    edges.push({ from: u, to: v, weight });
  }

  // Count multiple edges between same pair for offset
  const edgeCount = {};
  edges.forEach((edge) => {
    const key =
      edge.from < edge.to
        ? `${edge.from}-${edge.to}`
        : `${edge.to}-${edge.from}`;
    edgeCount[key] = (edgeCount[key] || 0) + 1;
    edge.count = edgeCount[key];
  });

  const multipleEdgeOffset = 10;

  // Draw edges (lines / loops)
  edges.forEach((edge) => {
    const fromNode = nodes.find((n) => n.id === edge.from);
    const toNode = nodes.find((n) => n.id === edge.to);
    if (!fromNode || !toNode) return;

    if (edge.from === edge.to) {
      // self-loop
      const loop = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      loop.setAttribute("cx", fromNode.x);
      loop.setAttribute("cy", fromNode.y - 30);
      loop.setAttribute("r", 15);
      loop.classList.add("edge");
      svg.appendChild(loop);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", fromNode.x);
      label.setAttribute("y", fromNode.y - 50);
      label.textContent = edge.weight;
      label.classList.add("weight-label");
      svg.appendChild(label);
    } else {
      // straight edge or curved multi-edge
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      const offsetFactor = (edge.count - 1) * multipleEdgeOffset;
      const offsetX = nx * offsetFactor;
      const offsetY = ny * offsetFactor;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromNode.x + offsetX);
      line.setAttribute("y1", fromNode.y + offsetY);
      line.setAttribute("x2", toNode.x + offsetX);
      line.setAttribute("y2", toNode.y + offsetY);
      line.classList.add("edge");
      svg.appendChild(line);

      const midX = (fromNode.x + toNode.x) / 2 + offsetX;
      const midY = (fromNode.y + toNode.y) / 2 + offsetY;

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", midX);
      label.setAttribute("y", midY);
      label.textContent = edge.weight;
      label.classList.add("weight-label");
      svg.appendChild(label);
    }
  });

  // Draw nodes on top
  nodes.forEach((node) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);
    circle.setAttribute("r", 20);
    circle.classList.add("node");
    svg.appendChild(circle);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", node.x);
    text.setAttribute("y", node.y);
    text.textContent = node.id;
    text.classList.add("label");
    svg.appendChild(text);
  });
}

// Demo Graph
function loadDemo() {
  // Example demo graph
  // Nodes: A, B, C, D, E
  // Edges with weights form a nice MST example
  document.getElementById("nodesInput").value = "A,B,C,D,E";

  document.getElementById("edgesInput").value =
    "A-B:2,A-C:3,B-C:1,B-D:4,C-D:5,C-E:6,D-E:7";

  // Draw the graph immediately so audience sees something change
  drawGraph();

  // If you want it to also immediately compute MST, uncomment this:
  // runKruskal();
}


// Kruskal's algorithm for MST
function runKruskal() {
  if (nodes.length === 0 || edges.length === 0) {
    alert("Please draw a graph first.");
    return;
  }

  const parent = {};
  nodes.forEach((n) => (parent[n.id] = n.id));

  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const union = (x, y) => {
    const rootX = find(x);
    const rootY = find(y);
    if (rootX !== rootY) parent[rootY] = rootX;
  };

  const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
  const mstEdges = [];

  for (const edge of sortedEdges) {
    if (find(edge.from) !== find(edge.to)) {
      mstEdges.push(edge);
      union(edge.from, edge.to);
    }
    if (mstEdges.length === nodes.length - 1) break;
  }

  highlightEdges(mstEdges);
}

// Highlight MST edges and show total weight
function highlightEdges(mstEdges) {
  svg.innerHTML = "";

  // Draw nodes
  nodes.forEach((node) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);
    circle.setAttribute("r", 20);
    circle.classList.add("node");
    svg.appendChild(circle);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", node.x);
    text.setAttribute("y", node.y);
    text.textContent = node.id;
    text.classList.add("label");
    svg.appendChild(text);
  });

  // Draw only MST edges
  let totalWeight = 0;
  mstEdges.forEach((edge) => {
    const fromNode = nodes.find((n) => n.id === edge.from);
    const toNode = nodes.find((n) => n.id === edge.to);
    if (!fromNode || !toNode) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", fromNode.x);
    line.setAttribute("y1", fromNode.y);
    line.setAttribute("x2", toNode.x);
    line.setAttribute("y2", toNode.y);
    line.classList.add("mst-edge");
    svg.appendChild(line);

    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", midX);
    label.setAttribute("y", midY);
    label.textContent = edge.weight;
    label.classList.add("weight-label");
    svg.appendChild(label);

    totalWeight += edge.weight;
  });

  document.getElementById("mstWeightDisplay").textContent =
    "Total MST Weight: " + totalWeight;
}
