import './App.scss';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import Blog from "./components/Blog";
import React from "react";
import IntegrationTestsContainersBlog from './components/Blog/Posts/IntegrationTestsContrainers'
import AiBugFixingPipelineBlog from './components/Blog/Posts/AiBugFixingPipeline'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path='/about' element={<About />} />
            <Route path='/contact' element={<Contact />} />
            <Route path='/blog' element={<Blog />} />
            <Route path='/integration-test-blog' element={<IntegrationTestsContainersBlog />} />
            <Route path='/ai-bug-fixing-pipeline-blog' element={<AiBugFixingPipelineBlog />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
