// Importaciones
import React, { useState, useEffect } from "react";
import { Container, Button, Row, Col } from "react-bootstrap";
import { db } from "../database/firebaseconfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import TablaProductos from "../components/productos/TablaProductos";
import ModalRegistroProducto from "../components/productos/ModalRegistroProducto";
import ModalEdicionProducto from "../components/productos/ModalEdicionProducto";
import ModalEliminacionProducto from "../components/productos/ModalEliminacionProducto";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx"; // Corrección del nombre de importación
import { saveAs } from "file-saver";

const Productos = () => {
  // Estados para manejo de datos
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    precio: "",
    categoria: "",
    imagen: "",
  });
  const [productoEditado, setProductoEditado] = useState(null);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Número de productos por página
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Referencia a las colecciones en Firestore
  const productosCollection = collection(db, "productos");
  const categoriasCollection = collection(db, "categorias");

  // Manejo de conexión offline/online
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Función para obtener todas las categorías y productos de Firestore
  const fetchData = () => {
    const unsubscribeProductos = onSnapshot(
      productosCollection,
      (snapshot) => {
        const fetchedProductos = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setProductos(fetchedProductos);
        setProductosFiltrados(fetchedProductos);
        if (isOffline) console.log("Offline: Productos cargados desde caché local.");
      },
      (error) => {
        console.error("Error al escuchar productos:", error);
        if (isOffline) console.log("Offline: Mostrando datos desde caché local.");
        else alert("Error al cargar productos: " + error.message);
      }
    );

    const unsubscribeCategorias = onSnapshot(
      categoriasCollection,
      (snapshot) => {
        const fetchedCategorias = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setCategorias(fetchedCategorias);
        if (isOffline) console.log("Offline: Categorías cargadas desde caché local.");
      },
      (error) => {
        console.error("Error al escuchar categorías:", error);
        if (isOffline) console.log("Offline: Mostrando categorías desde caché local.");
        else alert("Error al cargar categorías: " + error.message);
      }
    );

    return () => {
      unsubscribeProductos();
      unsubscribeCategorias();
    };
  };

  // Hook useEffect para carga inicial de datos
  useEffect(() => {
    fetchData();
  }, []);

  // Calcular productos paginados
  const paginatedProductos = productosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Manejador de búsqueda
  const handleSearchChange = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);
    const filtrados = productos.filter((producto) =>
      producto.nombre.toLowerCase().includes(text) ||
      producto.categoria.toLowerCase().includes(text) ||
      producto.precio.toString().toLowerCase().includes(text)
    );
    setProductosFiltrados(filtrados);
  };

  // Manejadores de cambios en formularios
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoProducto((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setProductoEditado((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNuevoProducto((prev) => ({ ...prev, imagen: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductoEditado((prev) => ({ ...prev, imagen: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // CRUD Operations
  const handleAddProducto = async () => {
    if (
      !nuevoProducto.nombre ||
      !nuevoProducto.precio ||
      !nuevoProducto.categoria ||
      !nuevoProducto.imagen
    ) {
      alert("Por favor, completa todos los campos, incluyendo la imagen.");
      return;
    }

    setShowModal(false);
    const tempId = `temp_${Date.now()}`;
    const productoConId = {
      ...nuevoProducto,
      id: tempId,
      precio: parseFloat(nuevoProducto.precio),
    };

    try {
      setProductos((prev) => [...prev, productoConId]);
      setProductosFiltrados((prev) => [...prev, productoConId]);
      if (isOffline) {
        console.log("Producto agregado localmente (sin conexión).");
        alert("Sin conexión: Producto agregado localmente. Se sincronizará al reconectar.");
      } else {
        console.log("Producto agregado exitosamente en la nube.");
      }

      await addDoc(productosCollection, {
        nombre: nuevoProducto.nombre,
        precio: parseFloat(nuevoProducto.precio),
        categoria: nuevoProducto.categoria,
        imagen: nuevoProducto.imagen,
      });

      setNuevoProducto({ nombre: "", precio: "", categoria: "", imagen: "" });
    } catch (error) {
      console.error("Error al agregar el producto:", error);
      if (isOffline) console.log("Offline: Producto almacenado localmente.");
      else {
        setProductos((prev) => prev.filter((prod) => prod.id !== tempId));
        setProductosFiltrados((prev) => prev.filter((prod) => prod.id !== tempId));
        alert("Error al agregar el producto: " + error.message);
      }
    }
  };

  const handleEditProducto = async () => {
    if (
      !productoEditado.nombre ||
      !productoEditado.precio ||
      !productoEditado.categoria ||
      !productoEditado.imagen
    ) {
      alert("Por favor, completa todos los campos, incluyendo la imagen.");
      return;
    }

    setShowEditModal(false);
    const productoRef = doc(db, "productos", productoEditado.id);

    try {
      setProductos((prev) =>
        prev.map((prod) =>
          prod.id === productoEditado.id
            ? { ...productoEditado, precio: parseFloat(productoEditado.precio) }
            : prod
        )
      );
      setProductosFiltrados((prev) =>
        prev.map((prod) =>
          prod.id === productoEditado.id
            ? { ...productoEditado, precio: parseFloat(productoEditado.precio) }
            : prod
        )
      );

      if (isOffline) {
        console.log("Producto actualizado localmente (sin conexión).");
        alert("Sin conexión: Producto actualizado localmente. Se sincronizará al reconectar.");
      } else {
        console.log("Producto actualizado exitosamente en la nube.");
      }

      await updateDoc(productoRef, {
        nombre: productoEditado.nombre,
        precio: parseFloat(productoEditado.precio),
        categoria: productoEditado.categoria,
        imagen: productoEditado.imagen,
      });
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      if (isOffline) console.log("Offline: Producto actualizado localmente.");
      else {
        setProductos((prev) =>
          prev.map((prod) => (prod.id === productoEditado.id ? { ...prod } : prod))
        );
        setProductosFiltrados((prev) =>
          prev.map((prod) => (prod.id === productoEditado.id ? { ...prod } : prod))
        );
        alert("Error al actualizar el producto: " + error.message);
      }
    }
  };

  const handleDeleteProducto = async () => {
    if (!productoAEliminar) return;

    setShowDeleteModal(false);

    try {
      setProductos((prev) => prev.filter((prod) => prod.id !== productoAEliminar.id));
      setProductosFiltrados((prev) => prev.filter((prod) => prod.id !== productoAEliminar.id));

      if (isOffline) {
        console.log("Producto eliminado localmente (sin conexión).");
        alert("Sin conexión: Producto eliminado localmente. Se sincronizará al reconectar.");
      } else {
        console.log("Producto eliminado exitosamente en la nube.");
      }

      const productoRef = doc(db, "productos", productoAEliminar.id);
      await deleteDoc(productoRef);
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      if (isOffline) console.log("Offline: Eliminación almacenada localmente.");
      else {
        setProductos((prev) => [...prev, productoAEliminar]);
        setProductosFiltrados((prev) => [...prev, productoAEliminar]);
        alert("Error al eliminar el producto: " + error.message);
      }
    }
  };

  // Funciones para modales
  const openEditModal = (producto) => {
    setProductoEditado({ ...producto });
    setShowEditModal(true);
  };

  const openDeleteModal = (producto) => {
    setProductoAEliminar(producto);
    setShowDeleteModal(true);
  };

  // Función para copiar datos al portapapeles
  const handleCopy = (producto) => {
    const rowData = `Nombre: ${producto.nombre}\nPrecio: C$${producto.precio}\nCategoría: ${producto.categoria}`;
    navigator.clipboard
      .writeText(rowData)
      .then(() => console.log("Datos de la fila copiados al portapapeles:\n" + rowData))
      .catch((err) => console.error("Error al copiar al portapapeles:", err));
  };

  // Generar PDF de todos los productos
  const generarPDFProductos = () => {
    const doc = new jsPDF();
    // Encabezado
    doc.setFillColor(28, 41, 51);
    doc.rect(0, 0, 220, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text("Lista de Productos", doc.internal.pageSize.getWidth() / 2, 18, { align: "center" });

    // Configuración de la tabla
    const columnas = ["#", "Nombre", "Precio", "Categoría"];
    const filas = productosFiltrados.map((producto, index) => [
      index + 1,
      producto.nombre,
      `C$${producto.precio}`,
      producto.categoria,
    ]);

    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 40,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      margins: { top: 30, left: 14, right: 14 },
      tableWidth: "auto",
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: "auto" },
        2: { cellWidth: "auto" },
      },
      pageBreak: "auto",
      didDrawPage: (data) => {
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const pageNumber = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const footerText = `Página ${pageNumber} de {total_pages_count_string}`;
        doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });
      },
    });

    // Actualizar el total de páginas
    if (typeof doc.putTotalPages === "function") {
      doc.putTotalPages("{total_pages_count_string}");
    }

    // Guardar el PDF
    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    const nombreArchivo = `productos_${anio}-${mes}-${dia}.pdf`;
    doc.save(nombreArchivo);
  };

  // Generar PDF de un producto específico
  const generarPDFDetalleProducto = (producto) => {
    const pdf = new jsPDF();
    // Encabezado
    pdf.setFillColor(28, 41, 51);
    pdf.rect(0, 0, 220, 30, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.text("Detalle del Producto", pdf.internal.pageSize.getWidth() / 2, 18, { align: "center" });

    // Imagen centrada (si existe)
    let startY = 40;
    if (producto.imagen) {
      const imgProps = pdf.getImageProperties(producto.imagen);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = imgProps.width * 0.75;
      const imgHeight = 60;
      const x = (pageWidth - imgWidth) / 2;
      pdf.addImage(producto.imagen, "JPEG", x, startY, imgWidth, imgHeight);
      startY += imgHeight + 10;
    }

    // Datos centrados
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.text(`Precio: C$${producto.precio}`, pdf.internal.pageSize.getWidth() / 2, startY, { align: "center" });
    pdf.text(`Categoría: ${producto.categoria}`, pdf.internal.pageSize.getWidth() / 2, startY + 10, { align: "center" });

    // Guardar el PDF
    pdf.save(`${producto.nombre}.pdf`);
  };

  // Exportar a Excel
  const exportarExcelProductos = () => {
    const data = productosFiltrados.map((producto, index) => ({
      "#": index + 1,
      Nombre: producto.nombre,
      Precio: parseFloat(producto.precio),
      Categoría: producto.categoria,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();
    const nombreArchivo = `productos_${dia}-${mes}-${anio}.xlsx`;

    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, nombreArchivo);
  };

  // Renderizado del componente
  return (
    <Container className="mt-5">
      <br />
      <h4>Gestión de Productos</h4>
      <Row className="mb-3">
        <Col lg={3} md={4} sm={4} xs={5}>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Agregar producto
          </Button>
        </Col>
        <Col lg={3} md={4} sm={4} xs={5}>
          <Button variant="secondary" onClick={generarPDFProductos}>
            Generar reporte PDF
          </Button>
        </Col>
        <Col lg={3} md={4} sm={4} xs={5}>
          <Button variant="secondary" onClick={exportarExcelProductos}>
            Generar Excel
          </Button>
        </Col>
      </Row>
      <CuadroBusquedas searchText={searchText} handleSearchChange={handleSearchChange} />
      <TablaProductos
        openEditModal={openEditModal}
        openDeleteModal={openDeleteModal}
        productos={paginatedProductos}
        totalItems={productos.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        handleCopy={handleCopy}
        generarPDFDetalleProducto={generarPDFDetalleProducto}
      />
      <Paginacion
        itemsPerPage={itemsPerPage}
        totalItems={productosFiltrados.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <ModalRegistroProducto
        showModal={showModal}
        setShowModal={setShowModal}
        nuevoProducto={nuevoProducto}
        handleInputChange={handleInputChange}
        handleImageChange={handleImageChange}
        handleAddProducto={handleAddProducto}
        categorias={categorias}
      />
      <ModalEdicionProducto
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        productoEditado={productoEditado}
        handleEditInputChange={handleEditInputChange}
        handleEditImageChange={handleEditImageChange}
        handleEditProducto={handleEditProducto}
        categorias={categorias}
      />
      <ModalEliminacionProducto
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        handleDeleteProducto={handleDeleteProducto}
      />
    </Container>
  );
};

export default Productos;