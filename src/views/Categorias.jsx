import React, { useState, useEffect } from "react";
import { Container, Button, Col } from "react-bootstrap"; // Añadido Col
import { db } from "../database/firebaseconfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

// Importaciones de componentes personalizados
import TablaCategorias from "../components/categorias/TablaCategorias";
import ModalRegistroCategoria from "../components/categorias/ModalRegistroCategoria";
import ModalEdicionCategoria from "../components/categorias/ModalEdicionCategoria";
import ModalEliminacionCategoria from "../components/categorias/ModalEliminacionCategoria";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";
import ChatIA from "../components/chat/ChatIA";

const Categorias = () => {
  // Estados para manejo de datos
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombre: "",
    descripcion: "",
  });
  const [categoriaEditada, setCategoriaEditada] = useState(null);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [showChatModal, setShowChatModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null); // Estado para manejar errores
  const itemsPerPage = 5; // Número de productos por página

  // Referencia a la colección de categorías en Firestore
  const categoriasCollection = collection(db, "categorias");

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setError(null); // Limpiar error al volver a estar online
    };
    const handleOffline = () => {
      setIsOffline(true);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Función para obtener todas las categorías de Firestore
  const fetchCategorias = () => {
    const stopListening = onSnapshot(
      categoriasCollection,
      (snapshot) => {
        const fetchedCategorias = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setCategorias(fetchedCategorias);
        setCategoriasFiltradas(fetchedCategorias);
        setError(null); // Limpiar error si la carga es exitosa
        console.log("Categorías cargadas desde Firestore:", fetchedCategorias);
        if (isOffline) {
          console.log("Offline: Mostrando datos desde la caché local.");
        }
      },
      (error) => {
        console.error("Error al escuchar categorías:", error);
        if (isOffline) {
          console.log("Offline: Mostrando datos desde la caché local.");
        } else {
          setError("Error al cargar las categorías: " + error.message);
        }
      }
    );
    return stopListening;
  };

  // Hook useEffect para carga inicial y escucha de datos
  useEffect(() => {
    const cleanupListener = fetchCategorias();
    return () => cleanupListener();
  }, []);

  // Calcular productos paginados
  const paginatedCategorias = categoriasFiltradas.length
    ? categoriasFiltradas.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : [];

  const handleSearchChange = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);

    const filtradas = categorias.filter(
      (categoria) =>
        categoria.nombre.toLowerCase().includes(text) ||
        categoria.descripcion.toLowerCase().includes(text)
    );

    setCategoriasFiltradas(filtradas);
    setCurrentPage(1); // Resetear página al buscar
  };

  // Manejador de cambios en inputs del formulario de nueva categoría
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaCategoria((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejador de cambios en inputs del formulario de edición
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setCategoriaEditada((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Función para agregar una nueva categoría (CREATE)
  const handleAddCategoria = async () => {
    // Validar campos requeridos
    if (!nuevaCategoria.nombre || !nuevaCategoria.descripcion) {
      alert("Por favor, completa todos los campos antes de guardar.");
      return;
    }

    // Validación adicional: longitud mínima
    if (nuevaCategoria.nombre.length < 3) {
      alert("El nombre de la categoría debe tener al menos 3 caracteres.");
      return;
    }

    // Cerrar modal
    setShowModal(false);

    // Crear ID temporal para offline y objeto de categoría
    const tempId = `temp_${Date.now()}`;
    const categoriaConId = { ...nuevaCategoria, id: tempId };

    try {
      // Actualizar estado local para reflejar la nueva categoría
      setCategorias((prev) => [...prev, categoriaConId]);
      setCategoriasFiltradas((prev) => [...prev, categoriaConId]);

      // Limpiar campos del formulario
      setNuevaCategoria({ nombre: "", descripcion: "" });

      // Intentar guardar en Firestore
      await addDoc(categoriasCollection, nuevaCategoria);

      // Mensaje según estado de conexión
      if (isOffline) {
        alert("Sin conexión: Categoría almacenada localmente. Se sincronizará cuando haya internet.");
      } else {
        console.log("Categoría agregada exitosamente en la nube.");
      }
    } catch (error) {
      console.error("Error al agregar la categoría:", error);

      // Manejar error según estado de conexión
      if (isOffline) {
        console.log("Offline: Categoría almacenada localmente.");
      } else {
        // Revertir cambios locales si falla en la nube
        setCategorias((prev) => prev.filter((cat) => cat.id !== tempId));
        setCategoriasFiltradas((prev) => prev.filter((cat) => cat.id !== tempId));
        alert("Error al agregar la categoría: " + error.message);
      }
    }
  };

  // Función para actualizar una categoría existente (UPDATE)
  const handleEditCategoria = async () => {
    if (!categoriaEditada?.nombre || !categoriaEditada?.descripcion) {
      alert("Por favor, completa todos los campos antes de actualizar.");
      return;
    }

    // Validación adicional: longitud mínima
    if (categoriaEditada.nombre.length < 3) {
      alert("El nombre de la categoría debe tener al menos 3 caracteres.");
      return;
    }

    setShowEditModal(false);

    const categoriaRef = doc(db, "categorias", categoriaEditada.id);

    try {
      // Intentar actualizar en Firestore
      await updateDoc(categoriaRef, {
        nombre: categoriaEditada.nombre,
        descripcion: categoriaEditada.descripcion,
      });

      if (isOffline) {
        // Actualizar estado local inmediatamente si no hay conexión
        setCategorias((prev) =>
          prev.map((cat) =>
            cat.id === categoriaEditada.id ? { ...categoriaEditada } : cat
          )
        );
        setCategoriasFiltradas((prev) =>
          prev.map((cat) =>
            cat.id === categoriaEditada.id ? { ...categoriaEditada } : cat
          )
        );
        alert("Sin conexión: Categoría actualizada localmente. Se sincronizará cuando haya internet.");
      } else {
        console.log("Categoría actualizada exitosamente en la nube.");
      }
    } catch (error) {
      console.error("Error al actualizar la categoría:", error);
      setCategorias((prev) =>
        prev.map((cat) =>
          cat.id === categoriaEditada.id ? { ...categoriaEditada } : cat
        )
      );
      setCategoriasFiltradas((prev) =>
        prev.map((cat) =>
          cat.id === categoriaEditada.id ? { ...categoriaEditada } : cat
        )
      );
      alert("Ocurrió un error al actualizar la categoría: " + error.message);
    }
  };

  // Función para eliminar una categoría (DELETE)
  const handleDeleteCategoria = async () => {
    if (!categoriaAEliminar) return;

    // Cerrar modal
    setShowDeleteModal(false);

    try {
      // Actualizar estado local para reflejar la eliminación
      setCategorias((prev) => prev.filter((cat) => cat.id !== categoriaAEliminar.id));
      setCategoriasFiltradas((prev) =>
        prev.filter((cat) => cat.id !== categoriaAEliminar.id)
      );

      // Intentar eliminar en Firestore
      const categoriaRef = doc(db, "categorias", categoriaAEliminar.id);
      await deleteDoc(categoriaRef);

      // Mensaje según estado de conexión
      if (isOffline) {
        alert("Sin conexión: Categoría eliminada localmente. Se sincronizará cuando haya internet.");
      } else {
        console.log("Categoría eliminada exitosamente en la nube.");
      }
    } catch (error) {
      console.error("Error al eliminar la categoría:", error);

      // Manejar error según estado de conexión
      if (isOffline) {
        console.log("Offline: Eliminación almacenada localmente.");
      } else {
        // Restaurar categoría en estado local si falla en la nube
        setCategorias((prev) => [...prev, categoriaAEliminar]);
        setCategoriasFiltradas((prev) => [...prev, categoriaAEliminar]);
        alert("Error al eliminar la categoría: " + error.message);
      }
    }
  };

  // Función para abrir el modal de edición con datos prellenados
  const openEditModal = (categoria) => {
    setCategoriaEditada({ ...categoria });
    setShowEditModal(true);
  };

  // Función para abrir el modal de eliminación
  const openDeleteModal = (categoria) => {
    setCategoriaAEliminar(categoria);
    setShowDeleteModal(true);
  };

  // Renderizado del componente
  return (
    <Container className="mt-5">
      <br />
      <h4>Gestión de Categorías</h4>
      {error && <div className="alert alert-danger">{error}</div>}
      <Button className="mb-3" onClick={() => setShowModal(true)}>
        Agregar categoría
      </Button>

      <Col lg={3} md={4} sm={4} xs={5}>
        <Button
          className="mb-3"
          onClick={() => setShowChatModal(true)}
          style={{ width: "100%" }}
        >
          Chat IA
        </Button>
      </Col>

      <CuadroBusquedas
        searchText={searchText}
        handleSearchChange={handleSearchChange}
      />

      <TablaCategorias
        openEditModal={openEditModal}
        openDeleteModal={openDeleteModal}
        categorias={paginatedCategorias} // Pasar productos paginados
        totalItems={categoriasFiltradas.length} // Total de productos
        itemsPerPage={itemsPerPage} // Elementos por página
        currentPage={currentPage} // Página actual
        setCurrentPage={setCurrentPage} // Método para cambiar página
      />
      <Paginacion
        itemsPerPage={itemsPerPage}
        totalItems={categoriasFiltradas.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <ModalRegistroCategoria
        showModal={showModal}
        setShowModal={setShowModal}
        nuevaCategoria={nuevaCategoria}
        handleInputChange={handleInputChange}
        handleAddCategoria={handleAddCategoria}
      />
      <ModalEdicionCategoria
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        categoriaEditada={categoriaEditada}
        handleEditInputChange={handleEditInputChange}
        handleEditCategoria={handleEditCategoria}
      />
      <ModalEliminacionCategoria
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDeleteCategoria={handleDeleteCategoria}
      />
      <ChatIA showChatModal={showChatModal} setShowChatModal={setShowChatModal} />
    </Container>
  );
};

export default Categorias;