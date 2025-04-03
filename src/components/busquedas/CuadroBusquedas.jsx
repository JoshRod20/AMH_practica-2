import React from "react";
import { InputGroup, Form } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import InputGroupText from "react-bootstrap/esm/InputGroupText";

const CuadroBusquedas = ({ searchText, handleSearchChange }) => {
  return (
    <InputGroup className="mb-3" style={{ width: "400px" }}>
      <InputGroupText>
        <i className="bi bi-search"></i>
      </InputGroupText>
      <Form.Control
        type="text"
        placeholder="Buscar..."
        value={searchText}
        onChange={handleSearchChange}
      />
    </InputGroup>
  );
};

export default CuadroBusquedas;
