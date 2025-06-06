import React from "react";
import { Table, Button, Image } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const TablaProductos = ({ productos, openEditModal, openDeleteModal, handleCopy, generarPDFDetalleProducto}) => {
  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Nombre</th>
          <th>Precio</th>
          <th>Categoría</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {productos.map((producto) => (
          <tr key={producto.id}>
            <td>
              {producto.imagen && (
                <Image src={producto.imagen} width="120" height="50" />
              )}
            </td>
            <td>{producto.nombre}</td>
            <td>C$  {producto.precio}</td>
            <td>{producto.categoria}</td>
            <td>
              <Button
                variant="outline-warning"
                size="sm"
                className="me-2"
                onClick={() => openEditModal(producto)}
              >
                <i className="bi bi-pencil"></i>
              </Button>
              <Button
              variant="outline-success"
              size="sm"
              className="me-2"
              onClick={() => generarPDFDetalleProducto(producto)}
              >
                <i className="bi bi-file-earmark-pdf"></i>  
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => openDeleteModal(producto)}
              >
                <i className="bi bi-trash"></i>
              </Button>
              <Button
              variant="outline-info"
              size="sm"
              onClick={() => handleCopy(producto)}
              >
                <i className="bi bi-clipboard"></i>
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default TablaProductos;
