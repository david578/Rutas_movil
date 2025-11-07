// Importamos las librerías necesarias de React y React Native
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// ============================================
// Representa cada tarea en el árbol
// ============================================
class TaskNode {
  id: string; // Identificador único de la tarea
  title: string; // Título de la tarea
  description: string; // Descripción detallada (opcional)
  completed: boolean; // ¿Está completada? true/false
  children: TaskNode[]; // Array de tareas hijas (subtareas)

  // Constructor para cuando creamos una nueva tarea
  constructor(id: string, title: string, description = '', completed = false) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.completed = completed;
    this.children = []; // Inicialmente sin hijos/subtareas
  }

  // Método para agregar una subtarea a esta tarea
  addChild(task: TaskNode): void {
    this.children.push(task); // Añade al final del array
  }

  // Método para eliminar una subtarea por su ID
  removeChild(id: string): void {
    // Filtra y mantiene solo los hijos que NO tengan ese ID
    this.children = this.children.filter(child => child.id !== id);
  }

  // Método recursivo para buscar una tarea por ID en todo el árbol
  findTask(id: string): TaskNode | null {
    if (this.id === id) return this; // ¿Soy yo? Devuélveme
    // Si no, busca en todos mis hijos recursivamente
    for (let child of this.children) {
      const found = child.findTask(id); // Búsqueda recursiva
      if (found) return found; // Si lo encontró, devuélvelo
    }
    return null; // No lo encontré en ningún lado
  }
}

// ============================================
// Algoritmos para recorrer el árbol
// ============================================
class TreeTraversal {
  // PreOrden: Visita nodo actual, luego sus hijos (raíz → izquierda → derecha)
  static preOrder(
    node: TaskNode | null,
    result: { id: string; title: string; completed: boolean }[] = []
  ) {
    if (!node) return result; // Si no hay nodo, termina
    // Primero agrega el nodo actual al resultado
    result.push({ id: node.id, title: node.title, completed: node.completed });
    // Luego recorre todos sus hijos recursivamente
    node.children.forEach(child => this.preOrder(child, result));
    return result;
  }

  // PostOrden: Visita hijos primero, luego el nodo actual (izquierda → derecha → raíz)
  static postOrder(
    node: TaskNode | null,
    result: { id: string; title: string; completed: boolean }[] = []
  ) {
    if (!node) return result; // Si no hay nodo, termina
    // Primero recorre todos los hijos
    node.children.forEach(child => this.postOrder(child, result));
    // Al final agrega el nodo actual
    result.push({ id: node.id, title: node.title, completed: node.completed });
    return result;
  }

  // Por Niveles: Visita el árbol nivel por nivel (como leer un libro)
  static levelOrder(root: TaskNode | null) {
    if (!root) return [] as { id: string; title: string; completed: boolean }[][]; // Sin raíz, devuelve vacío
    const result: { id: string; title: string; completed: boolean }[][] = []; // Array de arrays (uno por nivel)
    const queue: { node: TaskNode; level: number }[] = [{ node: root, level: 0 }]; // Cola para procesar nodos

    // Mientras haya nodos en la cola
    while (queue.length > 0) {
      const item = queue.shift(); // Saca el primero de la cola
      if (!item) break; // Si está vacío, termina
      const { node, level } = item; // Extrae el nodo y su nivel
      if (!result[level]) result[level] = []; // Si no existe este nivel, créalo
      result[level].push({ id: node.id, title: node.title, completed: node.completed }); // Agrega al nivel
      // Agrega todos los hijos a la cola (estarán en el siguiente nivel)
      node.children.forEach(child => queue.push({ node: child, level: level + 1 }));
    }
    return result;
  }
}

// ============================================
// COMPONENTE PRINCIPAL: La app completa
// ============================================
export default function TaskTreeApp() {
  // Estados del componente (variables que React observa y re-renderiza cuando cambian)
  const [root, setRoot] = useState<TaskNode | null>(null); // El nodo raíz del árbol
  const [showModal, setShowModal] = useState<boolean>(false); // ¿Mostrar el modal?
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add'); // Modo: agregar o editar
  const [currentParentId, setCurrentParentId] = useState<string | null>(null); // ID del padre al agregar
  const [editingTask, setEditingTask] = useState<TaskNode | null>(null); // Tarea que estamos editando
  const [formData, setFormData] = useState<{ title: string; description: string }>({ title: '', description: '' }); // Datos del formulario
  const [showTraversal, setShowTraversal] = useState<boolean>(false); // ¿Mostrar panel de recorridos?
  const [traversalType, setTraversalType] = useState<'preOrder' | 'postOrder' | 'levelOrder'>('preOrder'); // Tipo de recorrido

  // useEffect: se ejecuta cuando el componente se monta (primera vez que aparece)
  useEffect(() => {
    loadData(); // Carga los datos iniciales
  }, []); // El array vacío significa "solo una vez al inicio"

  // Función que carga datos de ejemplo (simula cargar desde base de datos)
  const loadData = () => {
    // Crea el nodo raíz
    const rootTask = new TaskNode('root', 'Mis Tareas', 'Tarea raíz del sistema');
    
    // Crea tareas de ejemplo
    const task1 = new TaskNode('1', 'Proyecto Final', 'Desarrollo de aplicación móvil');
    const task11 = new TaskNode('1-1', 'Diseño UI/UX', 'Crear mockups y prototipos');
    const task12 = new TaskNode('1-2', 'Implementación', 'Codificar la aplicación');
    const task121 = new TaskNode('1-2-1', 'Frontend', 'React Native con Expo');
    const task122 = new TaskNode('1-2-2', 'Backend', 'API REST con Node.js');
    
    const task2 = new TaskNode('2', 'Estudiar Algoritmos', 'Repasar estructuras de datos');
    const task21 = new TaskNode('2-1', 'Árboles', 'Árboles binarios y n-arios');
    const task22 = new TaskNode('2-2', 'Grafos', 'BFS y DFS');
    
    // Construye la jerarquía del árbol
    task12.addChild(task121); // Implementación tiene Frontend
    task12.addChild(task122); // Implementación tiene Backend
    task1.addChild(task11); // Proyecto tiene Diseño
    task1.addChild(task12); // Proyecto tiene Implementación
    
    task2.addChild(task21); // Estudiar tiene Árboles
    task2.addChild(task22); // Estudiar tiene Grafos
    
    rootTask.addChild(task1); // Raíz tiene Proyecto
    rootTask.addChild(task2); // Raíz tiene Estudiar
    
    setRoot(rootTask); // Guarda el árbol en el estado
  };

  // Guarda los datos (en una app real usaría AsyncStorage o base de datos)
  const saveData = (newRoot: TaskNode) => {
    // Aquí iría: await AsyncStorage.setItem('taskTree', JSON.stringify(newRoot));
    setRoot(newRoot); // Por ahora solo actualiza el estado
  };

  // Abre el modal para agregar una nueva tarea
  const openAddModal = (parentId: string | null) => {
    setModalMode('add'); // Modo agregar
    setCurrentParentId(parentId); // Guarda quién será el padre
    setFormData({ title: '', description: '' }); // Limpia el formulario
    setShowModal(true); // Muestra el modal
  };

  // Abre el modal para editar una tarea existente
  const openEditModal = (task: TaskNode) => {
    setModalMode('edit'); // Modo editar
    setEditingTask(task); // Guarda la tarea que vamos a editar
    setFormData({ title: task.title, description: task.description }); // Llena el formulario con los datos actuales
    setShowModal(true); // Muestra el modal
  };

  // Maneja el submit del formulario (crear o editar)
  const handleSubmit = () => {
    if (!formData.title.trim()) return; // Si no hay título, no hagas nada
    if (!root) return; // Si no hay árbol, no hagas nada

    const newRoot = cloneTree(root!); // Clona el árbol completo (inmutabilidad)

    if (modalMode === 'add') {
      // MODO AGREGAR
      const parent = currentParentId ? newRoot.findTask(currentParentId) : newRoot; // Encuentra el padre
      const newId = `${Date.now()}`; // Genera un ID único usando timestamp
      const newTask = new TaskNode(newId, formData.title, formData.description); // Crea la nueva tarea
      parent?.addChild(newTask); // Agrégala al padre
    } else {
      // MODO EDITAR
      if (editingTask) {
        const taskToEdit = newRoot.findTask(editingTask.id); // Encuentra la tarea en el árbol clonado
        if (taskToEdit) {
          // Actualiza los datos
          taskToEdit.title = formData.title;
          taskToEdit.description = formData.description;
        }
      }
    }

    saveData(newRoot); // Guarda el árbol modificado
    setShowModal(false); // Cierra el modal
    setFormData({ title: '', description: '' }); // Limpia el formulario
  };

  // Elimina una tarea del árbol
  const deleteTask = (taskId: string) => {
    if (taskId === 'root') return; // No se puede eliminar la raíz
    if (!root) return; // Si no hay árbol, no hagas nada

    const newRoot = cloneTree(root!); // Clona el árbol
    deleteTaskRecursive(newRoot, taskId); // Elimina recursivamente
    saveData(newRoot); // Guarda
  };

  // Función recursiva que elimina una tarea de todos los niveles
  const deleteTaskRecursive = (node: TaskNode, taskId: string) => {
    // Filtra los hijos, eliminando el que tiene el ID buscado
    node.children = node.children.filter(child => child.id !== taskId);
    // Repite el proceso en todos los hijos (por si está anidada más profundo)
    node.children.forEach(child => deleteTaskRecursive(child, taskId));
  };

  // Marca una tarea como completada o no completada
  const toggleComplete = (taskId: string) => {
    if (!root) return; // Si no hay árbol, no hagas nada
    const newRoot = cloneTree(root!); // Clona el árbol
    const task = newRoot.findTask(taskId); // Encuentra la tarea
    if (task) {
      task.completed = !task.completed; // Invierte el estado (true → false, false → true)
      saveData(newRoot); // Guarda
    }
  };

  // Clona un árbol completo recursivamente (para mantener inmutabilidad)
  const cloneTree = (node: TaskNode): TaskNode => {
    // Crea un nuevo nodo con los mismos datos
    const newNode = new TaskNode(node.id, node.title, node.description, node.completed);
    // Clona recursivamente todos los hijos
    node.children.forEach(child => {
      newNode.addChild(cloneTree(child));
    });
    return newNode;
  };

  // Obtiene el resultado del recorrido seleccionado
  const getTraversalResult = ():
    | { id: string; title: string; completed: boolean }[]
    | { id: string; title: string; completed: boolean }[][] => {
    if (!root) return [] as { id: string; title: string; completed: boolean }[];
    // Dependiendo del tipo, llama al método correspondiente
    switch (traversalType) {
      case 'preOrder':
        return TreeTraversal.preOrder(root);
      case 'postOrder':
        return TreeTraversal.postOrder(root);
      case 'levelOrder':
        return TreeTraversal.levelOrder(root);
      default:
        return [] as { id: string; title: string; completed: boolean }[];
    }
  };

  const traversalResult = getTraversalResult(); // Calcula el recorrido actual

  // ============================================
  // RENDERIZADO DE LA INTERFAZ
  // ============================================
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.inner}>
        {/* ============ HEADER ============ */}
        <View style={styles.headerCard}>
          <Text style={styles.h1}>🌳 Gestor de Tareas Jerárquicas</Text>
          <Text style={styles.lead}>Estructura de Árbol N-ario con algoritmos de recorrido</Text>

          {/* Botones principales */}
          <View style={styles.row}>
            {/* Botón para mostrar/ocultar recorridos */}
            <TouchableOpacity onPress={() => setShowTraversal(!showTraversal)} style={styles.purpleButton}>
              <Text style={styles.buttonText}>{showTraversal ? '🔽 Ocultar' : '🔍 Ver'} Recorridos</Text>
            </TouchableOpacity>
            {/* Botón para agregar tarea raíz (solo si existe el árbol) */}
            {root && (
              <TouchableOpacity onPress={() => openAddModal('root')} style={styles.greenButton}>
                <Text style={styles.buttonText}>➕ Nueva Tarea Raíz</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ============ PANEL DE RECORRIDOS ============ */}
        {showTraversal && (
          <View style={styles.card}>
            <Text style={styles.h2}>📊 Recorridos del Árbol</Text>

            {/* Botones para seleccionar tipo de recorrido */}
            <View style={styles.rowSmall}>
              <TouchableOpacity onPress={() => setTraversalType('preOrder')} style={styles.traversalButton}>
                <Text>PreOrden</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTraversalType('postOrder')} style={styles.traversalButton}>
                <Text>PostOrden</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTraversalType('levelOrder')} style={styles.traversalButton}>
                <Text>Por Niveles</Text>
              </TouchableOpacity>
            </View>

            {/* Caja donde se muestra el resultado del recorrido */}
            <View style={styles.traversalBox}>
              {/* Si es recorrido por niveles, muestra por niveles */}
              {traversalType === 'levelOrder' ? (
                <View>
                  {/* Verifica que traversalResult sea un array de arrays */}
                  {Array.isArray(traversalResult) && traversalResult.length > 0 && Array.isArray(traversalResult[0]) ? (
                    (traversalResult as { id: string; title: string; completed: boolean }[][]).map((level, idx) => (
                      <View key={idx} style={styles.levelBlock}>
                        <Text style={styles.levelTitle}>Nivel {idx}:</Text>
                        <View style={styles.levelRow}>
                          {/* Muestra cada tarea del nivel */}
                          {level.map((task: { id: string; title: string; completed: boolean }) => (
                            <View key={task.id} style={task.completed ? styles.tagDone : styles.tag}>
                              <Text style={task.completed ? styles.tagTextDone : styles.tagText}>{task.title}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))
                  ) : null}
                </View>
              ) : (
                // Si es preorden o postorden, muestra en línea
                <View style={styles.levelRow}>
                  {(traversalResult as { id: string; title: string; completed: boolean }[]).map((task, idx) => (
                    <View key={idx} style={task.completed ? styles.tagDone : styles.tag}>
                      <Text style={task.completed ? styles.tagTextDone : styles.tagText}>{idx + 1}. {task.title}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ============ ÁRBOL DE TAREAS ============ */}
        <View style={styles.card}>
          {root ? (
            // Renderiza el árbol completo usando el componente recursivo
            <TaskTreeNode
              task={root}
              onAddSubtask={openAddModal}
              onEdit={openEditModal}
              onDelete={deleteTask}
              onToggleComplete={toggleComplete}
              level={0} // Nivel 0 = raíz
            />
          ) : (
            // Si no hay árbol, muestra mensaje de carga
            <Text style={styles.centerText}>Cargando tareas...</Text>
          )}
        </View>

        {/* ============ MODAL (Agregar/Editar) ============ */}
        {showModal && (
          <Modal visible transparent animationType="fade">
            {/* Fondo oscuro semi-transparente */}
            <View style={styles.modalOverlay}>
              {/* Contenido del modal */}
              <View style={styles.modalContent}>
                {/* Título del modal */}
                <Text style={styles.h2}>{modalMode === 'add' ? '➕ Nueva Tarea' : '✏️ Editar Tarea'}</Text>

                {/* Formulario */}
                <View style={styles.spaceY}>
                  {/* Campo: Título */}
                  <View>
                    <Text style={styles.label}>Título *</Text>
                    <TextInput
                      value={formData.title}
                      onChangeText={(text) => setFormData({ ...formData, title: text })}
                      style={styles.input}
                      placeholder="Ej: Implementar función de búsqueda"
                    />
                  </View>

                  {/* Campo: Descripción */}
                  <View>
                    <Text style={styles.label}>Descripción</Text>
                    <TextInput
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      style={[styles.input, styles.textarea]}
                      placeholder="Detalles adicionales sobre la tarea..."
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                {/* Botones del modal */}
                <View style={styles.row}>
                  {/* Botón Crear/Guardar */}
                  <TouchableOpacity onPress={handleSubmit} style={[styles.blueButton, styles.flex1]}>
                    <Text style={styles.buttonText}>{modalMode === 'add' ? 'Crear' : 'Guardar'}</Text>
                  </TouchableOpacity>
                  {/* Botón Cancelar */}
                  <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.grayButton, styles.flex1]}>
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </ScrollView>
  );
}

// ============================================
//Renderiza cada nodo del árbol
// ============================================
interface TaskTreeNodeProps {
  task: TaskNode; // La tarea actual
  onAddSubtask: (parentId: string | null) => void; // Función para agregar subtarea
  onEdit: (task: TaskNode) => void; // Función para editar
  onDelete: (taskId: string) => void; // Función para eliminar
  onToggleComplete: (taskId: string) => void; // Función para marcar completo/incompleto
  level: number; // Nivel de profundidad en el árbol (para la indentación)
}

function TaskTreeNode({ task, onAddSubtask, onEdit, onDelete, onToggleComplete, level }: TaskTreeNodeProps) {
  const [collapsed, setCollapsed] = useState<boolean>(false); // Estado: ¿Está colapsado?
  const isRoot = task.id === 'root'; // ¿Es el nodo raíz?

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Fila del nodo actual */}
      <View
        style={[
          styles.nodeRow,
          { marginLeft: level * 20 }, // Indentación según el nivel
          // Estilos según si es raíz, completado o normal
          isRoot ? styles.rootNode : task.completed ? styles.completedNode : styles.normalNode,
        ]}
      >
        {/* Botón de colapsar/expandir (solo si tiene hijos) */}
        {task.children.length > 0 && (
          <TouchableOpacity onPress={() => setCollapsed(!collapsed)} style={styles.iconButton}>
            <Text style={isRoot ? styles.iconTextWhite : styles.iconText}>{collapsed ? '▸' : '▾'}</Text>
          </TouchableOpacity>
        )}

        {/* Información de la tarea */}
        <View style={{ flex: 1 }}>
          {/* Título (con línea tachada si está completado) */}
          <Text style={[styles.nodeTitle, task.completed && !isRoot ? styles.lineThrough : null]}>{task.title}</Text>
          {/* Descripción (si existe) */}
          {task.description ? <Text style={isRoot ? styles.descRoot : styles.desc}>{task.description}</Text> : null}
          {/* Contador de subtareas */}
          {task.children.length > 0 ? (
            <Text style={isRoot ? styles.subCountRoot : styles.subCount}>{task.children.length} subtarea{task.children.length !== 1 ? 's' : ''}</Text>
          ) : null}
        </View>

        {/* Botones de acción */}
        <View style={styles.actionsRow}>
          {/* Botón completar/descompletar (excepto raíz) */}
          {!isRoot && (
            <TouchableOpacity onPress={() => onToggleComplete(task.id)} style={styles.actionButton}>
              <Text>{task.completed ? '✅' : '☑️'}</Text>
            </TouchableOpacity>
          )}

          {/* Botón agregar subtarea */}
          <TouchableOpacity onPress={() => onAddSubtask(task.id)} style={styles.actionButton}>
            <Text>➕</Text>
          </TouchableOpacity>

          {/* Botones editar y eliminar (excepto raíz) */}
          {!isRoot && (
            <>
              <TouchableOpacity onPress={() => onEdit(task)} style={styles.actionButton}>
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(task.id)} style={styles.actionButton}>
                <Text>🗑️</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Renderiza los hijos recursivamente (si no está colapsado y tiene hijos) */}
      {!collapsed && task.children.length > 0 && (
        <View style={{ marginTop: 6 }}>
          {task.children.map((child: TaskNode) => (
            // AQUÍ ESTÁ LA RECURSIÓN: TaskTreeNode se llama a sí mismo
            <TaskTreeNode
              key={child.id}
              task={child}
              onAddSubtask={onAddSubtask}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
              level={level + 1} // Incrementa el nivel para la indentación
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================
// ESTILOS: Definición de todos los estilos visuales
// ============================================
const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#EFF6FF' }, // Fondo azul claro
  inner: { maxWidth: 800, alignSelf: 'center', width: '100%' }, // Contenedor centrado
  headerCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12 }, // Tarjeta del header
  h1: { fontSize: 24, fontWeight: '700', marginBottom: 6 }, // Título principal
  lead: { color: '#4B5563' }, // Subtítulo
  row: { flexDirection: 'row', gap: 8, marginTop: 12 }, // Fila de botones
  rowSmall: { flexDirection: 'row', gap: 8, marginBottom: 8 }, // Fila pequeña
  purpleButton: { backgroundColor: '#7C3AED', padding: 10, borderRadius: 8, marginRight: 8 }, // Botón morado
  greenButton: { backgroundColor: '#10B981', padding: 10, borderRadius: 8 }, // Botón verde
  blueButton: { backgroundColor: '#2563EB', padding: 10, borderRadius: 8 }, // Botón azul
  grayButton: { backgroundColor: '#D1D5DB', padding: 10, borderRadius: 8 }, // Botón gris
  traversalButton: { padding: 8, borderRadius: 6, backgroundColor: '#E5E7EB', marginRight: 8 }, // Botón de recorrido
  traversalBox: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12 }, // Caja de recorrido
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12 }, // Tarjeta genérica
  levelBlock: { marginBottom: 8 }, // Bloque de nivel
  levelTitle: { fontWeight: '700', marginBottom: 6 }, // Título de nivel
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, // Fila de niveles
  tag: { backgroundColor: '#BFDBFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginRight: 6, marginBottom: 6 }, // Etiqueta normal
  tagDone: { backgroundColor: '#BBF7D0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginRight: 6, marginBottom: 6 }, // Etiqueta completada
  tagText: { color: '#1E3A8A' }, // Texto de etiqueta normal
  tagTextDone: { color: '#14532D', textDecorationLine: 'line-through' }, // Texto de etiqueta completada
  centerText: { textAlign: 'center', color: '#6B7280', paddingVertical: 24 }, // Texto centrado
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 }, // Fondo del modal
  modalContent: { backgroundColor: '#fff', borderRadius: 8, padding: 16 }, // Contenido del modal
  h2: { fontSize: 18, fontWeight: '700', marginBottom: 8 }, // Título secundario
  spaceY: { gap: 12 }, // Espaciado vertical
  label: { color: '#374151', marginBottom: 6 }, // Etiqueta de campo
  input: { borderWidth: 1, borderColor: '#D1D5DB', padding: 10, borderRadius: 8, backgroundColor: '#fff' }, // Input de texto
  textarea: { minHeight: 80, textAlignVertical: 'top' }, // Área de texto
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' }, // Texto de botón
  flex1: { flex: 1, marginRight: 8 }, // Flex 1 con margen
  nodeRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8 }, // Fila de nodo
  rootNode: { backgroundColor: '#6366F1' }, // Nodo raíz (morado)
  completedNode: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#BBF7D0' }, // Nodo completado (verde claro)
  normalNode: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' }, // Nodo normal (gris claro)
  iconButton: { padding: 6, borderRadius: 6 }, // Botón de icono
  iconText: { color: '#4B5563' }, // Texto de icono normal
  iconTextWhite: { color: '#fff' }, // Texto de icono blanco (para raíz)
  nodeTitle: { fontWeight: '700' }, // Título del nodo
  lineThrough: { textDecorationLine: 'line-through' }, // Texto tachado para tareas completadas
  desc: { color: '#6B7280' }, // Descripción normal (gris)
  descRoot: { color: '#E0E7FF' }, // Descripción de la raíz (azul claro)
  subCount: { fontSize: 12, color: '#6B7280' }, // Contador de subtareas normal
  subCountRoot: { fontSize: 12, color: '#C7D2FE' }, // Contador de subtareas de la raíz
  actionsRow: { flexDirection: 'row', gap: 6, marginLeft: 8 }, // Fila de botones de acción
  actionButton: { padding: 6, borderRadius: 6, marginLeft: 6 }, // Botón de acción individual
});