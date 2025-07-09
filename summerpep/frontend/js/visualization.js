/**
 * NetworkVisualizer Class - Handles the visual representation of the social network
 */
class NetworkVisualizer {
    constructor(containerElement, network) {
        this.container = containerElement;
        this.network = network;
        this.width = this.container.clientWidth;
        this.height = 400;
        this.nodeRadius = 20;
        this.nodes = [];
        this.links = [];
    }

    /**
     * Initialize the SVG container
     */
    initSvg() {
        // Clear any existing SVG
        this.container.innerHTML = '';
        
        // Create the SVG element
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute("width", this.width);
        this.svg.setAttribute("height", this.height);
        this.svg.setAttribute("class", "network-svg");
        
        // Create groups for links and nodes
        this.linksGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.linksGroup.setAttribute("class", "links");
        
        this.nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.nodesGroup.setAttribute("class", "nodes");
        
        this.svg.appendChild(this.linksGroup);
        this.svg.appendChild(this.nodesGroup);
        
        this.container.appendChild(this.svg);
    }

    /**
     * Update the visualization with current network data
     */
    update() {
        this.initSvg();
        this.calculateNodePositions();
        this.renderLinks();
        this.renderNodes();
    }

    /**
     * Calculate positions for all nodes
     */
    calculateNodePositions() {
        this.nodes = [];
        const users = this.network.users;
        
        if (users.length === 0) return;
        
        // Use a simple circular layout
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) / 2 - this.nodeRadius * 2;
        
        users.forEach((user, index) => {
            const angle = (index / users.length) * 2 * Math.PI;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            this.nodes.push({
                id: user.id,
                name: user.name,
                x,
                y
            });
        });
    }

    /**
     * Find a node by its ID
     * @param {string} id - The node ID to find
     * @returns {object|null} - The node object or null if not found
     */
    findNodeById(id) {
        return this.nodes.find(node => node.id === id) || null;
    }

    /**
     * Render connection links between nodes
     */
    renderLinks() {
        this.links = [];
        this.linksGroup.innerHTML = '';
        
        this.network.connections.forEach(connection => {
            const source = this.findNodeById(connection.user1Id);
            const target = this.findNodeById(connection.user2Id);
            
            if (source && target) {
                this.links.push({ source, target });
                
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", source.x);
                line.setAttribute("y1", source.y);
                line.setAttribute("x2", target.x);
                line.setAttribute("y2", target.y);
                line.setAttribute("stroke", "#999");
                line.setAttribute("stroke-width", "2");
                
                this.linksGroup.appendChild(line);
            }
        });
    }

    /**
     * Render nodes representing users
     */
    renderNodes() {
        this.nodesGroup.innerHTML = '';
        
        this.nodes.forEach(node => {
            // Create group for node
            const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            nodeGroup.setAttribute("class", "node");
            nodeGroup.setAttribute("transform", `translate(${node.x},${node.y})`);
            
            // Create circle for node
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("r", this.nodeRadius);
            circle.setAttribute("fill", "#3498db");
            circle.setAttribute("stroke", "#2980b9");
            circle.setAttribute("stroke-width", "2");
            
            // Create text label
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("fill", "white");
            text.setAttribute("font-size", "10px");
            text.textContent = node.name;
            
            // Add elements to the group
            nodeGroup.appendChild(circle);
            nodeGroup.appendChild(text);
            
            // Add interactivity
            nodeGroup.addEventListener("mouseover", () => {
                circle.setAttribute("fill", "#e74c3c");
            });
            
            nodeGroup.addEventListener("mouseout", () => {
                circle.setAttribute("fill", "#3498db");
            });
            
            this.nodesGroup.appendChild(nodeGroup);
        });
    }
}
