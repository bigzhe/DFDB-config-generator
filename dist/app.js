let nodes = [], links = []
let lastNodeId = 1

// TODO: id generator
const idGenerator = (AttackPattern) => Object.keys(AttackPattern.states).map(s => parseStateId(s)).reduce((a,b) => Math.max(a,b), 0)

const parsePatternId = (id) => parseInt(id.substring(7))
const unparsePatternId = (id) => 'pattern' + id


const parseStateId = (id) => parseInt(id.substring(1))
const unparseStateId = (id) => 's' + id

var app = new Vue({
  el: '#app',
  mounted: function() {
    console.log('Mounted!')

  },
  data: {
    message: 'Hello Vue!',
    nodes: [],
    links: [],
    selectedNode: null,
    selectedLink: null,
    test: 'test',
    patterns: [],
    updating: false,
  },
  computed: {
    nodeSelected: function() {
      return this.selectedNode !== null 
    },
    linkSelected: function() {
      return this.selectedLink !== null 
    },
  },
  methods: {
  }
})

app.nodes = nodes
app.links = links
initGraph();


function initGraph() {

// set up SVG for D3
var width = 960,
  height = 500,
  colors = d3
    .scale
    .category10();

// var svg = d3.select('body') .append('svg') .attr('oncontextmenu', 'return
// false;') .attr('width', width) .attr('height', height);
var svg = d3.select('svg')
var width = +svg.attr('width');
var height = +svg.attr('height');

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge dicircleions are set by 'left' and
// 'right'.
// app.nodes = nodes
// app.links = links

const actionColor = (d) => {
  let c = d.reflexive ? '#3F51B5' : '#00BCD4';
  c = d.outcome ? '#E91E63' : c;
  return d.starter ? '#8BC34A' : c;
  
}

// init D3 force layout
var force = d3
  .layout
  .force()
  .nodes(nodes)
  .links(links)
  .size([width, height])
  .linkDistance(150)
  .charge(-1000)
  .chargeDistance(200)
  .linkStrength(0.6)
  // .gravity(0.05)
  .theta(0.2)
  .on('tick', tick)

// define arrow markers for graph links
svg
  .append('svg:defs')
  .append('svg:marker')
  .attr('id', 'end-arrow')
  .attr('viewBox', '0 -5 10 10')
  .attr('refX', 6)
  .attr('markerWidth', 3)
  .attr('markerHeight', 3)
  .attr('orient', 'auto')
  .append('svg:path')
  .attr('d', 'M0,-5L10,0L0,5')
  .attr('fill', '#000');

svg
  .append('svg:defs')
  .append('svg:marker')
  .attr('id', 'start-arrow')
  .attr('viewBox', '0 -5 10 10')
  .attr('refX', 4)
  .attr('markerWidth', 3)
  .attr('markerHeight', 3)
  .attr('orient', 'auto')
  .append('svg:path')
  .attr('d', 'M10,-5L0,0L10,5')
  .attr('fill', '#000');

// line displayed when dragging new nodes
var drag_line = svg
  .append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path = svg
    .append('svg:g')
    .selectAll('path'),
  circle = svg
    .append('svg:g')
    .selectAll('g');

// mouse event vars
var selected_node = null,
  selected_link = null,
  mousedown_link = null,
  mousedown_node = null,
  mouseup_node = null;

app.selectedNode = selected_node
app.selectedLink = selected_link

function resetMouseVars() {
  mousedown_node = null;
  mouseup_node = null;
  mousedown_link = null;
}

// update force layout (called automatically each iteration)
function tick() {
  const outcomeLimit = 50;
  const radiu = 28;
  // draw dicircleed edges with proper padding from node centers
  path
    .attr('d', function (d) {
      var deltaX = d.target.x - d.source.x,
        deltaY = d.target.y - d.source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = d.left
          ? 33
          : 26,
        targetPadding = d.right
          ? 33
          : 26,
        sourceX = d.source.x + (sourcePadding * normX),
        sourceY = d.source.y + (sourcePadding * normY),
        targetX = d.target.x - (targetPadding * normX),
        targetY = d.target.y - (targetPadding * normY);
      return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });

  circle.attr('transform', (d) => {
    let cx = d.x, cy = d.y;

    return 'translate(' + cx + ',' + cy + ')';
  });
}

// update graph (called when needed)
function restart() {
  // path (link) group
  path = path.data(links);

  // update existing links
  path.classed('selected', function (d) {
    return d === selected_link;
  })
    .style('marker-start', function (d) {
      return d.left
        ? 'url(#start-arrow)'
        : '';
    })
    .style('marker-end', function (d) {
      return d.right
        ? 'url(#end-arrow)'
        : '';
    });

  // add new links
  path
    .enter()
    .append('svg:path')
    .attr('class', 'link')
    .classed('selected', function (d) {
      return d === selected_link;
    })
    .style('marker-start', function (d) {
      return d.left
        ? 'url(#start-arrow)'
        : '';
    })
    .style('marker-end', function (d) {
      return d.right
        ? 'url(#end-arrow)'
        : '';
    })
    .on('mousedown', function (d) {
      console.log(d)
      if (d3.event.ctrlKey) 
        return;
      
      // select link
      mousedown_link = d;
      if (mousedown_link === selected_link) 
        selected_link = null;
      else 
        selected_link = mousedown_link;
      selected_node = null;
      app.selectedNode = selected_node
      app.selectedLink = selected_link
      console.log(selected_link)
      restart();
    });

  // remove old links
  path
    .exit()
    .remove();

  // circle (node) group NB: the function arg is crucial here! nodes are known by
  // id, not by index!
  circle = circle.data(nodes, function (d) {
    return d.id;
  });

  // update existing nodes (reflexive & selected visual states)
  circle
    .selectAll('circle')
    .style('fill', function (d) {
      return (d === selected_node)
        ? d3
          .rgb(actionColor(d))
          .brighter()
          .toString()
        : actionColor(d);
    })
    .classed('reflexive', function (d) {
      return d.reflexive;
    })
    .classed('outcome', (d) => d.outcome);

  // add new nodes
  var g = circle
    .enter()
    .append('svg:g');

  g
    .append('svg:circle')
    .attr('class', 'node')
    .attr('r', 28)
    .style('fill', function (d) {
      return (d === selected_node)
        ? d3
          .rgb(actionColor(d))
          .brighter()
          .toString()
        : actionColor(d);
    })
    .style('stroke', function (d) {
      return d3
        .rgb(actionColor(d))
        .darker()
        .toString();
    })
    .classed('reflexive', function (d) {
      return d.reflexive;
    })
    .classed('outcome', (d) => d.outcome)
    .on('mouseover', function (d) {
      if (!mousedown_node || d === mousedown_node) 
        return;
      
      // enlarge target node
      d3
        .select(this)
        .attr('transform', 'scale(1.1)');
    })
    .on('mouseout', function (d) {
      if (!mousedown_node || d === mousedown_node) 
        return;
      
      // unenlarge target node
      d3
        .select(this)
        .attr('transform', '');
    })
    .on('mousedown', function (d) {
      if (d3.event.ctrlKey) 
        return;
      
      // select node
      mousedown_node = d;
      if (mousedown_node === selected_node) 
        selected_node = null;
      else 
        selected_node = mousedown_node;
      app.selectedNode = selected_node
      selected_link = null;
      app.selectedLink = selected_link

      // reposition drag line
      drag_line
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);

      restart();
    })
    .on('mouseup', function (d) {
      if (!mousedown_node) 
        return;
      
      // needed by FF
      drag_line
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      mouseup_node = d;
      if (mouseup_node === mousedown_node) {
        resetMouseVars();
        return;
      }

      // unenlarge target node
      d3
        .select(this)
        .attr('transform', '');

      // add link to graph (update if exists) NB: links are strictly source < target;
      // arrows separately specified by booleans
      var source,
        target,
        dicircleion;
      // if (mousedown_node.id < mouseup_node.id) {
      //   source = mousedown_node;
      //   target = mouseup_node;
      //   dicircleion = 'right';
      // } else {
      //   source = mouseup_node;
      //   target = mousedown_node;
      //   dicircleion = 'left';
      // }

      source = mousedown_node
      target = mouseup_node
      dicircleion = 'right'

      var link;
      link = links.filter(function (l) {
        return (l.source === source && l.target === target);
      })[0];

      if (link) {
        link[dicircleion] = true;
      } else {
        link = {
          source: source,
          target: target,
          left: false,
          right: false,
          label: "",
          canCommit: {},
          timeout: 60,
          trigger: {
            username: false,
            username_regex: "",
            pc: false,
            pc_regex: "",
            activity: false,
            activity_regex: "",
            color: false,
            color_regex: "green",
            timeRange: false,
            start_time: "",
            end_time: "",
          },
        };
        link[dicircleion] = true;
        links.push(link);
      }

      // select new link
      selected_link = link;
      selected_node = null;
      app.selectedNode = selected_node
      app.selectedLink = selected_link
      restart();
    });

  // show node IDs
  g
    .append('svg:text')
    .attr('x', 0)
    .attr('y', 4)
    .attr('class', 'id')
    .text((d) => d.action);

  // remove old nodes
  circle
    .exit()
    .remove();

  // set the graph in motion
  force.start();
}

function mousedown() {
  // prevent I-bar on drag d3.event.preventDefault(); because :active only works
  // in WebKit?
  console.log("Mouse Down")
  svg.classed('active', true);

  if (d3.event.ctrlKey || mousedown_node || mousedown_link) 
    return;
  
  // insert new node at point
  var point = d3.mouse(this),
    node = {
      id: ++lastNodeId,
      action: unparseStateId(lastNodeId),
      label: "",
      reflexive: false,
      property: 'normal'
    };
  node.x = point[0];
  node.y = point[1];
  nodes.push(node);

  restart();
}

function mousemove() {
  if (!mousedown_node) 
    return;
  
  // update drag line
  drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
  mousedown_node.fixed = true

  restart();
}

function mouseup() {
  if (mousedown_node) {
    // hide drag line
    drag_line
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  var toSplice = links.filter(function (l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function (l) {
    links.splice(links.indexOf(l), 1);
  });
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
  // d3.event.preventDefault();

  if (lastKeyDown !== -1) 
    return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if (d3.event.keyCode === 16) {
    circle.call(force.drag);
    svg.classed('ctrl', true);
  }

  if (!selected_node && !selected_link) 
    return;
  switch (d3.event.keyCode) {
    // case 8: // backspace
    case 46: // delete
      if (selected_node) {
        nodes.splice(nodes.indexOf(selected_node), 1);
        spliceLinksForNode(selected_node);
      } else if (selected_link) {
        links.splice(links.indexOf(selected_link), 1);
      }
      selected_link = null;
      selected_node = null;
      app.selectedNode = selected_node
      app.selectedLink = selected_link
      restart();
      break;
  }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if (d3.event.keyCode === 16) {
    circle
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('ctrl', false);
  }


}

// app starts here
svg
  .on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3
  .select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
restart();

}