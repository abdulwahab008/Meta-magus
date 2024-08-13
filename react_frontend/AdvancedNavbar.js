import React, { useState, useEffect } from 'react';
import './AdvancedNavbar.css';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube, faPlay, faBars, faChartSimple, faPrescriptionBottle, faFolderTree, faCircle, faEye, faRing, faUpload, faTerminal, faRuler, faFileUpload, faFlask, faShapes, faSwatchbook } from '@fortawesome/free-solid-svg-icons';

const AdvancedNavbar = ({ onTerminalToggle, onFileUpload, handleGraphPredictionModel1,handleGraphPredictionModel2, onFormDataSubmit }) => {
  const [activeMainTab, setActiveMainTab] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('');
  const [activeMaterialType, setActiveMaterialType] = useState('');
  const [activeResonatorMaterial, setActiveResonatorMaterial] = useState('');
  const [activeGeometryShape, setActiveGeometryShape] = useState('');
  const [activeResultOption, setActiveResultOption] = useState('');
  const [showStructureDesignRow, setShowStructureDesignRow] = useState(false);
  const [formData, setFormData] = useState({
    height: '',
    width: '',
    length: '',
    period: '',
    n: '',
    k: '',
    lambda: ''
  });
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resultContent, setResultContent] = useState(null);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    onFormDataSubmit({
      activeMainTab,
      activeSubTab,
      activeMaterialType,
      activeGeometryShape,
      ...formData
    });
  }, [activeMainTab, activeSubTab, activeMaterialType, activeGeometryShape,activeResonatorMaterial, formData]);

  const handleMainTabClick = (tab) => {
    if (tab === 'simulationModeling' && activeMainTab === 'result') {
      window.location.reload();
    } else {
      setActiveMainTab(tab);
      setActiveSubTab('');
      setActiveGeometryShape('');
      setActiveMaterialType('');
      setActiveResonatorMaterial('');
      setActiveResultOption('');
    }
    if (tab === 'structureDesign') {
      setShowStructureDesignRow(!showStructureDesignRow);
    } else {
      setShowStructureDesignRow(false);
    }
  };

  const handleSubTabClick = (tab) => {
    setActiveSubTab(tab);
    setActiveGeometryShape('');
    setActiveResonatorMaterial('');
    setActiveMaterialType('');
  };


  const handleMaterialTypeClick = (type) => {
    setActiveMaterialType(type);
    setActiveResonatorMaterial('');
  };
  const handleResonatorMaterialClick = (material) => {
    setActiveResonatorMaterial(material);
  };
  const handleGeometryShapeClick = (shape) => {
    setActiveGeometryShape(shape);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrorMessage('');  
  };
  const handleFileUpload = async () => {
    if (!file) return;

    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
     
      const axiosResponse = await axios.post('http://127.0.0.1:5000/upload', formData);
      const imageDataUrl = `data:image/png;base64,${axiosResponse.data.img_data}`;
      onFileUpload({ type: 'image', content: imageDataUrl, isBinary: axiosResponse.data.is_binary });
      setActiveMainTab('result'); 
    } catch (error) {
      console.error('Error uploading file:', error.response ? error.response.data : error.message);
    } finally {
      setIsLoading(false);
    }
  };



  const handlePredict = async () => {
    setIsLoading(true);
    console.log('Form Data:', formData);
    try {
        const form = new FormData();
        Object.keys(formData).forEach(key => {
            form.append(key, formData[key]);
        });

       
        for (let [key, value] of form.entries()) {
            console.log(`${key}: ${value}`);
        }

        const response = await axios.post('http://127.0.0.1:5000/predict', form);
        console.log('Prediction Response:', response.data);

        handleGraphPredictionModel1({
            type: 'graph',
            plot_url: response.data.plot_url,
            prediction: response.data.prediction
        });

        onFormDataSubmit(formData);  
        setActiveMainTab('result');
    } catch (error) {
        console.error('Error during prediction:', error);
        if (error.response && error.response.data) {
            console.error('Error details:', error.response.data);
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handlePredictInverse = async () => {
    if (!file) return;

    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
       
        const graphResponse = await axios.post('http://127.0.0.1:5000/csv_graph', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (graphResponse.status !== 200) {
            setErrorMessage(graphResponse.data.error || 'An error occurred while generating the graph.');
            return;
        }

        const graphData = graphResponse.data;
        console.log('CSV Graph data received:', graphData);

   
        const predictionResponse = await axios.post('http://127.0.0.1:5000/predict_inverse', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (predictionResponse.status !== 200) {
            setErrorMessage(predictionResponse.data.error || 'An error occurred during prediction.');
            return;
        }

        const predictionData = predictionResponse.data;
        console.log('Prediction data received:', predictionData);

        const resultContent = {
            type: 'model2Prediction',
            plot_url: graphData.plot_url,
            inversePrediction: predictionData.prediction,
            prediction_plot_url: predictionData.graph,
        };
        console.log('Result content:', resultContent);

        
        handleGraphPredictionModel2(resultContent);

        setActiveMainTab('result');
        setActiveTab('result');

    } catch (error) {
        console.error('Error during CSV processing or prediction:', error.message);
        setErrorMessage('error');
    } finally {
        setIsLoading(false);
    }
};



  return (
    <div className="advanced-navbar">
      <div className="main-tabs">
        <button 
          onClick={() => handleMainTabClick('structureModeling')}
          className={activeMainTab === 'structureModeling' ? 'active' : ''}
        >
          <FontAwesomeIcon icon={faFolderTree} />&nbsp;&nbsp;  Structure Modeling
        </button>
        <button 
          onClick={() => handleMainTabClick('simulationModeling')}
          className={activeMainTab === 'simulationModeling' ? 'active' : ''}
        >
         <FontAwesomeIcon icon={faPlay} />&nbsp;&nbsp; Simulation Modeling
        </button>
        <button 
          onClick={() => handleMainTabClick('structureDesign')}
          className={activeMainTab === 'structureDesign' ? 'active' : ''}
        >
          <FontAwesomeIcon icon={faShapes} />&nbsp;&nbsp; Structure Design
        </button>

       

        <button 
          onClick={() => handleMainTabClick('result')}
          className={activeMainTab === 'result' ? 'active' : ''}
        >
          <FontAwesomeIcon icon={faRuler} />&nbsp;&nbsp;Result
        </button>
        <button onClick={() => handleMainTabClick('view')}><FontAwesomeIcon icon={faEye} />&nbsp;&nbsp;View</button>
        <button onClick={onTerminalToggle}><FontAwesomeIcon icon={faTerminal} />&nbsp;&nbsp;Terminal</button>
      </div>

      {activeMainTab === 'structureModeling' && (
        <div className="sub-tabs">
          <button 
            onClick={() => handleSubTabClick('geometrySelection')}
            className={activeSubTab === 'geometrySelection' ? 'active' : ''}
          >
            <FontAwesomeIcon icon={faCube} />&nbsp;&nbsp;Geometry Selection
          </button>
          <button 
            onClick={() => handleSubTabClick('materialType')}
            className={activeSubTab === 'materialType' ? 'active' : ''}
          >
            <FontAwesomeIcon icon={faFlask} />&nbsp;&nbsp; Material Type
          </button>
          <button 
            onClick={() => handleSubTabClick('operatingWavelength')}
            className={activeSubTab === 'operatingWavelength' ? 'active' : ''}
          >
           <FontAwesomeIcon icon={faRuler} />&nbsp;&nbsp;  Operating Wavelength
          </button>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <button className="upload-csv" onClick={handleFileUpload}>
          <FontAwesomeIcon icon={faFileUpload} />&nbsp;&nbsp; {file ? 'Predict Absorption Model' : 'Upload Image'}
          </button>
          {isLoading && <p className="loading-animation">Predicting...</p>}
        </div>
      )}

      {activeSubTab === 'geometrySelection' && (
        <div className="tertiary-tabs">
          <button 
            onClick={() => handleGeometryShapeClick('bar')}
            className={activeGeometryShape === 'bar' ? 'active' : ''}
          >
           <FontAwesomeIcon icon={faChartSimple} />&nbsp;&nbsp; Bar
          </button>
          <button 
            onClick={() => handleGeometryShapeClick('cylinder')}
            className={activeGeometryShape === 'cylinder' ? 'active' : ''}
          >
           <FontAwesomeIcon icon={faPrescriptionBottle}/>&nbsp;&nbsp; Cylinder
          </button>
          <button 
            onClick={() => handleGeometryShapeClick('circular')}
            className={activeGeometryShape === 'circular' ? 'active' : ''}
          >
           <FontAwesomeIcon icon={faCircle} />&nbsp;&nbsp; Circular
          </button>
          <button 
            onClick={() => handleGeometryShapeClick('circularRing')}
            className={activeGeometryShape === 'circularRing' ? 'active' : ''}
          >
            <FontAwesomeIcon icon={faRing}/>&nbsp;&nbsp; Circular Ring
          </button>
          <button 
            onClick={() => handleGeometryShapeClick('other')}
            className={activeGeometryShape === 'other' ? 'active' : ''}
          >
           <FontAwesomeIcon icon={faShapes}/>&nbsp;&nbsp; Other
          </button>
          <button 
            className="predict-button"
            onClick={handlePredict}
          >
           <FontAwesomeIcon icon={faSwatchbook}/> &nbsp;&nbsp;{file ? 'Predict Transmission Model' : 'Enter Geometrical Parameters'}
          </button>
        </div>
      )}

      {activeGeometryShape === 'bar' && (
        <div className="input-fields">
          <div className="input-group">
            <label>Height:</label>
            <input type="number" name="height" value={formData.height} onChange={handleInputChange} placeholder="Enter height in nm" />
          
          
            <label>Width:</label>
            <input type="number" name="width" value={formData.width} onChange={handleInputChange} placeholder="Enter width in nm" />
         
          
            <label>Length:</label>
            <input type="number" name="length" value={formData.length} onChange={handleInputChange} placeholder="Enter length in nm" />
          
            <label>Period:</label>
            <input type="number" name="period" value={formData.period} onChange={handleInputChange} placeholder="Enter period in nm" />
          </div>
        </div>
      )}

      {activeGeometryShape === 'other' && (
        <div className="input-fields">
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <button className="upload-csv" onClick={handleFileUpload}>
            Upload Customized Geometry
          </button>
        </div>
      )}

{showStructureDesignRow && (
        <div className="input-groups">
          <h4>Upload a 2x8 Matrix CSV File</h4>
          <input type="file" accept=".csv" onChange={handleFileChange} />
          <button className='upload-csvfile' onClick={handlePredictInverse} disabled={isLoading}>
            {isLoading ? 'Predicting...' : 'Predict Inverse'}
          </button>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
      )}

{activeSubTab === 'materialType' && !activeMaterialType && (
        <div className="tertiary-tabs">
          <button 
            onClick={() => handleMaterialTypeClick('resonator')}
            className={activeMaterialType === 'resonator' ? 'active' : ''}
          >
            Resonator Material
          </button>
          <button 
            onClick={() => handleMaterialTypeClick('substrate')}
            className={activeMaterialType === 'substrate' ? 'active' : ''}
          >
            Substrate
          </button>
        </div>
      )}

      {activeMaterialType === 'resonator' && (
        <div className="tertiary-tabs">
          <button 
            onClick={() => handleResonatorMaterialClick('plasmonic')}
            className={activeResonatorMaterial === 'plasmonic' ? 'active' : ''}
          >
            Plasmonic Material
          </button>
          <button 
            onClick={() => handleResonatorMaterialClick('gain')}
            className={activeResonatorMaterial === 'gain' ? 'active' : ''}
          >
            Gain Material
          </button>
          <button 
            onClick={() => handleResonatorMaterialClick('dielectric')}
            className={activeResonatorMaterial === 'dielectric' ? 'active' : ''}
          >
            Dielectric Material
          </button>
        </div>
      )}

      {activeResonatorMaterial === 'dielectric' && (
        <div className="input-fields">
          <div className="input-group">
            <label>n:</label>
            <input type="number" name="n" value={formData.n} onChange={handleInputChange} placeholder="Enter n in nm" />
       
            <label>k:</label>
            <input type="number" name="k" value={formData.k} onChange={handleInputChange} placeholder="Enter k in nm" />
       
            <label>λ:</label>
            <input type="number" name="lambda" value={formData.lambda} onChange={handleInputChange} placeholder="Enter λ in nm" />
          </div>
          <button 
            className="predict-button"
            onClick={handlePredict}
          >
           <FontAwesomeIcon icon={faSwatchbook}/> &nbsp;&nbsp;{'Predict Transmission Model'}
          </button>
        </div>
      )}


{activeMainTab === 'result' && (
  <div className="sub-tabs">
  
    <button 
      onClick={() => setActiveResultOption('phase')}
      className={activeResultOption === 'phase' ? 'active' : ''}
    >
      Phase
    </button>
    <button 
      onClick={() => setActiveResultOption('amplitude')}
      className={activeResultOption === 'amplitude' ? 'active' : ''}
    >
      Amplitude
    </button>
  </div>
)}
 </div>
  );
};

export default AdvancedNavbar;
