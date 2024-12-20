import './App.scss';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import Blog from "./components/Blog";
import React from "react";
import IntegrationTestsContainersBlog from './components/Blog/Posts/IntegrationTestsContrainers'

function App() {
  return (
    <>
      <Routes>
        <Route path="/react-portfolio-cv" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path='/react-portfolio-cv/about' element={<About />} />
            <Route path='/react-portfolio-cv/contact' element={<Contact />} />
            <Route path='/react-portfolio-cv/blog' element={<Blog />} />
            <Route path='/react-portfolio-cv/integration-test-blog' element={<IntegrationTestsContainersBlog />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
