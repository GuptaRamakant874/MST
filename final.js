let nodes = [], edges = [], svg;
let count = 0;

  function drawGraph() {
    svg = document.getElementById("graph");
    svg.innerHTML = "";

    const nodeIds = document.getElementById("nodesInput").value.split(",").map(s => s.trim()).filter(Boolean);
    const edgesInput = document.getElementById("edgesInput").value.split(",").map(e => e.trim());

    const angleStep = (2 * Math.PI) / nodeIds.length;
    const radius = 200;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    nodes = nodeIds.map((id, i) => ({
      id,
      x: centerX + radius * Math.cos(i * angleStep),
      y: centerY + radius * Math.sin(i * angleStep),
    }));

    edges = edgesInput.map(e => {
      const [pair, weight] = e.split(":");
      const [from, to] = pair.split("-");
      return { from, to, weight: parseInt(weight) };
    });

    const edgeCount = {};

    edges.forEach(edge => {
      const key = `${edge.from}-${edge.to}`;
      edgeCount[key] = (edgeCount[key] || 0) + 1;
      edge.count = edgeCount[key];
    });

    const multipleEdgeOffset = 10;

    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);

      if (fromNode && toNode) {
        if (edge.from === edge.to) {
          // Draw loop edge
          const loop = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          loop.setAttribute("cx", fromNode.x);
          loop.setAttribute("cy", fromNode.y - 30); // offset loop above node
          loop.setAttribute("r", 15);
          loop.setAttribute("stroke", "#888");
          loop.setAttribute("stroke-width", 2);
          loop.setAttribute("fill", "none");
          svg.appendChild(loop);

          const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
          label.setAttribute("x", fromNode.x);
          label.setAttribute("y", fromNode.y - 50);
          label.textContent = edge.weight;
          label.classList.add("weight-label");
          svg.appendChild(label);
        } else {
          // Calculate offset for multiple edges
          const dx = toNode.y - fromNode.y;
          const dy = fromNode.x - toNode.x;
          const length = Math.sqrt(dx * dx + dy * dy);
          const offsetX = (dx / length) * (edge.count - 1) * multipleEdgeOffset;
          const offsetY = (dy / length) * (edge.count - 1) * multipleEdgeOffset;

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
      }
    });

    nodes.forEach(node => {
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


    // function runPrim() {
    //     if (nodes.length === 0 || edges.length === 0) return alert("Please draw a graph first.");

    //     const start = document.getElementById("startVertex").value.trim();
    //     if (!start || !nodes.find(n => n.id === start)) {
    //         return alert("Please enter a valid starting vertex that exists in the graph.");
    //      }

    //     const visited = new Set();
    //     const mstEdges = [];
    //     visited.add(start);

    //     while (visited.size < nodes.length) {
    //         let minEdge = null;
    //         for (const edge of edges) {
    //             const inSet = visited.has(edge.from);
    //             const outSet = !visited.has(edge.to);
    //             const inSetRev = visited.has(edge.to);
    //             const outSetRev = !visited.has(edge.from);
    //             if ((inSet && outSet) || (inSetRev && outSetRev)) {
    //                 if (!minEdge || edge.weight < minEdge.weight) {
    //                 minEdge = edge;
    //                 }
    //             }
    //         }
    //         if (!minEdge) break;
    //         mstEdges.push(minEdge);
    //         visited.add(minEdge.from);
    //         visited.add(minEdge.to);
    //     }

    //     highlightEdges(mstEdges);
    // }


    function runKruskal() {
      if (nodes.length === 0 || edges.length === 0) return alert("Please draw a graph first.");

      const parent = {};
      const find = (x) => (parent[x] === x ? x : parent[x] = find(parent[x]));
      // this is union is used to detect cycle in graph
      const union = (x, y) => {
        const rootX = find(x);
        const rootY = find(y);
        if (rootX !== rootY) parent[rootY] = rootX;
      };

      nodes.forEach(n => parent[n.id] = n.id);
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

function highlightEdges(mstEdges) {
  svg.innerHTML = ""; // Clear entire graph

  // Draw only nodes
  nodes.forEach(node => {
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

  // Draw MST edges (green) and calculate total weight
  let totalWeight = 0;

  mstEdges.forEach(edge => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    if (fromNode && toNode) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromNode.x);
      line.setAttribute("y1", fromNode.y);
      line.setAttribute("x2", toNode.x);
      line.setAttribute("y2", toNode.y);
      line.classList.add("mst-edge");
      svg.appendChild(line);

      // Add weight label on green line
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", midX);
      label.setAttribute("y", midY);
      label.textContent = edge.weight;
      label.classList.add("weight-label");
      svg.appendChild(label);

      totalWeight += edge.weight;
    }
  });

  // Display total MST weight
  document.getElementById("mstWeightDisplay").textContent = `Total MST Weight: ${totalWeight}`;
}
