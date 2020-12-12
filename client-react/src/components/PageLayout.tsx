import React from 'react';
import { Col, Container, FormControl, Nav, Navbar, NavDropdown, Row } from 'react-bootstrap';
import Navigation from './Navigation';
import './Navigation.css';

const PageLayout = (props: any): JSX.Element => {
  return (
    <Container fluid className="bg-light">
      <Navbar className="d-lg-none" sticky="top" bg="light" expand="lg" collapseOnSelect={true}>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Brand href="#home">
          <img
            alt=""
            src="https://i.imgur.com/w7YI2Q8.png?1"
            width="30"
            height="30"
            className="d-inline-block align-top"
          />{' '}
          WE
        </Navbar.Brand>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Navigation />
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Row >
        <Col className='d-none d-lg-block' lg={2} style={{ paddingLeft: '0' }}>
          <Navigation />
        </Col>
        <Col lg={10} >{props.children}</Col>
      </Row>
    </Container>
  );
};

export default PageLayout;
