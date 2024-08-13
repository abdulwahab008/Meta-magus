import React, { useState } from 'react';
import { ResizableBox } from 'react-resizable';
import FileExplorer from './FileExplorer';
import Terminal from './Terminal';
import AdvancedNavbar from './AdvancedNavbar';
import './index.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube, faPlay, faBars, faChartSimple, faPrescriptionBottle, faFolderTree, faCircle, faEye, faRing, faUpload, faTerminal, faRuler, faFileUpload, faFlask, faShapes, faSwatchbook } from '@fortawesome/free-solid-svg-icons';

const ContentArea = ({ content }) => {
  return (
      <div className="content-area">
          <div className="blank-area">
              {console.log('Rendering ContentArea with content:', content)}

              {!content ? (
                  <>
                      {console.warn('ContentArea received null content.')}
                      <p>No content uploaded.</p>
                  </>
              ) : (
                  (() => {
                      switch (content.type) {
                          case 'text':
                              return <pre><code>{content.content}</code></pre>;
                          case 'image':
                              return (
                                  <div>
                                    <h2>Absorbtion Model Prediction Results</h2>
                                      <img src={content.content} alt="file content" />
                                      {/* <p>{content.isBinary ? 'The image is binary.' : 'The image is not binary.'}</p> */}
                                  </div>
                              );
                          case 'model1Prediction': 
                              return (
                                  <div>
                                      <h2>Transmission Model Prediction Results</h2>
                                      <img src={`data:image/png;base64,${content.plot_url}`} alt="Model 1 prediction graph" />
                                      <pre>{JSON.stringify(content.prediction, null, 2)}</pre>
                                  </div>
                              );
                          case 'model2Prediction': 
                              return (
                                <div>
                                <h2>Inverse Model Prediction Results</h2>
                                <div className="prediction-images">
                                      <img src={`data:image/png;base64,${content.plot_url}`} alt="CSV graph" />
                                      <img src={`data:image/png;base64,${content.prediction_plot_url}`} alt="Model 2 prediction graph" />
                                      {/* <pre>{JSON.stringify(content.prediction, null, 2)}</pre> */}
                                  </div>
                                  </div>
                              );
                          default:
                              console.error('Unsupported content type:', content.type);
                              return <div>Unsupported content type.</div>;
                      }
                  })()
              )}
          </div>
      </div>
  );
};


const FormDataDisplay = ({ formData }) => {
  console.log('Rendering FormDataDisplay with formData:', formData);

  const tabNames = {
    structureModeling: "Structure Modeling",
    geometrySelection: "Geometry Selection:",
    result: "Result",
    materialType: "Material Type",
    operatingWavelength: "Operating Wavelength",
    simulationModeling:"Simulation Modeling",
    structureDesign: "Structure Design",
    view: "View",
    resonater: "Resonater Material",
    substrate: "Substrate"
  };

  const getIcon = (shape) => {
    switch (shape) {
      case 'bar': return <FontAwesomeIcon icon={faChartSimple} />;
      case 'cylinder': return <FontAwesomeIcon icon={faPrescriptionBottle} />;
      case 'circular': return <FontAwesomeIcon icon={faCircle} />;
      case 'circularRing': return <FontAwesomeIcon icon={faRing} />;
      default: return null;
    }
  };

  return (
    <div className="form-data-display">
      {formData.activeMainTab && <h3>{tabNames[formData.activeMainTab] || formData.activeMainTab}</h3>}
      {formData.activeSubTab && (
        <h4>
          {tabNames[formData.activeSubTab] || formData.activeSubTab}
          {formData.activeSubTab === 'geometrySelection' && formData.activeGeometryShape && (
            <span>&nbsp; {getIcon(formData.activeGeometryShape)}&nbsp;{formData.activeGeometryShape}</span>
          )}
        </h4>
      )}
      {formData.activeMaterialType && <h4>{formData.activeMaterialType}</h4>}
      <table>
        <thead>
          <tr>
            <th>Geometry</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(formData).map(([key, value]) => {
            if (['height', 'width', 'length', 'period', 'n', 'k', 'lambda'].includes(key) && value !== '') {
              return (
                <tr key={key}>
                  <td>{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                  <td>{value}</td>
                </tr>
              );
            }
            return null;
          })}
        </tbody>
      </table>
    </div>
  );
};


const App = () => {
  const [fileContent, setFileContent] = useState(null);
  const [resultContent, setResultContent] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [activeTab, setActiveTab] = useState('simulationModeling');
  const [formData, setFormData] = useState({});

  console.log('Rendering App component');

  const toggleTerminal = () => {
    setShowTerminal(!showTerminal);
    console.log('Toggled Terminal:', !showTerminal);
  };

  const handleFileUpload = (content) => {
    setFileContent(content);
    console.log('File uploaded:', content);
    if (activeTab === 'result') {
      setResultContent(content);
      console.log('Set result content after file upload:', content);
    }
  };
  
  const handleTabChange = (tab) => {
    console.log('Tab changed to:', tab);
    if (tab === 'simulationModeling' && activeTab === 'result') {
      window.location.reload();
      console.log('Reloading page as tab changed to simulationModeling from result');
    } else {
      setActiveTab(tab);
      console.log('Active tab set to:', tab);
    }
  };

  const handleGraphPredictionModel1 = (content) => {
    console.log('Received Model 1 prediction content:', content);
    setResultContent({
        type: 'model1Prediction', 
        plot_url: content.plot_url,
        prediction: content.prediction,
    });
    setActiveTab('result');
};

const handleGraphPredictionModel2 = (content) => {
  console.log('Received Model 2 prediction content:', content);
  setResultContent({
      type: 'model2Prediction',
      plot_url: content.plot_url, 
      prediction_plot_url: content.prediction_plot_url, 
      prediction: content.inversePrediction,
  });
  setActiveTab('result');
};



  const handleFormDataSubmit = (data) => {
    setFormData(data);
    console.log('Form data submitted:', data);
  };

  return (
    <div className="app">
      <AdvancedNavbar
        onTerminalToggle={toggleTerminal}
        onFileUpload={handleFileUpload}
        handleGraphPredictionModel1={handleGraphPredictionModel1}
        handleGraphPredictionModel2={handleGraphPredictionModel2}
        onTabChange={handleTabChange}
        onFormDataSubmit={handleFormDataSubmit}
      />

      <div className="main">
        <ResizableBox
          width={leftPanelWidth}
          height={Infinity}
          minConstraints={[100, Infinity]}
          maxConstraints={[500, Infinity]}
          onResize={(e, data) => {
            setLeftPanelWidth(data.size.width);
            console.log('Left panel resized to width:', data.size.width);
          }}
          handle={<div className="resize-handle-x" />}
          axis="x"
        >
          <FormDataDisplay formData={formData} />
        </ResizableBox>

        <ContentArea content={activeTab === 'result' ? resultContent : fileContent} />
      </div>

      {showTerminal && (
        <ResizableBox
          width={Infinity}
          height={terminalHeight}
          minConstraints={[100, Infinity]}
          maxConstraints={[400, Infinity]}
          onResize={(e, data) => {
            setTerminalHeight(data.size.height);
            console.log('Terminal resized to height:', data.size.height);
          }}
          handle={<div className="resize-handle-y" />}
          axis="y"
        >
          <Terminal onClose={() => setShowTerminal(false)} />
        </ResizableBox>
      )}
    </div>
  );
};

export default App;