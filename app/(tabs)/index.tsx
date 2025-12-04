// app/(tabs)/index.tsx
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";

/*
  Single-file app:
  - Grafo local con nodos (id, title, coord) y edges {from,to,weight(km)}
  - Dijkstra (distancia en km) y BFS (por saltos)
  - Selección de inicio/destino tocando marcadores
  - Agregar nodo (formulario) y agregar conexión (formulario con distancia)
  - Comentarios en español para cada bloque
*/

/* ---------------------- Datos iniciales del grafo ---------------------- */
/* Los pesos están en kilómetros (km). Las coordenadas son ficticias
   pero cercanas entre sí para que se vean en el mapa. */
const initialNodes = [
  { id: "A", title: "A - Entrada", coord: { latitude: 3.4516, longitude: -76.5320 } },
  { id: "B", title: "B - Bloque 1", coord: { latitude: 3.4520, longitude: -76.5310 } },
  { id: "C", title: "C - Bloque 2", coord: { latitude: 3.4512, longitude: -76.5300 } },
  { id: "D", title: "D - Biblioteca", coord: { latitude: 3.4505, longitude: -76.5315 } },
  { id: "E", title: "E - Cafetería", coord: { latitude: 3.4512, longitude: -76.5325 } },
  { id: "F", title: "F - Laboratorio", coord: { latitude: 3.4518, longitude: -76.5295 } },
  { id: "G", title: "G - Parque", coord: { latitude: 3.4498, longitude: -76.5308 } },
  // { id: "H", title: "H - Puerta sur", coord: { latitude: 3.4509, longitude: -76.5330 } },
];

/* Aristas ponderadas (distancia en km). Estos números son de ejemplo. */
const initialEdges = [
  { from: "A", to: "B", weight: 0.3 },
  { from: "A", to: "E", weight: 0.2 },
  // { from: "A", to: "H", weight: 0.5 },
  { from: "B", to: "C", weight: 0.4 },
  { from: "B", to: "D", weight: 0.6 },
  { from: "B", to: "G", weight: 0.9 },
  { from: "B", to: "E", weight: 0.45 },
  { from: "C", to: "F", weight: 0.6 },
  { from: "C", to: "E", weight: 0.35 },
  { from: "C", to: "A", weight: 0.5 },
  // { from: "D", to: "H", weight: 0.7 },
  { from: "D", to: "G", weight: 0.8 },
  { from: "E", to: "F", weight: 0.3 },
  { from: "G", to: "E", weight: 1.5 },
  // { from: "H", to: "B", weight: 0.9 },
  // { from: "H", to: "E", weight: 0.6 },

];

/* ---------------------- Utilidades del grafo ---------------------- */

/* Construye una lista de adyacencia (bidireccional) a partir de nodos y edges */
function buildAdjacency(nodes: typeof initialNodes, edges: typeof initialEdges) {
  const adj: Record<string, Array<{ to: string; weight: number }>> = {};
  nodes.forEach((n) => (adj[n.id] = []));
  edges.forEach((e) => {
    if (!adj[e.from]) adj[e.from] = [];
    if (!adj[e.to]) adj[e.to] = [];
    adj[e.from].push({ to: e.to, weight: e.weight });
    adj[e.to].push({ to: e.from, weight: e.weight }); // grafo no dirigido
  });
  return adj;
}

/* Dijkstra: retorna { dist, prev } para reconstruir ruta; pesos en km */
function dijkstra(nodes: typeof initialNodes, edges: typeof initialEdges, startId: string) {
  const adj = buildAdjacency(nodes, edges);
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const Q = new Set<string>();

  // Inicializar distancias y prev
  nodes.forEach((n) => {
    dist[n.id] = Infinity;
    prev[n.id] = null;
    Q.add(n.id);
  });
  dist[startId] = 0;

  while (Q.size > 0) {
    // Extraer nodo con distancia mínima
    let u: string = "";   // <<< antes era string | null
    let min = Infinity;

    Q.forEach((v) => {
      if (dist[v] < min) {
        min = dist[v];
        u = v;
      }
    });

    if (u === "") break;  
    Q.delete(u);

    // Relajación
    adj[u].forEach((neighbor: any) => {
      const alt = dist[u] + neighbor.weight;  
      if (alt < dist[neighbor.to]) {
        dist[neighbor.to] = alt;
        prev[neighbor.to] = u;
      }
    });
  }

  return { dist, prev };
}


/* Reconstruir ruta desde start hasta goal usando prev */
function reconstructPath(prev: Record<string, string | null>, start: string, goal: string) {
  const path: string[] = [];
  let u: string | null = goal;
  while (u !== null) {
    path.unshift(u);
    if (u === start) break;
    u = prev[u];
  }
  if (path[0] !== start) return null; // no hay ruta
  return path;
}

/* BFS (por saltos) retorna la ruta más corta en número de saltos */
function bfsShortestByHops(nodes: typeof initialNodes, edges: typeof initialEdges, startId: string, goalId: string) {
  const adj = buildAdjacency(nodes, edges);
  const queue: string[] = [startId];
  const visited = new Set([startId]);
  const prev: Record<string, string | null> = {};

  while (queue.length > 0) {
    const u = queue.shift()!;
    if (u === goalId) {
      // reconstruir ruta
      const path = [];
      let curr: string | null = goalId;
      while (curr) {
        path.unshift(curr);
        curr = prev[curr] ?? null;
      }
      return path;
    }
    adj[u].forEach((nei) => {
      if (!visited.has(nei.to)) {
        visited.add(nei.to);
        prev[nei.to] = u;
        queue.push(nei.to);
      }
    });
  }
  return null;
}

/* Obtener coordenadas a partir de una ruta de ids */
function coordsFromPath(nodes: typeof initialNodes, path: string[]) {
  const map: Record<string, typeof initialNodes[0]> = {};
  nodes.forEach((n) => (map[n.id] = n));
  return path.map((id) => ({
    latitude: map[id].coord.latitude,
    longitude: map[id].coord.longitude,
    id,
    title: map[id].title,
  }));
}

/* ---------------------- Componente principal (pantalla) ---------------------- */
export default function IndexScreen() {
  /* Estado del grafo (nodos y aristas) */
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  /* Selecciones de inicio/destino */
  const [start, setStart] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);

  /* Coordenadas de la ruta calculada para dibujar Polyline */
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number; id: string }>>(
    []
  );
  const [routes, setRoutes] = useState<Array<{ coords: any[], color: string }>>([]);

  const [routeNodes, setRouteNodes] = useState<string[]>([]);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);

  /* Algoritmo seleccionado */
  const [algo, setAlgo] = useState<"dijkstra" | "bfs">("dijkstra");

  /* Formularios para añadir nodo y conexión */
  const [newNodeId, setNewNodeId] = useState("");
  const [newNodeLat, setNewNodeLat] = useState("");
  const [newNodeLon, setNewNodeLon] = useState("");

  const [connFrom, setConnFrom] = useState("");
  const [connTo, setConnTo] = useState("");
  const [connDist, setConnDist] = useState("");

  /* Región inicial del mapa centrada en los nodos iniciales */
  const initialRegion: Region = {
    latitude: nodes[0].coord.latitude,
    longitude: nodes[0].coord.longitude,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  };

  /* Cuando cambian start/goal/algo/grafo, recalcular ruta automáticamente */
useEffect(() => {
  if (!start || !goal) {
    setRouteCoords([]);
    setRouteNodes([]);
    setTotalDistance(null);
    return;
  }

  if (algo === "dijkstra") {
    const { dist, prev } = dijkstra(nodes, edges, start);
    const path = reconstructPath(prev as Record<string, string | null>, start, goal);
    if (!path) {
      Alert.alert("Ruta", "No se encontró ruta entre los puntos seleccionados.");
      setRouteCoords([]);
      setRouteNodes([]);
      setTotalDistance(null);
      return;
    }

    const coords = coordsFromPath(nodes, path);

    // Elegir color aleatorio
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);

    // Guardar ruta con color
    setRoutes((prev) => [...prev, { coords, color: randomColor }]);

    setRouteCoords(coords);
    setRouteNodes(path);
    setTotalDistance(Number(dist[goal].toFixed(3))); // km

  } else {
    // BFS por saltos
    const path = bfsShortestByHops(nodes, edges, start, goal);
    if (!path) {
      Alert.alert("Ruta", "No se encontró ruta entre los puntos seleccionados (BFS).");
      setRouteCoords([]);
      setRouteNodes([]);
      setTotalDistance(null);
      return;
    }

    const coords = coordsFromPath(nodes, path);

    // Calcular distancia total en BFS (si deseas mostrarla)
    let sum = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const e = edges.find(
        (ee) =>
          (ee.from === path[i] && ee.to === path[i + 1]) ||
          (ee.to === path[i] && ee.from === path[i + 1])
      );
      if (e) sum += e.weight;
    }

    // Elegir color aleatorio
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);

    // Guardar ruta
    setRoutes((prev) => [...prev, { coords, color: randomColor }]);

    setRouteCoords(coords);
    setRouteNodes(path);
    setTotalDistance(Number(sum.toFixed(3)));
  }
}, [start, goal, algo, nodes, edges]);


  /* Manejar presión en un marcador:
     - si no hay start seleccionado: asignar start
     - si hay start y no hay goal y el id es distinto: asignar goal
     - si ambos ya están: si presionas mismo marcador lo resetea, sino reasigna start->nuevo */
  const handleMarkerPress = (nodeId: string) => {
    if (!start) {
      setStart(nodeId);
      return;
    }
    if (!goal && nodeId !== start) {
      setGoal(nodeId);
      return;
    }
    // Si ya hay ambos seleccionados:
    if (start === nodeId) {
      // Deseleccionar inicio
      setStart(null);
      setGoal(null);
      return;
    }
    // Reasignar start al marcador pulsado (comodidad)
    setStart(nodeId);
    setGoal(null);
  };

  /* Añadir nuevo nodo con id y coordenadas (lat/lon) */
  const addNode = () => {
    const id = newNodeId.trim().toUpperCase();
    if (!id) {
      Alert.alert("Añadir nodo", "Ingresa un identificador para el nodo.");
      return;
    }
    if (nodes.some((n) => n.id === id)) {
      Alert.alert("Añadir nodo", "Ya existe un nodo con ese id.");
      return;
    }
    const lat = parseFloat(newNodeLat);
    const lon = parseFloat(newNodeLon);
    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert("Añadir nodo", "Ingresa latitud y longitud válidas.");
      return;
    }
    const newN = { id, title: `${id} - Nodo`, coord: { latitude: lat, longitude: lon } };
    setNodes((s) => [...s, newN]);
    setNewNodeId("");
    setNewNodeLat("");
    setNewNodeLon("");
    Alert.alert("Añadir nodo", `Nodo ${id} agregado correctamente.`);
  };

  /* Añadir conexión entre dos nodos con distancia en km */
  const addConnection = () => {
    const from = connFrom.trim().toUpperCase();
    const to = connTo.trim().toUpperCase();
    const w = parseFloat(connDist);
    if (!from || !to || isNaN(w)) {
      Alert.alert("Añadir conexión", "Rellena 'from', 'to' y una distancia válida (km).");
      return;
    }
    if (!nodes.some((n) => n.id === from) || !nodes.some((n) => n.id === to)) {
      Alert.alert("Añadir conexión", "Los nodos indicados deben existir.");
      return;
    }
    // Evitar duplicados exactos (from-to)
    if (edges.some((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from))) {
      Alert.alert("Añadir conexión", "Ya existe una conexión entre esos nodos.");
      return;
    }
    setEdges((s) => [...s, { from, to, weight: w }]);
    setConnFrom("");
    setConnTo("");
    setConnDist("");
    Alert.alert("Añadir conexión", `Conexión ${from} ↔ ${to} añadida (${w} km).`);
  };

  /* Reset de selección */
  const resetSelection = () => {
    setStart(null);
    setGoal(null);
    setRouteCoords([]);
    setRoutes([]);
    setRouteNodes([]);
    setTotalDistance(null);
  };

  /* Render paso (elemento de la lista de pasos) */
  const renderStep = ({ item, index }: { item: string; index: number }) => {
    const node = nodes.find((n) => n.id === item);
    return (
      <View style={styles.stepItem}>
        <Text style={styles.stepIndex}>{index + 1}.</Text>
        <View>
          <Text style={styles.stepTitle}>
            {node?.title ?? item} ({item})
          </Text>
          <Text style={styles.stepSub}>
            Lat {node?.coord.latitude.toFixed(6)}, Lon {node?.coord.longitude.toFixed(6)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        {/* MAPA */}
        <MapView style={styles.map} initialRegion={initialRegion}>
          {/* Marcadores: clic para seleccionar/conectar */}
          {nodes.map((n) => (
            <Marker
              key={n.id}
              coordinate={n.coord}
              title={`${n.title} (${n.id})`}
              description={`Toca para seleccionar (start/goal).`}
              onPress={() => handleMarkerPress(n.id)}
            />
          ))}

          {/* Dibujar todas las aristas del grafo (líneas grises) */}
          {edges.map((e, i) => {
            const n1 = nodes.find((nn) => nn.id === e.from);
            const n2 = nodes.find((nn) => nn.id === e.to);
            if (!n1 || !n2) return null;
            return (
              <Polyline
                key={`edge-${i}`}
                coordinates={[
                  { latitude: n1.coord.latitude, longitude: n1.coord.longitude },
                  { latitude: n2.coord.latitude, longitude: n2.coord.longitude },
                ]}
                strokeWidth={2}
                lineDashPattern={[4, 4]}
                // gris tenue para mostrar red del grafo
                strokeColor={"#999999"}
              />
            );
          })}

          {/* Si hay ruta calculada, dibujarla con Polyline visible (rojo) */}
{routes.map((r, idx) => (
  <Polyline
    key={idx}
    coordinates={r.coords}
    strokeWidth={5}
    strokeColor={r.color}
  />
))}


        </MapView>

        {/* CONTROLES */}
        <ScrollView style={styles.controls} contentContainerStyle={{ paddingBottom: 20 }}>
          <View >
            <Text style={styles.title}>Ruta más corta (grafo ponderado)</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={resetSelection}>
              <Text style={{ color: "white", fontWeight: "600" }}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Selección manual (alternativa a tocar marcadores) */}
          <View style={styles.inline}>
            <View style={styles.selectBox}>
              <Text style={styles.label}>Inicio</Text>
              <TextInput
                placeholder="ej. A"
                value={start ?? ""}
                onChangeText={(t) => setStart(t.trim().toUpperCase() || null)}
                style={styles.input}
              />
            </View>
            <View style={styles.selectBox}>
              <Text style={styles.label}>Destino</Text>
              <TextInput
                placeholder="ej. G"
                value={goal ?? ""}
                onChangeText={(t) => setGoal(t.trim().toUpperCase() || null)}
                style={styles.input}
              />
            </View>
          </View>

          {/* Elegir algoritmo */}
          <View >
            <TouchableOpacity
              onPress={() => setAlgo("dijkstra")}
              style={[styles.algoBtn, algo === "dijkstra" ? styles.algoActive : null]}
            >
              <Text> Dijkstra (distancia) </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAlgo("bfs")}
              style={[styles.algoBtn, algo === "bfs" ? styles.algoActive : null]}
            >
              <Text> BFS (saltos) </Text>
            </TouchableOpacity>
          </View>

          {/* Resultado */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resultado</Text>
            {routeNodes.length === 0 ? (
              <Text style={{ color: "#555" }}>Selecciona inicio y destino (tocando un marcador o ingresando el id).</Text>
            ) : (
              <>
                <Text style={{ fontWeight: "700", marginBottom: 4 }}>
                  Camino: {routeNodes.join(" → ")}
                </Text>
                <Text>Distancia total (km): {totalDistance ?? "—"}</Text>
                <Text style={{ marginTop: 8, fontWeight: "600" }}>Pasos:</Text>
                <FlatList
                  data={routeNodes}
                  keyExtractor={(i) => i}
                  renderItem={renderStep}
                  scrollEnabled={false}
                />
              </>
            )}
          </View>

          {/* Añadir nodo */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Añadir nodo (formulario)</Text>
            <Text style={styles.label}>ID del nodo (ej. X)</Text>
            <TextInput placeholder="ID" value={newNodeId} onChangeText={setNewNodeId} style={styles.input} />
            <Text style={styles.label}>Latitud</Text>
            <TextInput placeholder="3.45..." value={newNodeLat} onChangeText={setNewNodeLat} style={styles.input} keyboardType="numeric" />
            <Text style={styles.label}>Longitud</Text>
            <TextInput placeholder="-76.53..." value={newNodeLon} onChangeText={setNewNodeLon} style={styles.input} keyboardType="numeric" />
            <TouchableOpacity onPress={addNode} style={[styles.actionBtn, { marginTop: 8 }]}>
              <Text style={{ color: "white" }}>Agregar nodo</Text>
            </TouchableOpacity>
          </View>

          {/* Añadir conexión */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Añadir conexión (from → to)</Text>
            <Text style={styles.label}>Desde (ID)</Text>
            <TextInput placeholder="A" value={connFrom} onChangeText={(t) => setConnFrom(t.toUpperCase())} style={styles.input} />
            <Text style={styles.label}>Hasta (ID)</Text>
            <TextInput placeholder="B" value={connTo} onChangeText={(t) => setConnTo(t.toUpperCase())} style={styles.input} />
            <Text style={styles.label}>Distancia (km)</Text>
            <TextInput placeholder="0.5" value={connDist} onChangeText={setConnDist} style={styles.input} keyboardType="numeric" />
            <TouchableOpacity onPress={addConnection} style={[styles.actionBtn, { marginTop: 8 }]}>
              <Text style={{ color: "white" }}>Agregar conexión</Text>
            </TouchableOpacity>
            <Text style={{ marginTop: 8, color: "#666" }}>
              Nota: las conexiones son bidireccionales (no dirigidas). Si quieres eliminar, modifica el estado edges.
            </Text>
          </View>

          {/* Mostrar lista de nodos y aristas (para depuración) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nodos ({nodes.length})</Text>
            <Text style={{ color: "#333" }}>{nodes.map((n) => n.id).join(", ")}</Text>

            <Text style={[styles.cardTitle, { marginTop: 8 }]}>Aristas ({edges.length})</Text>
            <Text style={{ color: "#333" }}>
              {edges.map((e) => `${e.from}-${e.to}(${e.weight}km)`).join(", ")}
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------------------- Estilos ---------------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  controls: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    maxHeight: "60%",
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 10,
    padding: 10,
  },
  title: { fontSize: 16, fontWeight: "700" },
  resetBtn: {
    backgroundColor: "#ff3b30",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  
  inline: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  selectBox: { width: "48%" },
  label: { fontSize: 12, color: "#333", marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: "white",
  },
  algoBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  algoActive: { backgroundColor: "#e6f7ff", borderColor: "#91d5ff" },
  card: { backgroundColor: "#fff", padding: 10, borderRadius: 8, marginTop: 10, elevation: 2 },
  cardTitle: { fontWeight: "700", marginBottom: 6 },
  actionBtn: { backgroundColor: "#0066cc", padding: 10, borderRadius: 8, alignItems: "center" },
  stepItem: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  stepIndex: { width: 28, fontWeight: "700" },
  stepTitle: { fontWeight: "600" },
  stepSub: { fontSize: 12, color: "#666" },
});
