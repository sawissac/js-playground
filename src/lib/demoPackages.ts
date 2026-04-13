import { v4 as uuidv4 } from "uuid";
import { Package } from "@/state/types";

export const DEMO_PACKAGES: Record<string, Package> = {
  "d3-bar-chart": {
    id: uuidv4(),
    name: "D3 Bar Chart",
    enabled: true,
    isDemo: true,
    variables: [
      {
        id: uuidv4(),
        name: "output",
        type: "string",
        value: "",
      },
    ],
    functions: [],
    runner: [
      {
        id: uuidv4(),
        type: "code",
        target: ["output", ""],
        args: [],
        code: `// D3 Bar Chart Demo
const data = [
  { label: 'A', value: 30 },
  { label: 'B', value: 80 },
  { label: 'C', value: 45 },
  { label: 'D', value: 60 },
  { label: 'E', value: 20 },
  { label: 'F', value: 90 }
];

const container = document.getElementById(@renderer);
const margin = { top: 40, right: 30, bottom: 60, left: 60 };

function drawChart() {
  container.innerHTML = '';
  
  const width = container.clientWidth || 600;
  const height = container.clientHeight || 400;

  const svg = d3.select('#' + @renderer)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const x = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Add bars
  svg.selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', d => x(d.label))
    .attr('y', height - margin.bottom)
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('fill', (d, i) => d3.interpolateBlues((i + 1) / data.length))
    .transition()
    .duration(800)
    .attr('y', d => y(d.value))
    .attr('height', d => y(0) - y(d.value));

  // Add x-axis
  svg.append('g')
    .attr('transform', \`translate(0,\${height - margin.bottom})\`)
    .call(d3.axisBottom(x))
    .style('font-size', '12px');

  // Add y-axis
  svg.append('g')
    .attr('transform', \`translate(\${margin.left},0)\`)
    .call(d3.axisLeft(y))
    .style('font-size', '12px');

  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '18px')
    .style('font-weight', 'bold')
    .text('Interactive Bar Chart');
}

// Initial draw
drawChart();

// Redraw on resize
window.addEventListener('resize', drawChart);

return 'Chart rendered successfully!';`,
      },
    ],
    codeSnippets: [],
    cdnPackages: [
      {
        id: uuidv4(),
        name: "d3",
        url: "https://cdn.jsdelivr.net/npm/d3@7",
        enabled: true,
      },
    ],
  },

  "data-visualization": {
    id: uuidv4(),
    name: "Data Visualization",
    enabled: true,
    isDemo: true,
    variables: [
      {
        id: uuidv4(),
        name: "result",
        type: "string",
        value: "",
      },
    ],
    functions: [],
    runner: [
      {
        id: uuidv4(),
        type: "code",
        target: ["result", ""],
        args: [],
        code: `// Network Graph Visualization
const container = document.getElementById(@renderer);

const nodes = [
  { id: 'A', group: 1 },
  { id: 'B', group: 1 },
  { id: 'C', group: 2 },
  { id: 'D', group: 2 },
  { id: 'E', group: 3 },
  { id: 'F', group: 3 },
  { id: 'G', group: 3 }
];

const links = [
  { source: 'A', target: 'B' },
  { source: 'A', target: 'C' },
  { source: 'B', target: 'D' },
  { source: 'C', target: 'D' },
  { source: 'D', target: 'E' },
  { source: 'E', target: 'F' },
  { source: 'E', target: 'G' },
  { source: 'F', target: 'G' }
];

let simulation;

function drawGraph() {
  container.innerHTML = '';
  
  const width = container.clientWidth || 700;
  const height = container.clientHeight || 500;

  const svg = d3.select('#' + @renderer)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  if (simulation) simulation.stop();
  
  // Define drag functions
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  
  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2));

  const link = svg.append('g')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', '#999')
    .attr('stroke-width', 2);

  const node = svg.append('g')
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('r', 20)
    .attr('fill', d => d3.schemeCategory10[d.group])
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  const label = svg.append('g')
    .selectAll('text')
    .data(nodes)
    .join('text')
    .text(d => d.id)
    .attr('font-size', 14)
    .attr('font-weight', 'bold')
    .attr('text-anchor', 'middle')
    .attr('dy', 5);

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    label
      .attr('x', d => d.x)
      .attr('y', d => d.y);
  });
}

// Initial draw
drawGraph();

// Redraw on resize
window.addEventListener('resize', drawGraph);

return 'Network graph rendered!';`,
      },
    ],
    codeSnippets: [],
    cdnPackages: [
      {
        id: uuidv4(),
        name: "d3",
        url: "https://cdn.jsdelivr.net/npm/d3@7",
        enabled: true,
      },
    ],
  },

  "creative-canvas": {
    id: uuidv4(),
    name: "Creative Canvas",
    enabled: true,
    isDemo: true,
    variables: [
      {
        id: uuidv4(),
        name: "status",
        type: "string",
        value: "",
      },
    ],
    functions: [],
    runner: [
      {
        id: uuidv4(),
        type: "code",
        target: ["status", ""],
        args: [],
        code: `// Generative Art Animation
const container = document.getElementById(@renderer);
container.innerHTML = '';

const canvas = document.createElement('canvas');
canvas.style.border = '1px solid #e2e8f0';
canvas.style.borderRadius = '8px';
container.appendChild(canvas);

const ctx = canvas.getContext('2d');
const particles = [];
const particleCount = 100;

function resizeCanvas() {
  canvas.width = container.clientWidth || 700;
  canvas.height = container.clientHeight || 500;
}

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 2 - 1;
    this.speedY = Math.random() * 2 - 1;
    this.hue = Math.random() * 360;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
    if (this.y > canvas.height || this.y < 0) this.speedY *= -1;

    this.hue += 0.5;
    if (this.hue > 360) this.hue = 0;
  }

  draw() {
    ctx.fillStyle = \`hsl(\${this.hue}, 70%, 60%)\`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Initialize particles
for (let i = 0; i < particleCount; i++) {
  particles.push(new Particle());
}

// Set initial size
resizeCanvas();

// Resize on window resize
window.addEventListener('resize', resizeCanvas);

function animate() {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  particles.forEach(particle => {
    particle.update();
    particle.draw();
  });

  // Draw connections
  particles.forEach((p1, i) => {
    particles.slice(i + 1).forEach(p2 => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100) {
        ctx.strokeStyle = \`hsla(\${p1.hue}, 70%, 60%, \${1 - distance / 100})\`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });
  });

  requestAnimationFrame(animate);
}

animate();

return 'Animation started!';`,
      },
    ],
    codeSnippets: [],
    cdnPackages: [],
  },

  "hello-world": {
    id: uuidv4(),
    name: "Hello World",
    enabled: true,
    isDemo: true,
    variables: [
      {
        id: uuidv4(),
        name: "greeting",
        type: "string",
        value: "Hello, World!",
      },
    ],
    functions: [],
    runner: [
      {
        id: uuidv4(),
        type: "code",
        target: ["", ""],
        args: [],
        code: `// Hello World Demo\nconst container = document.getElementById(@renderer);\ncontainer.innerHTML = \`<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-family: sans-serif; font-size: 2rem; color: #3b82f6; font-weight: bold;">\${@greeting}</div>\`;\nreturn 'Hello World rendered!';`,
      },
    ],
    codeSnippets: [],
    cdnPackages: [],
  },
};
