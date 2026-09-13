/**
 * PathMate Real Walkable Campus Routing & Geometry Navigation Engine
 * Powered by Dijkstra / A* Shortest-Path Search, Polygon Obstacle Collision Avoidance,
 * Vector Bearing Geometry Turn Directions, and Off-Route GPS Deviation Detection.
 */

// Helper: Haversine distance in meters between two [lat, lng] points
export const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

// Helper: Calculate initial bearing angle in degrees (0-360°) from point 1 to point 2
export const calculateBearing = (lat1, lng1, lat2, lng2) => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;
  return Math.round(bearing);
};

// Helper: Determine cardinal/ordinal direction from bearing degrees
export const getCardinalDirection = (bearing) => {
  const directions = [
    'North', 'North-East', 'East', 'South-East',
    'South', 'South-West', 'West', 'North-West'
  ];
  const idx = Math.round(bearing / 45) % 8;
  return directions[idx];
};

// Helper: Determine turn direction from change in bearing
export const getTurnInstruction = (bearingChange) => {
  let change = (bearingChange + 360) % 360;
  if (change > 180) change -= 360;

  if (change >= -20 && change <= 20) return { action: 'straight', text: 'Continue straight' };
  if (change > 20 && change <= 60) return { action: 'slight_right', text: 'Bear slight right' };
  if (change > 60 && change <= 120) return { action: 'turn_right', text: 'Turn right' };
  if (change > 120) return { action: 'sharp_right', text: 'Make a sharp right' };
  if (change < -20 && change >= -60) return { action: 'slight_left', text: 'Bear slight left' };
  if (change < -60 && change >= -120) return { action: 'turn_left', text: 'Turn left' };
  if (change < -120) return { action: 'sharp_left', text: 'Make a sharp left' };
  return { action: 'straight', text: 'Continue straight' };
};

// Line Segment Intersection Test (Ray-Casting Collision Check)
export const doLineSegmentsIntersect = (p1, p2, q1, q2) => {
  const ccw = (A, B, C) => {
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0]);
  };
  return (
    ccw(p1, q1, q2) !== ccw(p2, q1, q2) &&
    ccw(p1, p2, q1) !== ccw(p1, p2, q2)
  );
};

// Check if a line segment intersects a polygon obstacle
export const isSegmentCollidingWithObstacle = (p1, p2, obstaclePolygon) => {
  if (!obstaclePolygon || !Array.isArray(obstaclePolygon) || obstaclePolygon.length < 3) {
    return false;
  }
  for (let i = 0; i < obstaclePolygon.length; i++) {
    const q1 = obstaclePolygon[i];
    const q2 = obstaclePolygon[(i + 1) % obstaclePolygon.length];
    if (doLineSegmentsIntersect(p1, p2, q1, q2)) {
      return true;
    }
  }
  return false;
};

// Snap any arbitrary lat/lng coordinate to nearest graph node
export const snapToNearestNode = (lat, lng, nodes = []) => {
  if (!nodes || nodes.length === 0) return null;

  let nearestNode = null;
  let minDistance = Infinity;

  nodes.forEach(node => {
    const nodeLat = parseFloat(node.latitude);
    const nodeLng = parseFloat(node.longitude);
    if (isNaN(nodeLat) || isNaN(nodeLng)) return;

    const dist = calculateHaversineDistance(lat, lng, nodeLat, nodeLng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestNode = node;
    }
  });

  return { node: nearestNode, distanceMeters: minDistance };
};

// A* / Dijkstra Shortest Path Search Engine over Connected Graph
export const findShortestPath = ({
  startNodeKey,
  endNodeKey,
  nodesMap = {},
  adjacencyMap = {},
  obstacles = [],
  travelMode = 'walking',
  accessibilityRequired = false
}) => {
  if (!startNodeKey || !endNodeKey || !nodesMap[startNodeKey] || !nodesMap[endNodeKey]) {
    return null;
  }

  if (startNodeKey === endNodeKey) {
    return {
      pathKeys: [startNodeKey],
      pathNodes: [nodesMap[startNodeKey]],
      coordinates: [[parseFloat(nodesMap[startNodeKey].longitude), parseFloat(nodesMap[startNodeKey].latitude)]],
      totalDistanceMeters: 0
    };
  }

  const distances = {};
  const previous = {};
  const priorityQueue = new Set();

  Object.keys(nodesMap).forEach(key => {
    distances[key] = Infinity;
    previous[key] = null;
  });

  distances[startNodeKey] = 0;
  priorityQueue.add(startNodeKey);

  while (priorityQueue.size > 0) {
    // Select node with smallest distance
    let currentKey = null;
    let smallestDist = Infinity;

    priorityQueue.forEach(key => {
      if (distances[key] < smallestDist) {
        smallestDist = distances[key];
        currentKey = key;
      }
    });

    if (currentKey === null || currentKey === endNodeKey) {
      break;
    }

    priorityQueue.delete(currentKey);

    const neighbors = adjacencyMap[currentKey] || [];
    const currentNode = nodesMap[currentKey];

    neighbors.forEach(edge => {
      const neighborKey = edge.targetKey;
      const neighborNode = nodesMap[neighborKey];
      if (!neighborNode) return;

      // Accessibility & mode checks
      if (accessibilityRequired && edge.isAccessible === false) return;
      if (edge.allowedModes && !edge.allowedModes.includes(travelMode)) return;

      // Obstacle collision check
      const p1 = [parseFloat(currentNode.longitude), parseFloat(currentNode.latitude)];
      const p2 = [parseFloat(neighborNode.longitude), parseFloat(neighborNode.latitude)];
      const collides = obstacles.some(obs => 
        obs.isActive && isSegmentCollidingWithObstacle(p1, p2, obs.polygonCoords)
      );

      if (collides) return;

      const alt = distances[currentKey] + (edge.distanceMeters || calculateHaversineDistance(
        parseFloat(currentNode.latitude), parseFloat(currentNode.longitude),
        parseFloat(neighborNode.latitude), parseFloat(neighborNode.longitude)
      ));

      if (alt < distances[neighborKey]) {
        distances[neighborKey] = alt;
        previous[neighborKey] = currentKey;
        priorityQueue.add(neighborKey);
      }
    });
  }

  // Reconstruct path
  const pathKeys = [];
  let curr = endNodeKey;
  while (curr) {
    pathKeys.unshift(curr);
    curr = previous[curr];
  }

  if (pathKeys[0] !== startNodeKey) {
    // Path not found
    return null;
  }

  const pathNodes = pathKeys.map(k => nodesMap[k]);
  const coordinates = pathNodes.map(n => [parseFloat(n.longitude), parseFloat(n.latitude)]);

  let totalDistanceMeters = 0;
  for (let i = 0; i < pathNodes.length - 1; i++) {
    totalDistanceMeters += calculateHaversineDistance(
      parseFloat(pathNodes[i].latitude), parseFloat(pathNodes[i].longitude),
      parseFloat(pathNodes[i + 1].latitude), parseFloat(pathNodes[i + 1].longitude)
    );
  }

  return {
    pathKeys,
    pathNodes,
    coordinates,
    totalDistanceMeters
  };
};

// Geometry-Based Step-by-Step Directions Generator
export const generateGeometryDirections = ({
  pathNodes = [],
  totalDistanceMeters = 0,
  travelMode = 'walking',
  originName = 'Start Location',
  destinationName = 'Destination'
}) => {
  if (!pathNodes || pathNodes.length === 0) return [];

  const steps = [];
  const speedMPerMin = travelMode === 'cycling' ? 220 : travelMode === 'wheelchair' ? 50 : 70;

  // Step 1: Start instruction
  steps.push({
    stepIndex: 1,
    action: 'start',
    icon: 'my_location',
    text: `Start at ${originName}.`,
    distanceMeters: 0,
    timeMinutes: 0
  });

  if (pathNodes.length === 1) {
    steps.push({
      stepIndex: 2,
      action: 'arrive',
      icon: 'where_to_vote',
      text: `Arrive at ${destinationName}. Entrance is straight ahead.`,
      distanceMeters: 0,
      timeMinutes: 0
    });
    return steps;
  }

  let prevBearing = null;
  let stepCounter = 2;

  for (let i = 0; i < pathNodes.length - 1; i++) {
    const curr = pathNodes[i];
    const next = pathNodes[i + 1];

    const segDist = calculateHaversineDistance(
      parseFloat(curr.latitude), parseFloat(curr.longitude),
      parseFloat(next.latitude), parseFloat(next.longitude)
    );

    const bearing = calculateBearing(
      parseFloat(curr.latitude), parseFloat(curr.longitude),
      parseFloat(next.latitude), parseFloat(next.longitude)
    );

    const cardinal = getCardinalDirection(bearing);

    if (i === 0) {
      steps.push({
        stepIndex: stepCounter++,
        action: 'straight',
        icon: 'straight',
        text: `Head ${cardinal} toward ${next.name} (${segDist}m).`,
        distanceMeters: segDist,
        timeMinutes: Math.max(1, Math.round(segDist / speedMPerMin))
      });
    } else {
      const turn = getTurnInstruction(bearing - prevBearing);
      const iconMap = {
        straight: 'straight',
        slight_right: 'turn_slight_right',
        turn_right: 'turn_right',
        sharp_right: 'turn_sharp_right',
        slight_left: 'turn_slight_left',
        turn_left: 'turn_left',
        sharp_left: 'turn_sharp_left'
      };

      steps.push({
        stepIndex: stepCounter++,
        action: turn.action,
        icon: iconMap[turn.action] || 'straight',
        text: `${turn.text} at ${curr.name} and proceed ${cardinal} (${segDist}m).`,
        distanceMeters: segDist,
        timeMinutes: Math.max(1, Math.round(segDist / speedMPerMin))
      });
    }

    prevBearing = bearing;
  }

  // Final Step: Arrival
  const totalTimeMin = Math.max(1, Math.round(totalDistanceMeters / speedMPerMin));
  steps.push({
    stepIndex: stepCounter,
    action: 'arrive',
    icon: 'where_to_vote',
    text: `Arrive at ${destinationName}.`,
    distanceMeters: totalDistanceMeters,
    timeMinutes: totalTimeMin
  });

  return steps;
};

// Check if user location deviates > thresholdMeters from the active polyline
export const checkIsOffRoute = (userLat, userLng, polylineCoords = [], thresholdMeters = 25) => {
  if (!userLat || !userLng || !polylineCoords || polylineCoords.length === 0) return false;

  let minDistance = Infinity;

  polylineCoords.forEach(pt => {
    const ptLng = pt[0];
    const ptLat = pt[1];
    const dist = calculateHaversineDistance(userLat, userLng, ptLat, ptLng);
    if (dist < minDistance) {
      minDistance = dist;
    }
  });

  return minDistance > thresholdMeters;
};

// Convenience Graph Builder
export const buildGraph = (nodes = [], edges = []) => {
  const nodesMap = {};
  const adjacencyMap = {};

  nodes.forEach(node => {
    nodesMap[node.id] = node;
    adjacencyMap[node.id] = [];
  });

  edges.forEach(edge => {
    if (!adjacencyMap[edge.source_node_id]) adjacencyMap[edge.source_node_id] = [];
    if (!adjacencyMap[edge.target_node_id]) adjacencyMap[edge.target_node_id] = [];

    const dist = parseFloat(edge.distance_meters) || 0;
    adjacencyMap[edge.source_node_id].push({
      targetKey: edge.target_node_id,
      distanceMeters: dist,
      isAccessible: edge.is_accessible !== false,
      allowedModes: edge.travel_mode ? [edge.travel_mode] : ['walking', 'cycling', 'wheelchair']
    });

    if (edge.is_bidirectional !== false) {
      adjacencyMap[edge.target_node_id].push({
        targetKey: edge.source_node_id,
        distanceMeters: dist,
        isAccessible: edge.is_accessible !== false,
        allowedModes: edge.travel_mode ? [edge.travel_mode] : ['walking', 'cycling', 'wheelchair']
      });
    }
  });

  return { nodesMap, adjacencyMap };
};

// Convenience A* Shortest Path
export const findShortestPathAStar = (graph, startNodeId, endNodeId, nodes = []) => {
  const result = findShortestPath({
    startNodeKey: startNodeId,
    endNodeKey: endNodeId,
    nodesMap: graph.nodesMap || {},
    adjacencyMap: graph.adjacencyMap || {}
  });

  return result ? result.pathKeys : [];
};

// Convenience Dijkstra Shortest Path
export const findShortestPathDijkstra = (graph, startNodeId, endNodeId) => {
  const result = findShortestPath({
    startNodeKey: startNodeId,
    endNodeKey: endNodeId,
    nodesMap: graph.nodesMap || {},
    adjacencyMap: graph.adjacencyMap || {}
  });

  return result ? result.pathKeys : [];
};

// Convenience Distance and Duration Calculation
export const calculateRouteDistanceAndDuration = (pathCoordinates = [], travelMode = 'walking') => {
  let distanceMeters = 0;

  for (let i = 0; i < pathCoordinates.length - 1; i++) {
    const p1 = pathCoordinates[i];
    const p2 = pathCoordinates[i + 1];
    distanceMeters += calculateHaversineDistance(p1[1], p1[0], p2[1], p2[0]);
  }

  const speedMPerMin = travelMode === 'cycling' ? 220 : travelMode === 'wheelchair' ? 50 : 70;
  const durationMinutes = Math.max(1, Math.round(distanceMeters / speedMPerMin));

  const formattedDistance = distanceMeters >= 1000
    ? `${(distanceMeters / 1000).toFixed(1)} km`
    : `${distanceMeters} Meters`;

  return { distanceMeters, formattedDistance, durationMinutes };
};

// Convenience Detailed Turn Steps Generator
export const generateDetailedTurnSteps = (pathCoordinates = [], nodes = []) => {
  if (!pathCoordinates || pathCoordinates.length === 0) return [];

  const nodeMap = new Map(nodes.map(n => [`${parseFloat(n.longitude).toFixed(5)}_${parseFloat(n.latitude).toFixed(5)}`, n.name]));

  const pathNodes = pathCoordinates.map(pt => {
    const key = `${parseFloat(pt[0]).toFixed(5)}_${parseFloat(pt[1]).toFixed(5)}`;
    const name = nodeMap.get(key) || 'Campus Walkway Point';
    return { name, latitude: pt[1], longitude: pt[0] };
  });

  const totalDist = calculateRouteDistanceAndDuration(pathCoordinates).distanceMeters;

  return generateGeometryDirections({
    pathNodes,
    totalDistanceMeters: totalDist,
    travelMode: 'walking',
    originName: pathNodes[0]?.name || 'Start Point',
    destinationName: pathNodes[pathNodes.length - 1]?.name || 'Destination'
  });
};
